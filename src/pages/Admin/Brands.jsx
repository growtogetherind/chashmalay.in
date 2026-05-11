import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { getBrands, saveBrand, deleteBrand } from '../../lib/firebase';
import { uploadImage } from '../../lib/cloudinary';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', logo: '' });
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await getBrands();
    setBrands(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Uploading logo...');
    const { url, error } = await uploadImage(file, 'brands');
    
    if (error) {
      toast.error(`Upload failed: ${error}`, { id: toastId });
    } else {
      setForm(prev => ({ ...prev, logo: url }));
      toast.success('Logo uploaded!', { id: toastId });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    
    setSaving(true);
    const { error } = await saveBrand(form, editing);
    if (error) toast.error('Failed to save');
    else {
      toast.success(editing ? 'Brand updated' : 'Brand added');
      setShowForm(false);
      loadData();
    }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: 'Delete Brand', message: `Are you sure you want to delete "${name}"?` }))) return;
    const { error } = await deleteBrand(id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Brand deleted');
      loadData();
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <h1 className="admin-title">Brands</h1>
           <button onClick={() => { setForm({ name: '', description: '', logo: '' }); setEditing(null); setShowForm(true); }} className="admin-action-btn"><Plus size={16} /> New Brand</button>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-12 font-black italic">Loading brands...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Brand Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div className="w-10 h-10 bg-gray-50 rounded-lg border flex items-center justify-center overflow-hidden">
                          {b.logo ? <img src={b.logo} className="w-full h-full object-contain" /> : <ImageIcon size={16} className="text-gray-300" />}
                        </div>
                      </td>
                      <td className="font-black text-gray-800">{b.name}</td>
                      <td className="text-sm text-gray-500">{b.description || '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => { setForm(b); setEditing(b.id); setShowForm(true); }} className="admin-table-btn edit"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(b.id, b.name)} className="admin-table-btn delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-400 italic">No brands found</td></tr>}
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
              <h2 className="text-xl font-black text-gray-900">{editing ? 'Edit Brand' : 'New Brand'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Brand Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
                    {form.logo ? <img src={form.logo} className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-300" />}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Click to upload brand logo</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Brand Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ray-Ban" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="About the brand..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                {saving ? 'Processing...' : 'Save Brand'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
