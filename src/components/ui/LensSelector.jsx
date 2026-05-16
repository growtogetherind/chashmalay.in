import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronRight, Eye, Zap, Shield, Sparkles, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { uploadImage } from '../../lib/cloudinary';
import toast from 'react-hot-toast';
import './LensSelector.css';

const LensSelector = ({ isOpen, onClose, product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [selections, setSelections] = useState({
    visionType: null,
    lensPackage: null,
    powerOption: null,
    prescriptionFile: null
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
    phone: ''
  });

  // Reset to step 1 every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsPowerModalOpen(false);
      setSelections({ visionType: null, lensPackage: null, powerOption: null, prescriptionFile: null });
      setManualDetails({ samePower: false, cylindrical: false, leftSph: '', rightSph: '', leftCyl: '', rightCyl: '', leftAxis: '', rightAxis: '', leftAddlPower: '', rightAddlPower: '', name: '', phone: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const visionTypes = [
    { 
      id: 'single', 
      title: 'Single Vision', 
      desc: 'For Distance or Near Vision', 
      image: '/assets/im/select_lens/single_vision.jpeg',
      price: 0 
    },
    { 
      id: 'bifocal', 
      title: 'Bifocal / Progressive', 
      desc: 'For both Distance and Near Vision', 
      image: '/assets/im/select_lens/bifocal.jpeg',
      price: 1500 
    },
    { 
      id: 'zero', 
      title: 'Zero Power / Fashion', 
      desc: 'No Prescription needed', 
      image: '/assets/im/select_lens/zero_power.jpeg',
      price: 500 
    },
    { 
      id: 'frame', 
      title: 'Frame Only', 
      desc: 'Buy frame without lenses', 
      image: '/assets/im/select_lens/frame_only.jpeg',
      price: 0 
    }
  ].filter(type => {
    if (!product?.available_lenses || product.available_lenses.length === 0) return true;
    
    // Map of product field names to internal IDs
    const mapping = {
      'Single Vision': ['single'],
      'Bifocal': ['bifocal'],
      'Progressive': ['bifocal'],
      'Zero Power': ['zero'],
      'Blue Cut': ['single', 'zero'],
      'Photochromic': ['single', 'zero']
    };

    const allowedIds = product.available_lenses.flatMap(l => mapping[l] || []);
    return allowedIds.includes(type.id) || type.id === 'frame'; // Always allow frame only
  });

  const lensPackages = [
    {
      id: 'essential',
      name: 'Essential Blue',
      desc: 'Anti-glare + Blue cut',
      image: '/assets/im/select_lens/essential.jpeg',
      features: ['Blue Light Protection', 'Anti-Glare', 'Scratch Resistant'],
      price: 999,
      tag: 'BEST VALUE'
    },
    {
      id: 'premium',
      name: 'Premium Thin',
      desc: 'Thinner lenses + HD clarity',
      image: '/assets/im/select_lens/premium.jpeg',
      features: ['Super Thin', 'Water Repellent', 'Blue Light Protection', 'UV Protection'],
      price: 1999,
      tag: 'MOST POPULAR'
    },
    {
      id: 'elite',
      name: 'Elite Supreme',
      desc: 'Ultima thin + Advanced coatings',
      image: '/assets/im/select_lens/elite.jpeg',
      features: ['Zero Distortion', 'Dust Repellent', 'All Clear Visibility', 'Lifetime Coating'],
      price: 3499,
      tag: 'PREMIUM'
    }
  ];

  const handleVisionSelect = (type) => {
    setSelections({ ...selections, visionType: type });
    if (type.id === 'frame') {
       // Finish early for frame only
       setStep(4);
    } else {
       setStep(2);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelections({ ...selections, lensPackage: pkg });
    if (selections.visionType?.id === 'zero') {
       setStep(4);
    } else {
       setStep(3);
    }
  };

  const handlePowerSelect = (option) => {
    setSelections({ ...selections, powerOption: option });
    if (option === 'later') {
      setStep(4); // Skip to summary
    } else if (option === 'upload' || option === 'manual') {
      setIsPowerModalOpen(true);
    }
  };

  const calculateTotal = () => {
    let total = parseFloat((product?.consumersPrice || product?.price || "0").toString().replace(/,/g, '')) || 0;
    if (selections.visionType?.price) total += selections.visionType.price;
    if (selections.lensPackage?.price) total += selections.lensPackage.price;
    return Math.round(total).toLocaleString();
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
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`step-item ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
              <div className="step-circle">
                {step > s ? <Check size={12} strokeWidth={3} /> : s}
              </div>
            </div>
          ))}
        </div>

        <div className="lens-modal-content" data-lenis-prevent>
          {step === 1 && (
            <div className="step-content animate-fade-in">
              <h3 className="step-title">Choose your vision type</h3>
              <div className="vision-grid">
                {visionTypes.map((type) => (
                  <button key={type.id} className="vision-card" onClick={() => handleVisionSelect(type)}>
                    <div className="vision-image-wrapper">
                      <img src={type.image} alt={type.title} className="vision-image" />
                    </div>
                    <div className="vision-info">
                      <h4>{type.title}</h4>
                      <p>{type.desc}</p>
                    </div>
                    <ChevronRight size={20} className="arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animate-fade-in">
              <button className="back-btn" onClick={() => setStep(1)}>← Back to Vision Type</button>
              <h3 className="step-title">Select Lens Package</h3>
              <div className="package-grid">
                {lensPackages.map((pkg) => (
                  <div key={pkg.id} className="package-card" onClick={() => handlePackageSelect(pkg)}>
                    {pkg.tag && <span className="package-tag">{pkg.tag}</span>}
                    <div className="package-image-wrapper">
                       <img src={pkg.image} alt={pkg.name} className="package-image" />
                    </div>
                    <div className="package-header">
                      <h4>{pkg.name}</h4>
                      <div className="package-price">+ ₹{pkg.price}</div>
                    </div>
                    <p className="package-desc">{pkg.desc}</p>
                    <ul className="package-features">
                      {pkg.features.map(f => <li key={f}><Check size={14} /> {f}</li>)}
                    </ul>
                    <button className="select-pkg-btn">Select This Package</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content animate-fade-in">
              <button className="back-btn" onClick={() => setStep(2)}>← Back to Lens Package</button>
              <h3 className="step-title" style={{marginBottom: '0.5rem'}}>Eye Power</h3>
              <p style={{textAlign: 'center', marginBottom: '2rem', color: '#64748b'}}>Need help with power option? <span style={{color: '#16a34a', cursor: 'pointer', fontWeight: 'bold'}}>Learn more</span></p>

              <div style={{marginBottom: '2rem'}}>
                 <h4 style={{fontSize: '1rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 'bold'}}>I know my power</h4>
                 <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                     <button className={`power-option-card ${selections.powerOption === 'upload' ? 'active' : ''}`} onClick={() => handlePowerSelect('upload')}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                           <div className="power-icon-wrapper">
                              <Camera size={24} color="#1E3A8A" />
                           </div>
                           <div style={{textAlign: 'left'}}>
                              <h5 style={{fontSize: '1rem', fontWeight: 'bold', color: '#0f172a'}}>Upload Prescription</h5>
                              <p style={{fontSize: '0.875rem', color: '#64748b'}}>Upload image of your eye prescription</p>
                           </div>
                        </div>
                        <ChevronRight size={20} className="arrow" />
                     </button>

                     <button className={`power-option-card ${selections.powerOption === 'manual' ? 'active' : ''}`} onClick={() => handlePowerSelect('manual')}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                           <div className="power-icon-wrapper">
                              <img src="/assets/im/select_lens/mobile_manual.png" alt="Enter Manually" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=100'; }} />
                           </div>
                           <div style={{textAlign: 'left'}}>
                              <h5 style={{fontSize: '1rem', fontWeight: 'bold', color: '#0f172a'}}>Enter Power Manually</h5>
                              <p style={{fontSize: '0.875rem', color: '#64748b'}}>Input your latest eye prescription</p>
                           </div>
                        </div>
                        <ChevronRight size={20} className="arrow" />
                     </button>
                 </div>
              </div>

              <div>
                 <h4 style={{fontSize: '1rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 'bold'}}>I don't know my power</h4>
                 <button className={`power-option-card ${selections.powerOption === 'later' ? 'active' : ''}`} onClick={() => handlePowerSelect('later')}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                       <div className="power-icon-wrapper">
                          <img src="/assets/im/select_lens/call_girl.png" alt="Submit Later" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100'; }} />
                       </div>
                       <div style={{textAlign: 'left'}}>
                          <h5 style={{fontSize: '1rem', fontWeight: 'bold', color: '#0f172a'}}>I don't know my power</h5>
                          <p style={{fontSize: '0.875rem', color: '#64748b'}}>Submit later after placing the order</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="arrow" />
                 </button>
              </div>

              {/* Inline forms removed, logic moved to a popup sub-modal */}
            </div>
          )}

          {step === 4 && (
            <div className="step-content final-step animate-fade-in">
              <button className="back-btn" onClick={() => {
                 if (selections.visionType?.id === 'frame' || selections.visionType?.id === 'zero') setStep(2);
                 else setStep(3);
              }}>← Back</button>
              <div className="success-icon"><Check size={48} /></div>
              <h3 className="step-title">Lenses Selected Successfully!</h3>
              <div className="summary-card">
                <div className="summary-preview-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
                   {/* Frame Preview */}
                   <div style={{background: '#f8fafc', borderRadius: '12px', padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center'}}>
                       <p style={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '1px'}}>Selected Frame</p>
                       <img 
                         src={product?.gallery?.[0] || product?.image || product?.frame_image || product?.images?.[0] || product?.images?.front} 
                         alt="Frame" 
                         style={{width: '100%', height: '60px', objectFit: 'contain'}} 
                         onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=200';
                         }}
                       />
                       <p style={{fontSize: '11px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{product?.name}</p>
                   </div>
                   {/* Lens Preview */}
                   {selections.lensPackage && (
                       <div style={{background: '#f8fafc', borderRadius: '12px', padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center'}}>
                           <p style={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '1px'}}>Selected Lens</p>
                           <div style={{width: '100%', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                              <img src={selections.lensPackage.image} alt="Lens" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                           </div>
                           <p style={{fontSize: '11px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px'}}>{selections.lensPackage.name}</p>
                       </div>
                   )}
                </div>
                <div className="summary-row">
                  <span>Frame Price</span>
                  <span>₹{product?.consumersPrice || product?.price}</span>
                </div>
                {selections.visionType && (
                   <div className="summary-row">
                    <span>{selections.visionType.title}</span>
                    <span>+ ₹{selections.visionType.price}</span>
                  </div>
                )}
                {selections.lensPackage && (
                  <div className="summary-row">
                    <span>{selections.lensPackage.name}</span>
                    <span>+ ₹{selections.lensPackage.price}</span>
                  </div>
                )}
                {selections.powerOption && (
                  <div className="summary-row" style={{borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: selections.powerOption === 'manual' ? '1rem' : '0'}}>
                        <span>Eye Power</span>
                        <span style={{color: '#16a34a', fontWeight: 'bold'}}>{selections.powerOption === 'later' ? 'Submit Later' : selections.powerOption === 'upload' ? 'Prescription Uploaded' : 'Manual Entry'}</span>
                    </div>
                    {selections.powerOption === 'manual' && manualDetails && (
                        <div style={{width: '100%', background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', fontSize: '11px'}}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase'}}>
                                <span>Detail</span>
                                <span style={{textAlign: 'center'}}>Right</span>
                                <span style={{textAlign: 'center'}}>Left</span>
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '4px'}}>
                                <span style={{fontWeight: 'bold', color: '#64748b'}}>SPH</span>
                                <span style={{textAlign: 'center'}}>{manualDetails.rightSph}</span>
                                <span style={{textAlign: 'center'}}>{manualDetails.leftSph}</span>
                            </div>
                            {manualDetails.cylindrical && (
                                <>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '4px'}}>
                                        <span style={{fontWeight: 'bold', color: '#64748b'}}>CYL</span>
                                        <span style={{textAlign: 'center'}}>{manualDetails.rightCyl || '-'}</span>
                                        <span style={{textAlign: 'center'}}>{manualDetails.leftCyl || '-'}</span>
                                    </div>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '4px'}}>
                                        <span style={{fontWeight: 'bold', color: '#64748b'}}>Axis</span>
                                        <span style={{textAlign: 'center'}}>{manualDetails.rightAxis || '-'}</span>
                                        <span style={{textAlign: 'center'}}>{manualDetails.leftAxis || '-'}</span>
                                    </div>
                                </>
                            )}
                            {selections.visionType?.id === 'bifocal' && (
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f1f5f9'}}>
                                    <span style={{fontWeight: 'bold', color: '#64748b'}}>Addl.</span>
                                    <span style={{textAlign: 'center'}}>{manualDetails.rightAddlPower || '-'}</span>
                                    <span style={{textAlign: 'center'}}>{manualDetails.leftAddlPower || '-'}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {selections.powerOption === 'upload' && selections.prescriptionFile && (
                        <div style={{width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                            <img 
                                src={URL.createObjectURL(selections.prescriptionFile)} 
                                alt="Prescription Preview" 
                                style={{width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc'}} 
                            />
                        </div>
                    )}
                  </div>
                )}
                <div className="summary-total">
                  <span>Final Price</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
              <button 
                className="btn-cta w-full" 
                onClick={async () => {
                  let prescriptionUrl = null;
                  if (selections.powerOption === 'upload' && selections.prescriptionFile) {
                      const toastId = toast.loading("Uploading prescription...");
                      const res = await uploadImage(selections.prescriptionFile, 'prescriptions');
                      if (res.error) {
                          toast.error("Failed to upload prescription", { id: toastId });
                          return;
                      }
                      toast.success("Prescription uploaded!", { id: toastId });
                      prescriptionUrl = res.url;
                  }
                  addToCart(product, { ...selections, manualDetails, prescriptionUrl });
                  onClose();
                }} 
                style={{marginTop: '2rem'}}
              >
                BUY NOW
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SUB-MODAL FOR POWER ENTRY */}
      {isPowerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800">
                {selections.powerOption === 'upload' ? 'Upload Prescription' : 'Manual Entry'}
              </h3>
              <button 
                onClick={() => setIsPowerModalOpen(false)} 
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {selections.powerOption === 'upload' && (
                 <div className="upload-power-form">
                    <p className="text-xs text-gray-500 mb-6 text-center">Please upload a clear image of your latest eye prescription. We will verify the details.</p>
                    
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group relative overflow-hidden">
                      {selections.prescriptionFile ? (
                        <div className="absolute inset-0 p-2">
                           <img src={URL.createObjectURL(selections.prescriptionFile)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <span className="text-white font-bold text-xs uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className="w-10 h-10 mb-3 text-gray-400 group-hover:text-primary transition-colors" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-400">SVG, PNG, JPG or PDF</p>
                        </div>
                      )}
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*,.pdf" onChange={(e) => setSelections({...selections, prescriptionFile: e.target.files[0]})} />
                    </label>

                    <button 
                      className="w-full py-4 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed" 
                      onClick={() => {
                        setIsPowerModalOpen(false);
                        setStep(4);
                      }} 
                      disabled={!selections.prescriptionFile}
                    >
                      Save & Proceed
                    </button>
                 </div>
              )}

              {selections.powerOption === 'manual' && (
                 <div className="manual-power-form">
                    <div className="flex flex-col gap-4 mb-8">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input type="checkbox" className="sr-only peer" checked={manualDetails.samePower} onChange={(e) => setManualDetails({...manualDetails, samePower: e.target.checked})} />
                            <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-black peer-checked:border-black transition-all"></div>
                            <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                          </div>
                          <span className="text-[13px] font-bold text-gray-700 group-hover:text-black transition-colors">I have same power for both eyes</span>
                       </label>
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input type="checkbox" className="sr-only peer" checked={manualDetails.cylindrical} onChange={(e) => setManualDetails({...manualDetails, cylindrical: e.target.checked})} />
                            <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-black peer-checked:border-black transition-all"></div>
                            <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                          </div>
                          <span className="text-[13px] font-bold text-gray-700 group-hover:text-black transition-colors">I have cylindrical power</span>
                       </label>
                    </div>

                    <div className="mb-8">
                      <div className={`grid ${manualDetails.samePower ? 'grid-cols-[100px_1fr]' : 'grid-cols-[100px_1fr_1fr]'} gap-4 mb-4 items-center`}>
                        <div className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Power</div>
                        {manualDetails.samePower ? (
                           <div className="text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Left & Right</div>
                        ) : (
                           <>
                             <div className="text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Right</div>
                             <div className="text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Left</div>
                           </>
                        )}
                      </div>

                      {/* SPH Row */}
                      <div className={`grid ${manualDetails.samePower ? 'grid-cols-[100px_1fr]' : 'grid-cols-[100px_1fr_1fr]'} gap-4 mb-4 items-center`}>
                        <div className="text-[13px] font-black text-gray-700 uppercase">SPH</div>
                        
                        {/* Right Eye SPH (or Combined) */}
                        <div className="relative">
                          <select 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold appearance-none focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                            value={manualDetails.rightSph}
                            onChange={(e) => {
                               const val = e.target.value;
                               if (manualDetails.samePower) {
                                  setManualDetails({...manualDetails, rightSph: val, leftSph: val});
                               } else {
                                  setManualDetails({...manualDetails, rightSph: val});
                               }
                            }}
                          >
                            <option value="">Select</option>
                            {Array.from({length: 81}, (_, i) => -10 + i * 0.25).map(val => (
                              <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={14} className="rotate-90" /></div>
                        </div>

                        {/* Left Eye SPH (Only if not samePower) */}
                        {!manualDetails.samePower && (
                           <div className="relative">
                             <select 
                               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold appearance-none focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                               value={manualDetails.leftSph}
                               onChange={(e) => setManualDetails({...manualDetails, leftSph: e.target.value})}
                             >
                               <option value="">Select</option>
                               {Array.from({length: 81}, (_, i) => -10 + i * 0.25).map(val => (
                                 <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                               ))}
                             </select>
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={14} className="rotate-90" /></div>
                           </div>
                        )}
                      </div>

                      {/* CYL Row - Only if cylindrical checked */}
                      {manualDetails.cylindrical && (
                        <>
                          <div className={`grid ${manualDetails.samePower ? 'grid-cols-[100px_1fr]' : 'grid-cols-[100px_1fr_1fr]'} gap-4 mb-4 items-center animate-fade-in`}>
                            <div className="text-[13px] font-black text-gray-700 uppercase">CYL</div>
                            
                            {/* Right Eye CYL (or Combined) */}
                            <div className="relative">
                              <select 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold appearance-none focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                                value={manualDetails.rightCyl}
                                onChange={(e) => {
                                   const val = e.target.value;
                                   if (manualDetails.samePower) {
                                      setManualDetails({...manualDetails, rightCyl: val, leftCyl: val});
                                   } else {
                                      setManualDetails({...manualDetails, rightCyl: val});
                                   }
                                }}
                              >
                                <option value="">Select</option>
                                {Array.from({length: 49}, (_, i) => -6 + i * 0.25).map(val => (
                                  <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={14} className="rotate-90" /></div>
                            </div>

                            {/* Left Eye CYL (Only if not samePower) */}
                            {!manualDetails.samePower && (
                               <div className="relative">
                                 <select 
                                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold appearance-none focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                                   value={manualDetails.leftCyl}
                                   onChange={(e) => setManualDetails({...manualDetails, leftCyl: e.target.value})}
                                 >
                                   <option value="">Select</option>
                                   {Array.from({length: 49}, (_, i) => -6 + i * 0.25).map(val => (
                                     <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                                   ))}
                                 </select>
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={14} className="rotate-90" /></div>
                               </div>
                            )}
                          </div>

                          {/* Axis Row */}
                          <div className={`grid ${manualDetails.samePower ? 'grid-cols-[100px_1fr]' : 'grid-cols-[100px_1fr_1fr]'} gap-4 mb-4 items-center animate-fade-in`}>
                            <div className="text-[13px] font-black text-gray-700 uppercase">Axis</div>
                            <input 
                              type="text" 
                              placeholder="0-180" 
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold focus:outline-none focus:border-black transition-all"
                              value={manualDetails.rightAxis}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 if (manualDetails.samePower) {
                                    setManualDetails({...manualDetails, rightAxis: val, leftAxis: val});
                                 } else {
                                    setManualDetails({...manualDetails, rightAxis: val});
                                 }
                              }}
                            />
                            {!manualDetails.samePower && (
                               <input 
                                 type="text" 
                                 placeholder="0-180" 
                                 className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold focus:outline-none focus:border-black transition-all"
                                 value={manualDetails.leftAxis}
                                 onChange={(e) => setManualDetails({...manualDetails, leftAxis: e.target.value})}
                               />
                            )}
                          </div>
                        </>
                      )}

                      {/* Addl. Power Row - Only if Bifocal */}
                      {selections.visionType?.id === 'bifocal' && (
                        <div className={`grid ${manualDetails.samePower ? 'grid-cols-[100px_1fr]' : 'grid-cols-[100px_1fr_1fr]'} gap-4 mb-4 items-center animate-fade-in`}>
                          <div className="text-[13px] font-black text-gray-700 uppercase">Addl. Power</div>
                          
                          {/* Right Eye Addl. Power (or Combined) */}
                          <div className="relative">
                            <select 
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold appearance-none focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                              value={manualDetails.rightAddlPower}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 if (manualDetails.samePower) {
                                    setManualDetails({...manualDetails, rightAddlPower: val, leftAddlPower: val});
                                 } else {
                                    setManualDetails({...manualDetails, rightAddlPower: val});
                                 }
                              }}
                            >
                              <option value="">Select</option>
                              {Array.from({length: 9}, (_, i) => 1 + i * 0.25).map(val => (
                                <option key={val} value={`+${val.toFixed(2)}`}>+{val.toFixed(2)}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={14} className="rotate-90" /></div>
                          </div>

                          {/* Left Eye Addl. Power (Only if not samePower) */}
                          {!manualDetails.samePower && (
                             <div className="relative">
                               <select 
                                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold appearance-none focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                                 value={manualDetails.leftAddlPower}
                                 onChange={(e) => setManualDetails({...manualDetails, leftAddlPower: e.target.value})}
                               >
                                 <option value="">Select</option>
                                 {Array.from({length: 9}, (_, i) => 1 + i * 0.25).map(val => (
                                   <option key={val} value={`+${val.toFixed(2)}`}>+{val.toFixed(2)}</option>
                                 ))}
                               </select>
                               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronRight size={14} className="rotate-90" /></div>
                             </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-8 mt-4">
                      <h5 className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-4">Patient Details</h5>
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Full Name *" 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all" 
                          value={manualDetails.name}
                          onChange={(e) => setManualDetails({...manualDetails, name: e.target.value})} 
                        />
                        <input 
                          type="tel" 
                          placeholder="Phone Number *" 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-bold focus:outline-none focus:border-black focus:bg-white transition-all" 
                          value={manualDetails.phone}
                          onChange={(e) => setManualDetails({...manualDetails, phone: e.target.value})} 
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="w-full py-4.5 bg-black text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all mt-8 shadow-lg shadow-black/10 disabled:opacity-50" 
                      onClick={() => {
                        setIsPowerModalOpen(false);
                        setStep(4);
                      }} 
                      disabled={!manualDetails.name || !manualDetails.phone || !manualDetails.leftSph || !manualDetails.rightSph}
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
