import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, TrendingDown, CheckCircle, XCircle, Plus, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import { getProducts, updateProductStock, toggleProductActive } from '../../lib/firebase';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [editingStock, setEditingStock] = useState({}); // { productId: tempValue }
  const [saving, setSaving] = useState({});

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await getProducts({ adminFilter: true });
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const startEditStock = (productId, currentStock) => {
    setEditingStock(prev => ({ ...prev, [productId]: String(currentStock ?? 0) }));
  };

  const cancelEditStock = (productId) => {
    setEditingStock(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const saveStock = async (productId, value) => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) { toast.error('Enter a valid quantity (≥ 0)'); return; }
    setSaving(prev => ({ ...prev, [productId]: true }));
    const { error } = await updateProductStock(productId, qty);
    if (error) {
      toast.error('Failed to update stock');
    } else {
      toast.success('Stock updated ✓');
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: qty } : p));
      cancelEditStock(productId);
    }
    setSaving(prev => ({ ...prev, [productId]: false }));
  };

  const adjustStock = async (productId, delta) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newQty = Math.max(0, (product.stock_quantity || 0) + delta);
    setSaving(prev => ({ ...prev, [productId]: true }));
    const { error } = await updateProductStock(productId, newQty);
    if (error) {
      toast.error('Failed to update stock');
    } else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: newQty } : p));
      toast.success(`Stock ${delta > 0 ? 'increased' : 'decreased'} to ${newQty}`);
    }
    setSaving(prev => ({ ...prev, [productId]: false }));
  };

  const toggleActive = async (productId, currentStatus) => {
    const newStatus = !currentStatus;
    setSaving(prev => ({ ...prev, [productId]: true }));
    const { error } = await toggleProductActive(productId, newStatus);
    if (error) {
      toast.error('Failed to update status');
    } else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: newStatus } : p));
      toast.success(newStatus ? 'Product activated' : 'Product hidden from store');
    }
    setSaving(prev => ({ ...prev, [productId]: false }));
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStock = stockFilter === 'all'
      ? true
      : stockFilter === 'low' ? (p.stock_quantity <= 10 && p.stock_quantity > 0)
      : stockFilter === 'out' ? p.stock_quantity === 0
      : true;
    return matchSearch && matchCategory && matchStock;
  });

  const lowStockCount = products.filter(p => p.stock_quantity <= 10 && p.stock_quantity > 0).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0);

  const getStockStatus = (qty) => {
    if (qty === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' };
    if (qty <= 10) return { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'In Stock', cls: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/products" className="admin-nav-item">🛍️ Products</Link>
          <Link to="/admin/inventory" className="admin-nav-item active">📦 Inventory</Link>
          <Link to="/admin/orders" className="admin-nav-item">🧾 Orders</Link>
          <Link to="/admin/customers" className="admin-nav-item">👥 Customers</Link>
          <Link to="/admin/coupons" className="admin-nav-item">🎟️ Coupons</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">
            Inventory
            {lowStockCount > 0 && (
              <span className="ml-3 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-black">
                ⚠️ {lowStockCount} Low Stock
              </span>
            )}
          </h1>
          <button onClick={loadProducts} className="admin-action-btn flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-icon bg-blue-50"><Package size={22} className="text-blue-500" /></div>
            <div>
              <p className="stat-label">Total Products</p>
              <p className="stat-value">{products.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-green-50"><CheckCircle size={22} className="text-green-500" /></div>
            <div>
              <p className="stat-label">In Stock</p>
              <p className="stat-value">{products.filter(p => (p.stock_quantity || 0) > 10).length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-amber-50"><AlertTriangle size={22} className="text-amber-500" /></div>
            <div>
              <p className="stat-label">Low Stock (≤10)</p>
              <p className="stat-value text-amber-600">{lowStockCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-red-50"><XCircle size={22} className="text-red-500" /></div>
            <div>
              <p className="stat-label">Out of Stock</p>
              <p className="stat-value text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm flex-1 min-w-[200px]">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, brand, SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="outline-none bg-transparent w-full text-sm"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm outline-none cursor-pointer">
            <option value="all">All Categories</option>
            <option value="eyeglasses">Eyeglasses</option>
            <option value="sunglasses">Sunglasses</option>
            <option value="contacts">Contacts</option>
            <option value="special-power">Special Power</option>
          </select>
          <div className="flex gap-2">
            {['all', 'low', 'out'].map(s => (
              <button key={s} onClick={() => setStockFilter(s)} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase transition-all ${stockFilter === s ? 'bg-primary-blue text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s === 'all' ? 'All' : s === 'low' ? '⚠️ Low' : '🔴 Out'}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="admin-card">
          {loading ? (
            <div className="text-gray-400 text-center p-12 font-bold">Loading inventory...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th className="text-center">Stock Qty</th>
                    <th>Stock Status</th>
                    <th>Visible</th>
                    <th>Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const status = getStockStatus(p.stock_quantity ?? 0);
                    const isEditing = editingStock.hasOwnProperty(p.id);
                    const isSaving = saving[p.id];
                    return (
                      <tr key={p.id} className={p.stock_quantity === 0 ? 'opacity-60' : ''}>
                        <td>
                          <div className="flex items-center gap-3">
                            <img src={p.frame_image} alt={p.name} className="w-10 h-10 object-contain bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-sm text-gray-800 truncate max-w-[160px]">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="font-mono text-xs text-gray-500">{p.sku || '—'}</span></td>
                        <td><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{p.category}</span></td>
                        <td><span className="font-black text-primary-blue">₹{p.price}</span></td>
                        <td className="text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min="0"
                                value={editingStock[p.id]}
                                onChange={e => setEditingStock(prev => ({ ...prev, [p.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') saveStock(p.id, editingStock[p.id]); if (e.key === 'Escape') cancelEditStock(p.id); }}
                                className="w-20 text-center border border-primary-blue rounded-lg px-2 py-1 text-sm font-black outline-none"
                                autoFocus
                              />
                              <button onClick={() => saveStock(p.id, editingStock[p.id])} disabled={isSaving} className="p-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600">
                                {isSaving ? '...' : '✓'}
                              </button>
                              <button onClick={() => cancelEditStock(p.id)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditStock(p.id, p.stock_quantity ?? 0)}
                              className="font-mono font-black text-lg text-gray-800 hover:text-primary-blue hover:underline transition-colors cursor-pointer"
                              title="Click to edit stock"
                            >
                              {p.stock_quantity ?? 0}
                            </button>
                          )}
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleActive(p.id, p.is_active)}
                            disabled={isSaving}
                            className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                            title={p.is_active ? 'Click to hide from store' : 'Click to show in store'}
                          >
                            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ml-0.5 ${p.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => adjustStock(p.id, -1)}
                              disabled={isSaving || (p.stock_quantity === 0)}
                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-30 transition-all"
                              title="Decrease by 1"
                            >
                              <Minus size={12} />
                            </button>
                            <button
                              onClick={() => adjustStock(p.id, 10)}
                              disabled={isSaving}
                              className="px-2 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-[10px] font-black disabled:opacity-30 transition-all"
                              title="Add 10 units"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => adjustStock(p.id, 1)}
                              disabled={isSaving}
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-30 transition-all"
                              title="Increase by 1"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-gray-400 py-8 font-bold">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory Value Summary */}
        <div className="mt-4 flex justify-end">
          <div className="bg-white border border-gray-100 rounded-xl px-6 py-3 shadow-sm">
            <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Estimated Inventory Value</span>
            <p className="text-2xl font-black text-primary-blue mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminInventory;
