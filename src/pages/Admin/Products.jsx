import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, X, Copy, Image as ImageIcon, Tags, Layers, ChevronRight, Upload, Palette } from 'lucide-react';
import { getProducts, saveProduct, deleteProduct, getCategories, getBrands, toggleProductActive } from '../../lib/firebase';
import { uploadImage } from '../../lib/cloudinary';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';
import AdminSidebar from '../../components/layout/AdminSidebar';

const GENDERS = ['Unisex', 'Men', 'Women', 'Kids'];
const FRAME_TYPES = ['Full Rim', 'Half Rim', 'Rimless', 'Low Bridge Fit'];
const MATERIALS = ['Acetate', 'Metal', 'Titanium', 'TR90', 'Ultem', 'Carbon Fiber', 'Wood'];
const LENS_TYPES = ['Single Vision', 'Bifocal', 'Progressive', 'Zero Power', 'Blue Cut', 'Photochromic'];
const SHAPES = ['Aviator', 'Rectangle', 'Round', 'Cat Eye', 'Wayfarer', 'Oval', 'Square', 'Geometric'];

const EMPTY_PRODUCT = { 
  name: '', 
  brand: '', 
  category: '', 
  sku: '', 
  price: '', 
  original_price: '', 
  discount_price: '',
  description: '', 
  stock_quantity: 100, 
  gender: 'Unisex',
  frame_type: 'Full Rim',
  frame_shape: 'Rectangle',
  frame_material: 'Acetate',
  lens_type: 'Single Vision',
  available_lenses: [], // New: Multiple compatible lenses
  available_sizes: ['M'], // New: S, M, L
  available_colors: ['Standard'], // New: Colors
  tags: '',
  is_active: true, 
  is_new: false,
  is_featured: false,
  images: {
    front: '',
    side: '',
    model: '',
    zoom: '',
    gallery: []
  },
  colors: [] 
};
const SIZES = ['S', 'M', 'L'];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [pendingImages, setPendingImages] = useState({});
  const [pendingGallery, setPendingGallery] = useState([]);
  const { confirm } = useConfirm();

  // Auto-save draft to localStorage
  useEffect(() => {
    if (showForm && !editing && form !== EMPTY_PRODUCT) {
      // Don't save preview URLs to localStorage, they won't be valid on reload
      const cleanForm = { ...form };
      // Optional: you could strip the blob URLs here if you want to be cleaner
      localStorage.setItem('product_draft', JSON.stringify(cleanForm));
    }
  }, [form, showForm, editing]);

  const restoreDraft = () => {
    const draft = localStorage.getItem('product_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      // Strip blob URLs as they are invalid after refresh
      if (parsed.images) {
        Object.keys(parsed.images).forEach(key => {
          if (key !== 'gallery' && typeof parsed.images[key] === 'string' && parsed.images[key].startsWith('blob:')) {
            parsed.images[key] = '';
          }
        });
        if (parsed.images.gallery) {
          parsed.images.gallery = parsed.images.gallery.filter(url => !url.startsWith('blob:'));
        }
      }
      setForm(parsed);
      toast.success('Draft restored! (Images need to be re-selected)');
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('product_draft');
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        getProducts({ adminFilter: true }),
        getCategories(),
        getBrands()
      ]);
      
      const fetchedProducts = pRes.data || [];
      setProducts(fetchedProducts);

      // Smart Fallback: If categories/brands collections are empty, 
      // extract unique values from existing products
      let fetchedCats = cRes.data || [];
      if (fetchedCats.length === 0 && fetchedProducts.length > 0) {
        const uniqueCats = [...new Set(fetchedProducts.map(p => p.category).filter(Boolean))];
        fetchedCats = uniqueCats.map((name, i) => ({ id: `ext-${i}`, name }));
      }
      setCategories(fetchedCats);

      let fetchedBrands = bRes.data || [];
      if (fetchedBrands.length === 0 && fetchedProducts.length > 0) {
        const uniqueBrands = [...new Set(fetchedProducts.map(p => p.brand).filter(Boolean))];
        fetchedBrands = uniqueBrands.map((name, i) => ({ id: `ext-b-${i}`, name }));
      }
      setBrands(fetchedBrands);
    } catch (err) {
      console.error("LoadData Error:", err);
      toast.error("Failed to load some data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleFileUpload = (e, path) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Store file for later upload
    setPendingImages(prev => ({ ...prev, [path]: file }));

    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: previewUrl } }));
    } else {
      setForm(prev => ({ ...prev, [path]: previewUrl }));
    }
    
    toast.success(`${path.split('.').pop()} selected (pending upload)`);
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    // Store files for later upload
    setPendingGallery(prev => [...prev, ...files]);

    setForm(prev => ({ 
      ...prev, 
      images: { ...prev.images, gallery: [...(prev.images.gallery || []), ...newPreviews] } 
    }));
    toast.success(`${files.length} images added to gallery (pending upload)`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price are required.'); return; }
    
    const isNew = !editing;
    const confirmMessage = isNew 
      ? 'Are you sure you want to publish this new product? All images will be uploaded now.' 
      : 'Are you sure you want to update this product? Any newly selected images will be uploaded.';

    if (!(await confirm({ title: isNew ? 'Publish Product' : 'Update Product', message: confirmMessage }))) {
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Processing product and uploads...');

    try {
      let finalImages = { ...form.images };

      // 1. Upload Pending Single Images
      for (const [path, file] of Object.entries(pendingImages)) {
        const { url, error } = await uploadImage(file, 'products');
        if (error) throw new Error(`Failed to upload ${path}: ${error}`);
        
        if (path.includes('.')) {
          const [_, child] = path.split('.');
          finalImages[child] = url;
        }
      }

      // 3. CRITICAL: Filter out any remaining blob: URLs from single images
      Object.keys(finalImages).forEach(key => {
        if (key !== 'gallery' && typeof finalImages[key] === 'string' && finalImages[key].startsWith('blob:')) {
          finalImages[key] = ''; // Remove if not uploaded
        }
      });

      // 2. Upload Pending Gallery Images
      if (pendingGallery.length > 0) {
        const uploadedGalleryUrls = [];
        for (const file of pendingGallery) {
          const { url, error } = await uploadImage(file, 'products/gallery');
          if (error) throw new Error(`Gallery upload failed: ${error}`);
          uploadedGalleryUrls.push(url);
        }
        // Filter out blob URLs and add new Cloudinary URLs
        const existingUrls = (finalImages.gallery || []).filter(url => typeof url === 'string' && !url.startsWith('blob:'));
        finalImages.gallery = [...existingUrls, ...uploadedGalleryUrls];
      } else {
        // Just filter out blob URLs if any were removed or not uploaded
        finalImages.gallery = (finalImages.gallery || []).filter(url => typeof url === 'string' && !url.startsWith('blob:'));
      }

      const payload = { 
        ...form, 
        images: finalImages,
        price: Number(form.price), 
        original_price: form.original_price ? Number(form.original_price) : null,
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        stock_quantity: Number(form.stock_quantity || 0),
        updated_at: new Date()
      };
      
      const { error } = await saveProduct(payload, editing);
      if (error) { 
        toast.error('Save failed: ' + error.message, { id: toastId }); 
      } else { 
        toast.success(editing ? 'Product updated!' : 'Product added!', { id: toastId }); 
        setShowForm(false); 
        clearDraft();
        setPendingImages({});
        setPendingGallery([]);
        loadData(); 
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleNewProduct = () => {
    setForm(EMPTY_PRODUCT);
    setEditing(null);
    setPendingImages({});
    setPendingGallery([]);
    
    const draft = localStorage.getItem('product_draft');
    if (draft) {
      confirm({ 
        title: 'Restore Draft?', 
        message: 'We found an unfinished product draft. Would you like to restore it?' 
      }).then(confirmed => {
        if (confirmed) restoreDraft();
        setShowForm(true);
      });
    } else {
      setShowForm(true);
    }
  };

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: 'Delete Product', message: `Are you sure you want to delete "${name}"? This action cannot be undone.` }))) return;
    const { error } = await deleteProduct(id);
    if (error) toast.error('Delete failed: ' + error.message); else { toast.success('Product deleted'); loadData(); }
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
        <div className="admin-brand flex items-center gap-2">
           <span className="text-xl">🕶️</span>
           <div>CHASHMALY <span>ADMIN</span></div>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/products" className="admin-nav-item active">🛍️ Products</Link>
          <Link to="/admin/categories" className="admin-nav-item">📁 Categories</Link>
          <Link to="/admin/brands" className="admin-nav-item">🏷️ Brands</Link>
          <Link to="/admin/inventory" className="admin-nav-item">📦 Inventory</Link>
          <Link to="/admin/orders" className="admin-nav-item">🧾 Orders</Link>
          <Link to="/admin/customers" className="admin-nav-item">👥 Customers</Link>
          <Link to="/admin/prescriptions" className="admin-nav-item">📄 Prescriptions</Link>
          <Link to="/admin/coupons" className="admin-nav-item">🎟️ Coupons</Link>
          <Link to="/admin/reviews" className="admin-nav-item">⭐ Reviews</Link>
          <Link to="/admin/settings" className="admin-nav-item">⚙️ Settings</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Product Catalog</h1>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">{products.length} Products Total</p>
          </div>
          <button onClick={handleNewProduct} className="admin-primary-btn"><Plus size={16} /> New Product</button>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-12 font-black italic">Loading catalog...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU / Brand</th>
                    <th>Category</th>
                    <th>Pricing</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                             {p.images?.front || p.frame_image || p.image || p.images?.gallery?.[0] ? <img src={p.images?.front || p.frame_image || p.image || p.images?.gallery?.[0]} className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-gray-300" />}
                          </div>
                          <div>
                            <span className="font-black text-sm text-gray-800 block">{p.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{p.gender} • {p.frame_shape}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="block text-xs font-mono font-black text-gray-600">#{p.sku || 'NO-SKU'}</span>
                        <span className="text-[10px] text-primary-blue font-black uppercase">{p.brand || 'No Brand'}</span>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{p.category || 'Uncategorized'}</span>
                      </td>
                      <td>
                        <div className="font-black text-gray-900">₹{p.price.toLocaleString()}</div>
                        {p.original_price && <div className="text-[10px] text-gray-400 line-through">₹{p.original_price.toLocaleString()}</div>}
                      </td>
                      <td>
                        <div className={`text-sm font-black ${p.stock_quantity <= 10 ? 'text-red-500' : 'text-gray-600'}`}>
                          {p.stock_quantity}
                        </div>
                        {p.stock_quantity <= 10 && <span className="text-[8px] font-black text-red-400 uppercase">Low Stock</span>}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={toggling[p.id]}
                          className={`admin-toggle ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`admin-toggle-dot ${p.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => { 
                            setForm(p); 
                            setEditing(p.id); 
                            setPendingImages({});
                            setPendingGallery([]);
                            setShowForm(true); 
                          }} className="admin-table-btn edit"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="admin-table-btn delete"><Trash2 size={14} /></button>
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

      {/* Product Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900">{editing ? 'Edit Product' : 'Create New Product'}</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Fill in all the details for the catalog</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex gap-6 mb-8 border-b border-gray-100">
              <button onClick={() => setActiveTab('basic')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'basic' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-gray-400'}`}>Basic Info</button>
              <button onClick={() => setActiveTab('details')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'details' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-gray-400'}`}>Eyewear Details</button>
              <button onClick={() => setActiveTab('media')} className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'media' ? 'border-primary-blue text-primary-blue' : 'border-transparent text-gray-400'}`}>Media & Gallery</button>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="form-row">
                    <div className="form-group flex-[2]">
                      <label>Product Name *</label>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Titanium Aviator Gold" required />
                    </div>
                    <div className="form-group">
                      <label>SKU (Auto-gen if empty)</label>
                      <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU-123" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select name="category" value={form.category} onChange={handleChange} required>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      {categories.length === 0 && (
                        <p className="text-[9px] text-red-500 font-bold mt-1">
                          No categories found. Please add them in the <Link to="/admin/categories" className="underline">Categories</Link> tab.
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Brand *</label>
                      <select name="brand" value={form.brand} onChange={handleChange} required>
                        <option value="">Select Brand</option>
                        {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Retail Price (₹) *</label>
                      <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="2999" required />
                    </div>
                    <div className="form-group">
                      <label>Original Price (₹)</label>
                      <input type="number" name="original_price" value={form.original_price} onChange={handleChange} placeholder="4999" />
                    </div>
                    <div className="form-group">
                      <label>Stock Qty</label>
                      <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Tell us about the product..." />
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6">
                   <div className="form-row">
                    <div className="form-group">
                      <label>Gender Type</label>
                      <select name="gender" value={form.gender} onChange={handleChange}>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Frame Type</label>
                      <select name="frame_type" value={form.frame_type} onChange={handleChange}>
                        {FRAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Frame Shape</label>
                      <select name="frame_shape" value={form.frame_shape} onChange={handleChange}>
                        {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Frame Material</label>
                      <select name="frame_material" value={form.frame_material} onChange={handleChange}>
                        {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Default Lens Type</label>
                      <select name="lens_type" value={form.lens_type} onChange={handleChange}>
                        {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tags (Comma separated)</label>
                      <input name="tags" value={form.tags} onChange={handleChange} placeholder="premium, trendy, lightweight" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Frame Sizes Available</label>
                    <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                      {SIZES.map(size => (
                        <label key={size} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.available_sizes?.includes(size)} 
                            onChange={(e) => {
                              const sizes = form.available_sizes || [];
                              const newSizes = e.target.checked 
                                ? [...sizes, size] 
                                : sizes.filter(s => s !== size);
                              setForm(prev => ({ ...prev, available_sizes: newSizes }));
                            }}
                          />
                          <span className="text-xs font-bold">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Available Lenses (Selection for customer)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl">
                      {LENS_TYPES.map(lens => (
                        <label key={lens} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.available_lenses?.includes(lens)} 
                            onChange={(e) => {
                              const lenses = form.available_lenses || [];
                              const newLenses = e.target.checked 
                                ? [...lenses, lens] 
                                : lenses.filter(l => l !== lens);
                              setForm(prev => ({ ...prev, available_lenses: newLenses }));
                            }}
                          />
                          <span className="text-[10px] font-bold">{lens}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group col-span-full">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Color Variants</label>
                      <button 
                        type="button" 
                        onClick={() => setForm(prev => ({ ...prev, colors: [...(prev.colors || []), { name: '', hex: '#000000', image: '' }] }))}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                      >
                        <Plus size={14} /> Add Color
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {(form.colors || []).map((color, index) => (
                        <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 items-start">
                          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Color Name</label>
                              <input 
                                type="text" 
                                value={color.name}
                                onChange={(e) => {
                                  const newColors = [...form.colors];
                                  newColors[index].name = e.target.value;
                                  setForm(prev => ({ ...prev, colors: newColors }));
                                }}
                                placeholder="e.g. Matte Black"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Hex Code</label>
                              <div className="flex gap-2 items-center h-[46px]">
                                <input 
                                  type="color" 
                                  value={color.hex || '#000000'}
                                  onChange={(e) => {
                                    const newColors = [...form.colors];
                                    newColors[index].hex = e.target.value;
                                    setForm(prev => ({ ...prev, colors: newColors }));
                                  }}
                                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                                />
                                <input 
                                  type="text" 
                                  value={color.hex || '#000000'}
                                  onChange={(e) => {
                                    const newColors = [...form.colors];
                                    newColors[index].hex = e.target.value;
                                    setForm(prev => ({ ...prev, colors: newColors }));
                                  }}
                                  className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all uppercase"
                                />
                              </div>
                            </div>
                            
                            {/* Color Image Upload */}
                            <div className="col-span-full">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Variant Image (Optional)</label>
                              <div className="flex items-center gap-4">
                                {color.image && (
                                  <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-white">
                                    <img src={color.image} alt={color.name} className="w-full h-full object-contain" />
                                  </div>
                                )}
                                <label className="cursor-pointer px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-2">
                                  <Upload size={14} /> {color.image ? 'Change Image' : 'Upload Image'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      
                                      const toastId = toast.loading('Uploading color image...');
                                      const { url, error } = await uploadImage(file, 'products/colors');
                                      
                                      if (error) {
                                        toast.error('Failed to upload image', { id: toastId });
                                      } else {
                                        const newColors = [...form.colors];
                                        newColors[index].image = url;
                                        setForm(prev => ({ ...prev, colors: newColors }));
                                        toast.success('Image uploaded', { id: toastId });
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const newColors = form.colors.filter((_, i) => i !== index);
                              setForm(prev => ({ ...prev, colors: newColors }));
                            }}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0 mt-7"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {(!form.colors || form.colors.length === 0) && (
                        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                          <Palette size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Color Variants Added</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} />
                      <span className="text-[10px] font-black uppercase">New Arrival</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
                      <span className="text-[10px] font-black uppercase">Featured Product</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'front', label: 'Front View' },
                      { id: 'side', label: 'Side View' },
                      { id: 'model', label: 'Model Face' },
                      { id: 'zoom', label: 'Zoom Detail' }
                    ].map(img => (
                      <div key={img.id} className="form-group">
                        <label>{img.label}</label>
                        <div className="relative group w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-primary-blue transition-colors cursor-pointer">
                          {form.images?.[img.id] ? (
                            <img src={form.images[img.id]} className="w-full h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <ImageIcon size={24} />
                              <span className="text-[8px] font-black uppercase mt-1">Upload</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, `images.${img.id}`)}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <div className="flex items-center justify-between mb-2">
                      <label>Product Gallery</label>
                      <label className="text-[10px] font-black text-primary-blue uppercase cursor-pointer hover:underline">
                        + Add Multiple
                        <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {form.images?.gallery?.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0">
                          <img src={url} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setForm(prev => ({ ...prev, images: { ...prev.images, gallery: prev.images.gallery.filter((_, i) => i !== idx) } }))}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {(!form.images?.gallery || form.images.gallery.length === 0) && (
                        <div className="w-16 h-16 rounded-xl border border-dashed flex items-center justify-center text-gray-300">
                           <Layers size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-8 sticky bottom-0 bg-white pt-4 border-t">
                <button type="submit" disabled={saving} className="admin-action-btn flex-1 py-4 text-sm">
                  {saving ? 'Processing...' : (editing ? 'Update Product' : 'Publish Product')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
