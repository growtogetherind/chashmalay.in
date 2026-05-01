import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import SearchModal from './SearchModal';
import Logo from '../ui/Logo';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'EYEGLASSES', path: '/category/eyeglasses' },
    { name: 'SUNGLASSES', path: '/category/sunglasses' },
    { name: 'CONTACT LENSES', path: '/category/contacts' },
    { name: 'TRACK ORDER', path: '/account' },
    { name: 'FIND A STORE', path: '/find-store' },
    { name: user ? (profile?.full_name?.split(' ')[0] || 'ACCOUNT').toUpperCase() : 'SIGN IN', path: '/account' },
  ];

  return (
    <header className={`navbar-main-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>

      {/* Main Navigation Bar */}
      <nav className="main-navbar bg-white border-b border-black/5">
        <div className="container flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="titan-styled-logo flex items-center gap-2 group">
             <Logo className="h-12 md:h-16 w-auto scale-125 origin-left transition-transform duration-500 group-hover:scale-130" />
             <h1 className="sr-only">CHASHMALY.IN</h1>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex gap-8 items-center h-full">
            {navLinks.map((link) => (
              <NavLink 
                key={link.name} 
                to={link.path} 
                className={({isActive}) => `text-[11px] font-black tracking-widest hover:text-primary h-full flex items-center border-b-2 transition-all ${isActive ? 'border-primary text-primary' : 'border-transparent'}`}
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-6">
             <button className="hover:text-primary transition-colors flex items-center gap-2 group" onClick={() => setIsSearchOpen(true)}>
               <Search size={20} className="group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-black tracking-widest hidden sm:block">SEARCH</span>
             </button>
             <Link to="/cart" className="relative hover:text-primary transition-colors hidden lg:flex items-center gap-2 group">
               <div className="relative">
                 <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                 {cartCount > 0 && (
                   <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                     {cartCount}
                   </span>
                 )}
               </div>
               <span className="text-[10px] font-black tracking-widest hidden sm:block">CART</span>
             </Link>
             <button 
               className="lg:hidden text-[#161616]"
               onClick={() => setIsMobileMenuOpen(true)}
             >
               <Menu size={24} />
             </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsMobileMenuOpen(false)}
               className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]"
            />
            <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 right-0 h-screen w-[85%] max-w-[350px] bg-white z-[2001] shadow-2xl p-8 flex flex-col"
            >
               <div className="flex justify-between items-center mb-12">
                  <span className="text-[10px] font-black tracking-[0.3em] text-primary">MENU</span>
                  <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X size={24} />
                  </button>
               </div>

               <div className="flex flex-col gap-8">
                  {navLinks.map((link, idx) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link 
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-2xl font-black tracking-tighter text-[#161616] hover:text-primary flex items-center justify-between group"
                      >
                         {link.name}
                         <ClipboardList size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </motion.div>
                  ))}
               </div>

               <div className="mt-auto border-t border-black/5 pt-8">
                  <div className="flex flex-col gap-4">
                     <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold text-[#8C867E]">
                        <User size={18} /> My Profile
                     </Link>
                     <p className="text-[9px] uppercase tracking-[0.2em] text-[#8C867E] mt-4">
                        © 2024 CHASHMALY.IN
                     </p>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

export default Navbar;
