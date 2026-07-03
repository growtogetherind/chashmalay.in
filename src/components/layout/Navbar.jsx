import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Heart, Menu, X, Phone, MapPin, LogOut, Package, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import SearchModal from './SearchModal';
import Logo from '../ui/Logo';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { cartCount, toggleCart } = useCart();
  const { user, profile, signOut } = useAuth();
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // ── Scroll detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close profile popup when clicking outside ────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'EYEGLASSES',        path: '/category/eyeglasses' },
    { name: 'SUNGLASSES',        path: '/category/sunglasses' },
    { name: 'CLIP-ON GLASSES',   path: '/category/clip-on-glasses' },
    { name: 'CONTACT LENSES',    path: '/contact-lenses' },
    { name: 'READING GLASSES',   path: '/category/reading-glasses' },
    { name: 'ACCESSORIES',       path: '/category/accessories' },
    { name: 'TRACK ORDER',       path: '/account' },
    { name: 'STORE LOCATOR',     path: '/find-store' },
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getInitials = () => {
    const name = profile?.full_name || user?.displayName || user?.email || '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'U';
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STICKY HEADER                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
          isScrolled
            ? 'shadow-[0_2px_20px_rgba(0,0,0,0.08)] backdrop-blur-md bg-white/95'
            : 'border-b border-gray-100'
        }`}
      >
        {/* ── Row 1: Search | Logo | Actions ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* Left – Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            {/* Center – Logo (absolute so it's truly centered) */}
            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center group"
            >
              <Logo className="h-[62px] md:h-[70px] w-auto transition-all duration-300 group-hover:scale-105" />
            </Link>

            {/* Right – Icons */}
            <div className="flex items-center gap-0.5">

              {/* Wishlist (desktop) */}
              <Link
                to="/account"
                className="hidden md:flex p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                aria-label="Wishlist"
              >
                <Heart size={18} strokeWidth={1.5} />
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 relative bg-transparent border-none cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* ── Profile Avatar / Popup (desktop) ── */}
              <div className="hidden md:block relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  aria-label="Account"
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ml-1 ${
                    user
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-100 hover:shadow-indigo-200'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {user ? (
                    <span className="text-[11px] font-black tracking-tight">{getInitials()}</span>
                  ) : (
                    <User size={16} strokeWidth={1.5} />
                  )}
                </button>

                {/* Profile Popup Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden z-[999]"
                    >
                      {user ? (
                        <>
                          {/* User Info Header */}
                          <div className="px-4 py-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-indigo-100 flex-shrink-0">
                                {getInitials()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {profile?.full_name || user?.displayName || 'My Account'}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate font-medium">
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            {[
                              { label: 'My Account', path: '/account', icon: <User size={15} /> },
                              { label: 'My Orders', path: '/account/orders', icon: <Package size={15} /> },
                            ].map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="flex items-center gap-2.5 text-gray-600 group-hover:text-gray-900">
                                  <span className="text-gray-400 group-hover:text-indigo-500 transition-colors">{item.icon}</span>
                                  <span className="text-sm font-semibold">{item.label}</span>
                                </div>
                                <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-400" />
                              </Link>
                            ))}
                          </div>

                          {/* Sign Out */}
                          <div className="border-t border-gray-100 py-2">
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <LogOut size={15} />
                              <span className="text-sm font-semibold">Sign Out</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Not logged in */
                        <div className="p-4 space-y-2">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">Account</p>
                          <Link
                            to="/auth"
                            onClick={() => setIsProfileOpen(false)}
                            className="block w-full text-center bg-gray-900 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
                          >
                            Sign In
                          </Link>
                          <Link
                            to="/auth?mode=register"
                            onClick={() => setIsProfileOpen(false)}
                            className="block w-full text-center border border-gray-200 text-gray-700 text-sm font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            Create Account
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Hamburger */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 ml-1"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Category Nav (desktop only) ── */}
        <div className="hidden md:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <nav className="flex items-center justify-center gap-4 lg:gap-6 xl:gap-8 h-10">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `text-xs lg:text-[13px] font-bold tracking-[0.08em] whitespace-nowrap transition-colors duration-200 ${
                      isActive
                        ? 'text-gray-900 border-b-2 border-gray-900 pb-px'
                        : 'text-gray-500 hover:text-gray-900'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}

            </nav>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE SIDE DRAWER                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[2000] mobile-menu-backdrop"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-screen w-[80vw] max-w-xs bg-white z-[2001] shadow-2xl flex flex-col"
              data-lenis-prevent
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                <span className="font-bold text-base text-gray-900 tracking-tight">
                  Chashmalay<span className="text-gray-400">.in</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User info (mobile) */}
              {user && (
                <div className="mx-4 mt-4 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center gap-3 border border-indigo-100/60">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow flex-shrink-0">
                    {getInitials()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {profile?.full_name || user?.displayName || 'My Account'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <div className="flex flex-col py-4 px-4 gap-0.5 flex-1 overflow-y-auto">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-3 rounded-xl transition-all tracking-wide"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1">
                  {user ? (
                    <>
                      <Link
                        to="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                      >
                        <User size={17} strokeWidth={1.5} className="text-indigo-400" />
                        <span className="text-sm font-semibold">My Account</span>
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                      >
                        <Package size={17} strokeWidth={1.5} className="text-indigo-400" />
                        <span className="text-sm font-semibold">My Orders</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                    >
                      <User size={17} strokeWidth={1.5} />
                      <span className="text-sm font-semibold">Sign In</span>
                    </Link>
                  )}

                  <Link
                    to="/find-store"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    <MapPin size={17} strokeWidth={1.5} className="text-gray-400" />
                    <span className="text-sm font-semibold">Find a Store</span>
                  </Link>

                  <a
                    href="tel:+919319484119"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    <Phone size={17} strokeWidth={1.5} className="text-gray-400" />
                    <span className="text-sm font-semibold">+91 93194 84119</span>
                  </a>
                </div>
              </div>

              {/* Sign Out (mobile) */}
              {user && (
                <div className="px-4 pb-6 border-t border-gray-100 pt-4">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-3 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-bold">Sign Out</span>
                  </button>
                </div>
              )}

              <div className="px-6 py-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                  © {new Date().getFullYear()} Chashmalay.in
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;
