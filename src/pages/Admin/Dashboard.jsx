import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, ArrowRight, Search, Bell, MoreVertical, Filter } from 'lucide-react';
import { subscribeDashboardStats } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import toast from 'react-hot-toast';
import '../Admin.css';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, duration, delay) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    };
    playTone(659.25, 0.4, 0);
    playTone(880.00, 0.6, 0.12);
  } catch (err) {
    console.warn("Could not play synthesized audio notification:", err);
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0, users: 0, pendingOrders: 0, lowStockProducts: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    let lastOrderId = null;

    const unsubscribe = subscribeDashboardStats((data) => {
      setStats({
        orders: data.orderCount,
        products: data.productCount,
        revenue: data.revenue,
        users: data.profileCount,
        pendingOrders: data.pendingOrders,
        lowStockProducts: data.lowStockProducts
      });

      const currentOrders = data.orders || [];
      setRecentOrders(currentOrders.slice(0, 6));

      // Trigger notification for new order
      if (currentOrders.length > 0) {
        const latestOrder = currentOrders[0];
        if (lastOrderId && latestOrder.id !== lastOrderId) {
          // Play notification chime
          playNotificationSound();

          // Show elegant in-app custom toast
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-purple-100 overflow-hidden`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                      🚀
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-wider">New Order Received!</p>
                    <p className="mt-1 text-xs text-gray-500 font-bold">
                      Order #{latestOrder.id.slice(0, 8).toUpperCase()} for ₹{Number(latestOrder.total_amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      Customer: {latestOrder.profiles?.full_name || latestOrder.shipping_address?.name || 'Guest'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-100">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-3xl p-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 hover:bg-purple-50 focus:outline-none"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ), { duration: 10000 });

          // Browser native notification
          if (Notification.permission === "granted") {
            new Notification("🚀 New Order Received!", {
              body: `Order #${latestOrder.id.slice(0, 8).toUpperCase()} for ₹${Number(latestOrder.total_amount).toLocaleString()}`,
              icon: "/favicon.ico"
            });
          }
        }
        lastOrderId = latestOrder.id;
      }

      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const STATUS_CLASSES = {
    confirmed: 'status-confirmed',
    packed: 'status-packed',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled'
  };

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  if (loading) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <main className="admin-main flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Initializing Dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div className="admin-search-wrapper">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Search orders, products..." />
          </div>
          <div className="admin-user-nav">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-purple-600 font-extrabold text-xs uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                <span className="text-gray-400 text-[10px] font-bold">Live store data</span>
             </div>
             {"Notification" in window && Notification.permission === "default" && (
                <button
                   onClick={async () => {
                      const permission = await Notification.permission === "default" 
                         ? await Notification.requestPermission()
                         : Notification.permission;
                      if (permission === "granted") {
                         toast.success("Desktop alerts enabled!");
                         playNotificationSound();
                      }
                   }}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-purple-100 mr-2"
                >
                   <Bell size={12} className="animate-bounce" /> Enable Alerts
                </button>
             )}
             <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                    <Bell size={20} />
                    {stats.pendingOrders > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                    )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[100] overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Notifications</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-[9px] font-black uppercase tracking-widest">{stats.pendingOrders} Pending</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {recentOrders.length > 0 ? recentOrders.map((order) => (
                        <Link 
                          key={order.id} 
                          to="/admin/orders" 
                          onClick={() => setIsNotificationOpen(false)}
                          className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${order.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                            <ShoppingBag size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-gray-900">New Order #{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">₹{Number(order.total_amount).toLocaleString()} • {order.profiles?.full_name || 'Guest User'}</p>
                            <p className="text-[9px] text-gray-400 mt-1 font-medium">{new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          {order.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
                        </Link>
                      )) : (
                        <div className="p-8 text-center">
                          <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No Recent Activity</p>
                        </div>
                      )}
                    </div>
                    <Link to="/admin/orders" onClick={() => setIsNotificationOpen(false)} className="block p-3 text-center text-[10px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-50 transition-colors">
                      View All Orders
                    </Link>
                  </div>
                )}
             </div>
             <div className="w-10 h-10 rounded-xl bg-purple-600 border border-purple-500 overflow-hidden shadow-lg shadow-purple-200">
                <img src="https://ui-avatars.com/api/?name=Admin&background=7C3AED&color=fff" alt="Profile" />
             </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-10">
           <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Store Dashboard</h1>
           <p className="text-gray-500 font-medium text-sm mt-1">Today’s orders, stock alerts, and store activity in one place.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           {/* Left side stats */}
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Revenue - Main Card */}
              <div className="stat-card primary md:row-span-1">
                 <div className="stat-card-header">
                    <span className="stat-card-title uppercase tracking-widest">Total Revenue</span>
                    <div className="stat-card-icon">
                       <DollarSign size={20} />
                    </div>
                 </div>
                 <div className="stat-card-value">₹{stats.revenue.toLocaleString()}</div>
                 <div className="stat-card-footer">
                    <span className="opacity-70">from all recorded orders</span>
                 </div>
              </div>

              {/* Total Orders */}
              <div className="stat-card">
                 <div className="stat-card-header">
                    <span className="stat-card-title uppercase tracking-widest text-gray-400">Total Orders</span>
                    <div className="stat-card-icon !bg-purple-50 !text-purple-600">
                       <ShoppingBag size={20} />
                    </div>
                 </div>
                 <div className="stat-card-value">{stats.orders}</div>
                 <div className="stat-card-footer">
                    <span className="text-gray-400">{stats.pendingOrders} need attention</span>
                 </div>
              </div>

              {/* Total Visitors */}
              <div className="stat-card">
                 <div className="stat-card-header">
                    <span className="stat-card-title uppercase tracking-widest text-gray-400">Customers</span>
                    <div className="stat-card-icon !bg-blue-50 !text-blue-600">
                       <Users size={20} />
                    </div>
                 </div>
                 <div className="stat-card-value">{stats.users}</div>
                 <div className="stat-card-footer">
                    <span className="text-gray-400">registered profiles</span>
                 </div>
              </div>

              {/* Net Profit */}
              <div className="stat-card">
                 <div className="stat-card-header">
                    <span className="stat-card-title uppercase tracking-widest text-gray-400">Low Stock</span>
                    <div className="stat-card-icon !bg-green-50 !text-green-600">
                       <TrendingUp size={20} />
                    </div>
                 </div>
                 <div className="stat-card-value">{stats.lowStockProducts}</div>
                 <div className="stat-card-footer">
                    <span className="text-gray-400">products at 10 or fewer</span>
                 </div>
              </div>
           </div>

           {/* Right side - Revenue Chart Card */}
           <div className="admin-card">
              <div className="admin-card-header">
                 <h2 className="admin-card-title">Order Activity</h2>
                 <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                 </button>
              </div>
              <div className="bar-chart-container">
                 {[stats.orders, stats.pendingOrders, stats.lowStockProducts, stats.products].map((value, i) => {
                    const h = Math.max(12, Math.min(95, value * 8));
                    return (
                    <div key={i} className="bar-wrapper">
                       <div className="bar group" style={{ height: `${h}%` }}>
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{value}</div>
                       </div>
                       <span className="bar-label">{['Orders', 'Open', 'Low', 'SKUs'][i]}</span>
                    </div>
                 )})}
              </div>
           </div>
        </div>

        {/* Bottom Section - Orders Table */}
        <div className="admin-card">
           <div className="admin-card-header !mb-6">
              <div>
                 <h2 className="admin-card-title">Recent Orders</h2>
                 <p className="text-gray-400 text-xs font-medium mt-1">Live order activity from your storefront.</p>
              </div>
              <div className="flex gap-3">
                 <button className="flex items-center gap-2 bg-white border border-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
                    <Filter size={14} /> Filter
                 </button>
                 <Link to="/admin/orders" className="flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-purple-100 transition-all uppercase tracking-wider">
                    View Orders <ArrowRight size={14} />
                 </Link>
              </div>
           </div>

           <div className="admin-table-container">
              <table className="admin-table">
                 <thead>
                    <tr>
                       <th>Unique Identifier</th>
                       <th>Customer</th>
                       <th>Amount</th>
                       <th>Status</th>
                       <th className="text-right">Timestamp</th>
                    </tr>
                 </thead>
                 <tbody>
                    {recentOrders.map((order) => (
                       <tr key={order.id}>
                          <td>
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                                   <Package size={18} />
                                </div>
                                <span className="font-mono text-xs font-bold text-gray-400">#{order.id?.slice(0, 8).toUpperCase()}</span>
                             </div>
                          </td>
                          <td>
                             <div className="flex flex-col">
                                <span className="text-gray-900 font-bold">{order.profiles?.full_name || order.shipping_address?.name || 'Guest User'}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.shipping_address?.city || 'Online'}</span>
                             </div>
                          </td>
                          <td>
                             <span className="text-gray-900 font-extrabold">₹{Number(order.total_amount).toLocaleString()}</span>
                          </td>
                          <td>
                             <span className={`status-chip ${STATUS_CLASSES[order.status] || 'status-confirmed'}`}>
                                {order.status}
                             </span>
                          </td>
                          <td className="text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-gray-900 font-bold">{new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                <span className="text-[10px] text-gray-400 font-bold">{new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
