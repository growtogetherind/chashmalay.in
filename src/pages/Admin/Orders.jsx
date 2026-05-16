import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Search,
  Filter,
  MoreVertical,
  DownloadCloud,
  Settings,
  Bell
} from 'lucide-react';
import { subscribeAllOrders, updateOrderStatus as firebaseUpdateOrderStatus } from '../../lib/firebase';
import { generateInvoice } from '../../lib/invoice';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import '../Admin.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllOrders((data) => {
      setOrders(data || []);
      setFiltered(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  useEffect(() => {
    let result = orders;
    if (filter !== 'all') {
      result = result.filter(o => o.status === filter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.id?.toLowerCase().includes(term) ||
        o.profiles?.full_name?.toLowerCase().includes(term) ||
        o.shipping_address?.name?.toLowerCase().includes(term)
      );
    }
    setFiltered(result);
  }, [searchTerm, filter, orders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    const { success, error } = await firebaseUpdateOrderStatus(orderId, newStatus);
    if (success) {
      toast.success('Order status updated');
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } else {
      toast.error(error || 'Failed to update status');
    }
    setUpdating(false);
  };

  const exportOrders = () => {
    const rows = [
      ['Order ID', 'Customer', 'Phone', 'Amount', 'Status', 'Payment ID', 'Date'],
      ...filtered.map(order => [
        order.id,
        order.profiles?.full_name || order.shipping_address?.name || 'Guest',
        order.shipping_address?.phone || '',
        order.total_amount || 0,
        order.status || '',
        order.razorpay_payment_id || '',
        new Date(order.created_at?.seconds * 1000 || order.created_at || Date.now()).toLocaleString('en-IN')
      ])
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `chashmaly-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Stats for the top cards
  const stats = {
    new: orders.filter(o => o.status === 'pending').length,
    await: orders.filter(o => o.status === 'confirmed' || o.status === 'packed').length,
    onWay: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Orders</h1>
           <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                 <Settings size={20} />
              </button>
              <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                 <Bell size={20} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-purple-600 overflow-hidden">
                 <img src="https://ui-avatars.com/api/?name=Admin&background=7C3AED&color=fff" alt="User" />
              </div>
           </div>
        </div>

        {/* Status Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
           <div className="admin-card !p-6 border-l-4 border-l-purple-500 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-bold uppercase tracking-[2px] text-purple-600 bg-purple-50 px-2 py-1 rounded-md">New orders</span>
                 <div className="text-red-500 text-[10px] font-bold flex items-center gap-1">↓ 2.67% <span className="text-gray-400">Than last week</span></div>
              </div>
              <div className="text-4xl font-extrabold text-gray-900">{stats.new}</div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
           </div>

           <div className="admin-card !p-6 border-l-4 border-l-orange-500 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-bold uppercase tracking-[2px] text-orange-600 bg-orange-50 px-2 py-1 rounded-md">Await accepting</span>
                 <div className="text-green-500 text-[10px] font-bold flex items-center gap-1">↑ 2.67% <span className="text-gray-400">Than last week</span></div>
              </div>
              <div className="text-4xl font-extrabold text-gray-900">{stats.await}</div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all"></div>
           </div>

           <div className="admin-card !p-6 border-l-4 border-l-yellow-500 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-bold uppercase tracking-[2px] text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">On way orders</span>
                 <div className="text-red-500 text-[10px] font-bold flex items-center gap-1">↓ 0.51% <span className="text-gray-400">Than last week</span></div>
              </div>
              <div className="text-4xl font-extrabold text-gray-900">{stats.onWay}</div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all"></div>
           </div>

           <div className="admin-card !p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-bold uppercase tracking-[2px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Delivered orders</span>
                 <div className="text-green-500 text-[10px] font-bold flex items-center gap-1">↑ 2.67% <span className="text-gray-400">Than last week</span></div>
              </div>
              <div className="text-4xl font-extrabold text-gray-900">{stats.delivered}</div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
           </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="admin-search-wrapper !mb-0 min-w-[300px]">
                 <Search size={18} className="text-gray-400" />
                 <input type="text" placeholder="Search orders..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <span className="text-gray-400 text-xs font-bold whitespace-nowrap">{filtered.length} orders</span>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={exportOrders} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                 <DownloadCloud size={16} /> Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                 <Filter size={16} /> Sort: default
              </button>
           </div>
        </div>

        {/* Orders Table */}
        <div className="admin-card">
           <div className="admin-table-container">
              <table className="admin-table">
                 <thead>
                    <tr>
                       <th className="w-10"><input type="checkbox" className="rounded" /></th>
                       <th>Order number</th>
                       <th>Customer</th>
                       <th>Category</th>
                       <th>Price</th>
                       <th>Date</th>
                       <th>Payment</th>
                       <th>Status</th>
                       <th className="text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                       <tr><td colSpan="9" className="text-center py-20 text-gray-400 font-bold">Fetching digital ledger...</td></tr>
                    ) : filtered.length === 0 ? (
                       <tr><td colSpan="9" className="text-center py-20 text-gray-400 font-bold">No orders found matching your criteria.</td></tr>
                    ) : filtered.map(order => (
                       <tr key={order.id}>
                          <td><input type="checkbox" className="rounded" /></td>
                          <td><span className="font-mono text-xs font-bold text-gray-400 tracking-widest uppercase">#{order.id?.slice(0, 8)}</span></td>
                          <td>
                             <div className="flex flex-col">
                                <span className="text-gray-900 font-bold leading-none">{order.profiles?.full_name || order.shipping_address?.name || 'Guest'}</span>
                                <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{order.shipping_address?.phone}</span>
                             </div>
                          </td>
                          <td>
                             <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                {order.order_items?.[0]?.category || order.order_items?.[0]?.products?.category || 'Eyewear'}
                             </span>
                          </td>
                          <td><span className="text-gray-900 font-extrabold">₹{Number(order.total_amount).toLocaleString()}</span></td>
                          <td><span className="text-gray-500 text-xs font-bold">{new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString('en-GB')}</span></td>
                          <td><span className="text-gray-500 text-xs font-bold">{order.razorpay_payment_id ? 'Razorpay' : (order.payment_method || 'Pending')}</span></td>
                          <td>
                             <span className={`status-chip ${
                                order.status === 'delivered' ? 'status-delivered' :
                                order.status === 'shipped' ? 'status-shipped' :
                                order.status === 'cancelled' ? 'status-cancelled' :
                                order.status === 'confirmed' ? 'status-packed' :
                                'status-confirmed'
                             }`}>
                                {order.status === 'pending' ? 'on way' : order.status}
                             </span>
                          </td>
                          <td className="text-right">
                             <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreVertical size={18} /></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <span className="text-xs text-gray-400 font-bold">Showing {filtered.length} live orders</span>
           </div>
        </div>
      </main>

      {/* Detail Sidebar (previous pop design) */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedOrder(null)}
               className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[2000]"
            />
            <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white z-[2001] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
            >
               {/* Sidebar Header */}
               <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Order Details</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-400"><X size={20} /></button>
               </div>

               {/* Sidebar Content */}
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {/* Items Summary */}
                  <div className="mb-10">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Summary</p>
                     <div className="space-y-4">
                        {selectedOrder.order_items?.map((item, idx) => (
                           <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-purple-200 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden p-2 shadow-sm group-hover:shadow-md transition-all">
                                    <img src={item.frame_image || item.product_image || item.image} alt="" className="w-full h-full object-contain" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-gray-900">{item.product_name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">Quantity: {item.quantity}</p>
                                    {item.lens_selection && (
                                       <div className="mt-2 flex flex-wrap gap-2">
                                          {item.lens_selection.visionType && (
                                             <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[9px] font-black uppercase tracking-widest border border-purple-100">
                                                {item.lens_selection.visionType.title}
                                             </span>
                                          )}
                                          {item.lens_selection.lensPackage && (
                                             <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                                {item.lens_selection.lensPackage.name}
                                             </span>
                                          )}
                                          {item.lens_selection.isContactLens && (
                                             <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                                Contact Lenses
                                             </span>
                                          )}
                                       </div>
                                    )}
                                    {!item.lens_selection && (
                                       <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[9px] font-black uppercase tracking-widest">
                                          {item.category?.toLowerCase().includes('contact') ? 'Contact Lens' : 'Frame Only'}
                                       </span>
                                    )}
                                 </div>
                              </div>
                              <p className="text-sm font-black text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-10">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Information</p>
                     <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <p className="font-extrabold text-gray-900 text-lg mb-1">{selectedOrder.shipping_address?.name}</p>
                        <p className="text-sm text-gray-500 font-semibold">{selectedOrder.shipping_address?.line1}</p>
                        <p className="text-sm text-gray-500 font-semibold">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.pincode}</p>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone:</span>
                           <span className="text-sm font-bold text-gray-900">{selectedOrder.shipping_address?.phone}</span>
                        </div>
                     </div>
                  </div>

                  {/* Order Status */}
                  <div className="mb-10">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Update Order Status</p>
                     <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(s => (
                           <button
                              key={s}
                              onClick={() => updateStatus(selectedOrder.id, s)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                                 selectedOrder.status === s ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                              }`}
                           >
                              {s}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Prescription Section (IF PRESENT) */}
                  {selectedOrder.order_items?.some(item => item.lens_selection?.prescriptionUrl || item.lens_selection?.manualDetails) && (
                     <div className="mb-10">
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                           Prescription Details
                        </p>
                        {selectedOrder.order_items.map((item, idx) => (
                           (item.lens_selection?.prescriptionUrl || item.lens_selection?.manualDetails) && (
                              <div key={idx} className="bg-purple-50 rounded-2xl p-6 border border-purple-100 mb-4">
                                 <p className="text-xs font-black text-purple-900 mb-4 uppercase tracking-wide">For: {item.product_name}</p>
                                 
                                 {item.lens_selection?.prescriptionUrl && (
                                    <div className="mb-4">
                                       <p className="text-[10px] font-bold text-purple-400 uppercase mb-2">Uploaded Prescription</p>
                                       <a href={item.lens_selection.prescriptionUrl} target="_blank" rel="noreferrer" className="block relative group rounded-xl overflow-hidden border-2 border-purple-200 bg-white aspect-video">
                                          <img src={item.lens_selection.prescriptionUrl} alt="Prescription" className="w-full h-full object-contain" />
                                          <div className="absolute inset-0 bg-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                             <span className="text-white text-[10px] font-black uppercase tracking-widest bg-purple-600 px-4 py-2 rounded-full shadow-lg">View Full Image</span>
                                          </div>
                                       </a>
                                    </div>
                                 )}

                                 {item.lens_selection?.manualDetails && (
                                    <div className="space-y-4">
                                       <div className="grid grid-cols-4 gap-2 text-[9px] font-black uppercase text-purple-400 tracking-widest px-1">
                                          <div>Power</div>
                                          <div className="text-center">SPH</div>
                                          <div className="text-center">CYL</div>
                                          <div className="text-center">Axis</div>
                                       </div>
                                       <div className="grid grid-cols-4 gap-2 items-center bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                                          <div className="text-[10px] font-black text-purple-900 uppercase">Right</div>
                                          <div className="text-center font-black text-purple-900 text-sm">{item.lens_selection.manualDetails.rightSph || '-'}</div>
                                          <div className="text-center font-black text-purple-900 text-sm">{item.lens_selection.manualDetails.rightCyl || '-'}</div>
                                          <div className="text-center font-black text-purple-900 text-sm">{item.lens_selection.manualDetails.rightAxis || '-'}</div>
                                       </div>
                                       <div className="grid grid-cols-4 gap-2 items-center bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                                          <div className="text-[10px] font-black text-purple-900 uppercase">Left</div>
                                          <div className="text-center font-black text-purple-900 text-sm">{item.lens_selection.manualDetails.leftSph || '-'}</div>
                                          <div className="text-center font-black text-purple-900 text-sm">{item.lens_selection.manualDetails.leftCyl || '-'}</div>
                                          <div className="text-center font-black text-purple-900 text-sm">{item.lens_selection.manualDetails.leftAxis || '-'}</div>
                                       </div>

                                       {(item.lens_selection.manualDetails.rightAddlPower || item.lens_selection.manualDetails.leftAddlPower) && (
                                          <div className="grid grid-cols-2 gap-4">
                                             <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                                                <p className="text-[9px] font-bold text-purple-400 uppercase mb-1">Addl. Power (R)</p>
                                                <p className="font-black text-purple-900">{item.lens_selection.manualDetails.rightAddlPower || '-'}</p>
                                             </div>
                                             <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                                                <p className="text-[9px] font-bold text-purple-400 uppercase mb-1">Addl. Power (L)</p>
                                                <p className="font-black text-purple-900">{item.lens_selection.manualDetails.leftAddlPower || '-'}</p>
                                             </div>
                                          </div>
                                       )}

                                       {(item.lens_selection.manualDetails.bc || item.lens_selection.manualDetails.dia) && (
                                          <div className="grid grid-cols-2 gap-4">
                                             {item.lens_selection.manualDetails.bc && (
                                                <div className="bg-white p-3 rounded-xl border border-purple-100">
                                                   <p className="text-[9px] font-bold text-purple-400 uppercase mb-1">Base Curve (BC)</p>
                                                   <p className="font-black text-purple-900">{item.lens_selection.manualDetails.bc}</p>
                                                </div>
                                             )}
                                             {item.lens_selection.manualDetails.dia && (
                                                <div className="bg-white p-3 rounded-xl border border-purple-100">
                                                   <p className="text-[9px] font-bold text-purple-400 uppercase mb-1">Diameter (DIA)</p>
                                                   <p className="font-black text-purple-900">{item.lens_selection.manualDetails.dia}</p>
                                                </div>
                                             )}
                                          </div>
                                       )}

                                       <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                                          <p className="text-[9px] font-bold text-purple-400 uppercase mb-1">Patient Info</p>
                                          <p className="font-black text-purple-900 text-xs">{item.lens_selection.manualDetails.name} ({item.lens_selection.manualDetails.phone})</p>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           )
                        ))}
                     </div>
                  )}
               </div>

               {/* Sidebar Footer */}
               <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-6 px-2">
                     <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Amount</span>
                     <span className="text-2xl font-black text-gray-900">₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                  </div>
                  <button onClick={() => generateInvoice(selectedOrder)} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-[3px] shadow-lg shadow-purple-200 flex items-center justify-center gap-3 hover:bg-purple-700 transition-all active:scale-[0.98]">
                     <Download size={18} /> Download Invoice
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
