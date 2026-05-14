import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, X, Copy, Image as ImageIcon, Tags, Layers, ChevronRight, Upload, Palette, Package, MoreVertical, Eye } from 'lucide-react';
import { getProducts, saveProduct, deleteProduct, getCategories, getBrands, toggleProductActive, subscribeProducts, subscribeCategories, subscribeBrands } from '../../lib/firebase';
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
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorEditing, setColorEditing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [colorForm, setColorForm] = useState({ name: '', hex: '#000000', image: '' });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [pendingImages, setPendingImages] = useState({});
  const [pendingGallery, setPendingGallery] = useState([]);
  const [pendingColorImages, setPendingColorImages] = useState({}); // New: Color variant uploads
  const { confirm } = useConfirm();

  // ── Lock body scroll when modal is open ──────────────────────────────────
  useEffect(() => {
    if (showForm || showColorModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm, showColorModal]);

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
    setLoading(true);
    const unProducts = subscribeProducts({ adminFilter: true }, (data) => {
      setProducts(data || []);
      setLoading(false);
    }, () => setLoading(false));
    const unCategories = subscribeCategories((data) => setCategories(data || []));
    const unBrands = subscribeBrands((data) => setBrands(data || []));
    return () => {
      unProducts?.();
      unCategories?.();
      unBrands?.();
    };
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

  const handleOpenColorModal = (index = null) => {
    if (index !== null) {
      setColorEditing(index);
      setColorForm(form.colors[index]);
    } else {
      setColorEditing(null);
      setColorForm({ name: '', hex: '#000000', hex2: '', is_dual_tone: false, image: '' });
    }
    setShowColorModal(true);
  };

  const handleSaveColor = () => {
    const newColors = [...(form.colors || [])];
    if (colorEditing !== null) {
      newColors[colorEditing] = colorForm;
    } else {
      newColors.push(colorForm);
    }
    setForm(prev => ({ ...prev, colors: newColors }));
    setShowColorModal(false);
    toast.success(colorEditing !== null ? 'Variation updated' : 'Variation added');
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
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Products</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{products.length} products in your store</p>
          </div>
          <button onClick={handleNewProduct} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
            <Plus size={18} /> <span className="ml-1">Add Product</span>
          </button>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading products...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>SKU / Brand</th>
                    <th>Category</th>
                    <th>Pricing</th>
                    <th>Inventory</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="group">
                      <td>
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/30 shadow-sm p-1.5">
                             {p.images?.front || p.frame_image || p.image || p.images?.gallery?.[0] ? <img src={p.images?.front || p.frame_image || p.image || p.images?.gallery?.[0]} className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-slate-300" />}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 block group-hover:text-emerald-600 transition-colors truncate max-w-[200px]">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">{p.gender} • {p.frame_shape}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="block text-xs font-mono font-bold text-slate-400 group-hover:text-slate-600 transition-colors">#{p.sku?.toUpperCase() || 'NO-SKU'}</span>
                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1 block">{p.brand || 'No Brand'}</span>
                      </td>
                      <td>
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[9px] font-bold uppercase tracking-widest">{p.category || 'Uncategorized'}</span>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 text-base">₹{p.price.toLocaleString()}</div>
                        {p.original_price && <div className="text-[10px] text-slate-400 font-bold line-through mt-1">₹{p.original_price.toLocaleString()}</div>}
                      </td>
                      <td>
                        <div className={`text-sm font-bold flex items-center gap-2 ${p.stock_quantity <= 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                          <Package size={14} className={p.stock_quantity <= 10 ? 'text-amber-400' : 'text-slate-300'} />
                          {p.stock_quantity}
                        </div>
                        {p.stock_quantity <= 10 && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1 block">Critical Level</span>}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end items-center gap-4">
                          <button
                            onClick={() => handleToggleActive(p)}
                            disabled={toggling[p.id]}
                            className={`admin-toggle ${p.is_active ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'}`}
                          >
                            <span className={`admin-toggle-dot ${p.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>

                          <div className="relative group/menu">
                            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100 transition-all">
                              <MoreVertical size={18} />
                            </button>

                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 p-2 transform origin-top-right scale-95 group-hover/menu:scale-100">
                               <button onClick={() => {
                                 setForm(p);
                                 setEditing(p.id);
                                 setPendingImages({});
                                 setPendingGallery([]);
                                 setShowForm(true);
                               }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Edit3 size={16} /> <span>Modify Asset</span>
                               </button>
                               <button onClick={() => {
                                 const duplicate = { ...p, id: undefined, name: `${p.name} (Copy)`, sku: `${p.sku}-COPY` };
                                 setForm(duplicate);
                                 setEditing(null);
                                 setShowForm(true);
                               }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Copy size={16} /> <span>Duplicate Profile</span>
                               </button>
                               <Link to={`/product/${p.id}`} target="_blank" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Eye size={16} /> <span>Inspect Live</span>
                               </Link>
                               <div className="h-px bg-slate-50 my-2" />
                               <button onClick={() => handleDelete(p.id, p.name)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Trash2 size={16} /> <span>Decommission</span>
                               </button>
                            </div>
                          </div>
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
        <div className="admin-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 md:p-8" onClick={() => setShowForm(false)}>
            <div className="admin-modal max-w-5xl w-full h-[90vh] bg-white rounded-[32px] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0 bg-white z-20">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{editing ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Adding products to your store
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
              </div>

              {/* Form Tabs */}
              <div className="flex gap-10 px-8 pt-6 border-b border-slate-100 shrink-0 bg-white z-10">
                <button type="button" onClick={() => setActiveTab('basic')} className={`pb-4 text-[10px] font-bold uppercase tracking-[2px] border-b-2 transition-all ${activeTab === 'basic' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>01. Basic Information</button>
                <button type="button" onClick={() => setActiveTab('details')} className={`pb-4 text-[10px] font-bold uppercase tracking-[2px] border-b-2 transition-all ${activeTab === 'details' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>02. Frame & Lens Details</button>
                <button type="button" onClick={() => setActiveTab('media')} className={`pb-4 text-[10px] font-bold uppercase tracking-[2px] border-b-2 transition-all ${activeTab === 'media' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>03. Product Images</button>
              </div>

            <form id="product-form" onSubmit={handleSave} className="admin-form overflow-y-auto p-8 flex-1 custom-scrollbar bg-slate-50/30">
              {activeTab === 'basic' && (
                <div className="space-y-10 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="form-group md:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Product Name *</label>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Titanium Aviator Gold Edition" required className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">SKU</label>
                      <input name="sku" value={form.sku} onChange={handleChange} placeholder="CHM-PRD-XXXX" className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-mono font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm uppercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Category *</label>
                      <select name="category" value={form.category} onChange={handleChange} required className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Brand *</label>
                      <select name="brand" value={form.brand} onChange={handleChange} required className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        <option value="">Select Brand</option>
                        {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Selling Price (₹) *</label>
                      <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" required className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-black focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Original Price (MRP) (₹)</label>
                      <input type="number" name="original_price" value={form.original_price} onChange={handleChange} placeholder="0.00" className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Stock Quantity</label>
                      <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Technical Narrative</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Compose a compelling narrative for this asset..." className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none leading-relaxed" />
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-10 pb-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Who is it for?</label>
                      <select name="gender" value={form.gender} onChange={handleChange} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Frame Type</label>
                      <select name="frame_type" value={form.frame_type} onChange={handleChange} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        {FRAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Product Shape</label>
                      <select name="frame_shape" value={form.frame_shape} onChange={handleChange} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Frame Material</label>
                      <select name="frame_material" value={form.frame_material} onChange={handleChange} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Lens Category</label>
                      <select name="lens_type" value={form.lens_type} onChange={handleChange} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm appearance-none cursor-pointer">
                        {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Search Tags (Separated by comma)</label>
                      <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. premium, red, round" className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4 block">Available Sizes</label>
                      <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        {SIZES.map(size => (
                          <label key={size} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                className="peer opacity-0 absolute h-6 w-6 cursor-pointer z-10"
                                checked={form.available_sizes?.includes(size)}
                                onChange={(e) => {
                                  const sizes = form.available_sizes || [];
                                  const newSizes = e.target.checked
                                    ? [...sizes, size]
                                    : sizes.filter(s => s !== size);
                                  setForm(prev => ({ ...prev, available_sizes: newSizes }));
                                }}
                              />
                              <div className="h-6 w-6 border-2 border-slate-200 rounded-lg bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all flex items-center justify-center shadow-inner">
                                <Plus size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase">{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4 block">Store Visibility</label>
                      <div className="flex gap-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} className="peer hidden" />
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                          <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">New Arrival</span>
                        </label>
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="peer hidden" />
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                          <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">Featured Product</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[2px]">Chroma Variation Profiles</label>
                        <p className="text-[9px] text-slate-400 mt-1 font-medium italic">Define color-specific visual and technical metadata.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenColorModal()}
                        className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-[2px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/10"
                      >
                        <Plus size={16} /> <span className="ml-1">Add Color</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(form.colors || []).map((color, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl group hover:border-emerald-200 transition-all shadow-sm">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 flex items-center justify-center shrink-0">
                            {color.image ? <img src={color.image} className="w-full h-full object-contain" /> : <Palette size={20} className="text-slate-200" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate uppercase">{color.name || 'Untitled Variant'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-3 h-3 rounded-full border border-slate-200" style={{ background: color.hex }}></div>
                              {color.is_dual_tone && (
                                <div className="w-3 h-3 rounded-full border border-slate-200" style={{ background: color.hex2 }}></div>
                              )}
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                                {color.hex} {color.is_dual_tone && `+ ${color.hex2}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenColorModal(index)}
                              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = form.colors.filter((_, i) => i !== index);
                                setForm(prev => ({ ...prev, colors: newColors }));
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!form.colors || form.colors.length === 0) && (
                        <div className="col-span-full py-10 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                          <Palette size={32} strokeWidth={1} className="mb-2 opacity-50" />
                          <span className="text-[9px] font-black uppercase tracking-[3px] opacity-40">No Variations Defined</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-10 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      { id: 'front', label: 'Primary Front' },
                      { id: 'side', label: 'Side Profile' },
                      { id: 'model', label: 'Face Display' },
                      { id: 'zoom', label: 'Macro Detail' }
                    ].map(img => (
                      <div key={img.id} className="form-group space-y-4">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[2px] text-center block">{img.label}</label>
                        <div className="relative group w-full aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-inner">
                          {form.images?.[img.id] ? (
                            <img src={form.images[img.id]} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                              <ImageIcon size={40} strokeWidth={1.5} />
                              <span className="text-[8px] font-black uppercase mt-3 tracking-[3px]">Initialize</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, `images.${img.id}`)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          {form.images?.[img.id] && (
                            <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                              <div className="bg-white/90 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-xl">Recalibrate Media</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <div className="flex items-center justify-between mb-6">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[2px]">High-Fidelity Gallery</label>
                      <label className="text-[10px] font-black text-emerald-600 uppercase cursor-pointer hover:text-emerald-700 flex items-center gap-3 border border-emerald-200 px-5 py-2.5 rounded-xl bg-emerald-50 transition-all shadow-sm">
                        <Layers size={16} /> Expand Assets
                        <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 min-h-[120px] shadow-inner">
                      {form.images?.gallery?.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-white shadow-sm p-1">
                          <img src={url} className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, images: { ...prev.images, gallery: prev.images.gallery.filter((_, i) => i !== idx) } }))}
                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {(!form.images?.gallery || form.images.gallery.length === 0) && (
                        <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-300">
                           <Layers size={32} strokeWidth={1} className="mb-3 opacity-50" />
                           <span className="text-[9px] font-black uppercase tracking-[3px] opacity-40">Registry Empty</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </form>

            {/* Sticky Footer */}
            <div className="flex gap-6 p-8 border-t border-slate-100 shrink-0 bg-white z-20">
              <button form="product-form" type="submit" disabled={saving} className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {saving ? 'Saving changes...' : (editing ? 'Save Changes' : 'Save Product')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-10 py-5 bg-slate-50 text-slate-400 rounded-2xl font-bold text-[10px] uppercase tracking-[3px] hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100 shadow-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showColorModal && (
        <div className="admin-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[2100] flex items-center justify-center p-4" onClick={() => setShowColorModal(false)}>
          <div className="admin-modal max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{colorEditing !== null ? 'Edit Color' : 'Add Color'}</h3>
              <button onClick={() => setShowColorModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="form-group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Color Name</label>
                <input
                  type="text"
                  value={colorForm.name}
                  onChange={(e) => setColorForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Gold & Black"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-xl">
                 <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={colorForm.is_dual_tone} onChange={(e) => setColorForm(prev => ({ ...prev, is_dual_tone: e.target.checked }))} className="peer hidden" />
                    <div className="w-5 h-5 rounded border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                    <span className="text-xs font-bold text-slate-600">This is a Dual Tone color</span>
                 </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={colorForm.hex} onChange={(e) => setColorForm(prev => ({ ...prev, hex: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
                    <input type="text" value={colorForm.hex} onChange={(e) => setColorForm(prev => ({ ...prev, hex: e.target.value }))} className="flex-grow bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-mono font-bold uppercase" />
                  </div>
                </div>

                {colorForm.is_dual_tone && (
                  <div className="form-group">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Secondary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={colorForm.hex2 || '#000000'} onChange={(e) => setColorForm(prev => ({ ...prev, hex2: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
                      <input type="text" value={colorForm.hex2 || '#000000'} onChange={(e) => setColorForm(prev => ({ ...prev, hex2: e.target.value }))} className="flex-grow bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-mono font-bold uppercase" />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                 <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Photo for this color</label>
                 <div className="relative aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500 transition-all cursor-pointer">
                    {colorForm.image ? (
                       <img src={colorForm.image} alt="" className="w-full h-full object-contain p-2" />
                    ) : (
                       <div className="flex flex-col items-center text-slate-300">
                          <Upload size={24} />
                          <span className="text-[10px] font-bold mt-2">Upload Photo</span>
                       </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                         const file = e.target.files[0];
                         if (file) {
                            const toastId = toast.loading('Uploading...');
                            const { url, error } = await uploadImage(file, 'products/colors');
                            if (error) toast.error('Upload failed');
                            else {
                               setColorForm(prev => ({ ...prev, image: url }));
                               toast.success('Uploaded!');
                            }
                            toast.dismiss(toastId);
                         }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                 </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={handleSaveColor} className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all">Save Color</button>
              <button onClick={() => setShowColorModal(false)} className="px-6 py-4 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
