import React, { useState, useEffect } from 'react';
import { X, Check, ChevronRight, Eye, Zap, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './LensSelector.css';

const LensSelector = ({ isOpen, onClose, product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    visionType: null,
    lensPackage: null
  });

  // Reset to step 1 every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelections({ visionType: null, lensPackage: null });
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
  ];

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
       setStep(3);
    } else {
       setStep(2);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelections({ ...selections, lensPackage: pkg });
    setStep(3);
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
          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
             <span className="step-circle">3</span>
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
            <div className="step-content final-step animate-fade-in">
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
                <div className="summary-total">
                  <span>Final Price</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
              <button 
                className="btn-cta w-full" 
                onClick={() => {
                  addToCart(product, selections);
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
    </div>
  );
};

export default LensSelector;
