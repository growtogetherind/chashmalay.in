import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Edit3, Trash2, X, Copy, Image as ImageIcon, Layers, Upload, Palette, Package, MoreVertical, Eye, Zap, ZoomIn, Tag, Search, Filter } from 'lucide-react';
import { getProducts, saveProduct, deleteProduct, getCategories, saveCategory, getBrands, saveBrand, toggleProductActive, subscribeProducts, subscribeCategories, subscribeBrands, subscribeLensCategories, saveLensCategory, subscribeLenses } from '../../lib/firebase';
import { uploadImage } from '../../lib/cloudinary';
import { useConfirm } from '../../context/ConfirmContext';
import ImageZoomModal from '../../components/ui/ImageZoomModal';
import toast from 'react-hot-toast';
import '../Admin.css';
import AdminSidebar from '../../components/layout/AdminSidebar';

const GENDERS = ['Unisex', 'Men', 'Women', 'Kids'];
const FRAME_TYPES = ['Full Rim', 'Half Rim', 'Rimless', 'Low Bridge Fit'];
const MATERIALS = ['Acetate', 'Metal', 'Titanium', 'TR90', 'Ultem', 'Carbon Fiber', 'Wood'];
const LENS_TYPES = ['Single Vision', 'Bifocal', 'Progressive', 'Zero Power', 'Blue Cut', 'Photochromic'];
const SHAPES = ['Aviator', 'Rectangle', 'Round', 'Cat Eye', 'Wayfarer', 'Oval', 'Square', 'Geometric'];

const DISPOSABLE_TYPES = ['Daily', 'Bi-weekly', 'Monthly', 'Yearly', 'Quarterly'];
const CONTACT_LENS_TYPES = ['Spherical', 'Toric', 'Multifocal', 'Colored'];
const PACK_SIZES = ['1 Lens', '2 Lenses', '6 Lenses', '10 Lenses', '30 Lenses', '90 Lenses'];
const CONTACT_LENS_COLORS = ['Clear', 'Blue', 'Brown', 'Green', 'Hazel', 'Gray', 'Honey', 'Turquoise'];



const ACCESSORY_TYPES = ['Lens Cleaner', 'Microfiber Cloth', 'Contact Lens Solution', 'Spectacle Case'];

const EMPTY_PRODUCT = {
  name: '',
  brand: '',
  category: '',
  default_color: '',
  sku: '',
  price: '',
  original_price: '',
  discount_price: '',
  description: '',
  stock_quantity: 100,
  gender: 'Unisex',
  frame_type: 'Full Rim',
  frame_shape: 'Rectangle',
  frame_material: 'Acetate',
  lens_type: 'Single Vision',
  available_lenses: [], // New: Multiple compatible lenses
  available_sizes: ['M'], // New: S, M, L
  available_colors: ['Standard'], // New: Colors
  custom_lenses: [], // Array of specific lens packages with custom values
  only_specific_lenses: false, // Restrict lens selector to only custom lenses
  tags: '',
  is_active: true,
  is_new: false,
  is_featured: false,
  images: {
    front: '',
    side: '',
    model: '',
    zoom: '',
    gallery: []
  },
  colors: [],
  // Accessory specific field
  accessory_type: '',
  // Contact Lens specific fields
  disposable_type: 'Monthly',
  contact_lens_type: 'Spherical',
  pack_size: '6 Lenses',
  contact_lens_color: 'Clear',
  material: 'Silicone Hydrogel',
  water_content: '38%',
  uv_protection: 'Yes',
  base_curve: '8.6',
  diameter: '14.2',
  show_lens_selection: true,
  show_lens_treatment: true,
  show_color_selection: true,
  show_size_selection: true
};
const SIZES = ['S', 'M', 'L'];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [lensCategories, setLensCategories] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorEditing, setColorEditing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [colorForm, setColorForm] = useState({ name: '', hex: '#000000', image: '' });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [pendingImages, setPendingImages] = useState({});
  const [pendingGallery, setPendingGallery] = useState([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  const [showNewLensCategoryInput, setShowNewLensCategoryInput] = useState(false);
  const [newLensCategoryName, setNewLensCategoryName] = useState('');
  const [addingLensCategory, setAddingLensCategory] = useState(false);
  const [zoomModal, setZoomModal] = useState({ isOpen: false, imageUrl: '', images: [], initialIndex: 0, title: '' });
  const { confirm } = useConfirm();

  const slugify = (v = '') => v.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleQuickAddLensCategory = async () => {
    const trimmed = newLensCategoryName.trim();
    if (!trimmed) {
      toast.error('Please enter a lens category name');
      return;
    }

    setAddingLensCategory(true);
    try {
      const existing = lensCategories.find(c => c.name?.toLowerCase().trim() === trimmed.toLowerCase());
      const catName = existing ? existing.name : trimmed;

      if (!existing) {
        const { error } = await saveLensCategory({
          name: trimmed,
          slug: slugify(trimmed),
          description: `Custom lens options for ${trimmed}`,
          sort_order: (lensCategories.length || 0) + 1,
          is_active: true
        });

        if (error) {
          console.error('Error saving lens category:', error);
          toast.error('Could not save to database, but added for this product');
        } else {
          toast.success(`Lens category "${trimmed}" added!`);
        }
      } else {
        toast.success(`Selected existing category: ${existing.name}`);
      }

      setForm(prev => {
        const currentList = prev.available_lenses || [];
        if (!currentList.some(al => al.toLowerCase() === catName.toLowerCase())) {
          return { ...prev, available_lenses: [...currentList, catName] };
        }
        return prev;
      });

      setShowNewLensCategoryInput(false);
      setNewLensCategoryName('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add lens category');
    } finally {
      setAddingLensCategory(false);
    }
  };

  // Specific Lens Override Management
  const handleAddLensOverride = (lensId = '') => {
    const selected = lenses.find(l => l.id === lensId);
    const newOverride = {
      id: `ovr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      lens_id: selected?.id || '',
      name: selected?.name || '',
      category_id: selected?.category_id || '',
      category_name: selected?.category_name || (lensCategories[0]?.name || 'Single Vision'),
      original_price: selected?.price ?? 490,
      price: 0,
      badge: 'FREE OFFER',
      description: selected?.description || 'Offer lens for this frame',
      is_active: true
    };

    setForm(prev => ({
      ...prev,
      custom_lenses: [...(prev.custom_lenses || []), newOverride]
    }));
  };

  const handleUpdateLensOverride = (index, field, value) => {
    setForm(prev => {
      const updated = [...(prev.custom_lenses || [])];
      if (!updated[index]) return prev;

      if (field === 'lens_id') {
        const found = lenses.find(l => l.id === value);
        if (found) {
          updated[index] = {
            ...updated[index],
            lens_id: found.id,
            name: found.name,
            category_id: found.category_id,
            category_name: found.category_name || updated[index].category_name,
            original_price: found.price,
            price: updated[index].price !== undefined ? updated[index].price : 0,
            badge: updated[index].badge || 'FREE OFFER',
            description: found.description || updated[index].description
          };
          return { ...prev, custom_lenses: updated };
        }
      }

      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, custom_lenses: updated };
    });
  };

  const handleRemoveLensOverride = (index) => {
    setForm(prev => ({
      ...prev,
      custom_lenses: (prev.custom_lenses || []).filter((_, i) => i !== index)
    }));
  };

  const handleQuickAddFreeSingleVision = () => {
    const svLens = lenses.find(l => l.category_name?.toLowerCase().includes('single') || l.name?.toLowerCase().includes('anti glare')) || lenses[0];
    const newOverride = {
      id: `ovr-${Date.now()}`,
      lens_id: svLens?.id || '',
      name: svLens?.name || 'Anti Glare Single Vision (Free Offer)',
      category_name: svLens?.category_name || 'Single Vision',
      category_id: svLens?.category_id || '',
      original_price: svLens?.price || 490,
      price: 0,
      badge: 'FREE WITH FRAME',
      description: 'Zero cost single vision lenses bundled with this frame.',
      is_active: true
    };

    setForm(prev => {
      const current = prev.custom_lenses || [];
      const exists = current.some(c => c.lens_id && c.lens_id === svLens?.id);
      if (exists) {
        toast('This lens is already added in the overrides below', { icon: 'ℹ️' });
        return prev;
      }
      toast.success('Free Single Vision lens offer added!');
      return {
        ...prev,
        custom_lenses: [...current, newOverride]
      };
    });
  };

  const handleQuickAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }

    setAddingCategory(true);
    try {
      const existing = categories.find(c => (c.name || c.title || c.slug)?.toLowerCase().trim() === trimmed.toLowerCase());
      if (existing) {
        setForm(prev => ({ ...prev, category: existing.name || existing.slug }));
        setShowNewCategoryInput(false);
        setNewCategoryName('');
        toast.success(`Selected existing category: ${existing.name || existing.slug}`);
        setAddingCategory(false);
        return;
      }

      const { error } = await saveCategory({ name: trimmed, slug: slugify(trimmed), is_active: true });
      if (error) {
        console.error('Error saving category:', error);
        toast.error('Could not save to database, but selected for this product');
      } else {
        toast.success(`Category "${trimmed}" added!`);
      }

      setForm(prev => ({ ...prev, category: trimmed }));
      setShowNewCategoryInput(false);
      setNewCategoryName('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleQuickAddBrand = async () => {
    const trimmed = newBrandName.trim();
    if (!trimmed) {
      toast.error('Please enter a brand name');
      return;
    }

    setAddingBrand(true);
    try {
      const existing = brands.find(b => b.name?.toLowerCase().trim() === trimmed.toLowerCase());
      if (existing) {
        setForm(prev => ({ ...prev, brand: existing.name }));
        setShowNewBrandInput(false);
        setNewBrandName('');
        toast.success(`Selected existing brand: ${existing.name}`);
        setAddingBrand(false);
        return;
      }

      const { error } = await saveBrand({ name: trimmed, description: '', logo: '' });
      if (error) {
        console.error('Error saving brand:', error);
        toast.error('Could not save to database, but selected for this product');
      } else {
        toast.success(`Brand "${trimmed}" added!`);
      }

      setForm(prev => ({ ...prev, brand: trimmed }));
      setShowNewBrandInput(false);
      setNewBrandName('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add brand');
    } finally {
      setAddingBrand(false);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus]);

  const filteredProducts = products.filter(p => {
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSku = (p.sku || '').toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const matchShape = (p.frame_shape || '').toLowerCase().includes(q);
      const matchGender = (p.gender || '').toLowerCase().includes(q);
      const matchTags = (p.tags || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBrand && !matchCat && !matchShape && !matchGender && !matchTags) {
        return false;
      }
    }
    if (filterCategory && (p.category || '').toLowerCase() !== filterCategory.toLowerCase()) {
      return false;
    }
    if (filterStatus === 'active' && !p.is_active) return false;
    if (filterStatus === 'inactive' && p.is_active) return false;
    return true;
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const totalPagesCount = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(totalPagesCount);
    }
  }, [filteredProducts]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (showForm && !editing && form !== EMPTY_PRODUCT) {
      // Don't save preview URLs to localStorage, they won't be valid on reload
      const cleanForm = { ...form };
      // Optional: you could strip the blob URLs here if you want to be cleaner
      localStorage.setItem('product_draft', JSON.stringify(cleanForm));
    }
  }, [form, showForm, editing]);

  const restoreDraft = () => {
    const draft = localStorage.getItem('product_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      // Strip blob URLs as they are invalid after refresh
      if (parsed.images) {
        Object.keys(parsed.images).forEach(key => {
          if (key !== 'gallery' && typeof parsed.images[key] === 'string' && parsed.images[key].startsWith('blob:')) {
            parsed.images[key] = '';
          }
        });
        if (parsed.images.gallery) {
          parsed.images.gallery = parsed.images.gallery.filter(url => !url.startsWith('blob:'));
        }
      }
      setForm(parsed);
      toast.success('Draft restored! (Images need to be re-selected)');
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('product_draft');
  };

  useEffect(() => {
    setLoading(true);
    const unProducts = subscribeProducts({ adminFilter: true }, (data) => {
      setProducts(data || []);
      setLoading(false);
    }, () => setLoading(false));
    const unCategories = subscribeCategories((data) => {
      setCategories(data || []);
    });
    const unBrands = subscribeBrands((data) => {
      setBrands(data || []);
    });
    const unLensCategories = subscribeLensCategories((data) => {
      setLensCategories(data || []);
    });
    const unLenses = subscribeLenses((data) => {
      setLenses(data || []);
    });
    return () => {
      unProducts?.();
      unCategories?.();
      unBrands?.();
      unLensCategories?.();
      unLenses?.();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        getProducts({ adminFilter: true }),
        getCategories(),
        getBrands()
      ]);

      const fetchedProducts = pRes.data || [];
      setProducts(fetchedProducts);

      // Smart Fallback: If categories/brands collections are empty,
      // extract unique values from existing products
      let fetchedCats = cRes.data || [];
      if (fetchedCats.length === 0 && fetchedProducts.length > 0) {
        const uniqueCats = [...new Set(fetchedProducts.map(p => p.category).filter(Boolean))];
        fetchedCats = uniqueCats.map((name, i) => ({ id: `ext-${i}`, name }));
      }
      setCategories(fetchedCats);

      let fetchedBrands = bRes.data || [];
      if (fetchedBrands.length === 0 && fetchedProducts.length > 0) {
        const uniqueBrands = [...new Set(fetchedProducts.map(p => p.brand).filter(Boolean))];
        fetchedBrands = uniqueBrands.map((name, i) => ({ id: `ext-b-${i}`, name }));
      }
      setBrands(fetchedBrands);
    } catch (err) {
      console.error("LoadData Error:", err);
      toast.error("Failed to load some data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleFileUpload = (e, path) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);

    // Store file for later upload
    setPendingImages(prev => ({ ...prev, [path]: file }));

    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: previewUrl } }));
    } else {
      setForm(prev => ({ ...prev, [path]: previewUrl }));
    }

    toast.success(`${path.split('.').pop()} selected (pending upload)`);
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));

    // Store files for later upload
    setPendingGallery(prev => [...prev, ...files]);

    setForm(prev => ({
      ...prev,
      images: { ...prev.images, gallery: [...(prev.images.gallery || []), ...newPreviews] }
    }));
    toast.success(`${files.length} images added to gallery (pending upload)`);
  };

  const handleOpenColorModal = (index = null) => {
    if (index !== null) {
      setColorEditing(index);
      setColorForm(form.colors[index]);
    } else {
      setColorEditing(null);
      setColorForm({ name: '', hex: '#000000', hex2: '', is_dual_tone: false, image: '', image_side: '', image_model: '' });
    }
    setShowColorModal(true);
  };

  const handleSaveColor = () => {
    const newColors = [...(form.colors || [])];
    if (colorEditing !== null) {
      newColors[colorEditing] = colorForm;
    } else {
      newColors.push(colorForm);
    }
    setForm(prev => ({ ...prev, colors: newColors }));
    setShowColorModal(false);
    toast.success(colorEditing !== null ? 'Variation updated' : 'Variation added');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.brand) { 
      setActiveTab('basic');
      toast.error('Name, Category, Brand and Price are required.'); 
      return; 
    }

    const isNew = !editing;
    const confirmMessage = isNew
      ? 'Are you sure you want to publish this new product? All images will be uploaded now.'
      : 'Are you sure you want to update this product? Any newly selected images will be uploaded.';

    if (!(await confirm({ title: isNew ? 'Publish Product' : 'Update Product', message: confirmMessage }))) {
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Processing product and uploads...');

    try {
      let finalImages = { ...form.images };

      // 1. Upload Pending Single Images
      for (const [path, file] of Object.entries(pendingImages)) {
        const { url, error } = await uploadImage(file, 'products');
        if (error) throw new Error(`Failed to upload ${path}: ${error}`);

        if (path.includes('.')) {
          const [, child] = path.split('.');
          finalImages[child] = url;
        }
      }

      // 3. CRITICAL: Filter out any remaining blob: URLs from single images
      Object.keys(finalImages).forEach(key => {
        if (key !== 'gallery' && typeof finalImages[key] === 'string' && finalImages[key].startsWith('blob:')) {
          finalImages[key] = ''; // Remove if not uploaded
        }
      });

      // 2. Upload Pending Gallery Images
      if (pendingGallery.length > 0) {
        const uploadedGalleryUrls = [];
        for (const file of pendingGallery) {
          const { url, error } = await uploadImage(file, 'products/gallery');
          if (error) throw new Error(`Gallery upload failed: ${error}`);
          uploadedGalleryUrls.push(url);
        }
        // Filter out blob URLs and add new Cloudinary URLs
        const existingUrls = (finalImages.gallery || []).filter(url => typeof url === 'string' && !url.startsWith('blob:'));
        finalImages.gallery = [...existingUrls, ...uploadedGalleryUrls];
      } else {
        // Just filter out blob URLs if any were removed or not uploaded
        finalImages.gallery = (finalImages.gallery || []).filter(url => typeof url === 'string' && !url.startsWith('blob:'));
      }

      const payload = {
        ...form,
        images: finalImages,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        stock_quantity: Number(form.stock_quantity || 0),
        updated_at: new Date()
      };

      const { error } = await saveProduct(payload, editing);
      if (error) {
        toast.error('Save failed: ' + error.message, { id: toastId });
      } else {
        toast.success(editing ? 'Product updated!' : 'Product added!', { id: toastId });
        setShowForm(false);
        clearDraft();
        setPendingImages({});
        setPendingGallery([]);
        loadData();
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleNewProduct = () => {
    setForm(EMPTY_PRODUCT);
    setEditing(null);
    setPendingImages({});
    setPendingGallery([]);
    setShowNewBrandInput(false);
    setNewBrandName('');
    setShowNewLensCategoryInput(false);
    setNewLensCategoryName('');

    const draft = localStorage.getItem('product_draft');
    if (draft) {
      confirm({
        title: 'Restore Draft?',
        message: 'We found an unfinished product draft. Would you like to restore it?'
      }).then(confirmed => {
        if (confirmed) restoreDraft();
        setShowForm(true);
      });
    } else {
      setShowForm(true);
    }
  };

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: 'Delete Product', message: `Are you sure you want to delete "${name}"? This action cannot be undone.` }))) return;
    const { error } = await deleteProduct(id);
    if (error) toast.error('Delete failed: ' + error.message); else { toast.success('Product deleted'); loadData(); }
  };

  const handleToggleActive = async (p) => {
    setToggling(prev => ({ ...prev, [p.id]: true }));
    const { error } = await toggleProductActive(p.id, !p.is_active);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(!p.is_active ? 'Product activated' : 'Product hidden');
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    }
    setToggling(prev => ({ ...prev, [p.id]: false }));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const isLocalhost = Boolean(import.meta.env.DEV) || (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname));

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Products</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{products.length} products in your store</p>
          </div>
          <div className="flex items-center gap-3">
            {isLocalhost && (
              <Link 
                to="/admin/quick-add" 
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap size={16} className="fill-white" /> <span>Quick Add</span>
              </Link>
            )}
            <button onClick={handleNewProduct} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
              <Plus size={18} /> <span className="ml-1">Add Product</span>
            </button>
          </div>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading products...</p>
            </div>
          ) : (
            <>
              {/* Product Search & Filter Toolbar */}
              <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="relative flex-1 max-w-lg">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, brand, category, shape, gender..."
                    value={searchQuery}
                    onChange={e => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (val) {
                        setSearchParams({ search: val }, { replace: true });
                      } else {
                        setSearchParams({}, { replace: true });
                      }
                    }}
                    className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs md:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchParams({}, { replace: true });
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id || c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Hidden Only</option>
                  </select>

                  {(searchQuery || filterCategory || filterStatus !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('');
                        setFilterStatus('all');
                        setSearchParams({}, { replace: true });
                      }}
                      className="px-3 py-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>SKU / Brand</th>
                    <th>Category</th>
                    <th>Pricing</th>
                    <th>Inventory</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Search size={22} />
                          </div>
                          <p className="text-sm font-bold text-slate-700">No products found</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            {searchQuery ? `No products match your search "${searchQuery}".` : 'No products available under selected filters.'}
                          </p>
                          {(searchQuery || filterCategory || filterStatus !== 'all') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                setFilterCategory('');
                                setFilterStatus('all');
                                setSearchParams({}, { replace: true });
                              }}
                              className="mt-2 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
                            >
                              Clear search & filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map(p => (
                    <tr key={p.id} className="group">
                      <td>
                        <div className="flex items-center gap-5">
                          <div 
                            className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/30 shadow-sm p-1.5 relative cursor-pointer group/thumb"
                            onClick={() => {
                              const thumbUrl = p.images?.front || p.frame_image || p.image || p.images?.gallery?.[0];
                              if (thumbUrl) {
                                const allImgs = [
                                  p.images?.front,
                                  p.images?.side,
                                  p.images?.model,
                                  p.images?.zoom,
                                  p.frame_image,
                                  p.image,
                                  ...(p.images?.gallery || [])
                                ].filter(Boolean);
                                const uniqueImgs = [...new Set(allImgs)];
                                setZoomModal({
                                  isOpen: true,
                                  imageUrl: thumbUrl,
                                  title: `${p.name || 'Product'} Preview`,
                                  images: uniqueImgs,
                                  initialIndex: 0
                                });
                              }
                            }}
                            title="Click to Zoom Image"
                          >
                             {p.images?.front || p.frame_image || p.image || p.images?.gallery?.[0] ? (
                               <>
                                 <img src={p.images?.front || p.frame_image || p.image || p.images?.gallery?.[0]} className="w-full h-full object-contain" />
                                 <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                   <ZoomIn size={14} className="text-white drop-shadow" />
                                 </div>
                               </>
                             ) : <ImageIcon size={20} className="text-slate-300" />}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 block group-hover:text-emerald-600 transition-colors truncate max-w-[200px]">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">{p.gender} • {p.frame_shape}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="block text-xs font-mono font-bold text-slate-400 group-hover:text-slate-600 transition-colors">#{p.sku?.toUpperCase() || 'NO-SKU'}</span>
                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1 block">{p.brand || 'No Brand'}</span>
                      </td>
                      <td>
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[9px] font-bold uppercase tracking-widest">{p.category || 'Uncategorized'}</span>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 text-base">₹{p.price.toLocaleString()}</div>
                        {p.original_price && <div className="text-[10px] text-slate-400 font-bold line-through mt-1">₹{p.original_price.toLocaleString()}</div>}
                      </td>
                      <td>
                        <div className={`text-sm font-bold flex items-center gap-2 ${p.stock_quantity <= 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                           <Package size={14} className={p.stock_quantity <= 10 ? 'text-amber-400' : 'text-slate-300'} />
                           {p.stock_quantity}
                        </div>
                        {p.stock_quantity <= 10 && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1 block">Critical Level</span>}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end items-center gap-4">
                          <button
                            onClick={() => handleToggleActive(p)}
                            disabled={toggling[p.id]}
                            className={`admin-toggle ${p.is_active ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'}`}
                          >
                            <span className={`admin-toggle-dot ${p.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>

                          <div className="relative group/menu">
                            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100 transition-all">
                              <MoreVertical size={18} />
                            </button>

                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 p-2 transform origin-top-right scale-95 group-hover/menu:scale-100">
                               <button onClick={() => {
                                 setForm(p);
                                 setEditing(p.id);
                                 setPendingImages({});
                                 setPendingGallery([]);
                                 setShowNewBrandInput(false);
                                 setNewBrandName('');
                                 setShowNewLensCategoryInput(false);
                                 setNewLensCategoryName('');
                                 setShowForm(true);
                               }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Edit3 size={16} /> <span>Modify Asset</span>
                               </button>
                               <button onClick={() => {
                                 const duplicate = { ...p, id: undefined, name: `${p.name} (Copy)`, sku: `${p.sku}-COPY` };
                                 setForm(duplicate);
                                 setEditing(null);
                                 setShowNewBrandInput(false);
                                 setNewBrandName('');
                                 setShowNewLensCategoryInput(false);
                                 setNewLensCategoryName('');
                                 setShowForm(true);
                               }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Copy size={16} /> <span>Duplicate Profile</span>
                               </button>
                               <Link to={`/product/${p.id}`} target="_blank" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Eye size={16} /> <span>Inspect Live</span>
                               </Link>
                               <div className="h-px bg-slate-50 my-2" />
                               <button onClick={() => handleDelete(p.id, p.name)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all text-xs font-bold uppercase tracking-widest">
                                 <Trash2 size={16} /> <span>Decommission</span>
                               </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )))
                  }
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
               <span className="text-xs text-slate-400 font-bold">
                  Showing {filteredProducts.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products{filteredProducts.length !== products.length ? ` (filtered from ${products.length} total)` : ''}
               </span>
               {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                     <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                     >
                        Previous
                     </button>
                     {[...Array(totalPages)].map((_, i) => (
                        <button
                           key={i}
                           onClick={() => setCurrentPage(i + 1)}
                           className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              currentPage === i + 1
                                 ? 'bg-emerald-500 text-white border-emerald-600'
                                 : 'bg-white text-slate-500 border-slate-100 hover:bg-gray-50'
                           }`}
                        >
                           {i + 1}
                        </button>
                     ))}
                     <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                     >
                        Next
                     </button>
                  </div>
               )}
            </div>
            </>
          )}
        </div>
      </main>

      {/* Product Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-2 sm:p-4 md:p-8" onClick={() => setShowForm(false)}>
            <div className="admin-modal max-w-5xl w-full h-[96vh] md:h-[90vh] bg-white rounded-2xl md:rounded-[32px] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 md:p-8 border-b border-slate-100 shrink-0 bg-white z-20">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{editing ? 'Edit Product' : 'Add New Product'}</h2>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Adding products to your store
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
              </div>

              {/* Form Tabs */}
              <div className="flex gap-4 md:gap-10 px-4 md:px-8 pt-4 md:pt-6 border-b border-slate-100 shrink-0 bg-white z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button type="button" onClick={() => setActiveTab('basic')} className={`pb-4 text-[10px] font-bold uppercase tracking-[2px] border-b-2 transition-all ${activeTab === 'basic' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>01. Basic Information</button>
                <button type="button" onClick={() => setActiveTab('details')} className={`pb-4 text-[10px] font-bold uppercase tracking-[2px] border-b-2 transition-all ${activeTab === 'details' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>02. Frame & Lens Details</button>
                <button type="button" onClick={() => setActiveTab('media')} className={`pb-4 text-[10px] font-bold uppercase tracking-[2px] border-b-2 transition-all ${activeTab === 'media' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>03. Product Images</button>
              </div>

            <form id="product-form" onSubmit={handleSave} className="admin-form overflow-y-auto p-4 md:p-8 flex-1 custom-scrollbar bg-slate-50/30">
              {activeTab === 'basic' && (
                <div className="space-y-10 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="form-group md:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Product Name *</label>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Titanium Aviator Gold Edition" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">SKU</label>
                      <input name="sku" value={form.sku} onChange={handleChange} placeholder="CHM-PRD-XXXX" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-mono font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm uppercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="form-group">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Category *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategoryInput(prev => !prev);
                            setNewCategoryName('');
                          }}
                          className="text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700 tracking-wider flex items-center gap-1 transition-colors hover:underline cursor-pointer"
                        >
                          <Plus size={12} /> {showNewCategoryInput ? 'Select Existing' : '+ Add Category'}
                        </button>
                      </div>

                      {showNewCategoryInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleQuickAddCategory();
                              }
                            }}
                            placeholder="Enter new category name..."
                            autoFocus
                            className="flex-1 bg-white border-2 border-emerald-500 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none transition-all shadow-sm"
                          />
                          <button
                            type="button"
                            disabled={addingCategory}
                            onClick={handleQuickAddCategory}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {addingCategory ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      ) : (
                        <select name="category" value={form.category} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer">
                          <option value="">{categories.length === 0 ? 'No Categories Found - Click + Add Category' : 'Select Category'}</option>
                          {categories.map(c => {
                            const val = c.name || c.title || c.slug;
                            return <option key={c.id || val} value={val}>{val}</option>;
                          })}
                          {/* Ensure current form.category is always selected even if not in standard list */}
                          {form.category && !categories.some(c => (c.name || c.title || c.slug) === form.category) && (
                            <option value={form.category}>{form.category}</option>
                          )}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Brand *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewBrandInput(prev => !prev);
                            setNewBrandName('');
                          }}
                          className="text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700 tracking-wider flex items-center gap-1 transition-colors hover:underline cursor-pointer"
                        >
                          <Plus size={12} /> {showNewBrandInput ? 'Select Existing' : '+ Add Brand'}
                        </button>
                      </div>

                      {showNewBrandInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleQuickAddBrand();
                              }
                            }}
                            placeholder="Enter new brand name..."
                            autoFocus
                            className="flex-1 bg-white border-2 border-emerald-500 p-3.5 rounded-xl text-slate-900 text-sm font-bold focus:outline-none transition-all shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={handleQuickAddBrand}
                            disabled={addingBrand || !newBrandName.trim()}
                            className="px-4 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm shadow-emerald-500/20"
                          >
                            {addingBrand ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewBrandInput(false);
                              setNewBrandName('');
                            }}
                            className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select
                          name="brand"
                          value={form.brand}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setShowNewBrandInput(true);
                              setNewBrandName('');
                            } else {
                              handleChange(e);
                            }
                          }}
                          required
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer"
                        >
                          <option value="">Select Brand</option>
                          <option value="__ADD_NEW__" className="text-emerald-600 font-bold bg-emerald-50">
                            + Add New Brand directly...
                          </option>
                          {Array.from(new Set([
                            'Ray-Ban',
                            'Oakley',
                            'Tommy Hilfiger',
                            'Armani Exchange',
                            'Fling',
                            'Calvin Klein',
                            'Danial Hunter',
                            'David Jones',
                            'Farenheit',
                            'Hyat Hunter Classic',
                            'Chashmalay',
                            'Scott',
                            'IDEE',
                            'IRUS',
                            'David Parker',
                            'Vogue',
                            '13 Century',
                            'Essilor',
                            'Zeiss',
                            'Nova',
                            'Yash',
                            'Nikon',
                            'Bonzer',
                            ...brands.map(b => b.name),
                            form.brand
                          ].filter(Boolean))).map(brandName => (
                            <option key={brandName} value={brandName}>{brandName}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Default Color</label>
                      <select name="default_color" value={form.default_color || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer">
                        <option value="">Select Default Color</option>
                        {Array.from(new Set([
                          ...(form.colors || []).map(c => c.name),
                          'Black', 'Gold', 'Silver', 'Gunmetal', 'Transparent', 'Brown', 'Blue', 'Rose Gold', 'Green', 'Gray', 'Clear', 'Honey', 'Hazel', 'Red', 'Tortoise'
                        ].filter(Boolean))).map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Selling Price (₹) *</label>
                      <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-black focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Original Price (MRP) (₹)</label>
                      <input type="number" name="original_price" value={form.original_price} onChange={handleChange} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Stock Quantity</label>
                      <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Technical Narrative</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Compose a compelling narrative for this asset..." className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-slate-700 text-sm font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none leading-relaxed" />
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-10 pb-6 pr-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Who is it for?</label>
                      <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer">
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Frame Type</label>
                      <select name="frame_type" value={form.frame_type} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer">
                        {FRAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Product Shape</label>
                      <select name="frame_shape" value={form.frame_shape} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer">
                        {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Frame Material</label>
                      <select name="frame_material" value={form.frame_material} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer">
                        {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Lens Category</label>
                      <select name="lens_type" value={form.lens_type} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer">
                        {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Search Tags (Separated by comma)</label>
                      <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. premium, red, round" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Compatible Lens Categories</label>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-medium italic">Select which lens options to offer for this particular product (e.g. Single Vision only, or Bifocal & Progressive). If none are checked, all categories will be shown.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewLensCategoryInput(prev => !prev);
                          setNewLensCategoryName('');
                        }}
                        className="text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700 tracking-wider flex items-center gap-1 transition-colors hover:underline cursor-pointer shrink-0"
                      >
                        <Plus size={12} /> {showNewLensCategoryInput ? 'Cancel' : '+ Add Lens Category'}
                      </button>
                    </div>

                    {showNewLensCategoryInput && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 animate-fade-in">
                        <input
                          type="text"
                          value={newLensCategoryName}
                          onChange={(e) => setNewLensCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickAddLensCategory();
                            }
                          }}
                          placeholder="e.g. Computer Glasses, Zero Power, Reading..."
                          autoFocus
                          className="flex-1 bg-white border-2 border-emerald-500 p-2.5 rounded-xl text-slate-900 text-xs font-bold focus:outline-none transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={handleQuickAddLensCategory}
                          disabled={addingLensCategory || !newLensCategoryName.trim()}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm shadow-emerald-500/20"
                        >
                          {addingLensCategory ? 'Adding...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewLensCategoryInput(false);
                            setNewLensCategoryName('');
                          }}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                      {Array.from(new Set([
                        'Single Vision',
                        'Bifocal',
                        'Progressive',
                        ...lensCategories.map(c => c.name),
                        ...(form.available_lenses || [])
                      ].filter(Boolean))).map(name => {
                        const isChecked = form.available_lenses?.some(al => al.toLowerCase() === name.toLowerCase()) || false;
                        return (
                          <label key={name} className={`flex items-center gap-3 p-2.5 px-4 rounded-xl border transition-all cursor-pointer group ${isChecked ? 'bg-emerald-50/80 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                className="peer opacity-0 absolute h-5 w-5 cursor-pointer z-10"
                                checked={isChecked}
                                onChange={(e) => {
                                  const list = form.available_lenses || [];
                                  const newList = e.target.checked
                                    ? [...list, name]
                                    : list.filter(item => item.toLowerCase() !== name.toLowerCase());
                                  setForm(prev => ({ ...prev, available_lenses: newList }));
                                }}
                              />
                              <div className="h-5 w-5 border-2 border-slate-300 rounded-md bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all flex items-center justify-center shadow-inner">
                                <Plus size={13} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                              </div>
                            </div>
                            <span className={`text-xs font-black uppercase transition-colors ${isChecked ? 'text-emerald-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{name}</span>
                          </label>
                        );
                      })}
                    </div>
                    {form.available_lenses && form.available_lenses.length > 0 && (
                      <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-[10px] font-bold text-emerald-600">
                          {form.available_lenses.length} lens {form.available_lenses.length === 1 ? 'category' : 'categories'} offered for this frame
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, available_lenses: [] }))}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-500 underline cursor-pointer"
                        >
                          Clear Selection (Offer All)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Specific Lenses & Custom Pricing Overrides ── */}
                  <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-emerald-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Specific Lens Overrides & Offers
                          </h4>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Custom Values
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                          Add specific lenses to edit their prices (e.g. Free ₹0, special discount) or change their promotional badge for this product.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleQuickAddFreeSingleVision}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Quickly bundle a Free ₹0 Single Vision Lens with this frame"
                        >
                          <Zap size={12} className="text-emerald-600 fill-emerald-600" />
                          <span>+ Free Single Vision Offer (₹0)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddLensOverride('')}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Add Specific Lens</span>
                        </button>
                      </div>
                    </div>

                    {/* Only Show Specific Lenses Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.only_specific_lenses || false}
                            onChange={(e) => setForm(prev => ({ ...prev, only_specific_lenses: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <div>
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                            Restrict Storefront to ONLY These Specific Lenses
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {form.only_specific_lenses
                              ? 'Enabled: Customers will only see the custom lenses listed below when configuring this frame.'
                              : 'Disabled: All catalog lenses remain available, with your custom prices applied to matching ones.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lens Treatment (Customize your lenses) Step Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.show_lens_treatment !== false}
                            onChange={(e) => setForm(prev => ({ ...prev, show_lens_treatment: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <div>
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                            Lens Treatment Step (Customize your lenses)
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {form.show_lens_treatment !== false
                              ? 'Enabled: Customer sees "Step 3: Lens Treatment" with standard free option or optional add-ons.'
                              : 'Disabled: Customer skips Lens Treatment directly to Prescription step.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lens List */}
                    {(!form.custom_lenses || form.custom_lenses.length === 0) ? (
                      <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/60">
                        <p className="text-xs font-bold text-slate-400">No specific lens overrides added yet.</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Standard catalog prices and badges will be used for this frame. Click <strong>"+ Free Single Vision Offer"</strong> or <strong>"+ Add Specific Lens"</strong> above to customize.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.custom_lenses.map((ovr, idx) => (
                          <div key={ovr.id || idx} className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-sm space-y-3 hover:border-emerald-300 transition-all">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                                  {idx + 1}
                                </span>
                                Specific Lens #{idx + 1}
                              </span>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={ovr.is_active !== false}
                                    onChange={(e) => handleUpdateLensOverride(idx, 'is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                  />
                                  <span>Enabled</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLensOverride(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                  title="Remove this lens override"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              {/* Lens Selection or Custom Name */}
                              <div className="md:col-span-5">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">
                                  Select Catalog Lens or Type Name
                                </label>
                                <div className="space-y-1.5">
                                  <select
                                    value={ovr.lens_id || ''}
                                    onChange={(e) => handleUpdateLensOverride(idx, 'lens_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800 text-xs font-bold focus:border-emerald-500 focus:bg-white outline-none"
                                  >
                                    <option value="">-- Choose from Catalog (or Custom) --</option>
                                    {lenses.map(l => (
                                      <option key={l.id} value={l.id}>
                                        {l.name} ({l.category_name || 'Lens'}) — Standard: ₹{l.price}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={ovr.name || ''}
                                    onChange={(e) => handleUpdateLensOverride(idx, 'name', e.target.value)}
                                    placeholder="Lens Display Name"
                                    className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 text-xs font-medium focus:border-emerald-500 outline-none"
                                  />
                                </div>
                              </div>

                              {/* Category */}
                              <div className="md:col-span-2">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">
                                  Vision Category
                                </label>
                                <select
                                  value={ovr.category_name || 'Single Vision'}
                                  onChange={(e) => handleUpdateLensOverride(idx, 'category_name', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800 text-xs font-bold focus:border-emerald-500 focus:bg-white outline-none"
                                >
                                  {Array.from(new Set([
                                    'Single Vision',
                                    'Bifocal',
                                    'Progressive',
                                    ...lensCategories.map(c => c.name)
                                  ])).map(catName => (
                                    <option key={catName} value={catName}>{catName}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Custom Offer Price */}
                              <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
                                    Offer Price (₹)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateLensOverride(idx, 'price', 0)}
                                    className="text-[9px] font-black text-emerald-600 hover:underline uppercase"
                                    title="Set price to 0 (Free)"
                                  >
                                    Free ₹0
                                  </button>
                                </div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    value={ovr.price ?? 0}
                                    onChange={(e) => handleUpdateLensOverride(idx, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                                    className={`w-full border p-2.5 rounded-lg text-xs font-black outline-none transition-all ${
                                      Number(ovr.price) === 0
                                        ? 'bg-emerald-50/70 border-emerald-400 text-emerald-800'
                                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                                    }`}
                                  />
                                  {Number(ovr.price) === 0 && (
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600 uppercase tracking-widest pointer-events-none">
                                      FREE
                                    </span>
                                  )}
                                </div>
                                {ovr.original_price && Number(ovr.original_price) > Number(ovr.price || 0) && (
                                  <span className="text-[9px] text-slate-400 line-through mt-0.5 block">
                                    Was ₹{ovr.original_price}
                                  </span>
                                )}
                              </div>

                              {/* Badge / Tag */}
                              <div className="md:col-span-3">
                                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">
                                  Offer Badge / Tag
                                </label>
                                <input
                                  type="text"
                                  value={ovr.badge || ''}
                                  onChange={(e) => handleUpdateLensOverride(idx, 'badge', e.target.value)}
                                  placeholder="e.g. FREE WITH FRAME, 50% OFF"
                                  className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-slate-800 text-xs font-bold focus:border-emerald-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Accessories Specialized Fields ── */}
                  {form.category?.toLowerCase().includes('accessor') && (
                    <div className="p-8 bg-amber-50/30 rounded-[24px] border border-amber-100/50 space-y-8">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                          <h4 className="text-[11px] font-black uppercase tracking-[2px] text-amber-800">Accessory Specifications</h4>
                       </div>
                       <div className="form-group">
                         <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Accessory Type *</label>
                         <select name="accessory_type" value={form.accessory_type || ''} onChange={handleChange} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-amber-500 outline-none transition-all shadow-sm cursor-pointer">
                           <option value="">Select Accessory Type</option>
                           {ACCESSORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                         <p className="text-[9px] text-slate-400 mt-2 font-medium italic">This field powers the Accessory Type filter on the storefront.</p>
                       </div>
                    </div>
                  )}

                  {/* ── Contact Lens Specialized Fields ── */}
                  {(form.category?.toLowerCase().includes('contact') || form.category?.toLowerCase() === 'contacts') && (
                    <div className="p-8 bg-emerald-50/30 rounded-[24px] border border-emerald-100/50 space-y-8">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                          <h4 className="text-[11px] font-black uppercase tracking-[2px] text-emerald-800">Contact Lens Specifications</h4>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Disposable Type</label>
                            <select name="disposable_type" value={form.disposable_type} onChange={handleChange} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm cursor-pointer">
                               {DISPOSABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Lens Material/Type</label>
                            <select name="contact_lens_type" value={form.contact_lens_type} onChange={handleChange} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm cursor-pointer">
                               {CONTACT_LENS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Pack Size</label>
                            <select name="pack_size" value={form.pack_size} onChange={handleChange} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm cursor-pointer">
                               {PACK_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Lens Color (Clear/Tinted)</label>
                            <select name="contact_lens_color" value={form.contact_lens_color} onChange={handleChange} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm cursor-pointer">
                               {CONTACT_LENS_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Material</label>
                            <input name="material" value={form.material} onChange={handleChange} placeholder="e.g. Silicone Hydrogel" className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" />
                          </div>
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Water Content</label>
                            <input name="water_content" value={form.water_content} onChange={handleChange} placeholder="e.g. 38%" className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" />
                          </div>
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">UV Protection</label>
                            <select name="uv_protection" value={form.uv_protection} onChange={handleChange} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm cursor-pointer">
                               <option value="Yes">Yes</option>
                               <option value="No">No</option>
                               <option value="Class 1">Class 1</option>
                               <option value="Class 2">Class 2</option>
                            </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Base Curve (BC)</label>
                            <input name="base_curve" value={form.base_curve} onChange={handleChange} placeholder="e.g. 8.6" className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" />
                          </div>
                          <div className="form-group">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 block">Diameter (DIA)</label>
                            <input name="diameter" value={form.diameter} onChange={handleChange} placeholder="e.g. 14.2" className="w-full bg-white border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" />
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4 block">Available Sizes</label>
                      <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        {SIZES.map(size => (
                          <label key={size} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                className="peer opacity-0 absolute h-6 w-6 cursor-pointer z-10"
                                checked={form.available_sizes?.includes(size)}
                                onChange={(e) => {
                                  const sizes = form.available_sizes || [];
                                  const newSizes = e.target.checked
                                    ? [...sizes, size]
                                    : sizes.filter(s => s !== size);
                                  setForm(prev => ({ ...prev, available_sizes: newSizes }));
                                }}
                              />
                              <div className="h-6 w-6 border-2 border-slate-200 rounded-lg bg-white peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all flex items-center justify-center shadow-inner">
                                <Plus size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase">{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4 block">Store Visibility</label>
                      <div className="flex gap-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} className="peer hidden" />
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                          <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">New Arrival</span>
                        </label>
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="peer hidden" />
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                          <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">Featured Product</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4 block">Interactive Features Config</label>
                    <div className="flex flex-wrap gap-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input type="checkbox" name="show_lens_selection" checked={form.show_lens_selection !== false} onChange={handleChange} className="peer hidden" />
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">Enable Lenses Selector</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input type="checkbox" name="show_lens_treatment" checked={form.show_lens_treatment !== false} onChange={handleChange} className="peer hidden" />
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">Show Lens Treatment</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input type="checkbox" name="show_color_selection" checked={form.show_color_selection !== false} onChange={handleChange} className="peer hidden" />
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">Show Color Options</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input type="checkbox" name="show_size_selection" checked={form.show_size_selection !== false} onChange={handleChange} className="peer hidden" />
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-600 transition-all shadow-inner" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-900 transition-colors">Show Size Options</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[2px]">Chroma Variation Profiles</label>
                        <p className="text-[9px] text-slate-400 mt-1 font-medium italic">Define color-specific visual and technical metadata.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenColorModal()}
                        className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-[2px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/10"
                      >
                        <Plus size={16} /> <span className="ml-1">Add Color</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(form.colors || []).map((color, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl group hover:border-emerald-200 transition-all shadow-sm">
                          <div 
                            className={`w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 flex items-center justify-center shrink-0 relative ${color.image ? 'cursor-pointer group/img' : ''}`}
                            onClick={() => {
                              if (color.image) {
                                const colorImgs = [color.image, color.image_side, color.image_model].filter(Boolean);
                                setZoomModal({
                                  isOpen: true,
                                  imageUrl: color.image,
                                  title: `${color.name || 'Color Variant'} Inspection`,
                                  images: colorImgs,
                                  initialIndex: 0
                                });
                              }
                            }}
                            title={color.image ? 'Click to Zoom Variant Image' : ''}
                          >
                            {color.image ? (
                              <>
                                <img src={color.image} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn size={14} className="text-white drop-shadow" />
                                </div>
                              </>
                            ) : (
                              <Palette size={20} className="text-slate-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate uppercase">{color.name || 'Untitled Variant'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-3 h-3 rounded-full border border-slate-200" style={{ background: color.hex }}></div>
                              {color.is_dual_tone && (
                                <div className="w-3 h-3 rounded-full border border-slate-200" style={{ background: color.hex2 }}></div>
                              )}
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                                {color.hex} {color.is_dual_tone && `+ ${color.hex2}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {color.image && (
                              <button
                                type="button"
                                onClick={() => {
                                  const colorImgs = [color.image, color.image_side, color.image_model].filter(Boolean);
                                  setZoomModal({
                                    isOpen: true,
                                    imageUrl: color.image,
                                    title: `${color.name || 'Color Variant'} Inspection`,
                                    images: colorImgs,
                                    initialIndex: 0
                                  });
                                }}
                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                title="Zoom Image"
                              >
                                <ZoomIn size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenColorModal(index)}
                              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = form.colors.filter((_, i) => i !== index);
                                setForm(prev => ({ ...prev, colors: newColors }));
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!form.colors || form.colors.length === 0) && (
                        <div className="col-span-full py-10 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                          <Palette size={32} strokeWidth={1} className="mb-2 opacity-50" />
                          <span className="text-[9px] font-black uppercase tracking-[3px] opacity-40">No Variations Defined</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-10 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      { id: 'front', label: 'Primary Front' },
                      { id: 'side', label: 'Side Profile' },
                      { id: 'model', label: 'Face Display' },
                      { id: 'zoom', label: form.category?.toLowerCase().includes('contact') ? 'Packaging Display' : 'Macro Detail' }
                    ].map(img => (
                      <div key={img.id} className="form-group space-y-4">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[2px] text-center block">{img.label}</label>
                        <div className="relative group w-full aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-inner">
                          {form.images?.[img.id] ? (
                            <img src={form.images[img.id]} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                              <ImageIcon size={40} strokeWidth={1.5} />
                              <span className="text-[8px] font-black uppercase mt-3 tracking-[3px]">Initialize</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, `images.${img.id}`)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          {form.images?.[img.id] && (
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex flex-col gap-3 items-center justify-center transition-all backdrop-blur-[2px] z-20 pointer-events-none">
                              <div className="bg-white/90 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-800 shadow-xl">Recalibrate Media</div>
                              <div className="flex items-center gap-2 pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setZoomModal({
                                      isOpen: true,
                                      imageUrl: form.images[img.id],
                                      title: `${img.label} Inspection`,
                                      images: [form.images.front, form.images.side, form.images.model, form.images.zoom, ...(form.images.gallery || [])].filter(Boolean)
                                    });
                                  }}
                                  className="bg-white text-emerald-600 hover:bg-emerald-50 hover:scale-110 p-2.5 rounded-full shadow-xl transition-all border border-emerald-100"
                                  title="Zoom / Inspect Image"
                                >
                                  <ZoomIn size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setForm(prev => ({ ...prev, images: { ...prev.images, [img.id]: '' } }));
                                    setPendingImages(prev => {
                                      const next = { ...prev };
                                      delete next[`images.${img.id}`];
                                      return next;
                                    });
                                  }}
                                  className="bg-white text-red-500 hover:bg-red-50 hover:text-red-600 hover:scale-110 p-2.5 rounded-full shadow-xl transition-all border border-red-100"
                                  title="Remove Image"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <div className="flex items-center justify-between mb-6">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[2px]">High-Fidelity Gallery</label>
                      <label className="text-[10px] font-black text-emerald-600 uppercase cursor-pointer hover:text-emerald-700 flex items-center gap-3 border border-emerald-200 px-5 py-2.5 rounded-xl bg-emerald-50 transition-all shadow-sm">
                        <Layers size={16} /> Expand Assets
                        <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 min-h-[120px] shadow-inner">
                      {form.images?.gallery?.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-white shadow-sm p-1">
                          <img src={url} className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            <button
                              type="button"
                              onClick={() => setZoomModal({
                                isOpen: true,
                                imageUrl: url,
                                title: `Gallery Photo #${idx + 1}`,
                                images: form.images.gallery,
                                initialIndex: idx
                              })}
                              className="bg-white text-slate-800 hover:bg-slate-100 rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
                              title="Zoom Image"
                            >
                              <ZoomIn size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, images: { ...prev.images, gallery: prev.images.gallery.filter((_, i) => i !== idx) } }))}
                              className="bg-red-500 text-white hover:bg-red-600 rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
                              title="Remove"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!form.images?.gallery || form.images.gallery.length === 0) && (
                        <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-300">
                           <Layers size={32} strokeWidth={1} className="mb-3 opacity-50" />
                           <span className="text-[9px] font-black uppercase tracking-[3px] opacity-40">Registry Empty</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </form>

            {/* Sticky Footer */}
            <div className="flex gap-3 md:gap-6 p-4 md:p-8 border-t border-slate-100 shrink-0 bg-white z-20">
              <button form="product-form" type="submit" disabled={saving} className="flex-1 py-3.5 md:py-5 bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[2px] md:tracking-[3px] hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 md:gap-3">
                {saving ? 'Saving changes...' : (editing ? 'Save Changes' : 'Save Product')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 md:px-10 py-3.5 md:py-5 bg-slate-50 text-slate-400 rounded-xl md:rounded-2xl font-bold text-[10px] uppercase tracking-[2px] md:tracking-[3px] hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100 shadow-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showColorModal && (
        <div className="admin-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[2100] flex items-center justify-center p-4" onClick={() => setShowColorModal(false)}>
          <div className="admin-modal max-w-lg w-full bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{colorEditing !== null ? 'Edit Color' : 'Add Color'}</h3>
              <button onClick={() => setShowColorModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Color Name</label>
                <input
                  type="text"
                  value={colorForm.name}
                  onChange={(e) => setColorForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Gold & Black"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-xl">
                 <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={colorForm.is_dual_tone} onChange={(e) => setColorForm(prev => ({ ...prev, is_dual_tone: e.target.checked }))} className="peer hidden" />
                    <div className="w-5 h-5 rounded border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                    <span className="text-xs font-bold text-slate-600">This is a Dual Tone color</span>
                 </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={colorForm.hex} onChange={(e) => setColorForm(prev => ({ ...prev, hex: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
                    <input type="text" value={colorForm.hex} onChange={(e) => setColorForm(prev => ({ ...prev, hex: e.target.value }))} className="flex-grow bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-mono font-bold uppercase" />
                  </div>
                </div>

                {colorForm.is_dual_tone && (
                  <div className="form-group">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Secondary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={colorForm.hex2 || '#000000'} onChange={(e) => setColorForm(prev => ({ ...prev, hex2: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
                      <input type="text" value={colorForm.hex2 || '#000000'} onChange={(e) => setColorForm(prev => ({ ...prev, hex2: e.target.value }))} className="flex-grow bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-mono font-bold uppercase" />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group border-t border-slate-100 pt-4">
                 <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block mb-3">Color Variation Photos (Multiple Sides)</label>
                 <div className="grid grid-cols-3 gap-3">
                   {/* Front View */}
                   <div className="flex flex-col items-center gap-1.5">
                     <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Front</span>
                     <div className="relative w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500 transition-all cursor-pointer shadow-inner group/cfront">
                        {colorForm.image ? (
                           <>
                             <img src={colorForm.image} alt="" className="w-full h-full object-contain p-1" />
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 setZoomModal({
                                   isOpen: true,
                                   imageUrl: colorForm.image,
                                   title: `${colorForm.name || 'Color'} Front View`,
                                   images: [colorForm.image, colorForm.image_side, colorForm.image_model].filter(Boolean),
                                   initialIndex: 0
                                 });
                               }}
                               className="absolute bottom-1 right-1 z-20 bg-slate-900/80 hover:bg-emerald-600 text-white p-1 rounded-lg opacity-0 group-hover/cfront:opacity-100 transition-opacity shadow"
                               title="Zoom / Inspect Image"
                             >
                               <ZoomIn size={13} />
                             </button>
                           </>
                        ) : (
                           <div className="flex flex-col items-center text-slate-300">
                              <Upload size={16} />
                              <span className="text-[8px] font-bold mt-1">Upload</span>
                           </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                             const file = e.target.files[0];
                             if (file) {
                                const toastId = toast.loading('Uploading front...');
                                const { url, error } = await uploadImage(file, 'products/colors');
                                if (error) toast.error('Upload failed');
                                else {
                                   setColorForm(prev => ({ ...prev, image: url }));
                                   toast.success('Uploaded Front!');
                                }
                                toast.dismiss(toastId);
                             }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                     </div>
                   </div>

                   {/* Side View */}
                   <div className="flex flex-col items-center gap-1.5">
                     <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Side</span>
                     <div className="relative w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500 transition-all cursor-pointer shadow-inner group/cside">
                        {colorForm.image_side ? (
                           <>
                             <img src={colorForm.image_side} alt="" className="w-full h-full object-contain p-1" />
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 setZoomModal({
                                   isOpen: true,
                                   imageUrl: colorForm.image_side,
                                   title: `${colorForm.name || 'Color'} Side View`,
                                   images: [colorForm.image, colorForm.image_side, colorForm.image_model].filter(Boolean),
                                   initialIndex: colorForm.image ? 1 : 0
                                 });
                               }}
                               className="absolute bottom-1 right-1 z-20 bg-slate-900/80 hover:bg-emerald-600 text-white p-1 rounded-lg opacity-0 group-hover/cside:opacity-100 transition-opacity shadow"
                               title="Zoom / Inspect Image"
                             >
                               <ZoomIn size={13} />
                             </button>
                           </>
                        ) : (
                           <div className="flex flex-col items-center text-slate-300">
                              <Upload size={16} />
                              <span className="text-[8px] font-bold mt-1">Upload</span>
                           </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                             const file = e.target.files[0];
                             if (file) {
                                const toastId = toast.loading('Uploading side...');
                                const { url, error } = await uploadImage(file, 'products/colors');
                                if (error) toast.error('Upload failed');
                                else {
                                   setColorForm(prev => ({ ...prev, image_side: url }));
                                   toast.success('Uploaded Side!');
                                }
                                toast.dismiss(toastId);
                             }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                     </div>
                   </div>

                   {/* Model View */}
                   <div className="flex flex-col items-center gap-1.5">
                     <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Model</span>
                     <div className="relative w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-500 transition-all cursor-pointer shadow-inner group/cmodel">
                        {colorForm.image_model ? (
                           <>
                             <img src={colorForm.image_model} alt="" className="w-full h-full object-contain p-1" />
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 const cImgs = [colorForm.image, colorForm.image_side, colorForm.image_model].filter(Boolean);
                                 setZoomModal({
                                   isOpen: true,
                                   imageUrl: colorForm.image_model,
                                   title: `${colorForm.name || 'Color'} Model View`,
                                   images: cImgs,
                                   initialIndex: cImgs.length - 1
                                 });
                               }}
                               className="absolute bottom-1 right-1 z-20 bg-slate-900/80 hover:bg-emerald-600 text-white p-1 rounded-lg opacity-0 group-hover/cmodel:opacity-100 transition-opacity shadow"
                               title="Zoom / Inspect Image"
                             >
                               <ZoomIn size={13} />
                             </button>
                           </>
                        ) : (
                           <div className="flex flex-col items-center text-slate-300">
                              <Upload size={16} />
                              <span className="text-[8px] font-bold mt-1">Upload</span>
                           </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                             const file = e.target.files[0];
                             if (file) {
                                const toastId = toast.loading('Uploading model...');
                                const { url, error } = await uploadImage(file, 'products/colors');
                                if (error) toast.error('Upload failed');
                                else {
                                   setColorForm(prev => ({ ...prev, image_model: url }));
                                   toast.success('Uploaded Model!');
                                }
                                toast.dismiss(toastId);
                             }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={handleSaveColor} className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all">Save Color</button>
              <button onClick={() => setShowColorModal(false)} className="px-6 py-4 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Image Zoom / Lightbox Inspector */}
      <ImageZoomModal
        isOpen={zoomModal.isOpen}
        onClose={() => setZoomModal(prev => ({ ...prev, isOpen: false }))}
        imageUrl={zoomModal.imageUrl}
        images={zoomModal.images}
        initialIndex={zoomModal.initialIndex}
        title={zoomModal.title}
      />
    </div>
  );
};

export default AdminProducts;
