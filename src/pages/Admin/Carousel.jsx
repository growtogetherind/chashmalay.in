import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, MoveUp, MoveDown, Layout } from 'lucide-react';
import { getCarouselItems, saveCarouselItem, deleteCarouselItem, uploadGenericImage } from '../../lib/firebase';
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
    const [file, setFile] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const { data } = await getCarouselItems();
        setItems(data || []);
        setLoading(false);
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setForm(prev => ({ ...prev, image: URL.createObjectURL(e.target.files[0]) }));
        }
    };

    const openAdd = () => { setForm({ ...EMPTY_ITEM, order: items.length }); setEditing(null); setFile(null); setShowForm(true); };
    const openEdit = (item) => { setForm({ ...item }); setEditing(item.id); setFile(null); setShowForm(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.image) { toast.error('Image is required'); return; }
        setSaving(true);

        let image = form.image;
        if (file) {
            const { url, error } = await uploadGenericImage(file, 'carousel');
            if (error) { toast.error('Upload failed'); setSaving(false); return; }
            image = url;
        }

        const { error } = await saveCarouselItem({ ...form, image, order: Number(form.order) }, editing);
        if (error) { toast.error('Save failed'); }
        else {
            toast.success(editing ? 'Item updated' : 'Item added');
            setShowForm(false);
            loadData();
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this carousel item?')) return;
        const { error } = await deleteCarouselItem(id);
        if (error) toast.error('Delete failed'); else { toast.success('Deleted'); loadData(); }
    };

    return (
        <div className="admin-page">
            <aside className="admin-sidebar">
                <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
                <nav className="admin-nav">
                    <a href="/admin" className="admin-nav-item">📊 Dashboard</a>
                    <a href="/admin/products" className="admin-nav-item">🛍️ Products</a>
                    <a href="/admin/offers" className="admin-nav-item">🏷️ Offers</a>
                    <a href="/admin/carousel" className="admin-nav-item active">🎞️ Carousel</a>
                    <a href="/admin/orders" className="admin-nav-item">🧾 Orders</a>
                    <a href="/admin/coupons" className="admin-nav-item">🎟️ Coupons</a>
                </nav>
            </aside>

            <main className="admin-main">
                <div className="admin-header">
                    <h1 className="admin-title">Hero Carousel <span className="text-gray-300">({items.length})</span></h1>
                    <button onClick={openAdd} className="admin-action-btn"><Plus size={16} /> Add Image</button>
                </div>

                <div className="admin-card">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead><tr><th>Preview</th><th>Title / Subtitle</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr> : 
                                items.map(item => (
                                    <tr key={item.id}>
                                        <td className="w-40"><img src={item.image} className="h-20 w-32 object-cover rounded-xl border border-gray-100" alt="" /></td>
                                        <td>
                                            <div className="font-bold text-gray-800">{item.title || 'Untitled'}</div>
                                            <div className="text-xs text-gray-400">{item.subtitle || 'No subtitle'}</div>
                                        </td>
                                        <td><span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{item.order}</span></td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${item.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {item.is_active ? 'Visible' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={14}/></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!loading && items.length === 0 && <div className="py-20 text-center text-gray-400">No carousel items yet.</div>}
                    </div>
                </div>
            </main>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-gray-900">{editing ? 'Edit Item' : 'Add Item'}</h2>
                            <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="admin-form">
                            <div className="form-group"><label>Hero Title (Optional)</label><input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Clearly Better" /></div>
                            <div className="form-group"><label>Subtitle (Optional)</label><input name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="e.g. Discovery our new luxury collection" /></div>
                            
                            <div className="form-group">
                                <label>Desktop Image *</label>
                                <input name="image" value={form.image} onChange={handleChange} placeholder="/assets/im/all_img/banner.jpg" required />
                            </div>
                            <div className="form-group">
                                <label>Mobile Image (Optional)</label>
                                <input name="mobile_image" value={form.mobile_image} onChange={handleChange} placeholder="/assets/im/all_img/banner-mobile.jpg" />
                            </div>
                            
                            <div className="form-row">
                                 <div className="form-group"><label>Button Link</label><input name="link" value={form.link} onChange={handleChange} placeholder="/category/eyeglasses" /></div>
                                 <div className="form-group"><label>Display Order</label><input type="number" name="order" value={form.order} onChange={handleChange} /></div>
                                 <div className="form-group"><label>Theme</label>
                                    <select name="theme" value={form.theme} onChange={handleChange}>
                                        <option value="dark">Dark (White Text)</option>
                                        <option value="light">Light (Dark Text)</option>
                                    </select>
                                 </div>
                             </div>

                            <div className="form-group">
                                <label>Image *</label>
                                <div className="flex items-center gap-3">
                                    {form.image && <img src={form.image} alt="Preview" className="w-20 h-12 object-cover rounded border" />}
                                    <input type="file" accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer py-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /><span className="text-sm font-bold">Show on Home Page</span></label>

                            <div className="flex gap-3 mt-4">
                                <button type="submit" disabled={saving} className="admin-action-btn flex-1">{saving ? 'Uploading...' : 'Save Carousel Item'}</button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full font-bold text-sm">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCarousel;
