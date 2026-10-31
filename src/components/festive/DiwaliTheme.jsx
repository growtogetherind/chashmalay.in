import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import './DiwaliTheme.css';

// ── Reusable Glowing Diya SVG for Announcement Bar ────────────────────────────
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

    {/* Flickering Flame */}
    <g className={isAlt ? 'diwali-flame-flicker-alt' : 'diwali-flame-flicker'}>
      <path
        d="M32 7C32 7 38 16 38 23C38 27.5 35.3 31 32 31C28.7 31 26 27.5 26 23C26 16 32 7 32 7Z"
        fill={`url(#outerFlame-${isAlt ? 'alt' : 'main'})`}
      />
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

// ── Festive Top Announcement Bar (Home Page Only, Sleek & Text-Only) ───────────
export const DiwaliAnnouncementBar = ({ settings = {} }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isDismissed, setIsDismissed] = useState(false);

  const isEnabled = settings.diwali_theme_enabled !== false;
  if (!isHome || !isEnabled || isDismissed) return null;

  const message = settings.diwali_banner_text || '🪔 Shubh Deepavali! Flat 20% OFF on all Eyewear • Use Code: DIWALI20 ✨';

  return (
    <div className="diwali-banner-bg text-amber-50 relative z-50 overflow-hidden py-1 sm:py-1.5 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left Glowing Diya */}
        <div className="flex items-center shrink-0">
          <DiwaliDiyaIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>

        {/* Center Text */}
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
            onClick={() => setIsDismissed(true)}
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

// ── Native Overlay Component Based on diwali-overlay-v3 (Home Page Only) ───────
export const DiwaliDecorOverlay = ({ settings = {} }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const containerRef = useRef(null);

  useEffect(() => {
    const isEnabled = settings.diwali_theme_enabled !== false;
    const showDiyas = isEnabled && settings.diwali_show_diyas !== false;
    if (!isHome || !showDiyas || !containerRef.current) return;

    const root = containerRef.current;
    const S = root.querySelector('#z-s');
    const D = root.querySelector('#z-d');

    // Diya vector generator
    function diya(w) {
      return (
        '<svg width="' + w + '" height="' + (w * 0.8) + '" viewBox="0 0 80 64">' +
        '<ellipse class="z-glow" cx="40" cy="20" rx="36" ry="28" fill="url(#z-glowG)"/>' +
        '<path d="M28 56H52L48 62H32Z" fill="#8a5a16"/>' +
        '<path d="M6 34C8 50 22 56 40 56C58 56 72 50 74 34Z" fill="url(#z-gold)"/>' +
        '<path d="M6 34C4 32 2 31 0 29C6 29 10 31 13 34Z" fill="url(#z-gold)"/>' +
        '<path d="M16 43Q40 55 64 43" stroke="#fff1b8" stroke-width="1" fill="none" opacity=".65"/>' +
        '<g fill="#fff1b8" opacity=".7"><circle cx="24" cy="48" r="1.1"/><circle cx="32" cy="51" r="1.1"/><circle cx="40" cy="52" r="1.1"/><circle cx="48" cy="51" r="1.1"/><circle cx="56" cy="48" r="1.1"/></g>' +
        '<ellipse cx="40" cy="34" rx="34" ry="6" fill="url(#z-gold2)"/><ellipse cx="40" cy="34" rx="28" ry="4" fill="#5a3a08" opacity=".85"/>' +
        '<ellipse cx="34" cy="33.6" rx="12" ry="1.2" fill="#ffe9a3" opacity=".6"/>' +
        '<path d="M40 32V35" stroke="#3a2006" stroke-width="2" stroke-linecap="round"/>' +
        '<path class="z-flame" d="M40 3C47 13 49 23 40 32C31 23 33 13 40 3Z" fill="url(#z-flameG)"/>' +
        '<path class="z-flame" d="M40 15C43 20 43 26 40 31C37 26 37 20 40 15Z" fill="#fffdf0" opacity=".9"/></svg>'
      );
    }

    // Silk corner drapes
    function silk(w, h, topOffset, mirror) {
      return (
        '<svg class="a" style="top:' + topOffset + 'px;' +
        (mirror ? 'right:0;transform:scaleX(-1)' : 'left:0') +
        ';filter:drop-shadow(0 4px 6px rgba(40,0,10,.35))" width="' + w + '" height="' + h + '" viewBox="0 0 200 172">' +
        '<path d="M0 0H190C170 40 110 70 70 110C45 135 20 155 0 172Z" fill="url(#z-silk)"/>' +
        '<path d="M0 0H120C100 40 60 80 0 120Z" fill="#c2314f" opacity=".28"/><path d="M0 0H70C55 30 30 60 0 85Z" fill="#e0607a" opacity=".18"/>' +
        '<path d="M190 0C170 40 110 70 70 110C45 135 20 155 0 172" stroke="url(#z-gold)" stroke-width="2.4" fill="none"/></svg>'
      );
    }

    // Build static decorative elements
    function build() {
      const W = window.innerWidth;
      const small = W < 768;
      let html = '';
      let h2 = '';

      if (small) {
        // MOBILE VIEW:
        // Corner drapes and hanging diyas hang gracefully from top corners
        const sw = 75;
        const sh = (sw * 172) / 200;
        html += silk(sw, sh, 0, false) + silk(sw, sh, 0, true);

        // Compact hanging diyas on mobile corners
        const dw = 30;
        const spec = [[3, 50], [97, 50]];
        spec.forEach((p, n) => {
          h2 +=
            '<div class="z-strand" style="left:' + p[0] + '%;top:0px;margin-left:-' + (dw / 2) + 'px;animation-duration:' + (4.2 + n * 0.5) + 's;animation-delay:-' + (n * 1.1) + 's">' +
            '<div class="z-chain" style="height:' + p[1] + 'px"></div><div style="margin-top:-2px">' + diya(dw) + '</div></div>';
        });
      } else {
        // DESKTOP & TABLET VIEW:
        // Big, royal festive drapes and prominent glowing diyas framed ABOVE the navbar (z-70)
        const sw = 210;
        const sh = (sw * 172) / 200;
        html += silk(sw, sh, 0, false) + silk(sw, sh, 0, true);

        // Prominent glowing diyas hanging on golden chains in the outer corners
        const dw = 58;
        const spec = [
          [2, 95],     // Left outer corner diya
          [5.5, 160],  // Left inner corner diya
          [94.5, 160], // Right inner corner diya
          [98, 95]     // Right outer corner diya
        ];
        spec.forEach((p, n) => {
          h2 +=
            '<div class="z-strand" style="left:' + p[0] + '%;top:0px;margin-left:-' + (dw / 2) + 'px;animation-duration:' + (4.2 + n * 0.5) + 's;animation-delay:-' + (n * 1.1) + 's">' +
            '<div class="z-chain" style="height:' + p[1] + 'px"></div><div style="margin-top:-2px">' + diya(dw) + '</div></div>';
        });
      }

      if (S) S.innerHTML = html;
      if (D) D.innerHTML = h2;
    }

    build();

    // Resize handler
    let rt;
    const handleResize = () => {
      clearTimeout(rt);
      rt = setTimeout(build, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (S) S.innerHTML = '';
      if (D) D.innerHTML = '';
    };
  }, [isHome, settings.diwali_theme_enabled, settings.diwali_show_diyas]);

  const isEnabled = settings.diwali_theme_enabled !== false;
  const showDiyas = isEnabled && settings.diwali_show_diyas !== false;

  if (!isHome || !showDiyas) return null;

  return (
    <div id="dz3" ref={containerRef} aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="z-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff0b3" />
            <stop offset=".35" stopColor="#e8b84a" />
            <stop offset=".7" stopColor="#b9812a" />
            <stop offset="1" stopColor="#7d5314" />
          </linearGradient>
          <linearGradient id="z-gold2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b9812a" />
            <stop offset=".45" stopColor="#fff0b3" />
            <stop offset="1" stopColor="#c8913a" />
          </linearGradient>
          <radialGradient id="z-flameG" cx=".5" cy=".75" r=".6">
            <stop offset="0" stopColor="#fffbe0" />
            <stop offset=".45" stopColor="#ffd24a" />
            <stop offset="1" stopColor="#ff7a1a" />
          </radialGradient>
          <radialGradient id="z-glowG">
            <stop offset="0" stopColor="#ffc55a" stopOpacity=".8" />
            <stop offset="1" stopColor="#ffc55a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="z-silk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9b173a" />
            <stop offset=".6" stopColor="#5e0a24" />
            <stop offset="1" stopColor="#3d0516" />
          </linearGradient>
        </defs>
      </svg>
      {/* Layer 1: Silk Drapes */}
      <div className="l" id="z-s"></div>
      {/* Layer 2: Hanging Diyas on Chains */}
      <div className="l" id="z-d"></div>
    </div>
  );
};

// ── Master Diwali Theme Provider ───────────────────────────────────────────────
const DiwaliTheme = ({ settings = {} }) => {
  return <DiwaliDecorOverlay settings={settings} />;
};

export default DiwaliTheme;
