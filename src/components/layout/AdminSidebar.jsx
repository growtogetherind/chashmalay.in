import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Tags, 
  Box, 
  Receipt, 
  Users, 
  FileText, 
  Ticket, 
  Star, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

const AdminSidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/products', label: 'Products', icon: '🛍️' },
    { path: '/admin/categories', label: 'Categories', icon: '📂' },
    { path: '/admin/brands', label: 'Brands', icon: '🏷️' },
    { path: '/admin/inventory', label: 'Inventory', icon: '📦' },
    { path: '/admin/orders', label: 'Orders', icon: '🧾' },
    { path: '/admin/customers', label: 'Customers', icon: '👥' },
    { path: '/admin/prescriptions', label: 'Prescriptions', icon: '📄' },
    { path: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
    { path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <aside className="admin-sidebar">
        <div className="admin-brand flex items-center justify-between gap-2 w-full">
           <div className="flex items-center gap-2">
              <span className="text-xl">🕶️</span>
              <div className="hidden lg:block text-white font-black tracking-tighter">CHASHMALY <span className="text-gray-500">ADMIN</span></div>
           </div>
           <button className="mobile-menu-toggle lg:hidden" onClick={toggleMenu}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>

        <nav className={`admin-nav ${isOpen ? 'mobile-active' : ''}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={signOut} className="admin-logout mt-auto flex items-center gap-2 w-full text-red-400 hover:text-red-300 font-bold">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[1000] lg:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default AdminSidebar;
