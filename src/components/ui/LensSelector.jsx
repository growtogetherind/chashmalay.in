import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, Camera } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { uploadImage, compressToWebP } from '../../lib/cloudinary';
import { useNavigate } from 'react-router-dom';
import { getLensCategories, getLenses, getLensAddons } from '../../lib/firebase';
import toast from 'react-hot-toast';
import './LensSelector.css';

const LensSelector = ({ isOpen, onClose, product, selectedColor = null, selectedSize = null }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [currentAddonGroupIndex, setCurrentAddonGroupIndex] = useState(0);

  // DB Data
  const [dbCategories, setDbCategories] = useState([]);
  const [dbLenses, setDbLenses] = useState([]);
  const [dbAddons, setDbAddons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selections, setSelections] = useState({
    visionType: null, // Selected Category (e.g. Single Vision)
    selectedLens: null, // Selected individual lens
    addons: [], // Selected add-ons array
    powerOption: null, // later, upload, manual
    prescriptionFile: null,
    prescriptionUrl: null
  });

  const [manualDetails, setManualDetails] = useState({
    samePower: false,
    cylindrical: false,
    leftSph: '',
    rightSph: '',
    leftCyl: '',
    rightCyl: '',
    leftAxis: '',
    rightAxis: '',
    leftAddlPower: '',
    rightAddlPower: '',
    name: '',
    phone: '',
    age: ''
  });

  // Fetch Firestore Data
  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      Promise.all([getLensCategories(), getLenses(), getLensAddons()])
        .then(([catsRes, lensesRes, addonsRes]) => {
          console.log("CATS RES:", catsRes);
          console.log("LENSES RES:", lensesRes);
          console.log("ADDONS RES:", addonsRes);
          setDbCategories(catsRes.data || []);
          setDbLenses(lensesRes.data || []);
          setDbAddons(addonsRes.data || []);
          setLoadingData(false);
        })
        .catch(err => {
          console.error("Error loading lens selection configuration:", err);
          toast.error("Failed to load lens configuration");
          setLoadingData(false);
        });
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsPowerModalOpen(false);
      setCurrentAddonGroupIndex(0);
      setSelections({
        visionType: null,
        selectedLens: null,
        addons: [],
        powerOption: null,
        prescriptionFile: null,
        prescriptionUrl: null,
        selectedColor,
        selectedSize
      });
      setManualDetails({
        samePower: false,
        cylindrical: false,
        leftSph: '',
        rightSph: '',
        leftCyl: '',
        rightCyl: '',
        leftAxis: '',
        rightAxis: '',
        leftAddlPower: '',
        rightAddlPower: '',
        name: '',
        phone: '',
        age: ''
      });
    }
  }, [isOpen, selectedColor, selectedSize]);

  if (!isOpen) return null;

  // Filter categories based on product's available_lenses configuration
  const getFilteredCategories = () => {
    const activeCats = dbCategories.filter(c => c.is_active !== false);
    if (!product?.available_lenses || product.available_lenses.length === 0) {
      return activeCats;
    }
    // Filter categories that match product's available_lenses (case-insensitive check)
    return activeCats.filter(cat =>
      product.available_lenses.some(al => al.toLowerCase() === cat.name.toLowerCase())
    );
  };

  const categories = getFilteredCategories();

  // Get available lenses for current selection category
  const getAvailableLenses = () => {
    if (!selections.visionType) return [];
    return dbLenses.filter(l => l.category_id === selections.visionType.id && l.is_active !== false);
  };

  // Get applicable add-ons for the current selection category
  const getAvailableAddons = () => {
    if (!selections.visionType) return [];
    return dbAddons.filter(a =>
      a.is_active !== false &&
      (!a.applicable_categories ||
       a.applicable_categories.length === 0 ||
       a.applicable_categories.includes(selections.visionType.slug))
    );
  };

  // Setup default add-ons when a category/lens is chosen
  const initializeDefaultAddons = (catSlug) => {
    const applicableAddons = dbAddons.filter(a =>
      a.is_active !== false &&
      a.is_default &&
      (!a.applicable_categories || a.applicable_categories.length === 0 || a.applicable_categories.includes(catSlug))
    );
    setSelections(prev => ({ ...prev, addons: applicableAddons }));
  };

  const handleCategorySelect = (cat) => {
    setSelections(prev => ({ ...prev, visionType: cat, selectedLens: null, addons: [] }));
    initializeDefaultAddons(cat.slug);
    setStep(2);
  };

  const handleFrameOnlySelect = () => {
    const frameOnlyCat = { id: 'frame', name: 'Frame Only', slug: 'frame-only', price: 0 };
    setSelections(prev => ({ ...prev, visionType: frameOnlyCat, selectedLens: null, addons: [], powerOption: 'later' }));
    setStep(5);
  };

  const handleLensSelect = (lens) => {
    setSelections(prev => ({ ...prev, selectedLens: lens }));
    setCurrentAddonGroupIndex(0);
    setStep(3);
  };

  const ADDON_GROUPS = [
    { name: 'Lens Treatment', label: 'Lens Treatment', required: true, noneLabel: null }
  ];

  const getApplicableGroups = () => {
    if (!selections.visionType) return [];
    return ADDON_GROUPS.filter(group => {
      const options = dbAddons.filter(a =>
        a.is_active !== false &&
        a.group === group.name &&
        (!a.applicable_categories ||
         a.applicable_categories.length === 0 ||
         a.applicable_categories.includes(selections.visionType.slug))
      );
      return options.length > 0;
    });
  };

  const handleSelectGroupOption = (groupName, option) => {
    setSelections(prev => {
      let updatedAddons = prev.addons.filter(a => a.group !== groupName);
      if (option) {
        updatedAddons.push(option);
      }
      return { ...prev, addons: updatedAddons };
    });
  };

  const handlePowerSelect = (option) => {
    setSelections(prev => ({ ...prev, powerOption: option }));
    if (option === 'later') {
      setStep(5);
    } else {
      setIsPowerModalOpen(true);
    }
  };

  const calculateTotal = () => {
    let total = parseFloat((product?.consumersPrice || product?.price || "0").toString().replace(/,/g, '')) || 0;
    if (selections.selectedLens?.price) {
      total += selections.selectedLens.price;
    }
    if (selections.addons && selections.addons.length > 0) {
      selections.addons.forEach(a => {
        total += Number(a.price || 0);
      });
    }
    return Math.round(total);
  };

  const getCategoryImage = (slug) => {
    if (slug === 'single-vision') return '/assets/im/select_lens/single_vision.jpeg';
    if (slug === 'bifocal') return '/assets/im/select_lens/bifocal.jpeg';
    if (slug === 'progressive') return '/assets/im/select_lens/bifocal.jpeg';
    return '/assets/im/select_lens/single_vision.jpeg';
  };

  return (
    <div className="lens-modal-overlay">
      <div className="lens-modal-container animate-slide-right">
        <header className="lens-modal-header">
          <div className="header-info">
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">{product?.name || 'Configuration'}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select your vision protocol</p>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-900 hover:bg-slate-100 transition-colors" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="lens-modal-steps">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`step-item ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
              <div className="step-circle">
                {step > s ? <Check size={12} strokeWidth={3} /> : s}
              </div>
            </div>
          ))}
        </div>

        <div className="lens-modal-content custom-scrollbar" data-lenis-prevent>
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading Lens Catalog...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: Choose Vision Type */}
              {step === 1 && (
                <div className="step-content animate-fade-in">
                  <h3 className="step-title">Choose your vision type</h3>
                  <div className="vision-grid">
                    {categories.map((cat) => (
                      <button key={cat.id} className="vision-card" onClick={() => handleCategorySelect(cat)}>
                        <div className="vision-image-wrapper">
                          <img src={getCategoryImage(cat.slug)} alt={cat.name} className="vision-image" onError={(e) => { e.target.src = '/assets/im/eyeglasses.png'; }} />
                        </div>
                        <div className="vision-info">
                          <h4>{cat.name}</h4>
                          <p>{cat.description}</p>
                        </div>
                        <ChevronRight size={20} className="arrow" />
                      </button>
                    ))}

                    {/* Frame Only Option */}
                    <button className="vision-card border-dashed border-slate-300 hover:border-slate-800" onClick={handleFrameOnlySelect}>
                      <div className="vision-image-wrapper">
                        <img src="/assets/im/select_lens/frame_only.jpeg" alt="Frame Only" className="vision-image" onError={(e) => { e.target.src = '/assets/im/eyeglasses.png'; }} />
                      </div>
                      <div className="vision-info">
                        <h4>Frame Only</h4>
                        <p>Buy frame without lenses</p>
                      </div>
                      <ChevronRight size={20} className="arrow" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Choose Lens */}
              {step === 2 && (
                <div className="step-content animate-fade-in">
                  <button className="back-btn" onClick={() => setStep(1)}>← Back to Vision Type</button>
                  <h3 className="step-title">Select Lens</h3>
                  <div className="package-grid">
                    {getAvailableLenses().map((lens) => (
                      <div key={lens.id} className="package-card" onClick={() => handleLensSelect(lens)}>
                        {lens.badge && <span className="package-tag">{lens.badge}</span>}

                        <div className="package-image-wrapper">
                          <img src={lens.image_url || "/assets/im/select_lens/essential.jpeg"} alt={lens.name} className="package-image" onError={(e) => { e.target.src = "/assets/im/select_lens/essential.jpeg"; }} />
                        </div>

                        <div className="package-info">
                          <div className="package-header">
                            <h4>{lens.name}</h4>
                            <div className="package-price">+ ₹{lens.price}</div>
                          </div>
                          <p className="package-desc">{lens.description}</p>
                          <ul className="package-features">
                            {(Array.isArray(lens.features) ? lens.features : []).map(f => (
                              <li key={f}><Check size={12} /> {f}</li>
                            ))}
                          </ul>
                          <button className="select-pkg-btn">Select This Lens</button>
                        </div>
                      </div>
                    ))}
                    {getAvailableLenses().length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400">
                        <p className="font-bold text-sm">No active lenses available in this category.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Choose Add-ons (Wizard) */}
              {step === 3 && (() => {
                const applicableGroups = getApplicableGroups();
                const currentGroup = applicableGroups[currentAddonGroupIndex];
                if (!currentGroup) return null;

                const options = dbAddons.filter(a =>
                  a.is_active !== false &&
                  a.group === currentGroup.name &&
                  (!a.applicable_categories ||
                   a.applicable_categories.length === 0 ||
                   a.applicable_categories.includes(selections.visionType.slug))
                );

                const currentSelection = selections.addons.find(a => a.group === currentGroup.name);

                return (
                  <div className="step-content animate-fade-in text-left">
                    <button className="back-btn" onClick={() => {
                      if (currentAddonGroupIndex === 0) {
                        setStep(2);
                      } else {
                        setCurrentAddonGroupIndex(prev => prev - 1);
                      }
                    }}>
                      ← Back
                    </button>
                    <h3 className="step-title" style={{ marginBottom: '0.5rem' }}>{currentGroup.label}</h3>
                    <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b', fontSize: '13px' }}>
                      Customize your lenses - Step {currentAddonGroupIndex + 1} of {applicableGroups.length}
                    </p>

                    <div className="space-y-4 mb-8">
                      {/* Render optional None option */}
                      {!currentGroup.required && currentGroup.noneLabel && (
                        <div
                          onClick={() => handleSelectGroupOption(currentGroup.name, null)}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${!currentSelection ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}
                        >
                          <div className="flex-1 pr-4">
                            <h4 className="font-bold text-sm text-slate-900">{currentGroup.noneLabel}</h4>
                            <p className="text-xs text-slate-500 mt-1 font-medium">No upgrade, keep standard options</p>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <span className="font-black text-sm text-slate-900">Free</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${!currentSelection ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                              {!currentSelection && <Check size={12} strokeWidth={4} />}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Render actual DB options */}
                      {options.map(addon => {
                        const isSelected = currentSelection?.id === addon.id;
                        return (
                          <div
                            key={addon.id}
                            onClick={() => handleSelectGroupOption(currentGroup.name, addon)}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}
                          >
                            <div className="flex items-center gap-4 flex-1 pr-4">
                              {addon.image_url && (
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <img src={addon.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-slate-900">{addon.name}</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">{addon.description}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <span className="font-black text-sm text-slate-900">{addon.price === 0 ? 'Free' : `+ ₹${addon.price}`}</span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                                {isSelected && <Check size={12} strokeWidth={4} />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      className="btn-cta w-full"
                      onClick={() => {
                        if (currentAddonGroupIndex < applicableGroups.length - 1) {
                          setCurrentAddonGroupIndex(prev => prev + 1);
                        } else {
                          setStep(4);
                        }
                      }}
                    >
                      Continue
                    </button>
                  </div>
                );
              })()}

              {/* STEP 4: Specify Prescription */}
              {step === 4 && (
                <div className="step-content animate-fade-in text-left">
                  <button className="back-btn" onClick={() => {
                    const applicableGroups = getApplicableGroups();
                    setCurrentAddonGroupIndex(applicableGroups.length - 1);
                    setStep(3);
                  }}>
                    ← Back
                  </button>
                  <h3 className="step-title">Specify Prescription</h3>
                  <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b', fontSize: '13px' }}>
                    Choose how you want to provide your eye power details
                  </p>
                  <div className="flex flex-col gap-4">
                    <button className="power-option-card" onClick={() => handlePowerSelect('upload')}>
                      <div className="flex items-center gap-4">
                        <div className="power-icon-wrapper">
                          <Camera size={24} color="#10b981" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a' }}>Upload Prescription</h5>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Provide photo of your prescription</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="arrow" />
                    </button>

                    <button className="power-option-card" onClick={() => handlePowerSelect('manual')}>
                      <div className="flex items-center gap-4">
                        <div className="power-icon-wrapper">
                          <img src="/assets/im/select_lens/mobile_manual.png" alt="Manual" onError={(e) => { e.target.src = '/assets/im/eyeglasses.png'; }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a' }}>Enter Power Manually</h5>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Fill in prescription fields manually</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="arrow" />
                    </button>

                    <button className="power-option-card" onClick={() => handlePowerSelect('later')}>
                      <div className="flex items-center gap-4">
                        <div className="power-icon-wrapper">
                          <img src="/assets/im/select_lens/call_girl.png" alt="Later" onError={(e) => { e.target.src = '/assets/im/lens.png'; }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a' }}>Provide Later on WhatsApp</h5>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Our executive will collect it post-order</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="arrow" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Summary & Add to Cart */}
              {step === 5 && (
                <div className="step-content final-step animate-fade-in">
                  <button className="back-btn" onClick={() => {
                    if (selections.visionType?.id === 'frame') setStep(1);
                    else setStep(4);
                  }}>← Back</button>
                  <div className="success-icon"><Check size={48} /></div>
                  <h3 className="step-title">Lenses Configured Successfully!</h3>
                  <div className="summary-card">
                    <div className="summary-preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                       {/* Frame Preview */}
                       <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                           <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '1px' }}>Selected Frame</p>
                           <img
                             src={product?.gallery?.[0] || product?.image || product?.frame_image || product?.images?.[0]}
                             alt="Frame"
                             style={{ width: '100%', height: '60px', objectFit: 'contain' }}
                             onError={(e) => { e.target.src = '/assets/im/eyeglasses.png'; }}
                           />
                           <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.name}</p>
                       </div>
                       {/* Lens Preview */}
                       {selections.selectedLens && (
                           <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                               <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '1px' }}>Selected Lens</p>
                               <div style={{ width: '100%', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src={selections.selectedLens.image_url || "/assets/im/select_lens/essential.jpeg"} alt="Lens" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = '/assets/im/select_lens/essential.jpeg'; }} />
                               </div>
                               <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>{selections.selectedLens.name}</p>
                           </div>
                       )}
                    </div>
                    <div className="summary-row">
                      <span>Frame Price</span>
                      <span>₹{(product?.consumersPrice || product?.price || '0').toLocaleString()}</span>
                    </div>
                    {(selectedColor || selectedSize) && (
                      <div className="summary-row">
                        <span>Frame Variant</span>
                        <span>{selectedColor?.name || selectedColor || 'Standard'}{selectedSize ? ` / ${selectedSize}` : ''}</span>
                      </div>
                    )}
                    {selections.visionType && (
                       <div className="summary-row">
                        <span>Vision Protocol</span>
                        <span>{selections.visionType.name}</span>
                      </div>
                    )}
                    {selections.selectedLens && (
                      <div className="summary-row">
                        <span>Lens ({selections.selectedLens.name})</span>
                        <span>+ ₹{selections.selectedLens.price}</span>
                      </div>
                    )}
                    {selections.addons && selections.addons.map(addon => (
                      <div key={addon.id} className="summary-row text-slate-500 text-xs">
                        <span className="pl-2">• {addon.name} ({addon.group})</span>
                        <span>+ ₹{addon.price}</span>
                      </div>
                    ))}
                    {selections.powerOption && (
                      <div className="summary-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>Eye Power Option</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                              {selections.powerOption === 'later' ? 'Provide Later' : selections.powerOption === 'upload' ? 'Prescription Uploaded' : 'Manual Entry'}
                            </span>
                        </div>
                        {selections.powerOption === 'manual' && manualDetails && (
                            <div style={{ width: '100%', background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
                                    <span>Detail</span>
                                    <span style={{ textAlign: 'center' }}>Right</span>
                                    <span style={{ textAlign: 'center' }}>Left</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>SPH</span>
                                    <span style={{ textAlign: 'center' }}>{manualDetails.rightSph || '-'}</span>
                                    <span style={{ textAlign: 'center' }}>{manualDetails.leftSph || '-'}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>CYL</span>
                                    <span style={{ textAlign: 'center' }}>{manualDetails.rightCyl || '-'}</span>
                                    <span style={{ textAlign: 'center' }}>{manualDetails.leftCyl || '-'}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>Axis</span>
                                    <span style={{ textAlign: 'center' }}>{manualDetails.rightAxis || '-'}</span>
                                    <span style={{ textAlign: 'center' }}>{manualDetails.leftAxis || '-'}</span>
                                </div>
                                {selections.visionType?.slug === 'bifocal' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                                        <span style={{ fontWeight: 'bold', color: '#64748b' }}>Addl.</span>
                                        <span style={{ textAlign: 'center' }}>{manualDetails.rightAddlPower || '-'}</span>
                                        <span style={{ textAlign: 'center' }}>{manualDetails.leftAddlPower || '-'}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {selections.powerOption === 'upload' && selections.prescriptionFile && (
                            <div style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <img
                                    src={selections.prescriptionUrl || URL.createObjectURL(selections.prescriptionFile)}
                                    alt="Prescription Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }}
                                />
                            </div>
                        )}
                      </div>
                    )}
                    <div className="summary-total">
                      <span>Total Price</span>
                      <span>₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    className="btn-cta w-full"
                    onClick={() => {
                      addToCart(product, { ...selections, selectedColor, selectedSize, manualDetails });
                      onClose();
                      navigate('/cart');
                    }}
                    style={{ marginTop: '2rem' }}
                  >
                    ADD TO CART
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* EYE POWER POPUP SUB-MODAL */}
      {isPowerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 font-black">
                {selections.powerOption === 'upload' ? 'Upload Prescription' : 'Manual Entry'}
              </h3>
              <button onClick={() => setIsPowerModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto" data-lenis-prevent>
              {selections.powerOption === 'upload' && (
                 <div className="upload-power-form">
                    <p className="text-xs text-gray-500 mb-6 text-center">Please upload a clear image of your eye prescription. Our team will verify it manually.</p>

                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group relative overflow-hidden">
                      {selections.prescriptionFile ? (
                        <div className="absolute inset-0 p-2">
                           <img src={selections.prescriptionUrl || URL.createObjectURL(selections.prescriptionFile)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <span className="text-white font-bold text-xs uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className="w-10 h-10 mb-3 text-gray-400 group-hover:text-primary transition-colors" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-emerald-600">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-400">PNG, JPG or WEBP</p>
                        </div>
                      )}
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const toastId = toast.loading('Optimizing image...');
                            const compressedBase64 = await compressToWebP(file);
                            setSelections(prev => ({ ...prev, prescriptionFile: file, prescriptionUrl: compressedBase64 }));
                            toast.success('Image optimized!', { id: toastId });
                          } catch (err) {
                            toast.error('Failed to optimize image.');
                            setSelections(prev => ({ ...prev, prescriptionFile: file }));
                          }
                        }
                      }} />
                    </label>

                    <button
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20"
                      onClick={() => {
                        setIsPowerModalOpen(false);
                        setStep(5);
                      }}
                      disabled={!selections.prescriptionFile}
                    >
                      Save & Proceed
                    </button>
                 </div>
              )}

              {selections.powerOption === 'manual' && (
                 <div className="manual-power-form">
                    <div className="flex flex-col gap-4 mb-6">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input type="checkbox" className="sr-only peer" checked={manualDetails.samePower} onChange={(e) => setManualDetails(prev => ({ ...prev, samePower: e.target.checked }))} />
                            <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div>
                            <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                          </div>
                          <span className="text-[13px] font-bold text-gray-700 group-hover:text-black transition-colors">Same power for both eyes</span>
                       </label>
                    </div>

                    <div className="mb-6">
                      <div className={`grid ${manualDetails.samePower ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_1fr_1fr]'} gap-3 mb-3 items-center`}>
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Power</div>
                        {manualDetails.samePower ? (
                           <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Both Eyes</div>
                        ) : (
                           <>
                             <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Right (OD)</div>
                             <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Left (OS)</div>
                           </>
                        )}
                      </div>

                      {/* SPH Row */}
                      <div className={`grid ${manualDetails.samePower ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_1fr_1fr]'} gap-3 mb-3 items-center`}>
                        <div className="text-[13px] font-black text-gray-700">SPH</div>
                        <div className="relative">
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                            value={manualDetails.rightSph}
                            onChange={(e) => {
                               const val = e.target.value;
                               setManualDetails(prev => ({ ...prev, rightSph: val, leftSph: prev.samePower ? val : prev.leftSph }));
                            }}
                          >
                            <option value="">Select</option>
                            {Array.from({ length: 81 }, (_, i) => -10 + i * 0.25).map(val => (
                              <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                        {!manualDetails.samePower && (
                           <div>
                             <select
                               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                               value={manualDetails.leftSph}
                               onChange={(e) => setManualDetails(prev => ({ ...prev, leftSph: e.target.value }))}
                             >
                               <option value="">Select</option>
                               {Array.from({ length: 81 }, (_, i) => -10 + i * 0.25).map(val => (
                                 <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                               ))}
                             </select>
                           </div>
                        )}
                      </div>

                      {/* CYL Row */}
                      <div className={`grid ${manualDetails.samePower ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_1fr_1fr]'} gap-3 mb-3 items-center`}>
                        <div className="text-[13px] font-black text-gray-700">CYL</div>
                        <div className="relative">
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                            value={manualDetails.rightCyl}
                            onChange={(e) => {
                               const val = e.target.value;
                               setManualDetails(prev => ({ ...prev, rightCyl: val, leftCyl: prev.samePower ? val : prev.leftCyl }));
                            }}
                          >
                            <option value="">Select</option>
                            {Array.from({ length: 49 }, (_, i) => -6 + i * 0.25).map(val => (
                              <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                        {!manualDetails.samePower && (
                           <div>
                             <select
                               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                               value={manualDetails.leftCyl}
                               onChange={(e) => setManualDetails(prev => ({ ...prev, leftCyl: e.target.value }))}
                             >
                               <option value="">Select</option>
                               {Array.from({ length: 49 }, (_, i) => -6 + i * 0.25).map(val => (
                                 <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                               ))}
                             </select>
                           </div>
                        )}
                      </div>

                      {/* Axis Row */}
                      <div className={`grid ${manualDetails.samePower ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_1fr_1fr]'} gap-3 mb-3 items-center`}>
                        <div className="text-[13px] font-black text-gray-700">Axis</div>
                        <input
                          type="text"
                          placeholder="0-180"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black transition-all"
                          value={manualDetails.rightAxis}
                          onChange={(e) => {
                             const val = e.target.value;
                             setManualDetails(prev => ({ ...prev, rightAxis: val, leftAxis: prev.samePower ? val : prev.leftAxis }));
                          }}
                        />
                        {!manualDetails.samePower && (
                           <input
                             type="text"
                             placeholder="0-180"
                             className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black transition-all"
                             value={manualDetails.leftAxis}
                             onChange={(e) => setManualDetails(prev => ({ ...prev, leftAxis: e.target.value }))}
                           />
                        )}
                      </div>

                      {/* Addl. Power Row - Only if Bifocal / Progressive */}
                      {selections.visionType?.slug !== 'single-vision' && selections.visionType?.id !== 'frame' && (
                        <div className={`grid ${manualDetails.samePower ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_1fr_1fr]'} gap-3 mb-3 items-center`}>
                          <div className="text-[13px] font-black text-gray-700">Addl.</div>
                          <div className="relative">
                            <select
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                              value={manualDetails.rightAddlPower}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 setManualDetails(prev => ({ ...prev, rightAddlPower: val, leftAddlPower: prev.samePower ? val : prev.leftAddlPower }));
                              }}
                            >
                              <option value="">Select</option>
                              {Array.from({ length: 9 }, (_, i) => 1 + i * 0.25).map(val => (
                                <option key={val} value={`+${val.toFixed(2)}`}>+{val.toFixed(2)}</option>
                              ))}
                            </select>
                          </div>
                          {!manualDetails.samePower && (
                             <div>
                               <select
                                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                                 value={manualDetails.leftAddlPower}
                                 onChange={(e) => setManualDetails(prev => ({ ...prev, leftAddlPower: e.target.value }))}
                               >
                                 <option value="">Select</option>
                                 {Array.from({ length: 9 }, (_, i) => 1 + i * 0.25).map(val => (
                                   <option key={val} value={`+${val.toFixed(2)}`}>+{val.toFixed(2)}</option>
                                 ))}
                               </select>
                             </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-4">
                      <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Patient Details</h5>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Full Name *"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all"
                          value={manualDetails.name}
                          onChange={(e) => setManualDetails(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="tel"
                            placeholder="Phone Number *"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all"
                            value={manualDetails.phone}
                            onChange={(e) => setManualDetails(prev => ({ ...prev, phone: e.target.value }))}
                          />
                          <input
                            type="number"
                            placeholder="Age *"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all"
                            value={manualDetails.age}
                            onChange={(e) => setManualDetails(prev => ({ ...prev, age: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all mt-6 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                      onClick={() => {
                        setIsPowerModalOpen(false);
                        setStep(5);
                      }}
                      disabled={!manualDetails.name || !manualDetails.phone || !manualDetails.age || !manualDetails.leftSph || !manualDetails.rightSph}
                    >
                      Save Details & Proceed
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LensSelector;
