import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, Eye, EyeOff, Layers } from 'lucide-react';
import { subscribeLensCategories, saveLensCategory, deleteLensCategory, seedLensSystemIfEmpty } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const EMPTY_FORM = { name: '', slug: '', description: '', sort_order: 999, is_active: true };

const slugify = (v = '') => v.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const AdminLensCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeLensCategories(
      (data) => { setCategories(data || []); setLoading(false); },
      () => setLoading(false)
    );
    // Seed if empty on first load
    seedLensSystemIfEmpty();
    return unsub;
  }, []);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ ...EMPTY_FORM, ...c }); setEditing(c.id); setShowForm(true); };
  const closeForm = () => setShowForm(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required');
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    const { error } = await saveLensCategory(payload, editing);
    if (error) toast.error('Failed to save category');
    else { toast.success(editing ? 'Category updated' : 'Category added'); closeForm(); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: 'Delete Lens Category', message: `Delete "${name}"? This cannot be undone.` }))) return;
    const { error } = await deleteLensCategory(id);
    if (error) toast.error('Failed to delete'); else toast.success('Category deleted');
  };

  const toggleActive = async (c) => {
    await saveLensCategory({ ...c, is_active: !c.is_active }, c.id);
    toast.success(`Category ${c.is_active ? 'deactivated' : 'activated'}`);
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Lens Categories</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{categories.length} Vision Types Configured</p>
          </div>
          <button onClick={openAdd} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
            <Plus size={18} /> <span className="ml-1">Add Category</span>
          </button>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading Lens System...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, i) => (
                    <tr key={c.id} className="group">
                      <td><span className="text-slate-400 font-mono text-xs">{i + 1}</span></td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <Layers size={16} />
                          </div>
                          <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{c.name}</span>
                        </div>
                      </td>
                      <td><span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tighter">{c.slug || slugify(c.name)}</span></td>
                      <td><p className="text-sm text-slate-500 font-medium line-clamp-1 max-w-xs">{c.description || '—'}</p></td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => toggleActive(c)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-slate-100 hover:border-amber-100 transition-all" title={c.is_active ? 'Deactivate' : 'Activate'}>
                            {c.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => openEdit(c)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-24 text-slate-300"><p className="text-[10px] font-bold uppercase tracking-[3px]">No Lens Categories Found</p></td></tr>
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
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Lens Category' : 'New Lens Category'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1">Define a vision type for customers to select</p>
              </div>
              <button onClick={closeForm} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="e.g. Single Vision" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="single-vision" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-mono focus:border-emerald-500 focus:bg-white outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description shown to customers..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sort Order</label>
                  <input type="number" min="1" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all h-[54px]">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 mt-4">
                {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLensCategories;
