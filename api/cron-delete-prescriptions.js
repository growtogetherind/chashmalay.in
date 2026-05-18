import { v2 as cloudinary } from 'cloudinary';

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
    // Calculate the date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Search for images in the 'prescriptions' folder older than 3 days
    const result = await cloudinary.search
      .expression(`folder:prescriptions AND uploaded_at<${threeDaysAgo.toISOString()}`)
      .max_results(500)
      .execute();

    const publicIds = result.resources.map(r => r.public_id);

    if (publicIds.length === 0) {
      return response.status(200).json({ message: 'No old prescriptions found to delete', count: 0 });
    }

    // Delete the identified images
    const deleteResult = await cloudinary.api.delete_resources(publicIds);

    return response.status(200).json({
      message: 'Successfully deleted old prescriptions',
      count: publicIds.length,
      deletedIds: publicIds,
      details: deleteResult
    });
  } catch (error) {
    console.error("Cron job error deleting prescriptions:", error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
