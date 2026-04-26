import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Glasses, ShieldCheck, Zap, Feather, Compass } from 'lucide-react';
import { getProducts } from '../lib/firebase';

// Components
import HeroSlider from '../components/ui/HeroSlider';
import CategoryBentoGrid from '../components/ui/CategoryBentoGrid';
import TestimonialStack from '../components/ui/TestimonialStack';
import ProductCard from '../components/ui/ProductCard';
import InstagramShowcase from '../components/ui/InstagramShowcase';
import { FadeIn, RevealText, StaggerContainer, StaggerItem, TRANSITIONS } from '../components/ui/Motion';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      const { data, error } = await getProducts({ isFeatured: true });
      if (!error && data) {
        setFeaturedProducts(data.slice(0, 8)); // Support up to 8 featured items
      }
      setLoading(false);
    };
    fetchTrending();
  }, []);

  return (
    <div className="bg-background text-primary">
      {/* Dynamic Banner Carousel */}
      <HeroSlider />

      <FadeIn>
         <CategoryBentoGrid />
      </FadeIn>

      {/* Narrative Section */}
      <section className="py-32 md:py-48 relative overflow-hidden bg-surface-flat">
         <div className="container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
               <FadeIn delay={0.2}>
                  <div className="relative">
                     <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl transform scale-150" />
                     <img src="/assets/im/eyeglasses.png" alt="The Craft" className="w-full aspect-square object-contain relative z-10 drop-shadow-2xl" />
                  </div>
               </FadeIn>
               
                <div className="text-center lg:text-left">
                   <span className="text-xs font-sans font-semibold uppercase tracking-[0.3em] text-accent-dark mb-8 block">
                      Our Philosophy
                   </span>
                   <h2 className="text-5xl md:text-7xl mb-10 leading-tight tracking-tighter text-primary font-medium mx-auto lg:mx-0">
                      <RevealText text="Geometry" className="block" />
                      <RevealText text="Of Soul." delay={0.2} className="text-secondary italic block font-light" />
                   </h2>
                   <FadeIn delay={0.4}>
                      <p className="text-secondary tracking-wide text-lg md:text-xl font-sans leading-relaxed mb-12 max-w-lg mx-auto lg:mx-0">
                         We perceive eyewear as architectural structures for the face. Each frame is a dialogue between material, light, and silhouette. 
                      </p>
                      <Link to="/about" className="group inline-flex items-center gap-4 text-xs font-sans font-semibold uppercase tracking-widest text-primary">
                        Read Narrative 
                        <div className="w-12 h-px bg-primary group-hover:w-24 transition-all duration-700 ease-cinema" />
                     </Link>
                  </FadeIn>
               </div>
            </div>
         </div>
      </section>

      {/* Technical Architecture Section */}
      <section className="py-32 md:py-48 bg-background border-y border-divider">
         <div className="container">
            <div className="text-center mb-24">
               <span className="text-xs font-sans font-semibold uppercase tracking-[0.3em] text-accent-dark mb-4 block">
                  Engineering
               </span>
               <h2 className="text-5xl md:text-7xl tracking-tighter">
                  <RevealText text="Technical" className="block" />
                  <RevealText text="Architecture." delay={0.1} className="italic text-accent-dark block font-light" />
               </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
               <FadeIn delay={0.2}>
                  <div className="p-8 rounded-3xl bg-surface-flat border border-divider hover:border-accent-dark transition-all group h-full">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                        <Glasses className="text-accent-dark" size={24} />
                     </div>
                     <h3 className="text-xl font-medium mb-4 tracking-tight">Round Silhouette</h3>
                     <p className="text-sm font-sans text-secondary leading-relaxed">
                        Hand-calibrated geometric symmetry designed to follow the face's natural architecture.
                     </p>
                  </div>
               </FadeIn>

               <FadeIn delay={0.3}>
                  <div className="p-8 rounded-3xl bg-surface-flat border border-divider hover:border-accent-dark transition-all group h-full">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                        <Zap className="text-accent-dark" size={24} />
                     </div>
                     <h3 className="text-xl font-medium mb-4 tracking-tight">Material Integrity</h3>
                     <p className="text-sm font-sans text-secondary leading-relaxed">
                        Constructed from Japanese Titanium and Italian Acetate for unparalleled structural longevity.
                     </p>
                  </div>
               </FadeIn>

               <FadeIn delay={0.4}>
                  <div className="p-8 rounded-3xl bg-surface-flat border border-divider hover:border-accent-dark transition-all group h-full">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                        <ShieldCheck className="text-accent-dark" size={24} />
                     </div>
                     <h3 className="text-xl font-medium mb-4 tracking-tight">Lens Science</h3>
                     <p className="text-sm font-sans text-secondary leading-relaxed">
                        Sapphire-coated optics featuring 100% UV protection and high-contrast blue-cut technology.
                     </p>
                  </div>
               </FadeIn>

               <FadeIn delay={0.5}>
                  <div className="p-8 rounded-3xl bg-surface-flat border border-divider hover:border-accent-dark transition-all group h-full">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                        <Feather className="text-accent-dark" size={24} />
                     </div>
                     <h3 className="text-xl font-medium mb-4 tracking-tight">Gravity Balance</h3>
                     <p className="text-sm font-sans text-secondary leading-relaxed">
                        Ergonomically weighted at 14g to ensure weightless all-day wearability.
                     </p>
                  </div>
               </FadeIn>
            </div>
         </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 md:py-48 bg-surface">
         <div className="container">
            <header className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-24 gap-8 text-center lg:text-left">
               <div className="w-full lg:w-auto">
                  <span className="text-xs font-sans font-semibold uppercase tracking-[0.3em] text-secondary mb-4 block">
                     Curated Objects
                  </span>
                  <h2 className="text-5xl md:text-7xl tracking-tighter text-primary mx-auto lg:mx-0">
                     <RevealText text="Most" className="block" />
                     <RevealText text="Loved." delay={0.1} className="italic text-accent-dark block font-light" />
                  </h2>
               </div>
               <FadeIn delay={0.3}>
                  <Link to="/category/all" className="btn-secondary">
                     View Full Archive
                  </Link>
               </FadeIn>
            </header>

            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-secondary/10 animate-pulse rounded-2xl" />
                  ))}
               </div>
            ) : (
               <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  {featuredProducts.map((p) => (
                     <StaggerItem key={p.id}>
                        <ProductCard product={p} />
                     </StaggerItem>
                  ))}
               </StaggerContainer>
            )}
         </div>
      </section>

      {/* Community Testimonials */}
      <FadeIn>
         <TestimonialStack />
      </FadeIn>

      {/* Instagram Reels Showcase */}
      <InstagramShowcase />

      {/* Final Callout */}
      <section className="py-32 md:py-48 text-primary bg-background border-t border-divider">
         <div className="container text-center">
            <h2 className="text-5xl md:text-8xl font-medium leading-[1] mb-16 tracking-tighter uppercase">
              <RevealText text="The New" className="block" />
              <RevealText text="Perspective." delay={0.1} className="italic text-accent-dark block font-light" />
            </h2>
            <FadeIn delay={0.4}>
               <Link to="/category/all" className="btn-primary inline-flex items-center gap-3">
                  Enter Collection <ArrowRight size={18} strokeWidth={1.5} />
               </Link>
            </FadeIn>
         </div>
      </section>
    </div>
  );
};

export default Home;
