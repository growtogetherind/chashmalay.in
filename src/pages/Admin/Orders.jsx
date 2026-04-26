import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronDown, Eye, X, MessageSquare, MapPin, ExternalLink } from 'lucide-react';
import { getAllOrders, updateOrderStatus as firebaseUpdateOrderStatus } from '../../lib/firebase';
import toast from 'react-hot-toast';
import '../Admin.css';

const STATUS_OPTIONS = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = { 
  confirmed: 'bg-blue-100 text-blue-700', 
  packed: 'bg-yellow-100 text-yellow-700', 
  shipped: 'bg-purple-100 text-purple-700', 
  delivered: 'bg-green-100 text-green-700', 
  cancelled: 'bg-red-100 text-red-700' 
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    const { data } = await getAllOrders();
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    const { error } = await firebaseUpdateOrderStatus(orderId, newStatus);
    if (error) { toast.error('Failed to update order status'); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
    toast.success(`Order marked as ${newStatus}`);
  };

  const filtered = orders.filter(o => {
    const matchesStatus = filter === 'all' || o.status === filter;
    const customerName = (o.profiles?.full_name || o.shipping_address?.name || '').toLowerCase();
    const customerEmail = (o.profiles?.email || '').toLowerCase();
    const matchesSearch = customerName.includes(searchTerm.toLowerCase()) || customerEmail.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleWhatsApp = (order) => {
    const items = order.order_items?.map(i => `${i.product_name} x ${i.quantity}`).join(', ');
    const address = `${order.shipping_address?.name}, ${order.shipping_address?.line1}, ${order.shipping_address?.city}, ${order.shipping_address?.pincode}`;
    const message = `*Chashmaly New Order* \nOrder ID: #${order.id?.slice(0, 8).toUpperCase()}\nItems: ${items}\nTotal: ₹${order.total_amount}\nAddress: ${address}\nPhone: ${order.shipping_address?.phone}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/products" className="admin-nav-item">🛍️ Products</Link>
          <Link to="/admin/inventory" className="admin-nav-item">📦 Inventory</Link>
          <Link to="/admin/orders" className="admin-nav-item active">🧾 Orders</Link>
          <Link to="/admin/customers" className="admin-nav-item">👥 Customers</Link>
          <Link to="/admin/coupons" className="admin-nav-item">🎟️ Coupons</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Orders <span className="text-gray-300 ml-2">({orders.length})</span></h1>
          <div className="admin-search-box">
            <input 
              type="text" 
              placeholder="Search by customer name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-primary-blue transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase transition-all ${filter === s ? 'bg-primary-blue text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{s}</button>
          ))}
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-8">Loading orders...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order.id}>
                      <td><span className="font-mono font-black text-gray-800">#{order.id?.slice(0, 8).toUpperCase()}</span></td>
                      <td>
                        <p className="font-bold text-sm">{order.profiles?.full_name || order.shipping_address?.name || 'Guest User'}</p>
                        <p className="text-xs text-gray-400">{order.profiles?.email || order.shipping_address?.phone || 'No email'}</p>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          {order.order_items?.slice(0, 2).map((item, i) => (
                            <span key={i} className="text-xs text-gray-600">{item.products?.name || item.product_name} × {item.quantity}</span>
                          ))}
                          {order.order_items?.length > 2 && <span className="text-xs text-gray-400">+{order.order_items.length - 2} more</span>}
                        </div>
                      </td>
                      <td><span className="font-black text-primary-blue">₹{Number(order.total_amount).toFixed(0)}</span></td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`text-[10px] font-black uppercase rounded-full px-3 py-1 border-none outline-none cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-gray-400 hover:text-primary-blue transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center text-gray-400 py-8 font-bold">No orders found.</div>}
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Customer & Shipping</h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="font-black text-gray-900">{selectedOrder.shipping_address?.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedOrder.shipping_address?.line1}</p>
                    {selectedOrder.shipping_address?.line2 && <p className="text-sm text-gray-600">{selectedOrder.shipping_address.line2}</p>}
                    <p className="text-sm text-gray-600">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}</p>
                    <p className="text-sm font-bold text-primary-blue mt-3">📞 {selectedOrder.shipping_address?.phone}</p>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <button 
                      onClick={() => handleWhatsApp(selectedOrder)}
                      className="w-full py-3 bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
                    >
                      <MessageSquare size={16} /> Send to WhatsApp
                    </button>
                    <Link 
                      to={`/account/orders/${selectedOrder.id}`} 
                      target="_blank"
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                      <ExternalLink size={16} /> View Invoice Page
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg">
                        <img src={item.frame_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGMUY1RjkiLz48cGF0aCBkPSJNMTQgMThIMTBhMiAyIDAgMCAwLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMi0ydi00YTIgMiAwIDAgMC0yLTJ6TTI4IDE4SDI0YTIgMiAwIDAgMC0yIDJ2NGEyIDIgMCAwIDAgMiAyaDRhMiAyIDAgMCAwIDItMnYtNGEyIDIgMCAwIDAtMi0yTTE4IDIwaDQiIHN0cm9rZT0iIzk0QTNCOCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg=='} alt="" className="w-10 h-10 object-contain" />
                        <div className="flex-1">
                          <p className="text-xs font-black text-gray-800 line-clamp-1">{item.product_name}</p>
                          <p className="text-[10px] text-gray-400">Qty: {item.quantity} · ₹{Number(item.price).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-gray-400 uppercase">Total Amount</span>
                      <span className="text-lg font-black text-primary-blue">₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="mt-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Status</label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                        className={`w-full text-xs font-black uppercase rounded-lg px-3 py-2 border-none outline-none cursor-pointer ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrders;
