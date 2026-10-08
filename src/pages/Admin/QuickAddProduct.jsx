import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Image as ImageIcon, 
  Palette, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Eye, 
  Star, 
  Layers, 
  Glasses,
  Sun,
  X,
  ZoomIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveProduct, subscribeProducts } from '../../lib/firebase';
import { uploadImage, compressToWebP, base64ToBlob, fileToBase64 } from '../../lib/cloudinary';
import AdminSidebar from '../../components/layout/AdminSidebar';
import ImageZoomModal from '../../components/ui/ImageZoomModal';
import toast from 'react-hot-toast';

const PRESET_SINGLE_COLORS = [
  { name: 'Black', hex: '#111111' },
  { name: 'Matte Black', hex: '#1A1A1A' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gunmetal', hex: '#2C3539' },
  { name: 'Tortoise Brown', hex: '#5C4033' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Smoke Grey', hex: '#475569' },
  { name: 'Emerald Green', hex: '#16A34A' },
  { name: 'Crystal Clear', hex: '#F1F5F9' },
  { name: 'Honey Amber', hex: '#D97706' },
];

const PRESET_DUAL_COLORS = [
  { name: 'Matte Black Red', hex: '#1A1A1A', hex2: '#DC2626' },
  { name: 'Black Gold', hex: '#111111', hex2: '#D4AF37' },
  { name: 'Black Silver', hex: '#111111', hex2: '#C0C0C0' },
  { name: 'Gunmetal Blue', hex: '#2C3539', hex2: '#1E3A8A' },
  { name: 'Tortoise Gold', hex: '#5C4033', hex2: '#D4AF37' },
  { name: 'Crystal Rose Gold', hex: '#F1F5F9', hex2: '#B76E79' },
  { name: 'Grey Neon Green', hex: '#475569', hex2: '#16A34A' },
  { name: 'Navy Blue Red', hex: '#1E3A8A', hex2: '#DC2626' },
];

const CLIP_ON_SETS = [
  '1 Magnetic Polarized Sun Clip (Black)',
  '2-in-1 (Black Polarized + Night Drive Yellow)',
  '5-in-1 Magnetic Clip Set (Black, Mirror, Brown, Blue, Yellow)',
  'Custom Magnetic Clip Attachment'
];

const PRICE_PRESETS = [799, 999, 1299, 1499, 1999];
const CATEGORY_OPTIONS = [
  { id: 'eyeglasses', label: 'Eyeglasses', icon: '👓' },
  { id: 'clip-on-glasses', label: 'Clip-On Glasses', icon: '🧲' },
  { id: 'sunglasses', label: 'Sunglasses', icon: '🕶️' },
  { id: 'computer-glasses', label: 'Computer Glasses', icon: '💻' },
];
const SHAPE_OPTIONS = ['Square', 'Round', 'Aviator', 'Cat Eye', 'Rectangle', 'Wayfarer'];
const GENDER_OPTIONS = ['Unisex', 'Men', 'Women'];

export default function QuickAddProduct() {
  const { user, isAdmin, isManager, signIn } = useAuth();

  // Auth helper for localhost
  const [adminEmail, setAdminEmail] = useState('chashmalayshorts@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Form State
  const [customName, setCustomName] = useState('');
  const [price, setPrice] = useState(999);
  const [category, setCategory] = useState('eyeglasses');
  const [isClipOn, setIsClipOn] = useState(false);
  const [clipOnSet, setClipOnSet] = useState(CLIP_ON_SETS[0]);
  const [frameShape, setFrameShape] = useState('Square');
  const [gender, setGender] = useState('Unisex');

  // Color Variants
  // Each variant has: id, name, hex, is_dual_tone, hex2, photos: [{ id, file, preview, url }]
  const [variants, setVariants] = useState([
    {
      id: 1,
      name: 'Black',
      hex: '#111111',
      is_dual_tone: false,
      hex2: '#DC2626',
      photos: []
    }
  ]);

  // Submission State
  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState('');
  const [lastCreatedProduct, setLastCreatedProduct] = useState(null);

  // Recent products feed
  const [recentProducts, setRecentProducts] = useState([]);
  const [zoomModal, setZoomModal] = useState({ isOpen: false, imageUrl: '', images: [], initialIndex: 0, title: '' });

  useEffect(() => {
    const unsub = subscribeProducts({ adminFilter: true }, (items) => {
      setRecentProducts(items.slice(0, 6));
    });
    return () => unsub && unsub();
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast.error('Enter email and password');
      return;
    }
    setLoggingIn(true);
    try {
      await signIn(adminEmail, adminPassword);
      toast.success('Admin authenticated successfully!');
    } catch (err) {
      toast.error('Login failed: ' + (err.message || 'Check credentials'));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleCategorySelect = (catId) => {
    setCategory(catId);
    if (catId === 'clip-on-glasses') {
      setIsClipOn(true);
    } else {
      setIsClipOn(false);
    }
  };

  const handleToggleClipOn = (val) => {
    setIsClipOn(val);
    if (val) {
      setCategory('clip-on-glasses');
      toast.success('Clip-On enabled: Category set to Clip-On Glasses');
    } else if (category === 'clip-on-glasses') {
      setCategory('eyeglasses');
    }
  };

  const addVariant = (preset = null, isDual = false) => {
    const newVariant = {
      id: Date.now() + Math.random(),
      name: preset ? preset.name : (isDual ? 'Black & Red' : 'New Color'),
      hex: preset ? preset.hex : '#111111',
      is_dual_tone: isDual || Boolean(preset?.hex2),
      hex2: preset?.hex2 || '#DC2626',
      photos: []
    };
    setVariants(prev => [...prev, newVariant]);
    toast.success(`Added ${newVariant.name} variant`);
  };

  const removeVariant = (id) => {
    if (variants.length <= 1) {
      toast.error('Keep at least one color variant');
      return;
    }
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id, field, value) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  // Multi-photo file selection for a variant
  const handleAddPhotos = async (variantId, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Immediately display preview placeholders so the UI is 100% responsive
    const newPhotos = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      originalFile: file,
      preview: URL.createObjectURL(file),
      base64: null,
      compressedBlob: null,
      url: ''
    }));

    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      return {
        ...v,
        photos: [...(v.photos || []), ...newPhotos]
      };
    }));

    toast.success(`Added ${files.length} photo(s)`);
    try {
      e.target.value = '';
    } catch {}

    // In parallel / background, immediately read each file into RAM (Blob + base64).
    // This locks the image data in memory so it CANNOT be detached, locked, or invalidated
    // by Windows OS file-handles, input resets, or rapid continuous additions!
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoId = newPhotos[i].id;
      try {
        let base64 = null;
        let compressedBlob = file;

        if (file.type && file.type.startsWith('image/')) {
          base64 = await compressToWebP(file, 1200, 1200, 0.75);
          compressedBlob = base64ToBlob(base64, 'image/webp');
        } else {
          base64 = await fileToBase64(file);
        }

        setVariants(prev => prev.map(v => {
          if (v.id !== variantId) return v;
          return {
            ...v,
            photos: (v.photos || []).map(p => p.id === photoId ? {
              ...p,
              base64,
              compressedBlob,
              file: compressedBlob,
              preview: base64 || p.preview
            } : p)
          };
        }));
      } catch (prepErr) {
        console.warn(`Could not pre-cache photo ${file.name}:`, prepErr?.message || prepErr);
      }
    }
  };

  const handleRemovePhoto = (variantId, photoId) => {
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      return {
        ...v,
        photos: v.photos.filter(p => p.id !== photoId)
      };
    }));
  };

  const handleSetPrimaryPhoto = (variantId, photoIndex) => {
    if (photoIndex === 0) return;
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      const reordered = [...v.photos];
      const [chosen] = reordered.splice(photoIndex, 1);
      reordered.unshift(chosen);
      return { ...v, photos: reordered };
    }));
    toast.success('Set as primary front photo');
  };

  const handlePublish = async () => {
    // 1. Validation: check that at least one photo is provided
    const totalPhotos = variants.reduce((acc, v) => acc + (v.photos?.length || 0), 0);
    if (totalPhotos === 0) {
      toast.error('Please upload at least one photo for your product');
      return;
    }

    setPublishing(true);
    setPublishStep('Preparing image uploads to Cloudinary CDN...');

    try {
      // 2. Upload photos for each variant
      const uploadedVariants = [];
      let globalUploadedPhotos = 0;

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const uploadedUrls = [];

        for (let pIdx = 0; pIdx < (v.photos || []).length; pIdx++) {
          const photo = v.photos[pIdx];
          globalUploadedPhotos++;
          setPublishStep(
            `Uploading ${v.name} photo (${globalUploadedPhotos}/${totalPhotos})...`
          );

          if ((photo.compressedBlob || photo.file) && !photo.url) {
            const uploadTarget = photo.compressedBlob || photo.file;
            const res = await uploadImage(uploadTarget, 'products', {
              base64: photo.base64 || null
            });
            if (res.error) {
              throw new Error(`Photo #${pIdx + 1} for ${v.name} failed: ${res.error}`);
            }
            uploadedUrls.push(res.url);

            // Cache uploaded URL into state so retrying doesn't re-upload already completed photos
            setVariants(prev => prev.map(variant => {
              if (variant.id !== v.id) return variant;
              return {
                ...variant,
                photos: (variant.photos || []).map((p, idx) => idx === pIdx ? { ...p, url: res.url } : p)
              };
            }));
          } else if (photo.url) {
            uploadedUrls.push(photo.url);
          }
        }

        const front = uploadedUrls[0] || '';
        const side = uploadedUrls[1] || '';
        const model = uploadedUrls[2] || '';

        uploadedVariants.push({
          name: v.name,
          hex: v.hex,
          color_code: v.hex,
          is_dual_tone: Boolean(v.is_dual_tone),
          hex2: v.is_dual_tone ? v.hex2 : null,
          dual_color_hex: v.is_dual_tone ? v.hex2 : null,
          image: front,
          image_side: side,
          image_model: model,
          gallery: uploadedUrls
        });
      }

      // 3. Fallbacks and auto-generated fields
      setPublishStep('Syncing catalog item to live Firestore...');

      const primary = uploadedVariants[0];
      const isClip = isClipOn || category === 'clip-on-glasses';
      const finalCategory = isClip ? 'clip-on-glasses' : category;

      const autoTitle = customName.trim()
        ? customName.trim()
        : `Chashmalay ${primary.is_dual_tone ? `${primary.name} Dual-Tone` : primary.name} ${frameShape} ${isClip ? 'Magnetic Clip-On' : ''} Frame`;

      const generatedSku = `CH-Q-${Date.now().toString().slice(-6)}`;
      const numPrice = Number(price) || 999;
      const numOriginalPrice = Math.round(numPrice * 1.8);

      const allGalleryUrls = Array.from(new Set(
        uploadedVariants.flatMap(v => v.gallery).filter(Boolean)
      ));

      const description = isClip
        ? `${autoTitle} by Chashmalay. 2-in-1 magnetic clip-on optical eyewear featuring ${clipOnSet}. Converts instantly from indoor clear prescription frame to outdoor polarized sunglasses.`
        : `${autoTitle} by Chashmalay. Premium handcrafted frame engineered for superior durability and all-day comfort. Finished in ${primary.name}.`;

      const tags = isClip
        ? `clip-on, clip-on glasses, magnetic clip-on, 2-in-1, polarized, sunglasses clip, optical frame, ${primary.name.toLowerCase()}`
        : `eyeglasses, ${category}, ${primary.name.toLowerCase()}, ${frameShape.toLowerCase()}`;

      const payload = {
        name: autoTitle,
        brand: 'Chashmalay',
        category: finalCategory,
        product_type: isClip ? 'Clip-On Glasses' : (category === 'sunglasses' ? 'Sunglasses' : 'Eyeglasses'),
        sku: generatedSku,
        price: numPrice,
        original_price: numOriginalPrice,
        discount_price: numPrice,
        description: description,
        stock_quantity: 50,
        gender: gender,
        frame_type: isClip ? 'Magnetic Clip-On' : 'Full Rim',
        frame_shape: frameShape,
        frame_material: 'Acetate',
        lens_type: 'Single Vision Prescription / Blue Cut Compatible',
        available_sizes: ['M', 'L'],
        available_colors: uploadedVariants.map(v => v.name),
        default_color: primary.name,
        color: primary.name,
        color_hex: primary.hex,
        is_dual_tone: Boolean(primary.is_dual_tone),
        hex2: primary.is_dual_tone ? primary.hex2 : null,
        dual_color_hex: primary.is_dual_tone ? primary.hex2 : null,
        frame_color: primary.name,
        // Clip-on flags
        is_clip_on: Boolean(isClip),
        has_clip_on: Boolean(isClip),
        clip_on_type: isClip ? clipOnSet : null,
        tags: tags,
        is_active: true,
        is_new: true,
        is_featured: false,
        images: {
          front: primary.image || '',
          side: primary.image_side || '',
          model: primary.image_model || '',
          gallery: allGalleryUrls
        },
        gallery: allGalleryUrls,
        frame_image: primary.image || '',
        image: primary.image || '',
        colors: uploadedVariants
      };

      const { id, error } = await saveProduct(payload);
      if (error) {
        throw new Error(error.message || 'Firestore write failed');
      }

      toast.success('🎉 Product published directly to live store!', { duration: 5000 });
      setLastCreatedProduct({
        id: id || generatedSku,
        name: autoTitle,
        price: numPrice,
        sku: generatedSku,
        primaryImage: primary.image,
        totalPhotos: allGalleryUrls.length,
        isClipOn: isClip,
        colors: uploadedVariants
      });

      // Reset for next rapid entry
      setVariants([
        {
          id: Date.now(),
          name: 'Black',
          hex: '#111111',
          is_dual_tone: false,
          hex2: '#DC2626',
          photos: []
        }
      ]);
      setCustomName('');
    } catch (err) {
      console.error('Quick Add error:', err);
      toast.error('Publishing failed: ' + err.message);
    } finally {
      setPublishing(false);
      setPublishStep('');
    }
  };

  const copyLiveLink = (id) => {
    const url = `https://chashmalay.in/product/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied live product link to clipboard!');
  };

  const canWrite = isAdmin || isManager || (user && ['chashmalayshorts@gmail.com', 'admin@gmail.com'].includes(user.email));
  const isClipActive = isClipOn || category === 'clip-on-glasses';

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        {/* Header Section */}
        <div className="admin-header flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                <Zap size={12} className="fill-amber-500" /> Rapid Mode
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                <Layers size={12} /> Dual Color & Multi-Photo
              </span>
              {isClipActive && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                  🧲 Clip-On Enabled
                </span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Storefront Sync
              </span>
            </div>
            <h1 className="admin-title">⚡ Quick Product Add</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Upload multiple photos, pick single/dual colors, or add magnetic clip-on frames — live sync in seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/admin/products"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              Back to Catalog
            </Link>
          </div>
        </div>

        {/* Auth Check for Localhost */}
        {!canWrite && (
          <div className="mb-6 p-6 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500 text-white rounded-xl">
                <Lock size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Admin Authentication Required for Live Sync</h4>
                <p className="text-xs text-amber-800/80 mt-1">
                  Firestore rules require an admin session to push live products. Log in below to publish directly from localhost.
                </p>
                <form onSubmit={handleAdminLogin} className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Admin Email"
                    className="px-4 py-2 bg-white rounded-xl border border-amber-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Admin Password"
                    className="px-4 py-2 bg-white rounded-xl border border-amber-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-600/20 disabled:opacity-50"
                  >
                    {loggingIn ? 'Authenticating...' : 'Sign In as Admin'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal / Banner when a product is published */}
        {lastCreatedProduct && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/10 animate-in fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 p-1.5 backdrop-blur-md flex items-center justify-center shrink-0">
                  {lastCreatedProduct.primaryImage ? (
                    <img src={lastCreatedProduct.primaryImage} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <CheckCircle2 size={32} className="text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest text-emerald-100">
                      Published & Live
                    </span>
                    {lastCreatedProduct.isClipOn && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-widest">
                        🧲 Clip-On
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black">{lastCreatedProduct.name}</h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    SKU: {lastCreatedProduct.sku} • ₹{lastCreatedProduct.price} • {lastCreatedProduct.colors.length} Color(s) • {lastCreatedProduct.totalPhotos} Photo(s)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <a
                  href={`/product/${lastCreatedProduct.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-800 text-xs font-black uppercase tracking-wider hover:bg-emerald-50 transition-all shadow-md"
                >
                  <Eye size={16} /> Localhost Preview
                </a>
                <a
                  href={`https://chashmalay.in/product/${lastCreatedProduct.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md"
                >
                  <ExternalLink size={16} /> Open on Live Store
                </a>
                <button
                  type="button"
                  onClick={() => copyLiveLink(lastCreatedProduct.id)}
                  className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all"
                  title="Copy Live Store Link"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Color Variants & Multiple Photos */}
          <div className="lg:col-span-2 space-y-8">
            <div className="admin-card !p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Palette size={20} className="text-emerald-600" />
                    1. Frame Colors & Photos
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Upload multiple photos (3, 4, 5+ angles). Front photo is primary thumbnail.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addVariant(null, false)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Plus size={15} /> Single Color
                  </button>
                  <button
                    type="button"
                    onClick={() => addVariant(null, true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Plus size={15} /> Dual-Tone Color
                  </button>
                </div>
              </div>

              {/* Clip-On Photo Suggestion Banner */}
              {isClipActive && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 animate-in fade-in">
                  <span className="text-xl">🧲</span>
                  <div className="text-xs text-amber-900">
                    <strong className="block font-black uppercase tracking-wider text-[11px] mb-0.5">
                      Clip-On Photo Tip:
                    </strong>
                    Include photos of the clear optical frame <strong>without</strong> the clip, plus photos <strong>with the magnetic sunglasses clip attached</strong>!
                  </div>
                </div>
              )}

              {/* Quick Preset Buttons for 1-click variant creation */}
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Quick Add Single Colors:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SINGLE_COLORS.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => addVariant(preset, false)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm"
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
                    ⚡ Quick Add Dual-Tone Combinations:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_DUAL_COLORS.map(dual => (
                      <button
                        key={dual.name}
                        type="button"
                        onClick={() => addVariant(dual, true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm"
                      >
                        <span 
                          className="w-4 h-4 rounded-full border border-black/10 shadow-inner shrink-0"
                          style={{ 
                            background: `linear-gradient(135deg, ${dual.hex} 50%, ${dual.hex2} 50%)`
                          }}
                        />
                        <span>{dual.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Variants List */}
              <div className="space-y-8">
                {variants.map((v) => (
                  <div 
                    key={v.id} 
                    className={`p-6 rounded-3xl border transition-all ${
                      v.is_dual_tone 
                        ? 'bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 border-indigo-200/80 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    {/* Variant Header & Color Pickers */}
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Swatch indicator (single or split gradient for dual tone) */}
                        <div 
                          className="w-9 h-9 rounded-2xl border-2 border-white shadow-md flex items-center justify-center shrink-0 transition-all"
                          style={{ 
                            background: v.is_dual_tone 
                              ? `linear-gradient(135deg, ${v.hex} 50%, ${v.hex2} 50%)` 
                              : v.hex 
                          }}
                        />

                        {/* Name input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
                            placeholder="Color Name"
                            className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500 w-44 shadow-sm"
                          />
                        </div>

                        {/* Primary Color Picker */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {v.is_dual_tone ? 'Base' : 'Color'}:
                          </span>
                          <input
                            type="color"
                            value={v.hex}
                            onChange={(e) => updateVariant(v.id, 'hex', e.target.value)}
                            className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                            title="Primary Color Hex"
                          />
                          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{v.hex}</span>
                        </div>

                        {/* Secondary Color Picker (Visible when Dual-Tone is active) */}
                        {v.is_dual_tone && (
                          <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in">
                            <span className="text-[10px] font-black text-indigo-700 uppercase">
                              Accent:
                            </span>
                            <input
                              type="color"
                              value={v.hex2 || '#DC2626'}
                              onChange={(e) => updateVariant(v.id, 'hex2', e.target.value)}
                              className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                              title="Secondary/Dual Color Hex"
                            />
                            <span className="text-[10px] font-mono text-indigo-700 font-bold uppercase">{v.hex2 || '#DC2626'}</span>
                          </div>
                        )}

                        {/* Dual Tone Toggle Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 select-none shadow-sm hover:border-slate-300 transition-all">
                          <input
                            type="checkbox"
                            checked={Boolean(v.is_dual_tone)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateVariant(v.id, 'is_dual_tone', checked);
                              if (checked && !v.hex2) {
                                updateVariant(v.id, 'hex2', '#DC2626');
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700">Dual-Tone</span>
                        </label>
                      </div>

                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(v.id)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-white transition-all ml-auto"
                          title="Remove this color variant"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Photos Area for this variant (Unlimited Photos Supported!) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          Photos for {v.name}
                          <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-[10px] font-bold text-slate-700">
                            {v.photos?.length || 0} photos
                          </span>
                        </span>

                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                          <Plus size={14} /> Add Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleAddPhotos(v.id, e)}
                          />
                        </label>
                      </div>

                      {/* Photo Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                        {(v.photos || []).map((photo, pIdx) => (
                          <div 
                            key={photo.id}
                            className={`relative rounded-2xl bg-white border p-2 flex flex-col group overflow-hidden shadow-sm transition-all ${
                              pIdx === 0 
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Badges */}
                            <div className="absolute top-2 left-2 z-10">
                              {pIdx === 0 ? (
                                <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                                  <Star size={10} className="fill-white" /> {isClipActive ? 'Clear Front' : 'Front'}
                                </span>
                              ) : pIdx === 1 ? (
                                <span className="bg-slate-700 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                                  {isClipActive ? '🧲 With Clip' : 'Side'}
                                </span>
                              ) : pIdx === 2 ? (
                                <span className="bg-slate-600 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                                  {isClipActive ? 'Side' : 'Model'}
                                </span>
                              ) : (
                                <span className="bg-slate-500 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                                  #{pIdx + 1}
                                </span>
                              )}
                              {photo.url && (
                                <span className="ml-1 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm inline-flex items-center gap-0.5">
                                  <CheckCircle2 size={9} /> Uploaded
                                </span>
                              )}
                            </div>

                            {/* Image Thumbnail */}
                            <div 
                              className="aspect-square rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-2 mb-2 relative cursor-pointer group/img"
                              onClick={() => {
                                const photoUrls = (v.photos || []).map(p => p.preview || p.url).filter(Boolean);
                                setZoomModal({
                                  isOpen: true,
                                  imageUrl: photo.preview || photo.url,
                                  title: `${v.name} Photo #${pIdx + 1}`,
                                  images: photoUrls,
                                  initialIndex: pIdx
                                });
                              }}
                              title="Click to Zoom / Inspect Image"
                            >
                              <img 
                                src={photo.preview || photo.url} 
                                alt="" 
                                className="w-full h-full object-contain group-hover/img:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn size={16} className="text-white drop-shadow" />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              {pIdx !== 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryPhoto(v.id, pIdx)}
                                  className="text-[10px] text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-0.5"
                                  title="Make this the front/primary photo"
                                >
                                  Make Front
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-bold">Primary</span>
                              )}

                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const photoUrls = (v.photos || []).map(p => p.preview || p.url).filter(Boolean);
                                    setZoomModal({
                                      isOpen: true,
                                      imageUrl: photo.preview || photo.url,
                                      title: `${v.name} Photo #${pIdx + 1}`,
                                      images: photoUrls,
                                      initialIndex: pIdx
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                                  title="Zoom / Inspect"
                                >
                                  <ZoomIn size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(v.id, photo.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
                                  title="Delete this photo"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Big Add Photo Dropzone Tile */}
                        <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl aspect-square flex flex-col items-center justify-center p-3 cursor-pointer bg-white/70 hover:bg-emerald-50/40 transition-all group">
                          <Upload size={22} className="text-slate-400 group-hover:text-emerald-600 mb-1.5 transition-colors" />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 text-center leading-tight">
                            {(v.photos?.length || 0) === 0 ? 'Upload Photos' : '+ Add More'}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 text-center">Multi-select files</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="hidden" 
                            onChange={(e) => handleAddPhotos(v.id, e)} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Settings & 1-Click Publishing */}
          <div className="space-y-6">
            <div className="admin-card !p-8 space-y-6">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                2. Quick Settings & Publish
              </h2>

              {/* Price */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Price (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-8 pr-4 py-3 rounded-2xl text-slate-900 font-black text-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {PRICE_PRESETS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrice(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        Number(price) === p 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Category
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {CATEGORY_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCategorySelect(c.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between ${
                        category === c.id
                          ? (c.id === 'clip-on-glasses' 
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                              : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20')
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.icon}</span>
                        <span>{c.label}</span>
                      </span>
                      {category === c.id && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Magnetic Clip-On Specialized Box */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isClipActive 
                  ? 'bg-amber-500/10 border-amber-300 ring-1 ring-amber-400/30' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                      isClipActive ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                    }`}>
                      🧲
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Magnetic Clip-On Frame</span>
                      <span className="text-[10px] text-slate-500 block">Includes detachable sunglass clips</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isClipActive}
                    onChange={(e) => handleToggleClipOn(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                {isClipActive && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 animate-in fade-in space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                      Clip-On Set Specification:
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {CLIP_ON_SETS.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setClipOnSet(preset)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold text-left transition-all ${
                            clipOnSet === preset
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-amber-50 border border-amber-200/80'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shape */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Frame Shape
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SHAPE_OPTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFrameShape(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        frameShape === s
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Gender Target
                </label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        gender === g
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Custom Name */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  Product Name <span className="text-slate-400 font-normal lowercase">(optional — auto-generated if blank)</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={`e.g. Chashmalay ${variants[0]?.name || ''} ${frameShape} ${isClipActive ? 'Clip-On' : ''} Frame`}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Huge Action Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white text-xs font-black uppercase tracking-[2px] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 ${
                    isClipActive 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
                  }`}
                >
                  {publishing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>{publishStep || 'PUBLISHING TO LIVE STORE...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} className="fill-white" />
                      <span>PUBLISH {isClipActive ? 'CLIP-ON ' : ''}PRODUCT TO LIVE STORE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Added Products List */}
        {recentProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Recent Storefront Catalog Items
                </h3>
                <p className="text-xs text-slate-500">Live products currently stored in database</p>
              </div>
              <Link to="/admin/products" className="text-xs font-bold text-emerald-600 hover:underline">
                View all {recentProducts.length}+ products →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {recentProducts.map(p => (
                <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col group hover:border-emerald-300 transition-all">
                  <div 
                    className="aspect-square rounded-xl bg-slate-50 p-2 flex items-center justify-center mb-2 overflow-hidden relative cursor-pointer group/thumb"
                    onClick={() => {
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
                      const activeImg = p.images?.front || p.frame_image || p.image || uniqueImgs[0];
                      if (activeImg) {
                        setZoomModal({
                          isOpen: true,
                          imageUrl: activeImg,
                          title: `${p.name} Preview`,
                          images: uniqueImgs,
                          initialIndex: 0
                        });
                      }
                    }}
                    title="Click to Zoom Image"
                  >
                    {p.is_clip_on && (
                      <span className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm z-10">
                        Clip-On
                      </span>
                    )}
                    <img
                      src={p.images?.front || p.frame_image || p.image || 'https://via.placeholder.com/200'}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover/thumb:scale-105 transition-transform"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200'; }}
                    />
                    <div className="absolute inset-0 bg-slate-900/30 rounded-xl opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn size={16} className="text-white drop-shadow" />
                    </div>
                  </div>
                  <h5 className="text-[11px] font-bold text-slate-900 truncate mb-1" title={p.name}>
                    {p.name}
                  </h5>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-2">
                    <span className="text-emerald-600">₹{p.price}</span>
                    <span className="uppercase truncate max-w-[50%]">{p.frame_shape || p.category}</span>
                  </div>
                  <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                    <a
                      href={`/product/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold text-slate-400 hover:text-slate-900 uppercase"
                    >
                      Local
                    </a>
                    <a
                      href={`https://chashmalay.in/product/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 uppercase flex items-center gap-0.5"
                    >
                      Live <ExternalLink size={8} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Image Zoom Lightbox Modal */}
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
}
