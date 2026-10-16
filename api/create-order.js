// api/create-order.js — Vercel Serverless Function
// Creates a Razorpay order securely and prepares the order record.

import { verifyAuth, db, admin } from './utils/auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  let decodedToken = null;
  try {
    decodedToken = await verifyAuth(request);
  } catch (authError) {
    return response.status(authError.statusCode || 401).json({ error: authError.message });
  }

  const userId = decodedToken?.uid || `guest_${Date.now()}`;
  const KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY || 'rzp_test_T8Y4OVZReJCDxP';
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    console.error('Razorpay credentials not configured on server.');
    return response.status(500).json({ error: 'Payment gateway not configured on server.', fallbackAllowed: true });
  }

  const { items, address, couponCode, amount, currency = 'INR', receipt } = request.body || {};

  try {
    let calculatedTotal = 0;
    let discountAmount = 0;
    const itemsWithPrices = [];

    // Support both structured cart items OR direct amount
    if (items && Array.isArray(items) && items.length > 0) {
      let cartTotal = 0;

      for (const item of items) {
        let basePrice = Number(item.price ?? item.consumersPrice ?? 0);
        let lensPrice = 0;

        // Try to query product from database if db is available
        if (db) {
          try {
            const productId = item.product_id || item.id;
            const productDoc = await db.collection('products').doc(productId).get();
            if (productDoc.exists) {
              const productData = productDoc.data();
              basePrice = Number(productData.price ?? productData.consumersPrice ?? basePrice);
            }
          } catch (dbErr) {
            // Firestore credentials not available on Vercel — use item's provided price
            console.warn('Firestore price lookup skipped:', dbErr.message);
          }
        }

        if (item.lensSelection) {
          const ls = item.lensSelection;
          if (ls.selectedLens?.price) {
            lensPrice += Number(ls.selectedLens.price || 0);
          }
          if (ls.addons && Array.isArray(ls.addons)) {
            for (const addon of ls.addons) {
              if (addon.price) lensPrice += Number(addon.price || 0);
            }
          }
          if (ls.visionType?.price) {
            lensPrice += Number(ls.visionType.price || 0);
          }
          if (ls.lensPackage?.price) {
            lensPrice += Number(ls.lensPackage.price || 0);
          }
        }

        const finalItemPrice = basePrice + lensPrice;
        const quantity = item.quantity || 1;
        cartTotal += finalItemPrice * quantity;

        itemsWithPrices.push({
          ...item,
          price: finalItemPrice,
          name: item.name || 'Premium Eyewear',
          category: item.category || '',
          brand: item.brand || '',
          image: item.frame_image || item.frameImage || item.image || (item.gallery?.[0] || '')
        });
      }

      // Validate Coupon if db is available
      if (couponCode && db) {
        try {
          const couponSnap = await db.collection('coupons')
            .where('code', '==', couponCode.toUpperCase())
            .where('is_active', '==', true)
            .limit(1)
            .get();

          if (!couponSnap.empty) {
            const coupon = couponSnap.docs[0].data();
            const minPurchase = Number(coupon.min_purchase || 0);
            if (cartTotal >= minPurchase) {
              const isBogoCode = coupon.is_bogo || couponCode.toUpperCase().includes('BOGO') || couponCode.toUpperCase().includes('BUY1GET1');
              if (isBogoCode) {
                const totalQty = itemsWithPrices.reduce((sum, item) => sum + item.quantity, 0);
                if (totalQty >= 2) {
                  const allPrices = [];
                  itemsWithPrices.forEach(item => {
                    for (let i = 0; i < item.quantity; i++) allPrices.push(item.price);
                  });
                  allPrices.sort((a, b) => a - b);
                  const freeCount = Math.floor(totalQty / 2);
                  for (let i = 0; i < freeCount; i++) discountAmount += allPrices[i] || 0;
                }
              } else {
                const rawPct = Number(coupon.discount_percentage || 0);
                const pct = rawPct > 1 ? rawPct / 100 : rawPct;
                discountAmount = cartTotal * pct;
                const maxDiscount = Number(coupon.max_discount || 0);
                if (maxDiscount > 0) discountAmount = Math.min(discountAmount, maxDiscount);
              }
            }
          }
        } catch (couponErr) {
          console.warn('Coupon lookup skipped:', couponErr.message);
        }
      }

      calculatedTotal = Math.max(1, cartTotal - discountAmount);
    } else if (amount) {
      calculatedTotal = Number(amount) / 100;
    } else {
      return response.status(400).json({ error: 'Missing items or amount in order request.' });
    }

    const amountInPaise = Math.round(calculatedTotal * 100);

    // Call Razorpay Order API
    const orderPayload = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
    };

    const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.json().catch(() => ({}));
      console.error('Razorpay create-order error:', razorpayRes.status, errBody);
      return response.status(500).json({
        error: errBody.error?.description || 'Failed to initiate payment with Razorpay.',
        details: errBody
      });
    }

    const razorpayOrder = await razorpayRes.json();

    // Best-effort: Save pending order to Firestore if DB credentials exist
    if (db && itemsWithPrices.length > 0 && address) {
      try {
        const batch = db.batch();
        const orderRef = db.collection('orders').doc(razorpayOrder.id);
        const denormalizedItems = itemsWithPrices.map(item => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.name,
          frame_image: item.image,
          category: item.category,
          brand: item.brand,
          lens_selection: item.lensSelection || null,
          selected_color: item.lensSelection?.selectedColor || null,
          selected_size: item.lensSelection?.selectedSize || null,
          cart_variant_key: item.cartVariantKey || item.firebaseId || null
        }));

        batch.set(orderRef, {
          user_id: userId,
          total_amount: calculatedTotal,
          shipping_address: address,
          razorpay_order_id: razorpayOrder.id,
          status: 'pending',
          coupon_code: couponCode || null,
          discount_amount: discountAmount,
          created_at: admin?.firestore?.FieldValue?.serverTimestamp?.() || new Date(),
          customer_name: address.name || 'Customer',
          customer_phone: address.phone || '',
          profiles: {
            full_name: address.name,
            phone: address.phone
          },
          order_items: denormalizedItems
        });

        denormalizedItems.forEach(item => {
          const itemRef = db.collection('order_items').doc();
          batch.set(itemRef, {
            order_id: razorpayOrder.id,
            ...item
          });
        });

        await batch.commit();
      } catch (dbErr) {
        console.warn('Pending order recording in Firestore skipped:', dbErr.message);
      }
    }

    return response.status(200).json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error('create-order internal error:', error);
    return response.status(500).json({
      error: error.message || 'Internal server error.',
      fallbackAllowed: true
    });
  }
}
