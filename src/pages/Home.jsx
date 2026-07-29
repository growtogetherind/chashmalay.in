import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, HeadphonesIcon, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { subscribeProducts } from '../lib/firebase';

// Components
import HeroSlider from '../components/ui/HeroSlider';
import CategoryBentoGrid from '../components/ui/CategoryBentoGrid';
import ProductCard from '../components/ui/ProductCard';
import TestimonialStack from '../components/ui/TestimonialStack';
import BrandTabs from '../components/ui/BrandTabs';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/Motion';

const SectionHeader = ({ label, title }) => (
  <div className="mb-6">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
  </div>
);

const ARRIVALS_ITEMS = [
  {
    id: 'arr-1',
    name: 'Aria Cat-Eye',
    price: '₹4,499',
    image: '/assets/im/all_img/0rb4165_622_t3_030a_1.webp',
    showTag: true,
  },
  {
    id: 'arr-2',
    name: 'Aria Cat-Eye',
    price: '₹4,499',
    image: '/assets/im/all_img/0rb4165_622_t3_030a_1.webp',
    showTag: true,
  },
  {
    id: 'arr-3',
    name: '',
    price: '',
    image: '/assets/im/arrivals_male_model.webp',
    isModel: true,
    showTag: false,
  },
  {
    id: 'arr-4',
    name: 'Leo Square Frame',
    price: '₹5,999',
    image: '/assets/im/all_img/0rb2140_901_030a.webp',
    showTag: true,
  },
  {
    id: 'arr-5',
    name: 'Aria Cat-Eye',
    price: '₹4,499',
    image: '/assets/im/all_img/0rb3025i_004_78_030a_new.webp',
    showTag: true,
  },
  {
    id: 'arr-6',
    name: 'Line Frames',
    price: '₹8,999',
    image: '/assets/im/arrivals_female_model.webp',
    isModel: true,
    showTag: true,
  },
  {
    id: 'arr-7',
    name: 'Luna Round Optical',
    price: '₹3,499',
    image: '/assets/im/all_img/0rx65452943p21_1.webp',
    showTag: true,
  },
  {
    id: 'arr-8',
    name: 'Luna Round Optical',
    price: '₹3,499',
    image: '/assets/im/all_img/0rx65452943p21_1.webp',
    showTag: true,
  },
];

const ArrivalCard = ({ item, product }) => {
  if (product) {
    const priceVal = parseInt((product.consumersPrice || product.price || "0").toString().replace(/,/g, ''));
    const imageVal = product.images?.front || product.frameImage || product.frame_image || product.image || product.images?.gallery?.[0] || 'https://via.placeholder.com/400x300/f5f5f5/999?text=No+Image';
    const isContactLens = product.category?.toLowerCase().includes('contact');
    const linkTo = isContactLens ? `/contact-lens/${product.id}` : `/product/${product.id}`;

    return (
      <Link to={linkTo} className="flex flex-col h-full group">
        <div className="relative bg-[#f5f5f5] rounded-sm overflow-hidden flex-shrink-0 aspect-square lg:aspect-auto lg:h-full lg:flex-grow flex items-center justify-center">
          <div className="absolute top-3 right-3 bg-[#e75a24] text-white text-[8px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm z-10">
            NEW
          </div>
          <img
            src={imageVal}
            alt={product.name}
            className="w-full h-full object-contain p-6 md:p-8 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300/f5f5f5/999?text=No+Image'; }}
          />
        </div>
        <div className="mt-3 text-left">
          <h3 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-widest leading-none line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 mt-2">
            ₹{priceVal.toLocaleString()}
          </p>
        </div>
      </Link>
    );
  }

  const { name, price, image, isModel, showTag } = item;
  const linkTo = isModel
    ? '/category/sunglasses'
    : name.toLowerCase().includes('optical')
    ? '/category/eyeglasses'
    : '/category/sunglasses';

  return (
    <Link to={linkTo} className="flex flex-col h-full group">
      <div className={`relative bg-[#f5f5f5] rounded-sm overflow-hidden flex-shrink-0 ${isModel ? 'aspect-[3/4] lg:aspect-auto lg:h-full lg:flex-grow' : 'aspect-square lg:aspect-auto lg:h-full lg:flex-grow'} flex items-center justify-center`}>
        {showTag && (
          <div className="absolute top-3 right-3 bg-[#e75a24] text-white text-[8px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm z-10">
            NEW
          </div>
        )}
        <img
          src={image}
          alt={name || "Lifestyle Model"}
          className={`w-full h-full ${isModel ? 'object-cover' : 'object-contain p-6 md:p-8'} group-hover:scale-105 transition-transform duration-500`}
          loading="lazy"
        />
      </div>
      {name && (
        <div className="mt-3 text-left">
          <h3 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-widest leading-none">
            {name}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 mt-2">
            {price}
          </p>
        </div>
      )}
    </Link>
  );
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Featured Products
    const unsubFeatured = subscribeProducts({ isFeatured: true }, (data) => {
      setFeaturedProducts(data.slice(0, 3));
      setLoading(false);
    }, () => setLoading(false));

    // Fetch New Arrivals
    const unsubNew = subscribeProducts({ isNew: true }, (data) => {
      setNewArrivals(data);
    });

    // Fetch All Products (for backup)
    const unsubAll = subscribeProducts({}, (data) => {
      setAllProducts(data);
    });

    return () => {
      unsubFeatured();
      unsubNew();
      unsubAll();
    };
  }, []);

  // Combine new arrivals with all products to make sure we always have 6 products
  const productsToDisplay = [...newArrivals];
  
  // Fill with other products if we have fewer than 6
  if (productsToDisplay.length < 6) {
    const backups = allProducts.filter(
      (ap) => !productsToDisplay.some((p) => p.id === ap.id)
    );
    productsToDisplay.push(...backups.slice(0, 6 - productsToDisplay.length));
  }

  const hasDbProducts = productsToDisplay.length >= 6;

  return (
    <div className="bg-white text-gray-900 font-sans">

      {/* Hero Slider with Bento Grid */}
      <HeroSlider />

      {/* Gender/Shop All Promo Section */}
      <section className="pt-10 pb-2 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Shop All Card */}
            <Link 
              to="/category/all" 
              className="relative group bg-[#f5f5f5] rounded-2xl overflow-hidden aspect-square flex items-center justify-center hover:shadow-md transition-all duration-300"
            >
              <img 
                src="https://i.ibb.co/1YPcbTPW/eyewear-landing-page-variant-1-1.webp" 
                alt="Shop All" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>

            {/* Men Card */}
            <Link 
              to="/category/men" 
              className="relative group bg-[#f5f5f5] rounded-2xl overflow-hidden aspect-square flex items-center justify-center hover:shadow-md transition-all duration-300"
            >
              <img 
                src="https://i.ibb.co/Jws0NQVr/eyewear-landing-page-variant-1.webp" 
                alt="Men" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>

            {/* Women Card */}
            <Link 
              to="/category/women" 
              className="relative group bg-[#f5f5f5] rounded-2xl overflow-hidden aspect-square flex items-center justify-center hover:shadow-md transition-all duration-300"
            >
              <img 
                src="https://i.ibb.co/tpbPKKCL/woman.webp" 
                alt="Women" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>

            {/* Kids Card */}
            <Link 
              to="/category/kids" 
              className="relative group bg-[#f5f5f5] rounded-2xl overflow-hidden aspect-square flex items-center justify-center hover:shadow-md transition-all duration-300"
            >
              <img 
                src="https://i.ibb.co/TxgHzFQW/kids.webp" 
                alt="Kids" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>

          </div>
        </div>
      </section>

      {/* Category Circles */}
      <section className="py-2 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <CategoryBentoGrid />
        </div>
      </section>





      {/* New Arrivals */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.2em] text-gray-900">
              New Arrivals
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:h-[680px]">
            {/* Column 1 */}
            <div className="flex flex-col justify-between h-full gap-6">
              <div className="lg:h-[calc(50%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[0]} product={hasDbProducts ? productsToDisplay[0] : null} />
              </div>
              <div className="lg:h-[calc(50%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[1]} product={hasDbProducts ? productsToDisplay[1] : null} />
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col justify-between h-full gap-6">
              <div className="lg:h-[calc(66%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[2]} />
              </div>
              <div className="lg:h-[calc(34%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[3]} product={hasDbProducts ? productsToDisplay[2] : null} />
              </div>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col justify-between h-full gap-6">
              <div className="lg:h-[calc(34%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[4]} product={hasDbProducts ? productsToDisplay[3] : null} />
              </div>
              <div className="lg:h-[calc(66%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[5]} />
              </div>
            </div>

            {/* Column 4 */}
            <div className="flex flex-col justify-between h-full gap-6">
              <div className="lg:h-[calc(50%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[6]} product={hasDbProducts ? productsToDisplay[4] : null} />
              </div>
              <div className="lg:h-[calc(50%-12px)] flex flex-col">
                <ArrivalCard item={ARRIVALS_ITEMS[7]} product={hasDbProducts ? productsToDisplay[5] : null} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Partners Marquee */}
      <BrandTabs />

      {/* Testimonials */}
      <FadeIn>
        <TestimonialStack />
      </FadeIn>

      {/* Features Bar */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Truck size={40} className="text-primary transition-transform group-hover:scale-110 duration-300" />, title: 'Speedy delivery', desc: 'Fast shipping nationwide' },
              { icon: <RotateCcw size={40} className="text-primary transition-transform group-hover:scale-110 duration-300" />, title: 'Return policy', desc: 'Easy 7-day returns' },
              { icon: <HeadphonesIcon size={40} className="text-primary transition-transform group-hover:scale-110 duration-300" />, title: 'Custom support', desc: '24/7 customer service' },
              { icon: <CreditCard size={40} className="text-primary transition-transform group-hover:scale-110 duration-300" />, title: 'Secure payment', desc: 'Encrypted transactions' },
            ].map((f, i) => (
              <div key={i} className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl hover:bg-gray-50/80 transition-all duration-300">
                <div className="p-3 bg-blue-50 rounded-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-white duration-300">
                  {React.cloneElement(f.icon, { className: 'transition-transform duration-300' })}
                </div>
                <h4 className="text-base font-extrabold text-gray-900 mt-2">{f.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
