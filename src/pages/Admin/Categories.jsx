import { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Edit3, RefreshCw, Trash2, X } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory, subscribeCategories } from '../../lib/firebase';
import { uploadImage } from '../../lib/cloudinary';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  image: '',
  image_url: '',
  color: '#f8fafc',
  accent: '#1d4ed8',
  sort_order: 999,
  is_active: true,
};

const STOREFRONT_CATEGORIES = [
  {
    name: 'Eyewear',
    slug: 'eyeglasses',
    description: 'Premium Eyewear',
    image: 'https://i.ibb.co/dsJrhRr1/eyewear-optimized.webp',
    image_url: 'https://i.ibb.co/dsJrhRr1/eyewear-optimized.webp',
    color: '#F6F4EE',
    accent: '#b45309',
    sort_order: 1,
    is_active: true,
  },
  {
    name: 'Sunglasses',
    slug: 'sunglasses',
    description: 'Premium Sunglasses',
    image: 'https://i.ibb.co/dsJrhRr1/eyewear-optimized.webp',
    image_url: 'https://i.ibb.co/dsJrhRr1/eyewear-optimized.webp',
    color: '#FFE5D0',
    accent: '#1d4ed8',
    sort_order: 2,
    is_active: true,
  },
  {
    name: 'Clip-On Glasses',
    slug: 'clip-on-glasses',
    description: 'Clip-On Glasses',
    image: 'https://i.ibb.co/vvsT2Csx/clip-on-optimized.webp',
    image_url: 'https://i.ibb.co/vvsT2Csx/clip-on-optimized.webp',
    color: '#EED9F7',
    accent: '#7c3aed',
    sort_order: 3,
    is_active: true,
  },
  {
    name: 'Contact Lenses',
    slug: 'contacts',
    description: 'Contact Lenses',
    image: 'https://i.ibb.co/Y4xPqzYN/lenses-optimized.webp',
    image_url: 'https://i.ibb.co/Y4xPqzYN/lenses-optimized.webp',
    color: '#D2F3E1',
    accent: '#15803d',
    sort_order: 4,
    is_active: true,
  },
  {
    name: 'Reading Glasses',
    slug: 'reading-glasses',
    description: 'Reading Glasses',
    image: 'https://i.ibb.co/GfVs075q/reder-glasses-optimized.webp',
    image_url: 'https://i.ibb.co/GfVs075q/reder-glasses-optimized.webp',
    color: '#D7ECFB',
    accent: '#0284c7',
    sort_order: 5,
    is_active: true,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Accessories',
    image: 'https://i.ibb.co/rKBPK5bY/acces-optimized.webp',
    image_url: 'https://i.ibb.co/rKBPK5bY/acces-optimized.webp',
    color: '#EFE8D3',
    accent: '#64748b',
    sort_order: 6,
    is_active: true,
  },
];

const slugify = (value = '') => value
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const resolveCategoryImage = (category = {}) => (
  category.image_url || category.image || category.base_photo || category.basePhoto || category.photo || ''
);

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
    const image = resolveCategoryImage(form);
    const { error } = await saveCategory({
      ...form,
      slug: form.slug || slugify(form.name),
      image,
      image_url: image,
      sort_order: Number(form.sort_order || 999),
    }, editing);
    if (error) toast.error('Failed to save');
    else {
      toast.success(editing ? 'Category updated' : 'Category added');
      setShowForm(false);
      loadData();
    }
    setSaving(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Uploading category image...');
    const { url, error } = await uploadImage(file, 'categories');

    if (error) {
      toast.error(`Upload failed: ${error}`, { id: toastId });
    } else {
      setForm(prev => ({ ...prev, image: url, image_url: url }));
      toast.success('Category image uploaded', { id: toastId });
    }
  };

  const syncStorefrontCategories = async () => {
    setSyncing(true);
    try {
      // 1. Identify and delete categories not in the new STOREFRONT_CATEGORIES list
      const targetSlugs = new Set(STOREFRONT_CATEGORIES.map(c => c.slug));
      const toDelete = categories.filter(c => !targetSlugs.has(c.slug));
      
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(c => deleteCategory(c.id)));
      }
      
      // 2. Add new categories or update existing ones with their correct images and metadata
      await Promise.all(STOREFRONT_CATEGORIES.map(async (seedCat) => {
        const existing = categories.find(c => c.slug === seedCat.slug);
        if (existing) {
          await saveCategory({
            ...existing,
            ...seedCat,
          }, existing.id);
        } else {
          await saveCategory(seedCat);
        }
      }));
      
      toast.success('Storefront categories synced and old ones removed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync categories');
    } finally {
      await loadData();
      setSyncing(false);
    }
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
           <div className="flex flex-wrap gap-3">
             <button onClick={syncStorefrontCategories} disabled={syncing} className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[2px] text-slate-500 hover:text-emerald-600 hover:border-emerald-100 transition-all disabled:opacity-50 flex items-center gap-2">
               <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> Sync Storefront
             </button>
             <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditing(null); setShowForm(true); }} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
               <Plus size={18} /> <span className="ml-1">Add Category</span>
             </button>
           </div>
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
                    <th>Visual</th>
                    <th>Category Signature</th>
                    <th>Functional Description</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="group">
                      <td>
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                          {resolveCategoryImage(c) ? (
                            <img src={resolveCategoryImage(c)} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{c.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tighter mt-1">/{c.slug || slugify(c.name)}</span>
                      </td>
                      <td>
                        <p className="text-sm text-slate-500 line-clamp-1 max-w-md group-hover:text-slate-700 transition-colors font-medium">{c.description || 'No specialized description provided'}</p>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { const image = resolveCategoryImage(c); setForm({ ...EMPTY_FORM, ...c, image, image_url: image }); setEditing(c.id); setShowForm(true); }} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-24 text-slate-300">
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
          <div className="admin-modal max-w-lg p-8 md:p-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Technical Modification' : 'Entity Initialization'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1.5">Define structural grouping for the catalog</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form space-y-10">
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Category Image</label>
                <div className="flex items-center gap-5 bg-slate-50 border border-slate-100 rounded-3xl p-4">
                  <div className="relative w-28 h-28 rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner group">
                    {resolveCategoryImage(form) ? (
                      <img src={resolveCategoryImage(form)} alt="Category preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={30} className="text-slate-300" />
                    )}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                      <div className="bg-white/90 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-xl">
                        {resolveCategoryImage(form) ? 'Replace' : 'Upload'}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Storefront Category Visual</p>
                    <p className="text-[9px] text-slate-400 mt-2 leading-relaxed font-medium">This image appears on the customer home category cards.</p>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Category Designation *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="e.g. Premium Sunglasses" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" required />
              </div>
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Customer URL Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="premium-sunglasses" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
              </div>
              <div className="form-group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Narrative Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Briefly define the target segment..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none leading-relaxed" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sort Order</label>
                  <input type="number" min="1" value={form.sort_order || ''} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                </div>
                <div className="form-group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Card Background</label>
                  <input type="color" value={form.color || '#f8fafc'} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-200 p-2 rounded-xl cursor-pointer" />
                </div>
                <div className="form-group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Accent</label>
                  <input type="color" value={form.accent || '#1d4ed8'} onChange={e => setForm({ ...form, accent: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-200 p-2 rounded-xl cursor-pointer" />
                </div>
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
