import { db, admin } from './auth.js';

export async function confirmOrder(orderId, paymentId) {
  const orderRef = db.collection('orders').doc(orderId);

  // 1. Transaction to update status and decrement stock
  let orderData;
  try {
    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }
      
      orderData = orderDoc.data();
      if (orderData.status === 'confirmed') {
        return; // Already confirmed, exit early
      }

      // Update order status to confirmed
      transaction.update(orderRef, {
        status: 'confirmed',
        razorpay_payment_id: paymentId,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Decrement stock for products
      const items = orderData.order_items || [];
      for (const item of items) {
        const pid = item.product_id;
        const qty = item.quantity || 1;
        if (pid && !pid.startsWith('custom-')) {
          const productRef = db.collection('products').doc(pid);
          const productDoc = await transaction.get(productRef);
          if (productDoc.exists) {
            const currentStock = Number(productDoc.data().stock_quantity || 0);
            transaction.update(productRef, {
              stock_quantity: Math.max(0, currentStock - qty),
              updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(`Transaction failed for order ${orderId}:`, error);
    if (error.message === 'Order not found') {
      return { success: false, error: 'Order not found' };
    }
  }

  // Refresh order document
  const freshDoc = await orderRef.get();
  orderData = freshDoc.data();
  
  if (!orderData || orderData.status !== 'confirmed') {
    return { success: false, error: 'Order confirmation failed.' };
  }

  // Ensure payment ID is recorded
  if (orderData.razorpay_payment_id !== paymentId) {
    await orderRef.update({ razorpay_payment_id: paymentId });
  }

  // Idempotence: check if already processed notifications/prescriptions
  if (orderData.processed_at) {
    return { success: true, alreadyProcessed: true };
  }

  await orderRef.update({
    processed_at: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Save prescriptions
  const items = orderData.order_items || [];
  const address = orderData.shipping_address || {};
  const userId = orderData.user_id;

  for (const item of items) {
    const lens = item.lens_selection;
    if (lens && (lens.prescriptionUrl || lens.manualDetails || lens.powerOption === 'later')) {
      try {
        await db.collection('prescriptions').add({
          user_id: userId,
          user_name: address.name || 'Customer',
          user_phone: address.phone || '',
          order_id: orderId,
          product_name: item.product_name || 'Premium Eyewear',
          image_url: lens.prescriptionUrl || null,
          right_eye: lens.manualDetails ? {
            sph: lens.manualDetails.rightSph || '',
            cyl: lens.manualDetails.rightCyl || '',
            axis: lens.manualDetails.rightAxis || '',
            add: lens.manualDetails.rightAddlPower || ''
          } : null,
          left_eye: lens.manualDetails ? {
            sph: lens.manualDetails.leftSph || '',
            cyl: lens.manualDetails.leftCyl || '',
            axis: lens.manualDetails.leftAxis || '',
            add: lens.manualDetails.leftAddlPower || ''
          } : null,
          status: 'pending',
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        if (lens.prescriptionUrl) {
          await sendTelegram(`📑 *New Prescription Uploaded!*\n\n*Customer:* ${address.name}\n*Phone:* ${address.phone}\n*Order ID:* #${orderId.slice(0, 8).toUpperCase()}\n*Item:* ${item.product_name || 'Eyewear'}\n\n🖼️ [View Uploaded Prescription](${lens.prescriptionUrl})`);
        }
      } catch (e) {
        console.error("Error saving prescription to database:", e);
      }
    }
  }

  // 3. Send Telegram notification
  let itemsDetail = '';
  items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const color = item.selected_color 
      ? (typeof item.selected_color === 'string' ? item.selected_color : item.selected_color.name)
      : 'Standard';
    const size = item.selected_size || 'Standard';

    itemsDetail += `\n*${index + 1}. ${item.product_name}*\n`;
    itemsDetail += `   • *Brand:* ${item.brand || 'Premium Edition'}\n`;
    itemsDetail += `   • *Specs:* Color: ${color} | Size: ${size}\n`;
    itemsDetail += `   • *Qty:* ${qty} x ₹${Number(item.price).toLocaleString()} = ₹${(Number(item.price) * qty).toLocaleString()}\n`;
    
    if (item.lens_selection && item.lens_selection.visionType?.id !== 'frame') {
      const ls = item.lens_selection;
      if (ls.selectedLens) {
        itemsDetail += `   • *Lens:* ${ls.selectedLens.name} — ${ls.visionType?.name || ls.category || 'N/A'} (₹${ls.selectedLens.price || 0})\n`;
      }
      if (ls.addons?.length) {
        itemsDetail += `   • *Add-ons:* ${ls.addons.map(a => `${a.name} (₹${a.price})`).join(', ')}\n`;
      }
      if (ls.prescriptionUrl) {
        itemsDetail += `   • *Prescription:* [View Uploaded Image](${ls.prescriptionUrl})\n`;
      } else if (ls.manualDetails) {
        const md = ls.manualDetails;
        itemsDetail += `   • *Prescription (Manual Power):*\n`;
        itemsDetail += `     OD (Right): SPH: ${md.rightSph || '-'} | CYL: ${md.rightCyl || '-'} | AXIS: ${md.rightAxis || '-'} | ADD: ${md.rightAddlPower || '-'}\n`;
        itemsDetail += `     OS (Left):  SPH: ${md.leftSph || '-'} | CYL: ${md.leftCyl || '-'} | AXIS: ${md.leftAxis || '-'} | ADD: ${md.leftAddlPower || '-'}\n`;
      } else {
        itemsDetail += `   • *Prescription:* Upload Later (Follow-up via WhatsApp)\n`;
      }
    }
  });

  const fullOrderDescription = `🛒 *New Customer Order Placed!*

*Order ID:* #${orderId.slice(0, 8).toUpperCase()} (Full: \`${orderId}\`)
*Razorpay Payment ID:* \`${paymentId || 'N/A'}\`
*Amount:* ₹${Number(orderData.total_amount).toLocaleString()}
*Status:* Confirmed

*Customer Details:*
• *Name:* ${address.name}
• *Phone:* ${address.phone}
• *DOB:* ${address.dob || 'Not Provided'}

*Delivery Address:*
${address.line1}${address.line2 ? `, ${address.line2}` : ''}
${address.city}, ${address.state} - ${address.pincode}

*Order Items:*${itemsDetail}

_Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;

  await sendTelegram(fullOrderDescription);

  // 4. Send Fast2SMS SMS
  await sendSMS(address.phone, address.name, orderId.slice(0, 8).toUpperCase(), orderData.total_amount);

  return { success: true };
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Telegram bot token or chat ID is missing. Message skipped.");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    if (!res.ok) {
      console.error("Telegram notification failed:", await res.text());
    }
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

async function sendSMS(phone, name, orderIdShort, amount) {
  const apiKey = process.env.FAST2SMS_API_KEY || process.env.VITE_FAST2SMS_API_KEY;
  const senderId = process.env.FAST2SMS_SENDER_ID || process.env.VITE_FAST2SMS_SENDER_ID || "FSTSMS";
  
  if (!apiKey || !phone) {
    console.warn("Fast2SMS API Key or phone number missing. SMS skipped.");
    return;
  }

  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const message = `Dear ${name}, your order #${orderIdShort} of Rs. ${Math.round(amount)} has been successfully placed. Thank you for shopping with chashmaly.in!`;

  try {
    const params = new URLSearchParams();
    params.append("route", "q");
    params.append("message", message);
    params.append("numbers", cleanPhone);
    params.append("language", "english");
    params.append("flash", "0");
    if (senderId) params.append("sender_id", senderId);

    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: params
    });

    const data = await res.json();
    if (!data.return) {
      console.error("Fast2SMS dispatch failure:", data);
    }
  } catch (err) {
    console.error("Fast2SMS dispatch error:", err);
  }
}
