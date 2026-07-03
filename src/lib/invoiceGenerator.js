import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getSelectedColorName = (item) => {
  const selectedColor = item?.selected_color || item?.lens_selection?.selectedColor;
  if (!selectedColor) return null;
  return typeof selectedColor === 'string' ? selectedColor : selectedColor.name;
};

const getSelectedSize = (item) => item?.selected_size || item?.lens_selection?.selectedSize;

const getVariantDescription = (item) => {
  const color = getSelectedColorName(item);
  const size = getSelectedSize(item);
  if (!color && !size) return '';
  return `\nFrame: ${color || 'Standard'}${size ? ` / Size: ${size}` : ''}`;
};

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  const date = order.created_at?.toDate
    ? order.created_at.toDate()
    : new Date(order.created_at?.seconds * 1000 || order.created_at || Date.now());

  // Page Width
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Brand Logo (Placed at top left)
  try {
    doc.addImage("/logo.png", "PNG", 14, 10, 25, 25);
  } catch (e) {
    console.error("Logo failed to load in PDF:", e);
  }

  // 2. Brand Identity Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 63, 138); // Brand Primary Blue
  doc.text('CHASHMALAY.IN', 14, 46);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Premium Eyewear Store', 14, 52);
  doc.text('Somatane, Maharashtra, India', 14, 57);

  // 3. Invoice Metadata
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55); // Charcoal text
  doc.text('INVOICE', 140, 46);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Invoice #: INV-${order.id?.slice(0, 8).toUpperCase()}`, 140, 52);
  doc.text(`Date: ${date.toLocaleDateString('en-IN')}`, 140, 57);
  
  const status = order.status?.toUpperCase() || 'CONFIRMED';
  doc.text(`Status: ${status}`, 140, 62);

  // 4. Horizontal Elegant Divider Line
  doc.setDrawColor(229, 231, 235); // border-gray-200
  doc.setLineWidth(0.5);
  doc.line(14, 67, 196, 67);

  // 5. Bill To Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 63, 138); // Primary blue
  doc.text('BILL TO:', 14, 76);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81); // Slate-700
  
  const name = order.shipping_address?.name || 'Customer';
  const line1 = order.shipping_address?.line1 || '';
  const line2 = order.shipping_address?.line2 || '';
  const city = order.shipping_address?.city || '';
  const state = order.shipping_address?.state || '';
  const pincode = order.shipping_address?.pincode || '';
  const phone = order.shipping_address?.phone || '';

  doc.setFont('helvetica', 'bold');
  doc.text(name, 14, 82);
  doc.setFont('helvetica', 'normal');
  doc.text(line1, 14, 87);
  
  let currentY = 92;
  if (line2) {
    doc.text(line2, 14, currentY);
    currentY += 5;
  }
  doc.text(`${city}, ${state} - ${pincode}`, 14, currentY);
  doc.text(`Phone: ${phone}`, 14, currentY + 5);

  // 6. Products Table
  const tableData = order.order_items?.map(item => [
    {
      content: `${item.products?.name || item.product_name}${getVariantDescription(item)}\nLenses: ${item.lens_selection?.visionType?.name || item.lens_selection?.visionType?.title || 'Frame Only'}${item.lens_selection?.selectedLens || item.lens_selection?.lensPackage ? ` (${item.lens_selection.selectedLens?.name || item.lens_selection.lensPackage?.name})` : ''}${item.lens_selection?.addons?.length ? `\nUpgrades: ${item.lens_selection.addons.map(a => a.name).join(', ')}` : ''}${item.lens_selection?.prescriptionUrl ? '\nPrescription: Image Attached' : ''}`,
      styles: { cellPadding: 4 }
    },
    `INR ${Number(item.price).toLocaleString()}`,
    item.quantity,
    `INR ${(Number(item.price) * item.quantity).toLocaleString()}`
  ]) || [];

  autoTable(doc, {
    startY: 112,
    head: [['Product Details', 'Price', 'Qty', 'Total']],
    body: tableData,
    headStyles: { 
      fillColor: [30, 63, 138], // Brand Primary Blue
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 9.5
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // Slate-50 alternate row background
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4, 
      lineColor: [243, 244, 246] 
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  let finalY = doc.lastAutoTable?.finalY || 180;

  // 7. Prescription Section (If available in any order items)
  const prescriptionItems = order.order_items?.filter(item => item.lens_selection?.manualDetails) || [];
  if (prescriptionItems.length > 0) {
    finalY += 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 63, 138);
    doc.text("PRESCRIPTION DETAILS", 14, finalY);
    
    let rxCurrentY = finalY + 4;
    
    prescriptionItems.forEach((item) => {
      const details = item.lens_selection.manualDetails;
      const rxData = [
        ['RIGHT (OD)', details.rightSph || '-', details.rightCyl || '-', details.rightAxis || '-', details.rightAddlPower || '-'],
        ['LEFT (OS)', details.leftSph || '-', details.leftCyl || '-', details.leftAxis || '-', details.leftAddlPower || '-']
      ];
      
      autoTable(doc, {
        startY: rxCurrentY,
        head: [['Eye', 'SPH', 'CYL', 'Axis', 'Addl. Power']],
        body: rxData,
        headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        theme: 'grid',
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8.5, halign: 'center', cellPadding: 3.5 },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 35 } }
      });

      rxCurrentY = doc.lastAutoTable.finalY + 5;

      // Patient Info if available
      if (details.name || details.phone) {
         doc.setFontSize(8);
         doc.setTextColor(156, 163, 175);
         doc.text(`Patient Name: ${details.name || '-'}  |  Phone: ${details.phone || '-'}`, 14, rxCurrentY + 1);
         rxCurrentY += 8;
      }
    });

    finalY = rxCurrentY;
  }

  // 8. Calculations Summary Card
  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 8;
  }

  const subtotal = Number(order.total_amount);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  doc.text('Subtotal:', 135, finalY);
  doc.text(`INR ${subtotal.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 196, finalY, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 63, 138); // brand color
  doc.text('TOTAL AMOUNT:', 135, finalY + 8);
  doc.text(`INR ${Number(order.total_amount).toLocaleString()}`, 196, finalY + 8, { align: 'right' });

  // 9. Standardized Professional Footer (Sticky at page bottom)
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(229, 231, 235);
  doc.line(14, pageHeight - 32, 196, pageHeight - 32);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text('TERMS & CONDITIONS:', 14, pageHeight - 26);
  doc.text('1. Warranty valid for 3 months from delivery date for manufacturing defects.', 14, pageHeight - 22);
  doc.text('2. Easy returns accepted within 7 days of delivery. Product must be unused and in original packaging.', 14, pageHeight - 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 63, 138);
  doc.text('Thank you for shopping with Chashmalay.in!', pageWidth / 2, pageHeight - 8, { align: 'center' });

  doc.save(`Invoice_Chashmalay_${order.id?.slice(0, 8).toUpperCase()}.pdf`);
};
