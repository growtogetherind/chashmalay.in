import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory, subscribeCategories } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCategories((data) => {
      setCategories(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await getCategories();
    setCategories(data || []);
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    
    setSaving(true);
    const { error } = await saveCategory(form, editing);
    if (error) toast.error('Failed to save');
    else {
      toast.success(editing ? 'Category updated' : 'Category added');
      setShowForm(false);
      loadData();
    }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: 'Delete Category', message: `Are you sure you want to delete "${name}"?` }))) return;
    const { error } = await deleteCategory(id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Category deleted');
      loadData();
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <div>
             <h1 className="admin-title">Product Categories</h1>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{categories.length} Taxonomies Defined</p>
           </div>
           <button onClick={() => { setForm({ name: '', description: '' }); setEditing(null); setShowForm(true); }} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
             <Plus size={18} /> <span className="ml-1">Add Category</span>
           </button>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Organizing Taxonomy Registry...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category Signature</th>
                    <th>Functional Description</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="group">
                      <td>
                        <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{c.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tighter mt-1">Registry-ID: #{c.id.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td>
                        <p className="text-sm text-slate-500 line-clamp-1 max-w-md group-hover:text-slate-700 transition-colors font-medium">{c.description || 'No specialized description provided'}</p>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { setForm(c); setEditing(c.id); setShowForm(true); }} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-24 text-slate-300">
                        <p className="text-[10px] font-bold uppercase tracking-[3px]">System Registry Empty</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Technical Modification' : 'Entity Initialization'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1.5">Define structural grouping for the catalog</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-10">
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Category Designation *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Sunglasses" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" required />
              </div>
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Narrative Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Briefly define the target segment..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none leading-relaxed" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/10 disabled:opacity-50">
                {saving ? 'Synchronizing Cloud Ecosystem...' : (editing ? 'Apply Component Updates' : 'Initialize Category Protocol')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
