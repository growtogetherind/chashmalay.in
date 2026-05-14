import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { getOffers, saveOffer, deleteOffer, subscribeOffers } from '../../lib/firebase';
import { uploadImage } from '../../lib/cloudinary';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const EMPTY_OFFER = { title: '', description: '', code: '', bg_image: '', color_preset: 'from-blue-600/80 to-indigo-900/80', is_active: true };

const COLOR_PRESETS = [
    { name: 'Blue Night', value: 'from-blue-600/80 to-indigo-900/80' },
    { name: 'Sunset Red', value: 'from-orange-500/80 to-red-600/80' },
    { name: 'Elegant Dark', value: 'from-slate-800/80 to-black/80' },
    { name: 'Fresh Green', value: 'from-emerald-500/80 to-teal-800/80' },
    { name: 'Royal Purple', value: 'from-purple-600/80 to-indigo-800/80' }
];

const AdminOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_OFFER);
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState(null);
    const { confirm } = useConfirm();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeOffers((data) => {
            setOffers(data || []);
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data } = await getOffers();
        setOffers(data || []);
        setLoading(false);
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setForm(prev => ({ ...prev, bg_image: URL.createObjectURL(e.target.files[0]) }));
        }
    };

    const openAdd = () => { setForm(EMPTY_OFFER); setEditing(null); setFile(null); setShowForm(true); };
    const openEdit = (o) => { setForm({ ...o }); setEditing(o.id); setFile(null); setShowForm(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description) { toast.error('Title and description are required'); return; }
        setSaving(true);

        let bg_image = form.bg_image;
        if (file) {
            const uploadToast = toast.loading('Uploading image...');
            const { url, error } = await uploadImage(file, 'offers');
            if (error) {
                toast.error('Upload failed', { id: uploadToast });
                setSaving(false);
                return;
            }
            toast.success('Image uploaded!', { id: uploadToast });
            bg_image = url;
        }

        const { error } = await saveOffer({ ...form, bg_image }, editing);
        if (error) { toast.error('Save failed'); }
        else {
            toast.success(editing ? 'Offer updated' : 'Offer created');
            setShowForm(false);
            loadData();
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!(await confirm({ title: 'Delete Offer', message: 'Are you sure you want to delete this offer?' }))) return;
        const { error } = await deleteOffer(id);
        if (error) toast.error('Delete failed'); else { toast.success('Offer deleted'); loadData(); }
    };

    return (
        <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <div>
             <h1 className="admin-title">Offers</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-[2px] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Manage storefront offers
             </p>
           </div>
           <button onClick={openAdd} className="admin-primary-btn shadow-lg shadow-emerald-500/10 font-black">
             <Plus size={18} strokeWidth={3} /> <span>Create Offer</span>
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-32">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px] mt-6">Loading offers...</p>
            </div>
          ) : offers.map(o => (
            <div key={o.id} className="admin-card !p-0 overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-slate-100 bg-white shadow-xl shadow-slate-200/40">
               <div className="h-52 bg-slate-50 relative overflow-hidden">
                  {o.bg_image && <img src={o.bg_image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />}
                  <div className={`absolute inset-0 bg-gradient-to-r ${o.color_preset} mix-blend-multiply opacity-60 group-hover:opacity-40 transition-opacity`} />
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent`} />

                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-1 h-3 bg-emerald-500"></div>
                         <span className="text-[10px] font-black uppercase tracking-[2px] opacity-90">{o.code || 'GLOBAL CAMPAIGN'}</span>
                      </div>
                      <h3 className="font-black text-3xl tracking-tighter uppercase leading-none drop-shadow-lg">{o.title}</h3>
                  </div>

                  <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all z-20">
                      <button onClick={() => openEdit(o)} className="p-3 bg-white/95 text-slate-900 rounded-2xl shadow-2xl hover:scale-110 hover:bg-white transition-all backdrop-blur-sm border border-white/20"><Edit3 size={18} strokeWidth={2.5}/></button>
                      <button onClick={() => handleDelete(o.id)} className="p-3 bg-white/95 text-red-600 rounded-2xl shadow-2xl hover:scale-110 hover:bg-white transition-all backdrop-blur-sm border border-white/20"><Trash2 size={18} strokeWidth={2.5}/></button>
                  </div>
               </div>
               <div className="p-8">
                  <p className="text-[13px] text-slate-500 line-clamp-2 mb-6 font-bold leading-relaxed">{o.description}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                     <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] border shadow-sm ${o.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {o.is_active ? 'Live' : 'Hidden'}
                     </span>
                     <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100"></div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          ))}
          {!loading && offers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-40 bg-slate-50 rounded-[60px] border border-slate-100 border-dashed">
               <Plus size={64} strokeWidth={1} className="text-slate-200 mb-6 opacity-40" />
               <p className="text-[11px] font-black text-slate-300 uppercase tracking-[3px]">No offers yet</p>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-4xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">{editing ? 'Edit Marketing Protocol' : 'Initialize New Campaign'}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Strategic Deployment Interface Active
                  </p>
               </div>
               <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div className="form-group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Campaign Designation (Title) *</label>
                        <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. SUMMER SOLSTICE BONANZA" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner uppercase" required />
                     </div>
                     <div className="form-group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Briefing (Description) *</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Define campaign objectives and user value..." className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[24px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner resize-none leading-relaxed" required />
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div className="form-group">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Promo Protocol Code</label>
                           <input name="code" value={form.code} onChange={handleChange} placeholder="SOLSTICE25" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-black focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner uppercase" />
                        </div>
                        <div className="form-group">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Visual Matrix Preset</label>
                           <select name="color_preset" value={form.color_preset} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner cursor-pointer">
                              {COLOR_PRESETS.map(p => <option key={p.value} value={p.value}>{p.name.toUpperCase()}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-[3px] flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Promotional Backdrop
                        </label>
                        <div className="relative h-64 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden group/upload transition-all hover:border-emerald-200 shadow-inner">
                           {form.bg_image ? <img src={form.bg_image} className="w-full h-full object-cover transition-transform group-hover/upload:scale-105" /> : <div className="text-slate-200 flex flex-col items-center gap-3"><Plus size={48} strokeWidth={1} /><p className="text-[9px] font-black tracking-widest">UPLOAD ASSET</p></div>}
                           <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                           <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/upload:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] bg-white px-6 py-3 rounded-xl shadow-2xl">Modify Background Artifact</p>
                           </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4 italic">High-fidelity 1200x800 asset recommended</p>
                     </div>

                     <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[24px] border border-slate-100 w-full">
                        <div className="relative inline-flex items-center cursor-pointer">
                           <input
                              type="checkbox"
                              name="is_active"
                              checked={form.is_active}
                              onChange={handleChange}
                              className="sr-only peer"
                           />
                           <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                        </div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-[2px]">Activate Promotional Pipeline</span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-6 pt-10 border-t border-slate-50">
                  <button type="submit" disabled={saving} className="flex-1 py-6 bg-emerald-500 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 transition-all disabled:opacity-50">
                    {saving ? 'COMMITTING CAMPAIGN DATA...' : 'AUTHORIZE & DEPLOY CAMPAIGN'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-12 py-6 bg-slate-50 text-slate-400 border border-slate-100 rounded-[28px] font-black text-[11px] uppercase tracking-[3px] hover:bg-slate-900 hover:text-white transition-all shadow-sm">CANCEL</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
};

export default AdminOffers;
