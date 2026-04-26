import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  const date = order.created_at?.toDate 
    ? order.created_at.toDate() 
    : new Date(order.created_at?.seconds * 1000 || order.created_at || Date.now());

  // Business Header
  doc.setFontSize(22);
  doc.setTextColor(30, 63, 138); // primary-blue
  doc.text('CHASHMALY.IN', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Luxury Eyewear Store', 14, 28);
  doc.text('GSTIN: 27AABCM1234F1Z5 (Mock)', 14, 33);
  doc.text('Mumbai, India', 14, 38);

  // Invoice Title
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text('INVOICE', 140, 22);
  
  doc.setFontSize(10);
  doc.text(`Invoice #: INV-${order.id?.slice(0, 8).toUpperCase()}`, 140, 30);
  doc.text(`Date: ${date.toLocaleDateString('en-IN')}`, 140, 35);
  doc.text(`Status: ${order.status?.toUpperCase()}`, 140, 40);

  // Bill To
  doc.setDrawColor(230);
  doc.line(14, 45, 196, 45);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(order.shipping_address?.name || 'Customer', 14, 62);
  doc.text(order.shipping_address?.line1 || '', 14, 67);
  if (order.shipping_address?.line2) doc.text(order.shipping_address.line2, 14, 72);
  doc.text(`${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} - ${order.shipping_address?.pincode || ''}`, 14, 77);
  doc.text(`Phone: ${order.shipping_address?.phone || ''}`, 14, 82);

  // Table
  const tableData = order.order_items?.map(item => [
    { 
      content: `${item.products?.name || item.product_name}\nLenses: ${item.lens_selection?.visionType?.title || 'Frame Only'} (${item.lens_selection?.lensPackage?.name || 'Standard'})`, 
      styles: { cellPadding: 3 } 
    },
    `INR ${Number(item.price).toLocaleString()}`,
    item.quantity,
    `INR ${(Number(item.price) * item.quantity).toLocaleString()}`
  ]) || [];

  doc.autoTable({
    startY: 90,
    head: [['Product Details', 'Price', 'Qty', 'Total']],
    body: tableData,
    headStyles: { fillStyle: 'f3f4f6', textColor: [31, 41, 55], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right' }
    }
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  
  const subtotal = Number(order.total_amount) / 1.18;
  const gst = Number(order.total_amount) - subtotal;
  
  doc.text('Subtotal:', 140, finalY);
  doc.text(`INR ${subtotal.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 196, finalY, { align: 'right' });
  
  doc.text('GST (18%):', 140, finalY + 7);
  doc.text(`INR ${gst.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 196, finalY + 7, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT:', 140, finalY + 15);
  doc.text(`INR ${Number(order.total_amount).toLocaleString()}`, 196, finalY + 15, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('This is a computer generated invoice and does not require a physical signature.', 105, 280, { align: 'center' });
  doc.text('Thank you for shopping with Chashmaly.in!', 105, 285, { align: 'center' });

  doc.save(`Invoice_Chashmaly_${order.id?.slice(0, 8).toUpperCase()}.pdf`);
};
