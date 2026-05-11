import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronRight, Eye, Zap, Shield, Sparkles, UploadCloud } from 'lucide-react';
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
    name: '',
    phone: ''
  });

  // Reset to step 1 every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsPowerModalOpen(false);
      setSelections({ visionType: null, lensPackage: null, powerOption: null, prescriptionFile: null });
      setManualDetails({ samePower: false, cylindrical: false, leftSph: '', rightSph: '', name: '', phone: '' });
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
            <h2>Select Lenses</h2>
            <p>{product?.name}</p>
          </div>
          <button className="close-modal" onClick={onClose}><X size={24} /></button>
        </header>

        <div className="lens-modal-steps">
          <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <span className="step-circle">{step > 1 ? <Check size={14} /> : '1'}</span>
            Vision Type
          </div>
          <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
             <span className="step-circle">{step > 2 ? <Check size={14} /> : '2'}</span>
             Lens Package
          </div>
          <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
             <span className="step-circle">{step > 3 ? <Check size={14} /> : '3'}</span>
             Add Power
          </div>
          <div className={`step-item ${step === 4 ? 'active' : ''}`}>
             <span className="step-circle">4</span>
             Summary
          </div>
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
                 <h4 style={{fontSize: '1rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 'bold'}}>I don't know my power</h4>
                 <button className={`power-option-card ${selections.powerOption === 'later' ? 'active' : ''}`} onClick={() => handlePowerSelect('later')}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                       <div className="power-icon-wrapper">
                          <img src="/assets/im/select_lens/call_girl.png" alt="Submit Later" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100'; }} />
                       </div>
                       <div style={{textAlign: 'left'}}>
                          <h5 style={{fontSize: '1rem', fontWeight: 'bold', color: '#0f172a'}}>Submit Power Later within 15 days</h5>
                          <p style={{fontSize: '0.875rem', color: '#64748b'}}>After placing the order</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="arrow" />
                 </button>
              </div>

              <div>
                 <h4 style={{fontSize: '1rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 'bold'}}>I know my power</h4>
                 <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                     <button className={`power-option-card ${selections.powerOption === 'upload' ? 'active' : ''}`} onClick={() => handlePowerSelect('upload')}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                           <div className="power-icon-wrapper">
                              <Sparkles size={24} color="#1E3A8A" />
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
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                        <span>Eye Power</span>
                        <span style={{color: '#16a34a', fontWeight: 'bold'}}>{selections.powerOption === 'later' ? 'Submit Later' : selections.powerOption === 'upload' ? 'Prescription Uploaded' : 'Manual Entry'}</span>
                    </div>
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
                  navigate('/cart');
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
                            <UploadCloud className="w-10 h-10 mb-3 text-gray-400 group-hover:text-primary transition-colors" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-400">SVG, PNG, JPG or PDF</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setSelections({...selections, prescriptionFile: e.target.files[0]})} />
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
                    <div className="flex gap-4 mb-6">
                       <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                          <input type="checkbox" className="accent-black w-4 h-4" onChange={(e) => setManualDetails({...manualDetails, samePower: e.target.checked})} /> Same power for both eyes
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                          <input type="checkbox" className="accent-black w-4 h-4" onChange={(e) => setManualDetails({...manualDetails, cylindrical: e.target.checked})} /> Cylindrical power
                       </label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">SPH (Left Eye)</label>
                          <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" onChange={(e) => setManualDetails({...manualDetails, leftSph: e.target.value})}>
                             <option value="">Select Power</option>
                             {Array.from({length: 41}, (_, i) => -10 + i * 0.25).map(val => (
                                <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                             ))}
                          </select>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">SPH (Right Eye)</label>
                          <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" onChange={(e) => setManualDetails({...manualDetails, rightSph: e.target.value})}>
                             <option value="">Select Power</option>
                             {Array.from({length: 41}, (_, i) => -10 + i * 0.25).map(val => (
                                <option key={val} value={val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}>{val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Patient Details</h5>
                      <div className="space-y-4">
                        <input type="text" placeholder="Full Name *" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" onChange={(e) => setManualDetails({...manualDetails, name: e.target.value})} />
                        <input type="tel" placeholder="Phone Number *" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" onChange={(e) => setManualDetails({...manualDetails, phone: e.target.value})} />
                      </div>
                    </div>
                    
                    <button 
                      className="w-full py-4 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors mt-6 disabled:opacity-50" 
                      onClick={() => {
                        setIsPowerModalOpen(false);
                        setStep(4);
                      }} 
                      disabled={!manualDetails.name || !manualDetails.phone || !manualDetails.leftSph || (!manualDetails.samePower && !manualDetails.rightSph)}
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
