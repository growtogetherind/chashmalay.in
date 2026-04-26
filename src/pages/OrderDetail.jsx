import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Package, Truck, Home, MapPin, Receipt, ShieldCheck, Download } from 'lucide-react';
import { getOrderById, updateOrderStatus } from '../lib/firebase';
import { generateInvoice } from '../lib/invoiceGenerator';
import toast from 'react-hot-toast';
import Loader from '../components/ui/Loader';
import './OrderDetail.css';

const TIMELINE = [
  { id: 'confirmed', label: 'Order Placed', icon: Receipt },
  { id: 'packed', label: 'Packed', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home }
];

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = () => {
    setLoading(true);
    getOrderById(orderId).then(({ data }) => {
      setOrder(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    setLoading(true);
    const { error } = await updateOrderStatus(orderId, 'cancelled');
    if (error) {
      toast.error('Failed to cancel order. Please try again.');
      setLoading(false);
    } else {
      toast.success('Order cancelled successfully.');
      fetchOrder();
    }
  };

  if (loading) return <Loader onLoadingComplete={() => {}} />;

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-black text-gray-800">Order Not Found</h2>
        <Link to="/account" className="mt-4 text-primary-blue hover:underline">Go back to My Orders</Link>
      </div>
    );
  }

  const currentStepIndex = TIMELINE.findIndex(t => t.id === order.status);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  // If cancelled, we want progress bar at 0, handle specially later if needed
  const progressWidth = order.status === 'cancelled' ? 0 : (activeIndex / (TIMELINE.length - 1)) * 100;

  return (
    <div className="order-detail-page animate-fade-in">
      <div className="container max-w-4xl">
        <Link to="/account/orders" className="flex items-center gap-2 text-sm font-black text-primary-blue hover:underline mb-6">
          <ArrowLeft size={16} /> Back to My Orders
        </Link>

        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-gray-900">Order #{order.id?.slice(0, 8).toUpperCase()}</h1>
            <span className="text-sm font-black text-gray-500 uppercase tracking-widest mt-1">
               {order.created_at?.toDate ? order.created_at.toDate().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date(order.created_at?.seconds * 1000 || order.created_at || Date.now()).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button 
              onClick={() => generateInvoice(order)}
              className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Download size={14} /> Invoice
            </button>
            {order.status === 'confirmed' && (
              <button 
                onClick={handleCancelOrder}
                className="px-6 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-full text-xs font-black uppercase tracking-widest"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-8">Amount: ₹{Number(order.total_amount).toLocaleString()} • {order.order_items?.length} Item(s)</p>

        {/* Visual Tracker */}
        <div className="order-detail-card">
          <h2 className="text-lg font-black text-gray-900 mb-6">Track Your Order</h2>
          
          {order.status === 'cancelled' ? (
             <div className="bg-red-50 text-red-700 p-4 rounded-lg font-bold border border-red-100 mb-6 flex items-center justify-center">
               This order has been cancelled.
             </div>
          ) : (
            <div className="timeline-tracker">
              <div className="timeline-line"></div>
              <div className="timeline-line-fill" style={{ width: `${progressWidth}%` }}></div>
              
              {TIMELINE.map((step, index) => {
                const isActive = index <= activeIndex;
                const Icon = isActive && index < activeIndex ? Check : step.icon;
                return (
                  <div key={step.id} className={`timeline-step ${isActive ? 'active' : ''}`}>
                    <div className="step-icon">
                      <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                    </div>
                    <span className="step-label">{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 mt-8">
             <ShieldCheck size={20} className="text-primary-blue mt-0.5" />
             <div>
               <p className="font-bold text-sm text-gray-900">Need helping submitting your prescription?</p>
               <p className="text-xs text-gray-600 mt-1">Our support team will reach out via WhatsApp with a secure link to upload your latest eye prescription before your lenses are crafted.</p>
             </div>
          </div>
        </div>

        {/* Items detail */}
        <div className="order-detail-card">
          <h2 className="text-lg font-black text-gray-900 mb-2">Order Items</h2>
          <table className="order-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Lens Selection</th>
                <th>Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="flex items-center gap-4">
                      <img src={item.frame_image || item.products?.frame_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNGMUY1RjkiLz48cGF0aCBkPSJNMjAgMjhIMTVhMyAzIDAgMCAwLTMgM3Y2YTMgMyAwIDAgMCAzIDNoNWEzIDMgMCAwIDAgMy0zdi02YTMgMyAwIDAgMC0zLTN6TTQwIDI4SDM1YTMgMyAwIDAgMC0zIDN2NmEzIDMgMCAwIDAgMyAzaDVhMyAzIDAgMCAwIDMtM3YtNmEzIDMgMCAwIDAtMy0zek0yNyAzMWg2IiBzdHJva2U9IiM5NEEzQjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+'} alt="Item" className="w-16 h-16 object-contain bg-gray-50 rounded-lg border border-gray-100" />
                      <div>
                        <p className="font-bold text-gray-900">{item.products?.name || item.product_name}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {item.product_id?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.lens_selection ? (
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{item.lens_selection.visionType?.title || 'Frame Only'}</p>
                        <p className="text-xs text-primary-blue font-bold mt-1">{item.lens_selection.lensPackage?.name}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not specified</span>
                    )}
                  </td>
                  <td className="text-sm font-bold text-gray-700">{item.quantity}</td>
                  <td className="text-right font-black text-primary-blue">
                    ₹{Number(item.price || item.products?.price || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Address and Billing Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="order-detail-card mb-0">
             <div className="flex items-center gap-2 mb-4">
               <MapPin size={20} className="text-gray-400" />
               <h3 className="font-black text-gray-900">Delivery Address</h3>
             </div>
             {order.shipping_address ? (
               <div className="text-sm text-gray-600 leading-relaxed">
                 <p className="font-bold text-gray-900 text-base">{order.shipping_address.name}</p>
                 <p className="mt-2">{order.shipping_address.line1}</p>
                 {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                 <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                 <p className="mt-3 font-medium text-gray-800">Phone: {order.shipping_address.phone}</p>
               </div>
             ) : (
               <p className="text-sm text-gray-500">No address provided.</p>
             )}
          </div>

          <div className="order-detail-card mb-0 bg-gray-50 border border-gray-100 shadow-none">
             <h3 className="font-black text-gray-900 mb-4">Payment Summary</h3>
             <div className="space-y-3 text-sm text-gray-600">
               <div className="flex justify-between">
                 <span>Subtotal</span>
                 <span>₹{Number(order.total_amount).toLocaleString()}</span>
               </div>
               <div className="flex justify-between">
                 <span>Shipping</span>
                 <span className="text-green-600 font-bold">Free</span>
               </div>
               <div className="flex justify-between border-t border-gray-200 mt-4 pt-4 font-black text-lg text-primary-blue">
                 <span>Total Paid</span>
                 <span>₹{Number(order.total_amount).toLocaleString()}</span>
               </div>
               {order.razorpay_payment_id && (
                 <p className="text-xs text-gray-400 text-center mt-4">Transaction ID: {order.razorpay_payment_id}</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
