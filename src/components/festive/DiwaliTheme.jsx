import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './DiwaliTheme.css';

// ── Reusable Glowing Diya SVG ──────────────────────────────────────────────────
export const DiwaliDiyaIcon = ({ className = 'w-4 h-4', isAlt = false }) => (
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
      className={`fixed top-0 z-[60] pointer-events-none select-none transition-all duration-300 ${
        isLeft
          ? 'left-0.5 sm:left-3 md:left-6 lg:left-10 diwali-lantern-left'
          : 'right-0.5 sm:right-3 md:right-6 lg:right-10 diwali-lantern-right'
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 230"
        className="w-7 sm:w-11 md:w-13 lg:w-16 h-auto filter drop-shadow-[0_8px_20px_rgba(245,158,11,0.45)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Brass Hanging Chain from Top Ceiling */}
        <line x1="50" y1="0" x2="50" y2="52" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="3 3" />
        <circle cx="50" cy="52" r="4.5" fill="#FDE047" stroke="#92400E" strokeWidth="1.5" />

        {/* Traditional Brass Bell */}
        <path d="M40 56 C40 52 60 52 60 56 L64 70 L36 70 Z" fill="#EAB308" stroke="#78350F" strokeWidth="1.2" />
        <circle cx="50" cy="72" r="3" fill="#FDE047" stroke="#92400E" strokeWidth="1" />
        <line x1="50" y1="73" x2="50" y2="84" stroke="#F59E0B" strokeWidth="2.5" />

        {/* Ambient Warm Golden Glow Halo */}
        <circle cx="50" cy="120" r="38" fill="#F59E0B" opacity="0.4" className="diwali-glow-pulse" />

        {/* Lantern Top Canopy */}
        <polygon points="50,78 76,92 24,92" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />

        {/* Outer Diamond Kandil Body (Ruby Red with Gold Border) */}
        <polygon points="50,92 84,130 50,168 16,130" fill="#DC2626" stroke="#FDE047" strokeWidth="2" />

        {/* Inner Diamond Layers */}
        <polygon points="50,104 72,130 50,156 28,130" fill="#B91C1C" stroke="#F59E0B" strokeWidth="1.2" />
        <polygon points="50,116 62,130 50,144 38,130" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />

        {/* Glowing Candle Flame Heart */}
        <circle cx="50" cy="130" r="5" fill="#FFFFFF" className="animate-pulse" />

        {/* Bottom Base Cap */}
        <polygon points="24,168 76,168 50,178" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />

        {/* Flowing Golden Tassels (Streamers) */}
        <path d="M50 178 Q50 200 50 224" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
        <path d="M40 174 Q36 198 32 216" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M60 174 Q64 198 68 216" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M28 171 Q23 192 18 206" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M72 171 Q77 192 82 206" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round" />

        {/* Sparkling Golden Tassel End Beads */}
        <circle cx="50" cy="225" r="3" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
        <circle cx="32" cy="217" r="2.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
        <circle cx="68" cy="217" r="2.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
        <circle cx="18" cy="207" r="2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
        <circle cx="82" cy="207" r="2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
      </svg>
    </div>
  );
};

// ── Festive Top Announcement Bar (Sleek, Small Font, Text-Only) ────────────────
export const DiwaliAnnouncementBar = ({ settings = {} }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('chashmalay_diwali_banner_dismissed') === 'true';
      if (dismissed) setIsDismissed(true);
    } catch (_) {}
  }, []);

  const isEnabled = settings.diwali_theme_enabled !== false;
  if (!isEnabled || isDismissed) return null;

  const message = settings.diwali_banner_text || '🪔 Shubh Deepavali! Flat 20% OFF on all Eyewear • Use Code: DIWALI20 ✨';

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem('chashmalay_diwali_banner_dismissed', 'true');
    } catch (_) {}
  };

  return (
    <div className="diwali-banner-bg text-amber-50 relative z-50 overflow-hidden py-1 sm:py-1.5 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left Glowing Diya */}
        <div className="flex items-center shrink-0">
          <DiwaliDiyaIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>

        {/* Center Text (Small, Sleek, Clean Typography) */}
        <div className="flex-1 flex items-center justify-center gap-2 text-center min-w-0 px-1">
          <span className="text-[10px] sm:text-[11px] md:text-xs font-medium tracking-wider text-amber-50 drop-shadow-sm truncate">
            {message}
          </span>
        </div>

        {/* Right Glowing Diya & Dismiss Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center">
            <DiwaliDiyaIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" isAlt />
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-0.5 text-amber-200/70 hover:text-white hover:bg-amber-900/40 rounded transition-colors cursor-pointer"
            aria-label="Dismiss festive banner"
            title="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
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
