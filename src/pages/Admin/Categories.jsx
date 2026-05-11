import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory } from '../../lib/firebase';
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

  useEffect(() => { loadData(); }, []);

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
           <h1 className="admin-title">Categories</h1>
           <button onClick={() => { setForm({ name: '', description: '' }); setEditing(null); setShowForm(true); }} className="admin-action-btn"><Plus size={16} /> New Category</button>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-12 font-black italic">Loading categories...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td className="font-black text-gray-800">{c.name}</td>
                      <td className="text-sm text-gray-500">{c.description || '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => { setForm(c); setEditing(c.id); setShowForm(true); }} className="admin-table-btn edit"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="admin-table-btn delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && <tr><td colSpan="3" className="text-center py-8 text-gray-400 italic">No categories found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-900">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Glasses" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                {saving ? 'Processing...' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
