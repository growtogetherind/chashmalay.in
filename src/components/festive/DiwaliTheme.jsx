import { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import './DiwaliTheme.css';

// ── Reusable Glowing Diya SVG ──────────────────────────────────────────────────
export const DiwaliDiyaIcon = ({ className = 'w-5 h-5', isAlt = false }) => (
  <svg
    viewBox="0 0 64 64"
    className={`shrink-0 ${className} diwali-glow-pulse`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id={`outerFlame-${isAlt ? 'alt' : 'main'}`} x1="32" y1="6" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="0.45" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#DC2626" />
      </linearGradient>
      <radialGradient id={`flameGlow-${isAlt ? 'alt' : 'main'}`} cx="50%" cy="50%" r="50%">
        <stop stopColor="#FDE047" stopOpacity="0.9" />
        <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`diyaBody-${isAlt ? 'alt' : 'main'}`} x1="12" y1="28" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="0.35" stopColor="#B45309" />
        <stop offset="1" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id={`diyaRim-${isAlt ? 'alt' : 'main'}`} x1="12" y1="30" x2="52" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.5" stopColor="#FEF08A" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Flame Ambient Glow */}
    <circle cx="32" cy="18" r="16" fill={`url(#flameGlow-${isAlt ? 'alt' : 'main'})`} />

    {/* Flickering Flame Group */}
    <g className={isAlt ? 'diwali-flame-flicker-alt' : 'diwali-flame-flicker'}>
      {/* Outer Flame */}
      <path
        d="M32 7C32 7 38 16 38 23C38 27.5 35.3 31 32 31C28.7 31 26 27.5 26 23C26 16 32 7 32 7Z"
        fill={`url(#outerFlame-${isAlt ? 'alt' : 'main'})`}
      />
      {/* Inner White Flame Core */}
      <path
        d="M32 14C32 14 35.5 19 35.5 23.5C35.5 26 34 28 32 28C30 28 28.5 26 28.5 23.5C28.5 19 32 14 32 14Z"
        fill="#FFFFFF"
      />
    </g>

    {/* Diya Clay Base */}
    <path
      d="M12 31C16 29 23.5 28 32 28C40.5 28 48 29 52 31C56 33.5 56 37 52 43C47 50.5 39.5 53 32 53C24.5 53 17 50.5 12 43C8 37 8 33.5 12 31Z"
      fill={`url(#diyaBody-${isAlt ? 'alt' : 'main'})`}
    />

    {/* Diya Rim */}
    <ellipse cx="32" cy="30.5" rx="19.5" ry="4" fill={`url(#diyaRim-${isAlt ? 'alt' : 'main'})`} />

    {/* Gold Filigree Dots */}
    <circle cx="18" cy="30.5" r="1.1" fill="#FEF08A" />
    <circle cx="25" cy="31.2" r="1.1" fill="#FEF08A" />
    <circle cx="32" cy="31.6" r="1.3" fill="#FEF08A" />
    <circle cx="39" cy="31.2" r="1.1" fill="#FEF08A" />
    <circle cx="46" cy="30.5" r="1.1" fill="#FEF08A" />
  </svg>
);

// ── Hanging Traditional Indian Lantern (Akash Kandil) ─────────────────────────
export const DiwaliHangingLantern = ({ side = 'left', className = '' }) => {
  const isLeft = side === 'left';
  return (
    <div
      className={`fixed top-0 z-40 pointer-events-none select-none transition-all duration-300 ${
        isLeft ? 'left-1 sm:left-4 md:left-8 diwali-lantern-left' : 'right-1 sm:right-4 md:right-8 diwali-lantern-right'
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 80 170"
        className="w-10 sm:w-14 md:w-16 h-auto filter drop-shadow-[0_8px_20px_rgba(245,158,11,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`goldChain-${side}`} x1="40" y1="0" x2="40" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="0.5" stopColor="#CA8A04" />
            <stop offset="1" stopColor="#EAB308" />
          </linearGradient>
          <radialGradient id={`lanternGlow-${side}`} cx="50%" cy="50%" r="50%">
            <stop stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#9A3412" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`kandilBody-${side}`} x1="16" y1="45" x2="64" y2="105" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E11D48" />
            <stop offset="0.5" stopColor="#B91C1C" />
            <stop offset="1" stopColor="#881337" />
          </linearGradient>
          <linearGradient id={`tasselGold-${side}`} x1="40" y1="105" x2="40" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Top Brass Hanging Ring & Chain */}
        <line x1="40" y1="0" x2="40" y2="40" stroke={`url(#goldChain-${side})`} strokeWidth="2.5" strokeDasharray="3 3" />
        <circle cx="40" cy="40" r="3.5" fill="#FDE047" stroke="#854D0E" strokeWidth="1" />

        {/* Lantern Top Cap / Canopy */}
        <polygon points="40,36 58,45 22,45" fill="#EAB308" stroke="#713F12" strokeWidth="1" />

        {/* Ambient Warm Candle Glow inside Lantern */}
        <circle cx="40" cy="75" r="28" fill={`url(#lanternGlow-${side})`} />

        {/* Central Geometric Kandil / Diamond Lantern Body */}
        <polygon
          points="40,45 66,75 40,105 14,75"
          fill={`url(#kandilBody-${side})`}
          stroke="#FDE047"
          strokeWidth="2"
        />

        {/* Inner Star Cutout with Golden Glow */}
        <polygon
          points="40,56 46,71 61,75 46,79 40,94 34,79 19,75 34,71"
          fill="#FEF08A"
          stroke="#CA8A04"
          strokeWidth="1.2"
        />
        <circle cx="40" cy="75" r="6" fill="#FFFBEB" className="diwali-glow-pulse" />

        {/* Bottom Cap */}
        <polygon points="22,105 58,105 40,114" fill="#EAB308" stroke="#713F12" strokeWidth="1" />

        {/* Hanging Golden Tassels (Akash Kandil Streamers) */}
        <path d="M40 114 Q40 140 40 165" stroke={`url(#tasselGold-${side})`} strokeWidth="3" strokeLinecap="round" />
        <path d="M33 111 Q30 135 28 158" stroke={`url(#tasselGold-${side})`} strokeWidth="2" strokeLinecap="round" />
        <path d="M47 111 Q50 135 52 158" stroke={`url(#tasselGold-${side})`} strokeWidth="2" strokeLinecap="round" />
        <path d="M26 108 Q21 130 18 150" stroke={`url(#tasselGold-${side})`} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M54 108 Q59 130 62 150" stroke={`url(#tasselGold-${side})`} strokeWidth="1.6" strokeLinecap="round" />

        {/* Sparkling End Beads */}
        <circle cx="40" cy="165" r="2.5" fill="#FEF08A" />
        <circle cx="28" cy="158" r="2" fill="#FEF08A" />
        <circle cx="52" cy="158" r="2" fill="#FEF08A" />
      </svg>
    </div>
  );
};

// ── Festive Top Announcement Bar ───────────────────────────────────────────────
export const DiwaliAnnouncementBar = ({ settings = {} }) => {
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('chashmalay_diwali_banner_dismissed') === 'true';
      if (dismissed) setIsDismissed(true);
    } catch (_) {}
  }, []);

  const isEnabled = settings.diwali_theme_enabled !== false;
  if (!isEnabled || isDismissed) return null;

  const message = settings.diwali_banner_text || '🪔 Shubh Deepavali! Extra 20% OFF on all Frames & Lenses • Use Code: DIWALI20 ✨';
  const couponCode = settings.diwali_coupon_code || 'DIWALI20';

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!couponCode) return;
    try {
      navigator.clipboard.writeText(couponCode);
      setCopied(true);
      toast.success(`Diwali coupon "${couponCode}" copied! Apply at checkout ✨`, {
        icon: '🪔',
        style: {
          background: '#450a0a',
          color: '#fef08a',
          fontWeight: 700,
          border: '1px solid #ca8a04'
        }
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Could not copy coupon code');
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem('chashmalay_diwali_banner_dismissed', 'true');
    } catch (_) {}
  };

  return (
    <div className="diwali-banner-bg text-amber-50 relative z-50 overflow-hidden py-2 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
        
        {/* Left Glowing Diya (visible on all screens) */}
        <div className="hidden sm:flex items-center shrink-0">
          <DiwaliDiyaIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        {/* Center Text & Coupon Pill */}
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center min-w-0">
          <div className="flex items-center gap-1.5 shrink-0 sm:hidden">
            <DiwaliDiyaIcon className="w-4 h-4" />
          </div>
          
          <span className="text-[11px] sm:text-xs md:text-sm font-black tracking-wide text-amber-100 drop-shadow-sm truncate">
            {message}
          </span>

          {couponCode && (
            <button
              type="button"
              onClick={handleCopy}
              className="diwali-coupon-btn inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0 cursor-pointer"
              title="Click to copy coupon code"
            >
              {copied ? (
                <>
                  <Check size={12} className="stroke-[3] text-emerald-800" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy size={11} className="stroke-[2.5]" />
                  <span>{couponCode}</span>
                </>
              )}
            </button>
          )}

          <div className="hidden md:flex items-center shrink-0">
            <DiwaliDiyaIcon className="w-5 h-5 sm:w-6 sm:h-6" isAlt />
          </div>
        </div>

        {/* Right Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1 text-amber-200/80 hover:text-white hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss festive banner"
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

// ── Master Diwali Theme Provider Component ─────────────────────────────────────
const DiwaliTheme = ({ settings = {} }) => {
  const isEnabled = settings.diwali_theme_enabled !== false;
  const showDiyas = isEnabled && settings.diwali_show_diyas !== false;

  if (!isEnabled) return null;

  return (
    <>
      {/* Hanging Corner Lanterns (Akash Kandils) */}
      {showDiyas && (
        <>
          <DiwaliHangingLantern side="left" />
          <DiwaliHangingLantern side="right" />
        </>
      )}
    </>
  );
};

export default DiwaliTheme;
