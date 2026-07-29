// api/create-order.js — Vercel Serverless Function
// Creates a Razorpay order and pending Firestore order server-side.

import { verifyAuth, db, admin } from './utils/auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  let decodedToken;
  try {
    decodedToken = await verifyAuth(request);
  } catch (authError) {
    return response.status(authError.statusCode || 401).json({ error: authError.message });
  }

  const userId = decodedToken.uid;
  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    console.error('Razorpay credentials not configured on server.');
    return response.status(500).json({ error: 'Payment gateway not configured on server.' });
  }

  const { items, address, couponCode } = request.body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return response.status(400).json({ error: 'Missing or invalid items in cart.' });
  }

  if (!address || !address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
    return response.status(400).json({ error: 'Missing or incomplete shipping address.' });
  }

  try {
    // 1. Recalculate cart pricing securely using database records
    let cartTotal = 0;
    const itemsWithPrices = [];

    for (const item of items) {
      const productId = item.product_id || item.id;
      const productRef = db.collection('products').doc(productId);
      const productDoc = await productRef.get();
      if (!productDoc.exists) {
        return response.status(400).json({ error: `Product with ID ${productId} not found.` });
      }

      const productData = productDoc.data();
      const basePrice = Number(productData.price ?? productData.consumersPrice ?? 0);
      
      let lensPrice = 0;
      if (item.lensSelection) {
        const ls = item.lensSelection;
        if (ls.selectedLens?.id) {
          const lensDoc = await db.collection('lenses').doc(ls.selectedLens.id).get();
          if (lensDoc.exists) {
            lensPrice += Number(lensDoc.data().price || 0);
          } else {
            lensPrice += Number(ls.selectedLens.price || 0);
          }
        } else if (ls.selectedLens?.price) {
          lensPrice += Number(ls.selectedLens.price || 0);
        }
        
        if (ls.addons && Array.isArray(ls.addons)) {
          for (const addon of ls.addons) {
            if (addon.id) {
              const addonDoc = await db.collection('lens_addons').doc(addon.id).get();
              if (addonDoc.exists) {
                lensPrice += Number(addonDoc.data().price || 0);
              } else {
                lensPrice += Number(addon.price || 0);
              }
            } else if (addon.price) {
              lensPrice += Number(addon.price || 0);
            }
          }
        }

        if (ls.visionType?.price) {
          lensPrice += Number(ls.visionType.price || 0);
        }
      }

      const finalItemPrice = basePrice + lensPrice;
      const quantity = item.quantity || 1;
      cartTotal += finalItemPrice * quantity;
      
      itemsWithPrices.push({
        ...item,
        price: finalItemPrice,
        name: productData.name || item.name || 'Premium Eyewear',
        category: productData.category || item.category || '',
        brand: productData.brand || item.brand || '',
        image: productData.frame_image || productData.image || (productData.images?.front || '')
      });
    }

    // 2. Validate Coupon and Recalculate Discount
    let discountAmount = 0;
    if (couponCode) {
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
                for (let i = 0; i < item.quantity; i++) {
                  allPrices.push(item.price);
                }
              });
              allPrices.sort((a, b) => a - b);
              const freeCount = Math.floor(totalQty / 2);
              for (let i = 0; i < freeCount; i++) {
                discountAmount += allPrices[i] || 0;
              }
            }
          } else {
            const rawPct = Number(coupon.discount_percentage || 0);
            const pct = rawPct > 1 ? rawPct / 100 : rawPct;
            discountAmount = cartTotal * pct;
            const maxDiscount = Number(coupon.max_discount || 0);
            if (maxDiscount > 0) {
              discountAmount = Math.min(discountAmount, maxDiscount);
            }
          }
        }
      }
    }

    const calculatedTotal = Math.max(0, cartTotal - discountAmount);
    const amountInPaise = Math.round(calculatedTotal * 100);

    // 3. Initiate Razorpay Order API call
    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
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
      return response.status(500).json({ error: 'Failed to initiate payment session.' });
    }

    const razorpayOrder = await razorpayRes.json();

    // 4. Create Pending Order in Firestore
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

    const orderData = {
      user_id: userId,
      total_amount: calculatedTotal,
      shipping_address: address,
      razorpay_order_id: razorpayOrder.id,
      status: 'pending',
      coupon_code: couponCode || null,
      discount_amount: discountAmount,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      customer_name: address.name || 'Customer',
      customer_phone: address.phone || '',
      
      // Store profiles denormalized to save reads!
      profiles: {
        full_name: address.name,
        phone: address.phone
      },
      
      // Save denormalized items array to prevent N+1 read loops!
      order_items: denormalizedItems
    };

    batch.set(orderRef, orderData);

    // Save individual items in order_items collection for backward compatibility
    denormalizedItems.forEach(item => {
      const itemRef = db.collection('order_items').doc();
      batch.set(itemRef, {
        order_id: razorpayOrder.id,
        ...item
      });
    });

    await batch.commit();

    return response.status(200).json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error('create-order internal error:', error);
    return response.status(500).json({ error: 'Internal server error.' });
  }
}
