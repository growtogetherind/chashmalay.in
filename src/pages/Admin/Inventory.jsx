import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, TrendingDown, CheckCircle, XCircle, Plus, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import { getProducts, updateProductStock, toggleProductActive, getCategories } from '../../lib/firebase';
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
  const [editingStock, setEditingStock] = useState({});
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

  useEffect(() => { loadData(); }, [loadData]);

  const saveStock = async (productId, value) => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) return toast.error('Enter a valid quantity');
    
    setSaving(prev => ({ ...prev, [productId]: true }));
    const { error } = await updateProductStock(productId, qty);
    if (error) toast.error('Failed to update');
    else {
      toast.success('Stock updated');
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: qty } : p));
      setEditingStock(prev => { const copy = { ...prev }; delete copy[productId]; return copy; });
    }
    setSaving(prev => ({ ...prev, [productId]: false }));
  };

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
    value: products.reduce((s, p) => s + ((p.price || 0) * (p.stock_quantity || 0)), 0)
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <h1 className="admin-title">Inventory Control</h1>
           <button onClick={loadData} className="admin-primary-btn flex items-center gap-2"><RefreshCw size={14} /> Refresh</button>
        </div>

        <div className="stats-grid">
           <div className="stat-card">
              <div className="stat-icon bg-blue-50 text-blue-600"><Package size={20} /></div>
              <div><p className="stat-label">Total SKUs</p><p className="stat-value">{stats.total}</p></div>
           </div>
           <div className="stat-card">
              <div className="stat-icon bg-amber-50 text-amber-600"><AlertTriangle size={20} /></div>
              <div><p className="stat-label">Low Stock</p><p className="stat-value text-amber-600">{stats.low}</p></div>
           </div>
           <div className="stat-card">
              <div className="stat-icon bg-red-50 text-red-600"><XCircle size={20} /></div>
              <div><p className="stat-label">Out of Stock</p><p className="stat-value text-red-600">{stats.out}</p></div>
           </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-8 mb-6">
           <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search by SKU or Product Name..." value={search} onChange={e => setSearch(e.target.value)} className="admin-search-box pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-primary-blue font-bold text-xs w-full" />
           </div>
           <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none cursor-pointer">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
           </select>
        </div>

        <div className="admin-card">
           <div className="overflow-x-auto">
              <table className="admin-table">
                 <thead>
                    <tr>
                       <th>Product</th>
                       <th>SKU / Brand</th>
                       <th className="text-center">Stock</th>
                       <th>Status</th>
                       <th>Quick Adjust</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filtered.map(p => (
                       <tr key={p.id}>
                          <td>
                             <div className="flex items-center gap-3">
                                <img src={p.frame_image} className="w-10 h-10 object-contain bg-gray-50 rounded-lg" alt="" />
                                <p className="font-black text-sm text-gray-800 truncate max-w-[200px]">{p.name}</p>
                             </div>
                          </td>
                          <td>
                             <p className="font-mono text-xs text-gray-400 font-bold">{p.sku || 'N/A'}</p>
                             <p className="text-[10px] text-primary-blue font-black uppercase">{p.brand}</p>
                          </td>
                          <td className="text-center">
                             <button onClick={() => setEditingStock({...editingStock, [p.id]: p.stock_quantity})} className="text-lg font-black text-gray-900">{p.stock_quantity || 0}</button>
                          </td>
                          <td>
                             <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                                p.stock_quantity === 0 ? 'bg-red-100 text-red-600' :
                                p.stock_quantity <= 10 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                             }`}>
                                {p.stock_quantity === 0 ? 'OUT' : p.stock_quantity <= 10 ? 'LOW' : 'OK'}
                             </span>
                          </td>
                          <td>
                             <div className="flex items-center gap-1">
                                <button onClick={() => adjustStock(p.id, -1)} className="admin-table-btn delete"><Minus size={12} /></button>
                                <button onClick={() => adjustStock(p.id, 1)} className="admin-table-btn bg-green-50 text-green-600"><Plus size={12} /></button>
                                <button onClick={() => adjustStock(p.id, 10)} className="admin-table-btn bg-blue-50 text-blue-600 text-[9px] font-black">+10</button>
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
