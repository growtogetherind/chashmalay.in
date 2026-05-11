import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { getOffers, saveOffer, deleteOffer } from '../../lib/firebase';
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

    useEffect(() => { loadData(); }, []);

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
                    <h1 className="admin-title">Promotional Offers</h1>
                    <button onClick={openAdd} className="admin-action-btn"><Plus size={16} /> Create Offer</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? <div className="col-span-full text-center py-12 text-gray-400 italic">Loading offers...</div> : 
                    offers.map(o => (
                        <div key={o.id} className="admin-card overflow-hidden group">
                            <div className="h-40 bg-gray-100 relative">
                                {o.bg_image && <img src={o.bg_image} className="w-full h-full object-cover opacity-60" alt="" />}
                                <div className={`absolute inset-0 bg-gradient-to-r ${o.color_preset}`} />
                                <div className="absolute inset-0 p-6 flex flex-col justify-center text-white">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{o.code || 'SPECIAL OFFER'}</div>
                                    <h3 className="font-black text-2xl tracking-tighter">{o.title}</h3>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(o)} className="p-2 bg-white text-black rounded-lg shadow-xl"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDelete(o.id)} className="p-2 bg-white text-red-600 rounded-lg shadow-xl"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 font-bold">{o.description}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${o.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {o.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal max-w-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-gray-900">{editing ? 'Edit Offer' : 'New Offer'}</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Offer Title *</label>
                               <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Summer Bonanza" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-black" required />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description *</label>
                               <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Offer details..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Promo Code</label>
                                   <input name="code" value={form.code} onChange={handleChange} placeholder="CHASH20" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-black" />
                                </div>
                                <div>
                                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Color Theme</label>
                                   <select name="color_preset" value={form.color_preset} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold">
                                       {COLOR_PRESETS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
                                   </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Background Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 h-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
                                       {form.bg_image ? <img src={form.bg_image} className="w-full h-full object-cover" /> : <X className="text-gray-300" />}
                                       <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Click to change background image</p>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer py-2">
                               <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 accent-black" />
                               <span className="text-xs font-black uppercase tracking-widest">Active and Visible</span>
                            </label>

                            <button type="submit" disabled={saving} className="w-full py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                                {saving ? 'Saving...' : 'Save Offer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOffers;
