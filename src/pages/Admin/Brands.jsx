import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { getBrands, saveBrand, deleteBrand, subscribeBrands } from '../../lib/firebase';
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

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeBrands((data) => {
      setBrands(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

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
           <div>
             <h1 className="admin-title">Brand Partners</h1>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{brands.length} Active Collaborations</p>
           </div>
           <button onClick={() => { setForm({ name: '', description: '', logo: '' }); setEditing(null); setShowForm(true); }} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
             <Plus size={18} /> <span className="ml-1">Add Brand</span>
           </button>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Syncing Partner Registry...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Visual Identity</th>
                    <th>Brand Portfolio</th>
                    <th>Strategic Overview</th>
                    <th className="text-right">Management</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(b => (
                    <tr key={b.id} className="group">
                      <td>
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden p-1.5 group-hover:border-emerald-500/30 transition-all shadow-sm">
                          {b.logo ? <img src={b.logo} className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-slate-300" />}
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{b.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono font-bold tracking-widest mt-1 uppercase">Registry-ID: #{b.id.slice(0, 8)}</span>
                      </td>
                      <td>
                        <p className="text-sm text-slate-500 line-clamp-1 max-w-md group-hover:text-slate-700 transition-colors font-medium">{b.description || 'General eyewear manufacturing partner'}</p>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { setForm(b); setEditing(b.id); setShowForm(true); }} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(b.id, b.name)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-24 text-slate-300">
                        <ImageIcon size={48} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-[3px]">No brand entities located</p>
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
          <div className="admin-modal max-w-lg p-8 md:p-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Technical Modification' : 'Entity Initialization'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1.5">Configure partner identity and positioning</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-10">
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Brand Artifact (Logo)</label>
                <div className="flex items-center gap-8">
                  <div className="relative group w-28 h-28 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-inner">
                    {form.logo ? <img src={form.logo} className="w-full h-full object-contain p-3 transition-transform group-hover:scale-105" /> : <ImageIcon className="text-slate-300 group-hover:text-emerald-500 transition-colors" size={32} strokeWidth={1.5} />}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    {form.logo && (
                      <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                        <div className="bg-white/90 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-xl">Replace</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Primary Visual Mark</p>
                    <p className="text-[9px] text-slate-400 mt-2 leading-relaxed font-medium">High-resolution PNG or SVG preferred for catalog visual fidelity.</p>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Partner Designation *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vintage Craft Collective" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" required />
              </div>
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Strategic Narrative</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe the brand ethos and positioning..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none leading-relaxed" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/10 disabled:opacity-50">
                {saving ? 'Synchronizing Cloud Ecosystem...' : (editing ? 'Apply Partner Updates' : 'Initialize Brand Protocol')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
