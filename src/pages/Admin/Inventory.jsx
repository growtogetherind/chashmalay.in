import { useEffect, useState, useCallback } from 'react';

import { Package, Search, XCircle, Plus, Minus, RefreshCw, AlertTriangle, Bell } from 'lucide-react';
import { getProducts, updateProductStock, getCategories, subscribeProducts, subscribeCategories } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [saving, setSaving] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      getProducts({ adminFilter: true }),
      getCategories()
    ]);
    setProducts(pRes.data || []);
    setCategories(cRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    const unProducts = subscribeProducts({ adminFilter: true }, (data) => {
      setProducts(data || []);
      setLoading(false);
    }, () => setLoading(false));
    const unCategories = subscribeCategories((data) => setCategories(data || []));
    return () => {
      unProducts?.();
      unCategories?.();
    };
  }, []);

  const adjustStock = async (productId, delta) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newQty = Math.max(0, (product.stock_quantity || 0) + delta);

    setSaving(prev => ({ ...prev, [productId]: true }));
    const { error } = await updateProductStock(productId, newQty);
    if (error) toast.error('Update failed');
    else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: newQty } : p));
      toast.success(`Updated to ${newQty}`);
    }
    setSaving(prev => ({ ...prev, [productId]: false }));
  };

  const filtered = products.filter(p => {
    const matchSearch = (p.name + p.brand + p.sku).toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStock = stockFilter === 'all' ? true : stockFilter === 'low' ? (p.stock_quantity <= 10 && p.stock_quantity > 0) : p.stock_quantity === 0;
    return matchSearch && matchCategory && matchStock;
  });

  const stats = {
    total: products.length,
    low: products.filter(p => p.stock_quantity <= 10 && p.stock_quantity > 0).length,
    out: products.filter(p => p.stock_quantity === 0).length,
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div className="admin-search-wrapper">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="admin-user-nav">
             <button onClick={loadData} className={`w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors ${loading ? 'animate-spin' : ''}`}>
                <RefreshCw size={20} />
             </button>
             <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <Bell size={20} />
             </button>
             <div className="w-10 h-10 rounded-xl bg-purple-600 overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Admin&background=7C3AED&color=fff" alt="User" />
             </div>
          </div>
        </div>

        <div className="mb-8">
           <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Inventory Management</h1>
           <p className="text-gray-500 text-sm font-medium mt-1">Monitor and adjust stock levels in real time.</p>
        </div>

        <div className="stats-grid">
           <div className="stat-card">
              <div className="stat-card-header">
                 <span className="stat-card-title uppercase tracking-widest text-gray-400">Total SKUs</span>
                 <div className="stat-card-icon !bg-purple-50 !text-purple-600">
                    <Package size={20} />
                 </div>
              </div>
              <div className="stat-card-value">{stats.total}</div>
           </div>
           <div className="stat-card">
              <div className="stat-card-header">
                 <span className="stat-card-title uppercase tracking-widest text-gray-400">Low Stock</span>
                 <div className="stat-card-icon !bg-orange-50 !text-orange-600">
                    <AlertTriangle size={20} />
                 </div>
              </div>
              <div className="stat-card-value text-orange-600">{stats.low}</div>
           </div>
           <div className="stat-card">
              <div className="stat-card-header">
                 <span className="stat-card-title uppercase tracking-widest text-gray-400">Out of Stock</span>
                 <div className="stat-card-icon !bg-red-50 !text-red-600">
                    <XCircle size={20} />
                 </div>
              </div>
              <div className="stat-card-value text-red-600">{stats.out}</div>
           </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-4 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none hover:bg-gray-50 transition-colors"
              >
                 <option value="all">All Categories</option>
                 {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none hover:bg-gray-50 transition-colors"
              >
                 <option value="all">All Stock Status</option>
                 <option value="low">Low Stock</option>
                 <option value="out">Out of Stock</option>
              </select>
           </div>
        </div>

        <div className="admin-card">
           <div className="admin-table-container">
              <table className="admin-table">
                 <thead>
                    <tr>
                       <th>Product</th>
                       <th>SKU</th>
                       <th className="text-center">Stock</th>
                       <th>Status</th>
                       <th className="text-right">Quick Adjust</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                       <tr><td colSpan="5" className="text-center py-20 text-gray-400 font-bold">Syncing inventory...</td></tr>
                    ) : filtered.map(p => (
                       <tr key={p.id}>
                          <td>
                             <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden p-1.5">
                                   <img src={p.images?.front || p.frame_image || p.image} alt="" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-gray-900 font-bold leading-none">{p.name}</span>
                                   <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{p.brand}</span>
                                </div>
                             </div>
                          </td>
                          <td>
                             <span className="font-mono text-xs font-bold text-gray-400">#{p.sku || 'N/A'}</span>
                          </td>
                          <td className="text-center">
                             <span className="text-gray-900 font-extrabold text-base">{p.stock_quantity || 0}</span>
                          </td>
                          <td>
                             <span className={`status-chip ${
                                p.stock_quantity === 0 ? 'status-cancelled' :
                                p.stock_quantity <= 10 ? 'status-packed' :
                                'status-delivered'
                             }`}>
                                {p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity <= 10 ? 'Low Stock' : 'In Stock'}
                             </span>
                          </td>
                          <td className="text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button disabled={saving[p.id]} onClick={() => adjustStock(p.id, -1)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center disabled:opacity-50"><Minus size={16} /></button>
                                <button disabled={saving[p.id]} onClick={() => adjustStock(p.id, 1)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center justify-center disabled:opacity-50"><Plus size={16} /></button>
                                <button disabled={saving[p.id]} onClick={() => adjustStock(p.id, 10)} className="ml-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-extrabold rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50">+10</button>
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

export default AdminInventory;
