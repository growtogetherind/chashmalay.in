import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { subscribeLenses, subscribeLensCategories, saveLens, deleteLens } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const BADGES = ['', 'Top Selling', 'Recommended', 'New', 'Best Value'];

const EMPTY_FORM = {
  name: '', category_id: '', category_name: '', price: 0,
  description: '', features: '', badge: '', sort_order: 999, is_active: true,
  image_url: '',
};

const AdminLenses = () => {
  const [lenses, setLenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const { confirm } = useConfirm();

  useEffect(() => {
    const unsubLenses = subscribeLenses(data => { setLenses(data || []); setLoading(false); }, () => setLoading(false));
    const unsubCats = subscribeLensCategories(data => setCategories(data || []), () => {});
    return () => { unsubLenses(); unsubCats(); };
  }, []);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setShowForm(true); };
  const openEdit = (l) => {
    setForm({ ...EMPTY_FORM, ...l, features: Array.isArray(l.features) ? l.features.join(', ') : (l.features || '') });
    setEditing(l.id); setShowForm(true);
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
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price || 0),
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
                          <button onClick={() => toggleActive(l)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-slate-100 hover:border-amber-100 transition-all">
                            {l.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => openEdit(l)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all"><Edit3 size={15} /></button>
                          <button onClick={() => handleDelete(l.id, l.name)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-24 text-slate-300"><p className="text-[10px] font-bold uppercase tracking-[3px]">No Lenses Found</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal max-w-lg p-8 md:p-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Lens' : 'New Lens'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1">Configure a lens option available to customers</p>
              </div>
              <button onClick={closeForm} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lens Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bluecut Lens" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category *</label>
                <select value={form.category_id} onChange={e => handleCatChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all h-[54px]" required>
                  <option value="">Select a category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Price (₹)</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Badge</label>
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all h-[54px]">
                    {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Short Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Briefly describe this lens option" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lens Image URL</label>
                  {form.image_url && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">
                      Delete Photo
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://example.com/lens-image.jpg" className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                  {form.image_url && (
                    <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 bg-white">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Features <span className="normal-case tracking-normal font-medium">(comma-separated)</span></label>
                <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} rows={3} placeholder="UV Protection, Blue Light Filter, Anti-Glare..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sort Order</label>
                  <input type="number" min="1" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all h-[54px]">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50">
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
