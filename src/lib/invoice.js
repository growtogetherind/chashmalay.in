import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 63, 138); // Primary Blue
  doc.text("CHASHMALY", 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Optical & Eyewear Store", 20, 32);
  doc.text("GSTIN: 27AABCM1234E1Z5", 20, 37);

  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text("INVOICE", pageWidth - 60, 25);

  // Divider
  doc.setDrawColor(230);
  doc.line(20, 45, pageWidth - 20, 45);

  // Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 55);
  doc.setFont("helvetica", "normal");
  doc.text(order.shipping_address?.name || "Customer", 20, 60);
  doc.text(order.shipping_address?.line1 || "", 20, 65);
  doc.text(`${order.shipping_address?.city}, ${order.shipping_address?.state} - ${order.shipping_address?.pincode}`, 20, 70);
  doc.text(`Phone: ${order.shipping_address?.phone}`, 20, 75);

  doc.setFont("helvetica", "bold");
  doc.text("Order Details:", pageWidth - 80, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: INV-${order.id?.slice(0, 8).toUpperCase()}`, pageWidth - 80, 60);
  doc.text(`Date: ${new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString()}`, pageWidth - 80, 65);
  doc.text(`Payment: ${order.payment_method || 'Online'}`, pageWidth - 80, 70);
  doc.text(`Status: ${order.status?.toUpperCase()}`, pageWidth - 80, 75);

  // Table
  const tableData = order.order_items.map((item, index) => [
    index + 1,
    item.product_name,
    `INR ${Number(item.price).toLocaleString()}`,
    item.quantity,
    `INR ${(item.price * item.quantity).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['#', 'Item Description', 'Unit Price', 'Qty', 'Total']],
    body: tableData,
    headStyles: { fillColor: [30, 63, 138], textColor: 255, fontStyle: 'bold' },
    foot: [['', '', '', 'Subtotal', `INR ${Number(order.total_amount).toLocaleString()}`]],
    footStyles: { fillColor: [250, 250, 250], textColor: 0, fontStyle: 'bold' },
    theme: 'striped',
    margin: { left: 20, right: 20 }
  });

  // Footer
  const finalY = doc.lastAutoTable?.finalY || 200;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Terms & Conditions:", 20, finalY);
  doc.text("1. Warranty is valid for 1 year on manufacturing defects only.", 20, finalY + 5);
  doc.text("2. Returns are accepted within 7 days of delivery in original packaging.", 20, finalY + 10);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 63, 138);
  doc.text("Thank you for shopping with Chashmaly!", pageWidth / 2, finalY + 25, { align: 'center' });

  doc.save(`Invoice_Chashmaly_${order.id?.slice(0, 8).toUpperCase()}.pdf`);
};
