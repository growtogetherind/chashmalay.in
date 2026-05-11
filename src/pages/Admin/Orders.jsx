import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronDown, Eye, X, MessageSquare, MapPin, ExternalLink, Download, Truck, Clock, CheckCircle, Info, Search, Upload } from 'lucide-react';
import { getAllOrders, updateOrderStatus as firebaseUpdateOrderStatus, addOrderNote, updateOrderItemPower } from '../../lib/firebase';
import { generateInvoice } from '../../lib/invoice';
import { uploadImage } from '../../lib/cloudinary';
import AdminSidebar from '../../components/layout/AdminSidebar';
import toast from 'react-hot-toast';
import '../Admin.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const STATUS_COLORS = { 
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700', 
  packed: 'bg-orange-100 text-orange-700', 
  shipped: 'bg-purple-100 text-purple-700', 
  delivered: 'bg-green-100 text-green-700', 
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-700 text-white'
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Power Edit State
  const [editingPowerItem, setEditingPowerItem] = useState(null); // { orderId, item, idx }
  const [powerUpdateData, setPowerUpdateData] = useState({
     leftSph: '',
     rightSph: '',
     name: '',
     phone: ''
  });
  const [isUploadingPower, setIsUploadingPower] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await getAllOrders();
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    const { error } = await firebaseUpdateOrderStatus(orderId, newStatus);
    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
         setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success(`Order status updated to ${newStatus}`);
    } else {
      toast.error('Failed to update status');
    }
    setUpdating(false);
  };

  const openPowerEdit = (orderId, item, idx) => {
     setEditingPowerItem({ orderId, item, idx });
     const existing = item.lens_selection?.manualDetails || {};
     setPowerUpdateData({
        leftSph: existing.leftSph || '',
        rightSph: existing.rightSph || '',
        name: existing.name || '',
        phone: existing.phone || ''
     });
  };

  const handleUpdatePower = async () => {
      if (!editingPowerItem || !editingPowerItem.item.id) {
          toast.error("Item ID is missing. Cannot update.");
          return;
      }
      setIsUploadingPower(true);
      try {
         const updatedSelection = {
            ...editingPowerItem.item.lens_selection,
            powerOption: 'manual', // If admin updates it, it becomes a manual entry
            manualDetails: {
               samePower: powerUpdateData.leftSph === powerUpdateData.rightSph,
               cylindrical: false,
               leftSph: powerUpdateData.leftSph,
               rightSph: powerUpdateData.rightSph,
               name: powerUpdateData.name,
               phone: powerUpdateData.phone
            }
         };

         const { error } = await updateOrderItemPower(editingPowerItem.item.id, updatedSelection);
         if (error) throw error;

         // Update local state
         const updatedOrderItems = [...selectedOrder.order_items];
         updatedOrderItems[editingPowerItem.idx] = { ...updatedOrderItems[editingPowerItem.idx], lens_selection: updatedSelection };
         
         const updatedOrder = { ...selectedOrder, order_items: updatedOrderItems };
         setSelectedOrder(updatedOrder);
         setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
         
         toast.success("Eye power details updated successfully!");
         setEditingPowerItem(null);
      } catch (err) {
          console.error(err);
          toast.error("Failed to update eye power.");
      }
      setIsUploadingPower(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const note = e.target.note.value;
    if (!note) return;
    
    const { error } = await addOrderNote(selectedOrder.id, note);
    if (error) toast.error('Failed to add note');
    else {
      toast.success('Note added');
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, admin_note: note } : o));
      setSelectedOrder(prev => ({ ...prev, admin_note: note }));
      e.target.reset();
    }
  };

  const filtered = orders.filter(o => {
    const matchesStatus = filter === 'all' || o.status === filter;
    const customerName = (o.profiles?.full_name || o.shipping_address?.name || '').toLowerCase();
    const customerId = (o.id || '').toLowerCase();
    const matchesSearch = customerName.includes(searchTerm.toLowerCase()) || customerId.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <h1 className="admin-title">Order Management</h1>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
           <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search by Order ID or Customer Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-search-box pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-primary-blue font-bold text-xs w-full" />
           </div>
           <select value={filter} onChange={e => setFilter(e.target.value)} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none cursor-pointer">
              <option value="all">All Orders</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>

        <div className="admin-card">
           <div className="overflow-x-auto">
              <table className="admin-table">
                 <thead>
                    <tr>
                       <th>Item</th>
                       <th>Order ID</th>
                       <th>Customer</th>
                       <th>Amount</th>
                       <th>Status</th>
                       <th>Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? <tr><td colSpan="6" className="text-center py-12 text-gray-400">Loading orders...</td></tr> : filtered.map(order => (
                       <tr key={order.id}>
                          <td>
                             <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                                {order.order_items?.[0]?.frame_image || order.order_items?.[0]?.product_image || order.order_items?.[0]?.image ? (
                                   <img src={order.order_items[0].frame_image || order.order_items[0].product_image || order.order_items[0].image} className="w-full h-full object-contain" />
                                ) : (
                                   <Package size={16} className="text-gray-300" />
                                )}
                             </div>
                          </td>
                          <td><span className="font-mono font-black text-gray-600">#{order.id?.slice(0, 8).toUpperCase()}</span></td>
                          <td>{order.profiles?.full_name || order.shipping_address?.name || 'Guest'}</td>
                          <td className="font-black text-primary-blue">₹{Number(order.total_amount).toLocaleString()}</td>
                          <td>
                             <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                          </td>
                          <td>
                             <button onClick={() => setSelectedOrder(order)} className="admin-table-btn edit"><Eye size={14} /></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
           <div className="admin-modal max-w-4xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8 pb-4 border-b">
                 <h2 className="text-xl font-black text-gray-900">Order Details <span className="text-gray-300 font-mono text-sm ml-2">#{selectedOrder.id?.toUpperCase()}</span></h2>
                 <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div>
                       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Shipping Info</h3>
                       <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="font-black text-gray-800">{selectedOrder.shipping_address?.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{selectedOrder.shipping_address?.line1}, {selectedOrder.shipping_address?.city}</p>
                          <p className="text-sm text-gray-500">{selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}</p>
                          <p className="text-sm font-black text-primary-blue mt-2 flex items-center gap-1"><MapPin size={12} /> {selectedOrder.shipping_address?.phone}</p>
                       </div>
                    </div>

                    <div>
                       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Status Update</h3>
                       <div className="grid grid-cols-2 gap-2">
                           {STATUS_OPTIONS.map(s => {
                              const isActive = selectedOrder.status === s;
                              let activeClass = 'bg-black text-white'; // default
                              if (s === 'confirmed') activeClass = 'bg-blue-600 text-white shadow-lg shadow-blue-200';
                              if (s === 'shipped') activeClass = 'bg-purple-600 text-white shadow-lg shadow-purple-200';
                              if (s === 'delivered') activeClass = 'bg-green-600 text-white shadow-lg shadow-green-200';
                              if (s === 'cancelled') activeClass = 'bg-red-600 text-white shadow-lg shadow-red-200';
                              if (s === 'packed') activeClass = 'bg-orange-500 text-white shadow-lg shadow-orange-200';
                              if (s === 'returned') activeClass = 'bg-gray-800 text-white';

                              return (
                                 <button 
                                    key={s} 
                                    onClick={() => updateStatus(selectedOrder.id, s)} 
                                    disabled={updating} 
                                    className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase transition-all duration-300 ${isActive ? activeClass : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}
                                 >
                                    {s}
                                 </button>
                              );
                           })}
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Summary</h3>
                    <div className="space-y-3">
                        {selectedOrder.order_items?.map((item, idx) => (
                           <div key={idx} className="flex flex-col gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                              <div className="flex items-center gap-3">
                                 <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                                    {item.frame_image || item.product_image || item.image ? <img src={item.frame_image || item.product_image || item.image} className="w-full h-full object-contain" /> : <Package size={20} className="text-gray-300" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-gray-800 truncate">{item.product_name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">Qty: {item.quantity} × ₹{item.price}</p>
                                 </div>
                                 <p className="text-xs font-black text-primary-blue">₹{item.price * item.quantity}</p>
                              </div>

                              {/* Lenses and Power */}
                              {item.lens_selection && (
                                   <div className="pt-2 border-t border-gray-200">
                                       <p className="text-[10px] text-gray-600 font-bold flex justify-between">
                                           <span>Lenses: {item.lens_selection.visionType?.title || 'None'} | {item.lens_selection.lensPackage?.name || 'None'}</span>
                                       </p>
                                       {item.lens_selection.powerOption && (
                                          <div className="mt-1 flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                              <div>
                                                  <span className="text-[10px] font-black uppercase text-primary-blue block">Eye Power: {item.lens_selection.powerOption}</span>
                                                  {item.lens_selection.powerOption === 'manual' && item.lens_selection.manualDetails && (
                                                      <span className="text-[10px] text-gray-500">
                                                          L: {item.lens_selection.manualDetails.leftSph} | R: {item.lens_selection.manualDetails.rightSph}
                                                      </span>
                                                  )}
                                                  {item.lens_selection.prescriptionUrl && (
                                                      <div className="mt-2">
                                                          <a href={item.lens_selection.prescriptionUrl} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
                                                              <img src={item.lens_selection.prescriptionUrl} alt="Prescription" className="w-full h-20 object-cover" />
                                                              <div className="bg-gray-50 py-1 px-2 text-[8px] font-black uppercase text-gray-500 text-center flex items-center justify-center gap-1">
                                                                  <Eye size={8} /> View Full Image
                                                              </div>
                                                          </a>
                                                      </div>
                                                  )}
                                              </div>
                                              <button onClick={() => openPowerEdit(selectedOrder.id, item, idx)} className="text-[9px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">Update</button>
                                          </div>
                                       )}
                                       {!item.lens_selection.powerOption && item.lens_selection.visionType?.id !== 'frame' && item.lens_selection.visionType?.id !== 'zero' && (
                                           <div className="mt-1 flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                              <span className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1"><Info size={10}/> Power Missing</span>
                                              <button onClick={() => openPowerEdit(selectedOrder.id, item, idx)} className="text-[9px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">Add Power</button>
                                           </div>
                                       )}
                                   </div>
                               )}
                           </div>
                        ))}
                       <div className="pt-4 border-t flex justify-between items-center">
                          <span className="text-sm font-black text-gray-800 uppercase">Total Amount</span>
                          <span className="text-lg font-black text-primary-blue">₹{selectedOrder.total_amount}</span>
                       </div>
                    </div>
                    
                    <button onClick={() => generateInvoice(selectedOrder)} className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"><Download size={16} /> Download Invoice (PDF)</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Power Edit Modal */}
      {editingPowerItem && (
         <div className="admin-modal-overlay" onClick={() => setEditingPowerItem(null)} style={{zIndex: 100}}>
            <div className="admin-modal max-w-lg" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h2 className="text-xl font-black text-gray-900">Update Eye Power</h2>
                  <button onClick={() => setEditingPowerItem(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20} /></button>
               </div>
               
               {editingPowerItem.item.lens_selection?.prescriptionUrl && (
                  <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                     <div className="flex items-center justify-between mb-3">
                        <div>
                           <h4 className="text-sm font-bold text-blue-900">Customer Uploaded Rx</h4>
                           <p className="text-xs text-blue-700">The customer provided a prescription file.</p>
                        </div>
                        <a href={editingPowerItem.item.lens_selection.prescriptionUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2">
                           <Eye size={12} /> Full View
                        </a>
                     </div>
                     <div className="rounded-lg overflow-hidden border border-blue-200 bg-white">
                        <img src={editingPowerItem.item.lens_selection.prescriptionUrl} alt="Prescription Preview" className="w-full max-h-48 object-contain" />
                     </div>
                  </div>
               )}

               <div className="space-y-4">
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">SPH Left</label>
                        <input type="text" value={powerUpdateData.leftSph} onChange={(e) => setPowerUpdateData({...powerUpdateData, leftSph: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="-1.00" />
                     </div>
                     <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">SPH Right</label>
                        <input type="text" value={powerUpdateData.rightSph} onChange={(e) => setPowerUpdateData({...powerUpdateData, rightSph: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="-1.00" />
                     </div>
                  </div>
                  <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Patient Name</label>
                      <input type="text" value={powerUpdateData.name} onChange={(e) => setPowerUpdateData({...powerUpdateData, name: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="John Doe" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Patient Phone</label>
                      <input type="text" value={powerUpdateData.phone} onChange={(e) => setPowerUpdateData({...powerUpdateData, phone: e.target.value})} className="w-full border p-2 rounded-lg text-sm" placeholder="+91..." />
                  </div>
               </div>

               <button 
                  onClick={handleUpdatePower} 
                  disabled={isUploadingPower}
                  className="w-full mt-6 py-3 bg-primary-blue text-white rounded-lg font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 disabled:opacity-50"
               >
                  {isUploadingPower ? 'Saving...' : 'Save Details'}
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default AdminOrders;
