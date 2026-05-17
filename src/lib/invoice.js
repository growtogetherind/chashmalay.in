import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  return `
Frame: ${color || 'Standard'}${size ? ` / Size: ${size}` : ''}`;
};

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  try {
    doc.addImage("/logo.png", "PNG", 20, 10, 30, 30); // Add logo
  } catch (e) {
    console.error("Logo not found", e);
  }

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 63, 138); // Primary Blue
  doc.text("CHASHMALAY.IN", 20, 50); // Move down for logo
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Optical & Eyewear Store", 20, 57);
  doc.text("GSTIN: 27AABCM1234E1Z5", 20, 62);

  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text("INVOICE", pageWidth - 60, 50); // Shifted down
  
  // Divider
  doc.setDrawColor(230);
  doc.line(20, 70, pageWidth - 20, 70); // Shifted down

  // Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 80); // Shifted down
  doc.setFont("helvetica", "normal");
  doc.text(order.shipping_address?.name || "Customer", 20, 85);
  doc.text(order.shipping_address?.line1 || "", 20, 90);
  doc.text(`${order.shipping_address?.city}, ${order.shipping_address?.state} - ${order.shipping_address?.pincode}`, 20, 95);
  doc.text(`Phone: ${order.shipping_address?.phone}`, 20, 100);

  doc.setFont("helvetica", "bold");
  doc.text("Order Details:", pageWidth - 80, 80); // Shifted down
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: INV-${order.id?.slice(0, 8).toUpperCase()}`, pageWidth - 80, 85);
  doc.text(`Date: ${new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString()}`, pageWidth - 80, 90);
  doc.text(`Payment: ${order.payment_method || 'Online'}`, pageWidth - 80, 95);
  doc.text(`Status: ${order.status?.toUpperCase()}`, pageWidth - 80, 100);

  // Table
  const tableData = order.order_items.map((item, index) => [
    index + 1,
    `${item.product_name}${getVariantDescription(item)}`,
    `INR ${Number(item.price).toLocaleString()}`,
    item.quantity,
    `INR ${(item.price * item.quantity).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 110, // Shifted down
    head: [['#', 'Item Description', 'Unit Price', 'Qty', 'Total']],
    body: tableData,
    headStyles: { fillColor: [30, 63, 138], textColor: 255, fontStyle: 'bold' },
    foot: [['', '', '', 'Subtotal', `INR ${Number(order.total_amount).toLocaleString()}`]],
    footStyles: { fillColor: [250, 250, 250], textColor: 0, fontStyle: 'bold' },
    theme: 'striped',
    margin: { left: 20, right: 20 }
  });

  // Prescription Section
  const prescriptionItems = order.order_items.filter(item => item.lens_selection?.manualDetails);
  
  if (prescriptionItems.length > 0) {
    const rxStartY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 63, 138);
    doc.text("PRESCRIPTION DETAILS", 20, rxStartY);
    
    let rxCurrentY = rxStartY + 5;
    
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
        headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold' },
        theme: 'grid',
        margin: { left: 20 },
        styles: { fontSize: 9, halign: 'center' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
      });

      rxCurrentY = doc.lastAutoTable.finalY + 5;

      // Patient Info if available
      if (details.name || details.phone) {
         doc.setFontSize(8);
         doc.setTextColor(100);
         doc.text(`Patient: ${details.name || '-'} | Phone: ${details.phone || '-'}`, 20, rxCurrentY + 2);
         rxCurrentY += 8;
      }
    });
  }

  // Footer
  const finalY = doc.lastAutoTable?.finalY + 20 || 200;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Terms & Conditions:", 20, finalY);
  doc.text("1. Warranty is valid for 1 year on manufacturing defects only.", 20, finalY + 5);
  doc.text("2. Returns are accepted within 7 days of delivery in original packaging.", 20, finalY + 10);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 63, 138);
  doc.text("Thank you for shopping with Chashmalay!", pageWidth / 2, finalY + 25, { align: 'center' });

  doc.save(`Invoice_Chashmalay_${order.id?.slice(0, 8).toUpperCase()}.pdf`);
};
