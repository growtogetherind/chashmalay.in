import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { subscribeLensAddons, subscribeLensCategories, saveLensAddon, deleteLensAddon } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const EMPTY_FORM = {
  name: '', group: '', price: 0, description: '',
  applicable_categories: [], sort_order: 999, is_active: true, is_default: false,
  image_url: '',
};

const AdminLensAddons = () => {
  const [addons, setAddons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    const unsubAddons = subscribeLensAddons(data => { setAddons(data || []); setLoading(false); }, () => setLoading(false));
    const unsubCats = subscribeLensCategories(data => setCategories(data || []), () => {});
    return () => { unsubAddons(); unsubCats(); };
  }, []);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setShowForm(true); };
  const openEdit = (a) => { setForm({ ...EMPTY_FORM, ...a }); setEditing(a.id); setShowForm(true); };
  const closeForm = () => setShowForm(false);

  const toggleCategory = (slug) => {
    setForm(f => ({
      ...f,
      applicable_categories: f.applicable_categories.includes(slug)
        ? f.applicable_categories.filter(s => s !== slug)
        : [...f.applicable_categories, slug],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Add-on name is required');
    if (!form.group.trim()) return toast.error('Group name is required');
    setSaving(true);
    const { error } = await saveLensAddon({ ...form, price: Number(form.price || 0) }, editing);
    if (error) toast.error('Failed to save add-on');
    else { toast.success(editing ? 'Add-on updated' : 'Add-on created'); closeForm(); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: 'Delete Add-on', message: `Delete "${name}"? This cannot be undone.` }))) return;
    const { error } = await deleteLensAddon(id);
    if (error) toast.error('Failed to delete'); else toast.success('Add-on deleted');
  };

  const toggleActive = async (a) => {
    await saveLensAddon({ ...a, is_active: !a.is_active }, a.id);
    toast.success(`Add-on ${a.is_active ? 'deactivated' : 'activated'}`);
  };

  // Group addons by group name for display
  const grouped = addons.reduce((acc, a) => {
    const g = a.group || 'Uncategorized';
    if (!acc[g]) acc[g] = [];
    acc[g].push(a);
    return acc;
  }, {});

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Lens Add-ons</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{addons.length} Add-on Options • {Object.keys(grouped).length} Groups</p>
          </div>
          <button onClick={openAdd} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
            <Plus size={18} /> <span className="ml-1">Add Add-on</span>
          </button>
        </div>

        {loading ? (
          <div className="admin-card flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading Add-ons...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="admin-card">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{group}</h3>
                  <span className="ml-auto text-[10px] text-slate-400 font-bold">{items.length} Options</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Add-on Name</th>
                        <th>Price</th>
                        <th>Description</th>
                        <th>Applies To</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(a => (
                        <tr key={a.id} className="group">
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                {a.image_url ? (
                                  <img src={a.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider">No Img</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{a.name}</p>
                                  {a.is_default && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded border border-blue-100 uppercase tracking-wide">Default</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><span className="font-black text-slate-900">₹{Number(a.price).toLocaleString()}</span></td>
                          <td><p className="text-sm text-slate-500 font-medium line-clamp-1 max-w-[200px]">{a.description || '—'}</p></td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(a.applicable_categories || []).map(slug => {
                                const cat = categories.find(c => c.slug === slug);
                                return (
                                  <span key={slug} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-wide border border-slate-200">
                                    {cat?.name || slug}
                                  </span>
                                );
                              })}
                              {!a.applicable_categories?.length && <span className="text-slate-300 text-xs">All</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${a.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {a.is_active ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => toggleActive(a)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-slate-100 hover:border-amber-100 transition-all">
                                {a.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                              <button onClick={() => openEdit(a)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all"><Edit3 size={15} /></button>
                              <button onClick={() => handleDelete(a.id, a.name)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {addons.length === 0 && (
              <div className="admin-card text-center py-24">
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[3px]">No Add-ons Configured</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal max-w-lg p-8 md:p-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Add-on' : 'New Add-on'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1">Add optional upgrades customers can select</p>
              </div>
              <button onClick={closeForm} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Add-on Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Photochromic (Grey)" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Group Name * <span className="normal-case tracking-normal font-medium">(one add-on per group selectable)</span></label>
                <input value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} placeholder="e.g. Lens Treatment, Coating" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Price (₹) *</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="699" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sort Order</label>
                  <input type="number" min="1" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this add-on do?" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add-on Image URL</label>
                  {form.image_url && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">
                      Delete Photo
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://example.com/addon-image.jpg" className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                  {form.image_url && (
                    <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 bg-white">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Applicable Lens Categories</label>
                <div className="space-y-2">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-all">
                      <input type="checkbox" checked={(form.applicable_categories || []).includes(c.slug)} onChange={() => toggleCategory(c.slug)} className="w-4 h-4 rounded accent-emerald-500" />
                      <span className="text-sm font-bold text-slate-700">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">{c.slug}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-all flex-1">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">Active</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-all flex-1">
                  <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Default Selected</span>
                </label>
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Add-on' : 'Create Add-on'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLensAddons;
