import { useState, useEffect } from 'react';
import { X, Check, Eye, UploadCloud, Sparkles, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { compressToWebP } from '../../lib/cloudinary';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './LensSelector.css'; // Reuse the same CSS for consistency

const ContactLensSelector = ({ isOpen, onClose, product, selectedColor = null, selectedSize = null }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    powerOption: null,
    prescriptionFile: null,
    prescriptionUrl: null,
    leftPower: '',
    rightPower: '',
    bc: '', // Base Curve
    dia: '', // Diameter
    quantity: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelections({
        powerOption: null,
        prescriptionFile: null,
        prescriptionUrl: null,
        leftPower: '',
        rightPower: '',
        bc: product?.base_curve || '8.6',
        dia: product?.diameter || '14.2',
        quantity: 1,
        selectedColor,
        selectedSize
      });
    }
  }, [isOpen, product, selectedColor, selectedSize]);

  if (!isOpen) return null;

  const powers = Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => v > 0 ? `+${v}` : v);

  const handleAddToCart = async () => {
    setIsSubmitting(true);
    let prescriptionUrl = selections.prescriptionUrl || null;

    const manualDetails = selections.powerOption === 'manual' ? {
      leftSph: selections.leftPower,
      rightSph: selections.rightPower,
      bc: selections.bc,
      dia: selections.dia,
      name: user?.displayName || 'Customer',
      phone: user?.phoneNumber || ''
    } : null;

    addToCart(product, { 
      ...selections, 
      prescriptionUrl, 
      manualDetails,
      selectedColor,
      selectedSize,
      isContactLens: true 
    });
    toast.success("Added to cart!");
    onClose();
    setIsSubmitting(false);
    navigate('/cart');
  };

  return (
    <div className="lens-modal-overlay">
      <div className="lens-modal-container animate-slide-right">
        <header className="lens-modal-header">
          <div className="header-info">
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">{product?.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure your contact lenses</p>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-900" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="lens-modal-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`step-item ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
              <div className="step-circle">{step > s ? <Check size={12} strokeWidth={3} /> : s}</div>
            </div>
          ))}
        </div>

        <div className="lens-modal-content" data-lenis-prevent>
          {step === 1 && (
            <div className="step-content animate-fade-in">
              <h3 className="step-title">How would you like to provide your power?</h3>
              <div className="space-y-4">
                <button className={`power-option-card ${selections.powerOption === 'upload' ? 'active' : ''}`} onClick={() => { setSelections({...selections, powerOption: 'upload'}); setStep(2); }}>
                  <div className="flex items-center gap-4">
                    <div className="power-icon-wrapper"><UploadCloud size={24} className="text-primary" /></div>
                    <div className="text-left">
                      <h5 className="text-sm font-bold text-slate-900">Upload Prescription</h5>
                      <p className="text-xs text-slate-500">Fastest way to verify</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>

                <button className={`power-option-card ${selections.powerOption === 'manual' ? 'active' : ''}`} onClick={() => { setSelections({...selections, powerOption: 'manual'}); setStep(2); }}>
                  <div className="flex items-center gap-4">
                    <div className="power-icon-wrapper"><Eye size={24} className="text-primary" /></div>
                    <div className="text-left">
                      <h5 className="text-sm font-bold text-slate-900">Enter Manually</h5>
                      <p className="text-xs text-slate-500">I know my power details</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>

                <button className={`power-option-card ${selections.powerOption === 'later' ? 'active' : ''}`} onClick={() => { setSelections({...selections, powerOption: 'later'}); setStep(3); }}>
                  <div className="flex items-center gap-4">
                    <div className="power-icon-wrapper"><Sparkles size={24} className="text-primary" /></div>
                    <div className="text-left">
                      <h5 className="text-sm font-bold text-slate-900">Provide Later</h5>
                      <p className="text-xs text-slate-500">Buy now, provide details in 15 days</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animate-fade-in">
              <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
              <h3 className="step-title">{selections.powerOption === 'upload' ? 'Upload Prescription' : 'Manual Entry'}</h3>
              
              {selections.powerOption === 'upload' ? (
                <div className="space-y-6">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all relative overflow-hidden group">
                    {selections.prescriptionFile ? (
                      <div className="absolute inset-0 p-4">
                        <img src={selections.prescriptionUrl || URL.createObjectURL(selections.prescriptionFile)} alt="Prescription" className="w-full h-full object-contain rounded-2xl" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="bg-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <UploadCloud size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-sm font-bold text-slate-900">Click to upload prescription</p>
                        <p className="text-xs text-slate-400 mt-1">Image files accepted</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const toastId = toast.loading('Optimizing image...');
                          const compressedBase64 = await compressToWebP(file);
                          setSelections({...selections, prescriptionFile: file, prescriptionUrl: compressedBase64});
                          toast.success('Image optimized!', { id: toastId });
                        } catch (err) {
                          toast.error('Failed to optimize image.');
                          setSelections({...selections, prescriptionFile: file});
                        }
                      }
                    }} />
                  </label>
                  <button className="btn-cta w-full" disabled={!selections.prescriptionFile} onClick={() => setStep(3)}>Continue to Summary</button>
                </div>
              ) : (
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Left Eye (OS)</label>
                         <select className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none" value={selections.leftPower} onChange={(e) => setSelections({...selections, leftPower: e.target.value})}>
                            <option value="">Select Power</option>
                            {powers.map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Right Eye (OD)</label>
                         <select className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none" value={selections.rightPower} onChange={(e) => setSelections({...selections, rightPower: e.target.value})}>
                            <option value="">Select Power</option>
                            {powers.map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">BC (Base Curve)</label>
                         <input type="text" className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none" value={selections.bc} onChange={(e) => setSelections({...selections, bc: e.target.value})} placeholder="e.g. 8.6" />
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">DIA (Diameter)</label>
                         <input type="text" className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none" value={selections.dia} onChange={(e) => setSelections({...selections, dia: e.target.value})} placeholder="e.g. 14.2" />
                      </div>
                   </div>
                   <button className="btn-cta w-full" disabled={!selections.leftPower || !selections.rightPower} onClick={() => setStep(3)}>Review Configuration</button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="step-content animate-fade-in">
              <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
              <div className="success-icon"><Check size={32} /></div>
              <h3 className="step-title">Configuration Summary</h3>
              
              <div className="summary-card">
                 <div className="summary-row"><span>Product</span><span className="font-bold">{product?.name}</span></div>
                 <div className="summary-row"><span>Disposable</span><span className="font-bold">{product?.disposable_type || 'Monthly'}</span></div>
                 <div className="summary-row"><span>Pack Size</span><span className="font-bold">{product?.pack_size || '6 Lenses'}</span></div>
                 {(selectedColor || selectedSize) && (
                   <div className="summary-row"><span>Variant</span><span className="font-bold">{selectedColor?.name || selectedColor || 'Standard'}{selectedSize ? ` / ${selectedSize}` : ''}</span></div>
                 )}
                 
                 <div className="border-t border-slate-100 my-4 pt-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Vision Protocol</h5>
                    {selections.powerOption === 'manual' ? (
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-3 rounded-xl text-[10px] font-bold">L: {selections.leftPower}</div>
                          <div className="bg-slate-50 p-3 rounded-xl text-[10px] font-bold">R: {selections.rightPower}</div>
                       </div>
                    ) : (
                       <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                          {selections.powerOption === 'upload' ? 'Prescription Uploaded' : 'Submit Power Later'}
                       </div>
                    )}
                 </div>

                 <div className="summary-total">
                    <span>Subtotal</span>
                    <span>₹{product?.price}</span>
                 </div>
              </div>

              <button className="btn-cta w-full mt-8" onClick={handleAddToCart} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'ADD TO CART'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactLensSelector;
