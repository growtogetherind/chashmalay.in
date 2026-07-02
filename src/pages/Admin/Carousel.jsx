import { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2, ExternalLink, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { getCarouselItems, saveCarouselItem, deleteCarouselItem, subscribeCarouselItems } from '../../lib/firebase';
import { uploadImage } from '../../lib/cloudinary';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const EMPTY_ITEM = { title: '', subtitle: '', image: '', mobile_image: '', link: '', order: 0, is_active: true, theme: 'dark' };

const AdminCarousel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCarouselItems((data) => {
      setItems(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await getCarouselItems();
    setItems(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${field}...`);
    const { url, error } = await uploadImage(file, 'carousel');

    if (error) {
      toast.error(`Upload failed: ${error}`, { id: toastId });
    } else {
      setForm(prev => ({ ...prev, [field]: url }));
      toast.success('Uploaded!', { id: toastId });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image) return toast.error('Desktop image is required');

    setSaving(true);
    const { error } = await saveCarouselItem({ ...form, order: Number(form.order) }, editing);
    if (error) toast.error('Failed to save');
    else {
      toast.success(editing ? 'Banner updated' : 'Banner added');
      setShowForm(false);
      loadData();
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: 'Delete Banner', message: 'Are you sure you want to delete this banner?' }))) return;
    const { error } = await deleteCarouselItem(id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Banner deleted');
      loadData();
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Home Banners</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-[2px] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {items.length} banners
            </p>
          </div>
          <button onClick={() => { setForm({ ...EMPTY_ITEM, order: items.length }); setEditing(null); setShowForm(true); }} className="admin-primary-btn shadow-lg shadow-emerald-500/10 font-black">
            <Plus size={18} strokeWidth={3} /> <span>New Banner</span>
          </button>
        </div>

        <div className="admin-card">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Banner Image</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-24">
                       <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                       <p className="text-[10px] text-slate-400 font-black uppercase mt-4 tracking-widest">Loading banners...</p>
                    </td>
                  </tr>
                ) :
                items.map(item => (
                  <tr key={item.id} className="group">
                    <td>
                       <div className="w-40 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group/preview shadow-inner">
                          <img src={item.image} className="w-full h-full object-cover transition-transform group-hover/preview:scale-110" alt="" />
                          <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover/preview:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                             <a href={item.image} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-emerald-600 rounded-xl shadow-2xl hover:scale-110 transition-transform"><ExternalLink size={16} strokeWidth={2.5} /></a>
                          </div>
                       </div>
                    </td>
                    <td>
                      <p className="font-black text-sm text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{item.title || 'Untitled Banner'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{item.subtitle || 'No Subtitle Specified'}</p>
                    </td>
                    <td>
                       <span className="px-4 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-100 font-mono font-black text-xs shadow-sm">
                         #{item.order.toString().padStart(2, '0')}
                       </span>
                    </td>
                    <td>
                       {item.is_active ?
                         <span className="px-4 py-2 rounded-xl text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 uppercase tracking-[2px] flex items-center gap-2 w-fit shadow-sm"><Eye size={12} strokeWidth={3} /> Live</span> :
                         <span className="px-4 py-2 rounded-xl text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 uppercase tracking-[2px] flex items-center gap-2 w-fit shadow-sm"><EyeOff size={12} strokeWidth={3} /> Offline</span>
                       }
                    </td>
                    <td>
                      <div className="flex justify-end gap-3">
                         <button onClick={() => { setForm(item); setEditing(item.id); setShowForm(true); }} className="p-3 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all shadow-sm"><Edit3 size={18} strokeWidth={2.5} /></button>
                         <button onClick={() => handleDelete(item.id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={18} strokeWidth={2.5} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && items.length === 0 && (
              <div className="py-32 text-center text-slate-200 uppercase font-black">
                <ImageIcon size={64} strokeWidth={1} className="mx-auto mb-6 opacity-20" />
                <p className="text-[11px] tracking-[3px]">No banners yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-5xl p-10 md:p-12" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">{editing ? 'Edit Visual Artifact' : 'New Visual Artifact'}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Hero Configuration Engine Active
                  </p>
               </div>
               <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div className="form-group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Institutional Title</label>
                        <input name="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. NEW LUXURY ARRIVALS" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner uppercase" />
                     </div>
                     <div className="form-group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Secondary Label (Subtitle)</label>
                        <input name="subtitle" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="e.g. SHOP THE EXCLUSIVE COLLECTION" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner uppercase" />
                     </div>
                     <div className="form-group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Target Protocol (Link URL)</label>
                        <input name="link" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="/category/luxury-eyewear" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="form-group">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Priority Order</label>
                           <input type="number" name="order" value={form.order} onChange={e => setForm({...form, order: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                        </div>
                        <div className="form-group">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Visual Theme</label>
                           <select name="theme" value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-[10px] font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner cursor-pointer">
                              <option value="dark">DARK PROTOCOL (WHITE TEXT)</option>
                              <option value="light">LIGHT PROTOCOL (DARK TEXT)</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-[3px] flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Desktop Artifact (1920x800)
                        </label>
                        <div className="relative aspect-[16/7] bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden group/upload transition-all hover:border-emerald-200 shadow-inner">
                           {form.image ? <img src={form.image} className="w-full h-full object-cover transition-transform group-hover/upload:scale-105" /> : <ImageIcon className="text-slate-200" size={48} strokeWidth={1} />}
                           <input type="file" onChange={e => handleFileUpload(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                           <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/upload:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] bg-white px-6 py-3 rounded-xl shadow-2xl">Upload New Artifact</p>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-[3px] flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Mobile Optimized (800x1200)
                        </label>
                        <div className="relative aspect-[3/4] w-48 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden group/upload-m transition-all hover:border-emerald-200 shadow-inner">
                           {form.mobile_image ? <img src={form.mobile_image} className="w-full h-full object-cover transition-transform group-hover/upload-m:scale-105" /> : <ImageIcon className="text-slate-200" size={32} strokeWidth={1} />}
                           <input type="file" onChange={e => handleFileUpload(e, 'mobile_image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                           <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/upload-m:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[1px] bg-white px-4 py-2 rounded-lg shadow-xl">Update</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[24px] border border-slate-100 w-fit">
                  <div className="relative inline-flex items-center cursor-pointer">
                     <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={e => setForm({...form, is_active: e.target.checked})}
                        className="sr-only peer"
                     />
                     <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                  </div>
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-[2px]">Deploy to Home Interface</span>
               </div>

               <div className="flex gap-6 pt-8 border-t border-slate-50">
                  <button type="submit" disabled={saving} className="flex-1 py-6 bg-emerald-500 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 transition-all disabled:opacity-50">
                    {saving ? 'SYNCHRONIZING PROTOCOL...' : 'AUTHORIZE & SAVE ARTIFACT'}
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

export default AdminCarousel;
