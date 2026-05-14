import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Star, Truck, RotateCcw, HeadphonesIcon, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { subscribeProducts } from '../lib/firebase';

// Components
import HeroSlider from '../components/ui/HeroSlider';
import CategoryBentoGrid from '../components/ui/CategoryBentoGrid';
import ProductCard from '../components/ui/ProductCard';
import TestimonialStack from '../components/ui/TestimonialStack';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/Motion';

const SectionHeader = ({ label, title }) => (
  <div className="mb-6">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
  </div>
);

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Featured Products
    const unsubFeatured = subscribeProducts({ isFeatured: true }, (data) => {
      setFeaturedProducts(data.slice(0, 4));
      setLoading(false);
    }, () => setLoading(false));

    // Fetch New Arrivals
    const unsubNew = subscribeProducts({ isNew: true }, (data) => {
      setNewArrivals(data.slice(0, 4));
    });

    return () => {
      unsubFeatured();
      unsubNew();
    };
  }, []);

  return (
    <div className="bg-white text-gray-900 font-sans">

      {/* Hero Slider with Bento Grid */}
      <HeroSlider />

      {/* Category Circles */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <CategoryBentoGrid />
        </div>
      </section>

      {/* Our Products (Featured) */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <SectionHeader label="Hottest collections" title="Our products" />
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded aspect-[4/3]" />
              ))}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Promo / Feature Banner */}
      <section className="py-8 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left - Cloudinary optimized banner */}
            <FadeIn delay={0.1}>
              <div className="rounded-lg overflow-hidden aspect-[4/3] w-full">
                <img
                  src="https://res.cloudinary.com/dpv40ou2c/image/upload/q_auto/f_auto/c_fill,w_900,h_675/banners/sunglasses_banner.png"
                  alt="Featured Sunglasses"
                  className="w-full h-full object-cover"
                />
              </div>
            </FadeIn>

            {/* Right - Text */}
            <FadeIn delay={0.2} className="flex flex-col justify-center md:pl-4">
              <p className="text-xs font-bold text-gray-900 mb-2 tracking-wide">Trending products to buy 1 get 1</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
                For the sunglasses <br /> you don't yet know
              </h2>
              <p className="text-gray-500 text-xs leading-relaxed mb-4 max-w-md font-medium">
                If you are the sunglasses person who wants to find the best deal, we carry the top performing sunglasses from top brands and manufacturers.
              </p>
              <p className="text-sm font-bold text-red-600 mb-6">
                Best selling price at ₹590
              </p>
              <Link
                to="/category/sunglasses"
                className="inline-flex items-center justify-center w-fit border border-red-600 text-red-600 bg-white text-xs font-bold px-8 py-2.5 rounded hover:bg-red-50 transition-colors tracking-wide"
              >
                SHOP NOW
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <SectionHeader label="Friendly frames" title="New arrivals" />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded aspect-[4/3]" />
              ))}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(newArrivals.length > 0 ? newArrivals : featuredProducts).map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <FadeIn>
        <TestimonialStack />
      </FadeIn>

      {/* Features Bar */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Truck size={28} className="text-red-600" />, title: 'Speedy delivery', desc: 'Fast shipping nationwide' },
              { icon: <RotateCcw size={28} className="text-red-600" />, title: 'Return policy', desc: 'Easy 30-day returns' },
              { icon: <HeadphonesIcon size={28} className="text-red-600" />, title: 'Custom support', desc: '24/7 customer service' },
              { icon: <CreditCard size={28} className="text-red-600" />, title: 'Secure payment', desc: 'Encrypted transactions' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 p-4">
                {f.icon}
                <h4 className="text-sm font-bold text-gray-900">{f.title}</h4>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
