import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, X, Copy } from 'lucide-react';
import { getProducts, saveProduct, deleteProduct, uploadProductImage, toggleProductActive } from '../../lib/firebase';
import toast from 'react-hot-toast';
import '../Admin.css';

const CATEGORIES = ['eyeglasses', 'sunglasses', 'contacts', 'special-power'];
const SHAPES = ['Aviator', 'Rectangle', 'Round', 'Cat Eye', 'Wayfarer', 'N/A'];
const THEMES = ['Classic', 'Modern', 'Luxury', 'Minimalist', 'Sport', 'Vintage', 'Titan Elite'];
const EMPTY_PRODUCT = { name: '', brand: '', category: 'eyeglasses', shape: 'Rectangle', theme: 'Classic', description: '', price: '', original_price: '', frame_image: '', model_image: '', is_new: false, stock_quantity: 100, is_active: true, offers: '', reviewCount: 0, rating: 0, colors: [] };

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState({});

  useEffect(() => { loadProducts(); }, []);

  const [files, setFiles] = useState({ frame_image: null, model_image: null });

  const loadProducts = async () => {
    const { data } = await getProducts({ adminFilter: true });
    setProducts(data || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
      setForm(prev => ({ ...prev, [e.target.name]: URL.createObjectURL(e.target.files[0]) }));
    }
  };

  const openAdd = () => { setForm({ ...EMPTY_PRODUCT }); setEditing(null); setFiles({ frame_image: null, model_image: null }); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p, price: String(p.price), original_price: String(p.original_price || ''), offers: Array.isArray(p.offers) ? p.offers.join(', ') : (p.offers || ''), colors: p.colors || [] }); setEditing(p.id); setFiles({ frame_image: null, model_image: null }); setShowForm(true); };
  const openDuplicate = (p) => { setForm({ ...p, id: undefined, name: `${p.name} (Copy)`, price: String(p.price), original_price: String(p.original_price || ''), offers: Array.isArray(p.offers) ? p.offers.join(', ') : (p.offers || ''), colors: p.colors || [] }); setEditing(null); setFiles({ frame_image: null, model_image: null }); setShowForm(true); };

  const handleColorChange = (index, field, value) => {
    const newColors = [...form.colors];
    newColors[index][field] = value;
    setForm(prev => ({ ...prev, colors: newColors }));
  };

  const addColor = () => {
    setForm(prev => ({ ...prev, colors: [...prev.colors, { name: '', hex: '#000000', image: '' }] }));
  };

  const removeColor = (index) => {
    setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }));
  };

  const handleColorFileChange = async (index, file) => {
    if (!file) return;
    // Show preview immediately
    const newColors = [...form.colors];
    newColors[index].tempFile = file;
    newColors[index].image = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, colors: newColors }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.price) { toast.error('Name, brand, and price are required.'); return; }
    setSaving(true);
    
    let finalFrameImage = form.frame_image;
    let finalModelImage = form.model_image;

    if (files.frame_image) {
      const { url, error } = await uploadProductImage(files.frame_image, Date.now().toString());
      if (error) { toast.error('Failed to upload frame image.'); setSaving(false); return; }
      finalFrameImage = url;
    }
    if (files.model_image) {
      const { url, error } = await uploadProductImage(files.model_image, Date.now().toString());
      if (error) { toast.error('Failed to upload model image.'); setSaving(false); return; }
      finalModelImage = url;
    }

    const finalColors = await Promise.all(form.colors.map(async (c) => {
      if (c.tempFile) {
        const { url, error } = await uploadProductImage(c.tempFile, `color-${Date.now()}`);
        if (error) { toast.error(`Failed to upload image for color ${c.name}`); return c; }
        const { tempFile, ...rest } = c;
        return { ...rest, image: url };
      }
      return c;
    }));

    const payload = { 
      ...form, 
      frame_image: finalFrameImage, 
      model_image: finalModelImage, 
      colors: finalColors,
      price: Number(form.price), 
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_quantity: Number(form.stock_quantity || 0),
      offers: form.offers ? form.offers.split(',').map(o => o.trim()).filter(o => o.length > 0) : [],
      updated_at: new Date()
    };
    const { error } = await saveProduct(payload, editing);
    if (error) { toast.error('Save failed: ' + error.message); }
    else { toast.success(editing ? 'Product updated!' : 'Product added!'); setShowForm(false); loadProducts(); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const { error } = await deleteProduct(id);
    if (error) toast.error('Delete failed: ' + error.message); else { toast.success('Product deleted'); loadProducts(); }
  };

  const handleToggleActive = async (p) => {
    setToggling(prev => ({ ...prev, [p.id]: true }));
    const { error } = await toggleProductActive(p.id, !p.is_active);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(!p.is_active ? 'Product activated' : 'Product hidden');
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    }
    setToggling(prev => ({ ...prev, [p.id]: false }));
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/products" className="admin-nav-item active">🛍️ Products</Link>
          <Link to="/admin/inventory" className="admin-nav-item">📦 Inventory</Link>
          <Link to="/admin/orders" className="admin-nav-item">🧾 Orders</Link>
          <Link to="/admin/customers" className="admin-nav-item">👥 Customers</Link>
          <Link to="/admin/coupons" className="admin-nav-item">🎟️ Coupons</Link>
        </nav>
      </aside>


      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Products <span className="text-gray-300">({products.length})</span></h1>
          <button onClick={openAdd} className="admin-action-btn"><Plus size={16} /> Add Product</button>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-8">Loading products...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <img src={p.frame_image} alt={p.name} className="w-12 h-12 object-contain bg-gray-50 rounded-lg border border-gray-100" />
                          <span className="font-bold text-sm text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{p.brand}</td>
                      <td><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{p.category}</span></td>
                      <td>
                        <span className="font-black text-primary-blue">₹{p.price}</span>
                        {p.original_price && <span className="block text-xs text-gray-400 line-through">₹{p.original_price}</span>}
                      </td>
                      <td><span className="font-mono text-sm font-black">{p.stock_quantity ?? '—'}</span></td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={toggling[p.id]}
                          className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                          title={p.is_active ? 'Hide from store' : 'Show in store'}
                        >
                          <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ml-0.5 ${p.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Edit"><Edit3 size={14} /></button>
                          <button onClick={() => openDuplicate(p)} className="p-2 rounded-lg bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors" title="Duplicate"><Copy size={14} /></button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-row">
                <div className="form-group"><label>Product Name *</label><input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Titanium Aviator Elite" required /></div>
                <div className="form-group"><label>Brand *</label><input name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Chashmaly Elite" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Shape</label>
                  <select name="shape" value={form.shape} onChange={handleChange}>
                    {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Theme</label>
                  <select name="theme" value={form.theme} onChange={handleChange}>
                    {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price (₹) *</label><input name="price" type="number" value={form.price} onChange={handleChange} placeholder="2999" required /></div>
                <div className="form-group"><label>Original Price (₹)</label><input name="original_price" type="number" value={form.original_price} onChange={handleChange} placeholder="4999 (optional)" /></div>
                <div className="form-group"><label>Stock</label><input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange} /></div>
              </div>
              <div className="form-group">
                <label>Frame Image</label>
                <div className="flex items-center gap-3">
                  {form.frame_image && <img src={form.frame_image} alt="Frame" className="w-10 h-10 object-contain bg-gray-50 rounded border" />}
                  <input type="file" accept="image/*" name="frame_image" onChange={handleFileChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Model Image</label>
                <div className="flex items-center gap-3">
                  {form.model_image && <img src={form.model_image} alt="Model" className="w-10 h-10 object-contain bg-gray-50 rounded border" />}
                  <input type="file" accept="image/*" name="model_image" onChange={handleFileChange} />
                </div>
              </div>
              <div className="form-group"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Product details..." /></div>
              
              {/* Color Options Section */}
              <div className="admin-form-section">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">Product Colors</h3>
                  <button type="button" onClick={addColor} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-blue-100">+ Add Color</button>
                </div>
                <div className="space-y-4">
                  {form.colors.map((color, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                      <button type="button" onClick={() => removeColor(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="text-[10px]">Color Name</label>
                          <input value={color.name} onChange={(e) => handleColorChange(idx, 'name', e.target.value)} placeholder="e.g. Midnight Blue" className="bg-white" />
                        </div>
                        <div className="form-group">
                          <label className="text-[10px]">Hex Code</label>
                          <div className="flex gap-2">
                             <input type="color" value={color.hex} onChange={(e) => handleColorChange(idx, 'hex', e.target.value)} className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer" />
                             <input value={color.hex} onChange={(e) => handleColorChange(idx, 'hex', e.target.value)} placeholder="#000000" className="bg-white flex-1" />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="text-[10px]">Color Image</label>
                          <div className="flex items-center gap-2">
                            {color.image && <img src={color.image} alt="Preview" className="w-8 h-8 object-contain bg-white rounded border" />}
                            <input type="file" accept="image/*" onChange={(e) => handleColorFileChange(idx, e.target.files[0])} className="text-[10px] w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {form.colors.length === 0 && <div className="text-center py-4 text-gray-400 text-xs italic">No colors added yet.</div>}
                </div>
              </div>

              <div className="form-group"><label>Offers (comma separated)</label><input type="text" name="offers" value={form.offers} onChange={handleChange} placeholder="e.g. Buy 1 Get 1 Free, Free Lenses" /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} /><span className="text-sm font-bold">Mark as New Arrival</span></label>

              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={saving} className="admin-action-btn flex-1">{saving ? 'Saving...' : (editing ? 'Update Product' : 'Add Product')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full font-bold text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
