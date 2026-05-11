import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';

const EMPTY_ITEM = { title: '', subtitle: '', image: '', mobile_image: '', link: '', order: 0, is_active: true, theme: 'dark' };

const AdminCarousel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => { loadData(); }, []);

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
            <h1 className="admin-title">Hero Carousel</h1>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">{items.length} Active Banners</p>
          </div>
          <button onClick={() => { setForm({ ...EMPTY_ITEM, order: items.length }); setEditing(null); setShowForm(true); }} className="admin-action-btn"><Plus size={16} /> New Banner</button>
        </div>

        <div className="admin-card">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Display Info</th>
                  <th>Order</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic font-black">Loading banners...</td></tr> : 
                items.map(item => (
                  <tr key={item.id}>
                    <td>
                       <div className="w-32 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative group">
                          <img src={item.image} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <a href={item.image} target="_blank" className="p-1.5 bg-white rounded-lg text-gray-900"><ExternalLink size={12} /></a>
                          </div>
                       </div>
                    </td>
                    <td>
                      <p className="font-black text-sm text-gray-800">{item.title || 'No Title'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.subtitle || 'No Subtitle'}</p>
                    </td>
                    <td><span className="px-2 py-1 bg-gray-50 text-gray-900 rounded font-mono font-black text-xs">{item.order}</span></td>
                    <td>
                       {item.is_active ? 
                         <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase"><Eye size={10} /> Visible</span> : 
                         <span className="flex items-center gap-1 text-[9px] font-black text-red-400 uppercase"><EyeOff size={10} /> Hidden</span>
                       }
                    </td>
                    <td>
                      <div className="flex gap-2">
                         <button onClick={() => { setForm(item); setEditing(item.id); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit3 size={14}/></button>
                         <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && items.length === 0 && <div className="py-20 text-center text-gray-400 italic font-bold">No carousel banners found</div>}
          </div>
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
               <h2 className="text-xl font-black text-gray-900">{editing ? 'Edit Banner' : 'New Banner'}</h2>
               <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="form-group"><label>Banner Title</label><input name="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. New Luxury Arrivals" /></div>
                     <div className="form-group"><label>Subtitle</label><input name="subtitle" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="e.g. Shop the latest styles" /></div>
                     <div className="form-group"><label>Target Link (URL)</label><input name="link" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="/category/sunglasses" /></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                           <label>Display Order</label>
                           <input type="number" name="order" value={form.order} onChange={e => setForm({...form, order: e.target.value})} />
                        </div>
                        <div className="form-group">
                           <label>Text Theme</label>
                           <select name="theme" value={form.theme} onChange={e => setForm({...form, theme: e.target.value})}>
                              <option value="dark">Dark Theme (White Text)</option>
                              <option value="light">Light Theme (Dark Text)</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Desktop Banner Image (1920x800)</label>
                        <div className="relative aspect-[16/7] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                           {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-200" size={32} />}
                           <input type="file" onChange={e => handleFileUpload(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Mobile Banner Image (800x1200)</label>
                        <div className="relative aspect-[3/4] w-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                           {form.mobile_image ? <img src={form.mobile_image} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-200" size={24} />}
                           <input type="file" onChange={e => handleFileUpload(e, 'mobile_image')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-2 mt-8">
                  <input type="checkbox" id="banner_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 accent-primary-blue" />
                  <label htmlFor="banner_active" className="text-xs font-black text-gray-700 uppercase">Visible on Home Page</label>
               </div>

               <div className="flex gap-3 mt-8">
                  <button type="submit" disabled={saving} className="admin-action-btn flex-1 py-4 text-sm">{saving ? 'Saving Banner...' : 'Save Banner'}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-200">Cancel</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCarousel;
