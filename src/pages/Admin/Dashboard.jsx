import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  Search,
  Bell,
  MoreVertical,
  Filter
} from 'lucide-react';
import { subscribeDashboardStats } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import '../Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0, users: 0, pendingOrders: 0, lowStockProducts: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeDashboardStats((data) => {
      setStats({
        orders: data.orderCount,
        products: data.productCount,
        revenue: data.revenue,
        users: data.profileCount,
        pendingOrders: data.pendingOrders,
        lowStockProducts: data.lowStockProducts
      });
      setRecentOrders(data.orders.slice(0, 6));
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
             <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <Bell size={20} />
             </button>
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
