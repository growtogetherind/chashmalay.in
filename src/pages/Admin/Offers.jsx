import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, Tag } from 'lucide-react';
import { getOffers, saveOffer, deleteOffer, uploadGenericImage } from '../../lib/firebase';
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
            const { url, error } = await uploadGenericImage(file, 'offers');
            if (error) { toast.error('Upload failed'); setSaving(false); return; }
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
        if (!confirm('Delete this offer?')) return;
        const { error } = await deleteOffer(id);
        if (error) toast.error('Delete failed'); else { toast.success('Offer deleted'); loadData(); }
    };

    return (
        <div className="admin-page">
            <aside className="admin-sidebar">
                <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
                <nav className="admin-nav">
                    <a href="/admin" className="admin-nav-item">📊 Dashboard</a>
                    <a href="/admin/products" className="admin-nav-item">🛍️ Products</a>
                    <a href="/admin/offers" className="admin-nav-item active">🏷️ Offers</a>
                    <a href="/admin/carousel" className="admin-nav-item">🎞️ Carousel</a>
                    <a href="/admin/orders" className="admin-nav-item">🧾 Orders</a>
                    <a href="/admin/coupons" className="admin-nav-item">🎟️ Coupons</a>
                </nav>
            </aside>

            <main className="admin-main">
                <div className="admin-header">
                    <h1 className="admin-title">Promotional Offers <span className="text-gray-300">({offers.length})</span></h1>
                    <button onClick={openAdd} className="admin-action-btn"><Plus size={16} /> Create Offer</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? <div className="col-span-full text-center py-12 text-gray-400">Loading offers...</div> : 
                    offers.map(o => (
                        <div key={o.id} className="admin-card overflow-hidden group">
                            <div className="h-32 bg-gray-100 relative">
                                {o.bg_image && <img src={o.bg_image} className="w-full h-full object-cover opacity-60" alt="" />}
                                <div className={`absolute inset-0 bg-gradient-to-r ${o.color_preset}`} />
                                <div className="absolute inset-0 p-4 flex flex-col justify-center text-white">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">{o.code || 'NO CODE'}</div>
                                    <h3 className="font-black text-xl">{o.title}</h3>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(o)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-white/40"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDelete(o.id)} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-red-500/60"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{o.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${o.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {o.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && offers.length === 0 && <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">No offers found. Start by creating one!</div>}
                </div>
            </main>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-gray-900">{editing ? 'Edit Offer' : 'Create New Offer'}</h2>
                            <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="admin-form">
                            <div className="form-group"><label>Offer Title *</label><input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Summer Bonanza" required /></div>
                            <div className="form-group"><label>Description *</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Offer details..." required /></div>
                            
                            <div className="form-row">
                                <div className="form-group"><label>Promo Code (Optional)</label><input name="code" value={form.code} onChange={handleChange} placeholder="CHASH20" /></div>
                                <div className="form-group"><label>Background Color Preset</label>
                                    <select name="color_preset" value={form.color_preset} onChange={handleChange}>
                                        {COLOR_PRESETS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Background Image</label>
                                <div className="flex items-center gap-3">
                                    {form.bg_image && <img src={form.bg_image} alt="Preview" className="w-16 h-10 object-cover rounded border" />}
                                    <input type="file" accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer py-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /><span className="text-sm font-bold">Active and Visible</span></label>

                            <div className="flex gap-3 mt-4">
                                <button type="submit" disabled={saving} className="admin-action-btn flex-1">{saving ? 'Saving...' : 'Save Offer'}</button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full font-bold text-sm">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOffers;
