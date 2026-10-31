import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, X, Eye, EyeOff, Search, Layers, Globe } from 'lucide-react';
import { subscribeLenses, subscribeLensCategories, subscribeProducts, saveLens, deleteLens } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const BADGES = ['', 'Top Selling', 'Recommended', 'New', 'Best Value'];

const EMPTY_FORM = {
  name: '',
  category_id: '',
  category_name: '',
  price: 0,
  description: '',
  features: '',
  badge: '',
  sort_order: 999,
  is_active: true,
  image_url: '',
  applies_to: 'all', // 'all' or 'specific'
  applicable_product_ids: []
};

const AdminLenses = () => {
  const [lenses, setLenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const { confirm } = useConfirm();

  useEffect(() => {
    const unsubLenses = subscribeLenses(data => { setLenses(data || []); setLoading(false); }, () => setLoading(false));
    const unsubCats = subscribeLensCategories(data => setCategories(data || []), () => {});
    const unsubProducts = subscribeProducts({ adminFilter: true }, data => setProducts(data || []), () => {});
    return () => {
      unsubLenses();
      unsubCats();
      unsubProducts();
    };
  }, []);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setProductSearch('');
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (l) => {
    setForm({
      ...EMPTY_FORM,
      ...l,
      applies_to: l.applies_to || 'all',
      applicable_product_ids: Array.isArray(l.applicable_product_ids) ? l.applicable_product_ids : [],
      features: Array.isArray(l.features) ? l.features.join(', ') : (l.features || '')
    });
    setProductSearch('');
    setEditing(l.id);
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const handleCatChange = (catId) => {
    const cat = categories.find(c => c.id === catId);
    setForm(f => ({ ...f, category_id: catId, category_name: cat?.name || '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Lens name is required');
    if (!form.category_id) return toast.error('Please select a category');
    if (form.applies_to === 'specific' && (!form.applicable_product_ids || form.applicable_product_ids.length === 0)) {
      return toast.error('Please select at least one eyewear frame or switch to "All Eyewear"');
    }

    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price || 0),
      applies_to: form.applies_to || 'all',
      applicable_product_ids: form.applies_to === 'specific' ? (form.applicable_product_ids || []) : [],
      features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : [],
    };
    const { error } = await saveLens(payload, editing);
    if (error) toast.error('Failed to save lens');
    else { toast.success(editing ? 'Lens updated' : 'Lens added'); closeForm(); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: 'Delete Lens', message: `Delete "${name}"? This cannot be undone.` }))) return;
    const { error } = await deleteLens(id);
    if (error) toast.error('Failed to delete'); else toast.success('Lens deleted');
  };

  const toggleActive = async (l) => {
    await saveLens({ ...l, is_active: !l.is_active }, l.id);
    toast.success(`Lens ${l.is_active ? 'deactivated' : 'activated'}`);
  };

  // Toggle single product selection for specific eyewear
  const toggleProductSelection = (productId) => {
    setForm(f => {
      const current = Array.isArray(f.applicable_product_ids) ? [...f.applicable_product_ids] : [];
      const idx = current.indexOf(productId);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(productId);
      }
      return { ...f, applicable_product_ids: current };
    });
  };

  // Filter products for the modal selection checklist
  const filteredModalProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase().trim();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const handleSelectAllProducts = () => {
    const allIds = filteredModalProducts.map(p => p.id);
    setForm(f => ({
      ...f,
      applicable_product_ids: Array.from(new Set([...(f.applicable_product_ids || []), ...allIds]))
    }));
  };

  const handleDeselectAllProducts = () => {
    if (productSearch.trim()) {
      const filteredIds = new Set(filteredModalProducts.map(p => p.id));
      setForm(f => ({
        ...f,
        applicable_product_ids: (f.applicable_product_ids || []).filter(id => !filteredIds.has(id))
      }));
    } else {
      setForm(f => ({ ...f, applicable_product_ids: [] }));
    }
  };

  const filtered = filterCat === 'all' ? lenses : lenses.filter(l => l.category_id === filterCat);

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Lenses</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{lenses.length} Lens Options Available</p>
          </div>
          <button onClick={openAdd} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
            <Plus size={18} /> <span className="ml-1">Add Lens</span>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterCat === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterCat === c.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'}`}>{c.name}</button>
          ))}
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading Lens Catalog...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Lens Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Availability</th>
                    <th>Badge</th>
                    <th>Features</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                            {l.image_url ? (
                              <img src={l.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">No Img</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{l.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">{l.description}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100">{l.category_name || '—'}</span>
                      </td>
                      <td><span className="font-black text-slate-900">{l.price === 0 ? 'Free' : `₹${Number(l.price).toLocaleString()}`}</span></td>
                      <td>
                        {l.applies_to === 'specific' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Layers size={12} className="text-amber-500" />
                            <span>{(l.applicable_product_ids?.length || 0)} Frame{(l.applicable_product_ids?.length === 1) ? '' : 's'} Only</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Globe size={12} className="text-emerald-500" />
                            <span>All Eyewear</span>
                          </span>
                        )}
                      </td>
                      <td>
                        {l.badge ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${l.badge === 'Top Selling' ? 'bg-amber-50 text-amber-700 border border-amber-200' : l.badge === 'Recommended' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>{l.badge}</span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(Array.isArray(l.features) ? l.features : []).slice(0, 2).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-wide">{f}</span>
                          ))}
                          {(l.features?.length || 0) > 2 && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black">+{l.features.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${l.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${l.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {l.is_active ? 'Active' : 'Off'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => toggleActive(l)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-slate-100 hover:border-amber-100 transition-all" title={l.is_active ? 'Deactivate' : 'Activate'}>
                            {l.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => openEdit(l)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all" title="Edit Lens"><Edit3 size={15} /></button>
                          <button onClick={() => handleDelete(l.id, l.name)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all" title="Delete Lens"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="8" className="text-center py-24 text-slate-300"><p className="text-[10px] font-bold uppercase tracking-[3px]">No Lenses Found</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal max-w-xl p-6 md:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Lens' : 'New Lens'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1">Configure lens details & eyewear availability</p>
              </div>
              <button onClick={closeForm} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lens Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bluecut Lens" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category *</label>
                <select value={form.category_id} onChange={e => handleCatChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all h-[48px]" required>
                  <option value="">Select a category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Eyewear Availability / Scope */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    Eyewear Availability / Scope
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Choose whether this lens shows on all frames or only specific selected eyewear.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, applies_to: 'all' }))}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      form.applies_to !== 'specific'
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${form.applies_to !== 'specific' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        All Eyewear
                        {form.applies_to !== 'specific' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Available on all frames & products
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, applies_to: 'specific' }))}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      form.applies_to === 'specific'
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${form.applies_to === 'specific' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Layers size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Specific Eyewear Only
                        {form.applies_to === 'specific' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Show on selected frames; hide on others
                      </p>
                    </div>
                  </button>
                </div>

                {/* If Specific Eyewear selected, show search and product checklist */}
                {form.applies_to === 'specific' && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        Selected Frames: <span className="text-emerald-600">{form.applicable_product_ids?.length || 0}</span>
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleSelectAllProducts}
                          className="text-[9px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                        >
                          Select All ({filteredModalProducts.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllProducts}
                          className="text-[9px] font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Search frames by name, SKU, or category..."
                        className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-emerald-500 outline-none transition-all"
                      />
                      {productSearch && (
                        <button
                          type="button"
                          onClick={() => setProductSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Frame Checklist Box */}
                    <div className="max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-inner">
                      {filteredModalProducts.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs font-medium">
                          No frames found matching "{productSearch}"
                        </div>
                      ) : (
                        filteredModalProducts.map(p => {
                          const isSelected = form.applicable_product_ids?.includes(p.id);
                          const mainImg = p.image_url || (Array.isArray(p.images) && p.images[0]) || '';
                          return (
                            <div
                              key={p.id}
                              onClick={() => toggleProductSelection(p.id)}
                              className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                                isSelected ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected || false}
                                onChange={() => {}} // handled by parent div onClick
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 pointer-events-none accent-emerald-500 shrink-0"
                              />
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {mainImg ? (
                                  <img src={mainImg} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <span className="text-[7px] font-black text-slate-300 uppercase">Img</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {p.category_name || p.category || 'Eyewear'} {p.sku ? `• SKU: ${p.sku}` : ''}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-black text-slate-900">
                                  ₹{Number(p.price || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {form.applicable_product_ids?.length > 0 && (
                      <p className="text-[10px] text-emerald-700 font-bold">
                        ✓ Visible on {form.applicable_product_ids.length} selected frame{form.applicable_product_ids.length > 1 ? 's' : ''}. Hidden on all other products.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Price (₹)</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Badge</label>
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all h-[48px]">
                    {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Short Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Briefly describe this lens option" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lens Image URL</label>
                  {form.image_url && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">
                      Delete Photo
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://example.com/lens-image.jpg" className="flex-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                  {form.image_url && (
                    <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 bg-white">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Features <span className="normal-case tracking-normal font-medium">(comma-separated)</span></label>
                <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} rows={2} placeholder="UV Protection, Blue Light Filter, Anti-Glare..." className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sort Order</label>
                  <input type="number" min="1" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all h-[48px]">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 mt-2">
                {saving ? 'Saving...' : editing ? 'Update Lens' : 'Create Lens'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLenses;
