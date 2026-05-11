import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { getDashboardStats } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import '../Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0, users: 0, pendingOrders: 0, lowStockProducts: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const { data, error } = await getDashboardStats();
      if (!error && data) {
        setStats({ 
          orders: data.orderCount, 
          products: data.productCount, 
          revenue: data.revenue, 
          users: data.profileCount,
          pendingOrders: data.pendingOrders,
          lowStockProducts: data.lowStockProducts
        });
        setRecentOrders(data.orders.slice(0, 8));
        setBestSellers([
          { name: 'Classic Aviator', sales: 42, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=100' },
          { name: 'Urban Rectangle', sales: 35, image: 'https://images.unsplash.com/photo-1511499767350-a159402e5bf1?auto=format&fit=crop&q=80&w=100' },
          { name: 'Titan Elite Round', sales: 28, image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&q=80&w=100' }
        ]);
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.orders, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Pending', value: stats.pendingOrders, icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Low Stock', value: stats.lowStockProducts, icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const STATUS_COLORS = { confirmed: 'bg-blue-100 text-blue-700', packed: 'bg-yellow-100 text-yellow-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <h1 className="admin-title">Dashboard Overview</h1>
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
               <Link to="/admin/products" className="admin-primary-btn whitespace-nowrap">+ Add Product</Link>
               <Link to="/admin/orders" className="admin-primary-btn whitespace-nowrap bg-white !text-gray-800 border !border-gray-200">View Orders</Link>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="admin-card">
                <h2 className="admin-card-title mb-6"><TrendingUp size={18} /> Sales Analytics</h2>
                <div className="h-[250px] flex items-end justify-between gap-2 px-4">
                  {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-primary-blue/10 rounded-t-lg relative group transition-all" style={{ height: `${h}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">₹{(h * 100).toLocaleString()}</div>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card">
                <h2 className="admin-card-title mb-6"><ShoppingBag size={18} /> Best Sellers</h2>
                <div className="space-y-4">
                  {bestSellers.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="text-sm font-black text-gray-800">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.sales} Units Sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary-blue">₹{(item.sales * 2999).toLocaleString()}</p>
                        <span className="text-[10px] text-green-500 font-black">↑ 12%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-card mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="admin-card-title"><TrendingUp size={18} /> Recent Orders</h2>
                <Link to="/admin/orders" className="text-xs font-black text-primary-blue flex items-center gap-1">View All <ArrowRight size={14} /></Link>
              </div>
              <div className="overflow-x-auto">
                 <table className="admin-table">
                   <thead><tr><th>Item</th><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                   <tbody>
                     {recentOrders.map(order => (
                       <tr key={order.id}>
                         <td>
                           <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                             {order.order_items?.[0]?.frame_image || order.order_items?.[0]?.product_image || order.order_items?.[0]?.image ? (
                               <img src={order.order_items[0].frame_image || order.order_items[0].product_image || order.order_items[0].image} className="w-full h-full object-contain" />
                             ) : (
                               <ShoppingBag size={16} className="text-gray-300" />
                             )}
                           </div>
                         </td>
                         <td><span className="font-mono font-black text-gray-600">#{order.id?.slice(0, 8).toUpperCase()}</span></td>
                        <td>{order.profiles?.full_name || order.shipping_address?.name || 'Guest'}</td>
                        <td className="font-black text-primary-blue">₹{Number(order.total_amount).toLocaleString()}</td>
                        <td><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span></td>
                        <td className="text-gray-400 text-xs">{new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString('en-IN')}</td>
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
