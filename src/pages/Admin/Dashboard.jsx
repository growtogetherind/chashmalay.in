import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { getDashboardStats } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import '../Admin.css';

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0, users: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const { data, error } = await getDashboardStats();
      if (!error && data) {
        setStats({ 
          orders: data.orderCount, 
          products: data.productCount, 
          revenue: data.revenue, 
          users: data.profileCount 
        });
        setRecentOrders(data.orders.slice(0, 8));
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.orders, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Revenue', value: `₹${stats.revenue.toFixed(0)}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Products', value: stats.products, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Customers', value: stats.users, icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const STATUS_COLORS = { confirmed: 'bg-blue-100 text-blue-700', packed: 'bg-yellow-100 text-yellow-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item active">📊 Dashboard</Link>
          <Link to="/admin/products" className="admin-nav-item">🛍️ Products</Link>
          <Link to="/admin/offers" className="admin-nav-item">🏷️ Offers</Link>
          <Link to="/admin/carousel" className="admin-nav-item">🎞️ Carousel</Link>
          <Link to="/admin/inventory" className="admin-nav-item">📦 Inventory</Link>
          <Link to="/admin/orders" className="admin-nav-item">🧾 Orders</Link>
          <Link to="/admin/customers" className="admin-nav-item">👥 Customers</Link>
          <Link to="/admin/coupons" className="admin-nav-item">🎟️ Coupons</Link>
        </nav>
        <button onClick={signOut} className="admin-logout">Logout</button>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Dashboard</h1>
          <div className="flex gap-3">
            <Link to="/admin/products" className="admin-action-btn">+ Add Product</Link>
          </div>
        </div>

        {loading ? <div className="text-gray-400 font-bold p-12 text-center">Loading stats...</div> : (
          <>
            <div className="stats-grid">
              {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="stat-card">
                  <div className={`stat-icon ${bg}`}><Icon size={24} className={color} /></div>
                  <div>
                    <p className="stat-label">{label}</p>
                    <p className="stat-value">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="admin-card-title"><TrendingUp size={18} /> Recent Orders</h2>
                <Link to="/admin/orders" className="text-xs font-black text-primary-blue flex items-center gap-1">View All <ArrowRight size={14} /></Link>
              </div>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td><span className="font-mono font-black text-gray-600">#{order.id?.slice(0, 8).toUpperCase()}</span></td>
                        <td>{order.profiles?.full_name || 'Guest'}</td>
                        <td className="font-black text-primary-blue">₹{Number(order.total_amount).toFixed(0)}</td>
                        <td><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span></td>
                        <td className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
