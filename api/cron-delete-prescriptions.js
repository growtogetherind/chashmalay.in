import { v2 as cloudinary } from 'cloudinary';
import { db } from './utils/auth.js';

export default async function handler(request, response) {
  // Protect the cron job from unauthorized access
  const authHeader = request.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  // Ensure Cloudinary is configured
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return response.status(500).json({ error: 'Cloudinary credentials missing' });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  try {
    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all prescriptions older than 30 days
    const prescriptionsSnap = await db.collection('prescriptions')
      .where('created_at', '<', thirtyDaysAgo)
      .get();

    if (prescriptionsSnap.empty) {
      return response.status(200).json({ message: 'No old prescriptions found to audit', count: 0 });
    }

    let deletedFirestoreCount = 0;
    let deletedCloudinaryCount = 0;
    const deletedPublicIds = [];
    const deletedDocIds = [];

    // Audit and process each old prescription doc
    for (const rxDoc of prescriptionsSnap.docs) {
      const rx = rxDoc.data();
      const orderId = rx.order_id;
      let isOrphaned = false;

      if (!orderId) {
        isOrphaned = true;
      } else {
        // Verify if order exists in Firestore
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
          isOrphaned = true;
        }
      }

      if (isOrphaned) {
        // 1. Delete from Cloudinary if image_url exists
        if (rx.image_url) {
          const match = rx.image_url.match(/\/upload\/(?:v\d+\/)?(prescriptions\/[^.]+)/);
          const publicId = match ? match[1] : null;
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
              deletedPublicIds.push(publicId);
              deletedCloudinaryCount++;
            } catch (clErr) {
              console.error(`Failed to delete Cloudinary asset ${publicId}:`, clErr);
            }
          }
        }

        // 2. Delete the prescription document from Firestore
        await db.collection('prescriptions').doc(rxDoc.id).delete();
        deletedDocIds.push(rxDoc.id);
        deletedFirestoreCount++;
      }
    }

    return response.status(200).json({
      message: 'Successfully audited and deleted orphaned prescriptions older than 30 days.',
      auditedCount: prescriptionsSnap.size,
      deletedFirestoreCount,
      deletedCloudinaryCount,
      deletedDocIds,
      deletedPublicIds
    });
  } catch (error) {
    console.error("Cron job error deleting prescriptions:", error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
