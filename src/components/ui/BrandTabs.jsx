import React from 'react';
import './BrandTabs.css';

const BRANDS_LOGOS = [
  { name: '13th Century', logo: 'https://i.ibb.co/Z7BW6p8/13th-centry.webp' },
  { name: 'Brozar', logo: 'https://i.ibb.co/Psqq1kzw/brozar.webp' },
  { name: 'David Parker', logo: 'https://i.ibb.co/qVvqz13/david-parkar.webp' },
  { name: 'Essilor', logo: 'https://i.ibb.co/Zb4XgRN/essailor.webp' },
  { name: 'IDEE', logo: 'https://i.ibb.co/0yPfzRTz/IDDE.webp' },
  { name: 'Irus', logo: 'https://i.ibb.co/sJKNXfZn/irus.webp' },
  { name: 'Nikon', logo: 'https://i.ibb.co/7tMfSwgr/nikkon.webp' },
  { name: 'Nova', logo: 'https://i.ibb.co/ymSdgSSN/nova.webp' },
  { name: 'Ray-Ban', logo: 'https://i.ibb.co/7J0266kg/Reyban.webp' },
  { name: 'Scott', logo: 'https://i.ibb.co/n8fdLBVh/scott.webp' },
  { name: 'Yash', logo: 'https://i.ibb.co/FLd2bzXW/yash.webp' },
  { name: 'Zeiss', logo: 'https://i.ibb.co/kVNYZXpv/zess.webp' },
];

const BrandTabs = () => {
  return (
    <section className="py-12 md:py-16 bg-white border-t border-gray-100 overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 mb-8 md:mb-12 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.2em] text-gray-900">
          Shop by Designer
        </h2>
      </div>

      <div className="relative w-full overflow-hidden py-4 select-none">
        {/* Fade gradients on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div 
          className="marquee-container flex gap-6 md:gap-8 items-center" 
          style={{ 
            width: 'max-content', 
            animation: '40s linear 0s infinite normal none running marquee-left' 
          }}
        >
          {BRANDS_LOGOS.map((brand, i) => (
            <div key={i} className="flex-shrink-0 h-[280px] md:h-[420px] flex items-center justify-center cursor-pointer hover:-translate-y-1 transition-all duration-300">
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-full w-auto object-contain"
                style={{ mixBlendMode: 'multiply' }}
                loading="lazy"
              />
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {BRANDS_LOGOS.map((brand, i) => (
            <div key={`dup-${i}`} className="flex-shrink-0 h-[280px] md:h-[420px] flex items-center justify-center cursor-pointer hover:-translate-y-1 transition-all duration-300">
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-full w-auto object-contain"
                style={{ mixBlendMode: 'multiply' }}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <style>
          {`
            @keyframes marquee-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}
        </style>
      </div>
    </section>
  );
};

export default BrandTabs;
