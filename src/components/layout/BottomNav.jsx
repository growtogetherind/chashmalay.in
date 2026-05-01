import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, User, ShoppingBag, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './BottomNav.css';

const BottomNav = () => {
  const { cartCount } = useCart();
  const location = useLocation();

  // Hide BottomNav on Product Detail & Cart Page to avoid overlapping with CTAs
  if (location.pathname.startsWith('/product/') || location.pathname === '/cart') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/category/eyeglasses" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Grid size={20} />
        <span>Shop</span>
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-cart">
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="bottom-nav-badge">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </NavLink>
      <NavLink to="/account" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User size={20} />
        <span>Account</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
