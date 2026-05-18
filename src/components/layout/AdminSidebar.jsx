import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Box, Layers, Tag, Package, Receipt, Users, FileText, Ticket, Star, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

const AdminSidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutGrid size={20} /> },
    { path: '/admin/orders', label: 'Orders', icon: <Receipt size={20} /> },
    { path: '/admin/products', label: 'Products', icon: <Box size={20} /> },
    { path: '/admin/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/admin/categories', label: 'Categories', icon: <Layers size={20} /> },
    { path: '/admin/brands', label: 'Brands', icon: <Tag size={20} /> },
    { path: '/admin/inventory', label: 'Inventory', icon: <Package size={20} /> },
    { path: '/admin/prescriptions', label: 'Prescriptions', icon: <FileText size={20} /> },
    { path: '/admin/coupons', label: 'Coupons', icon: <Ticket size={20} /> },
    { path: '/admin/carousel', label: 'Home Banners', icon: <LayoutGrid size={20} /> },
    { path: '/admin/reviews', label: 'Reviews', icon: <Star size={20} /> },
  ];

  const bottomItems = [
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <aside className={`admin-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 fixed lg:sticky top-0 left-0 bg-white border-r border-gray-100 z-[1001]`}>
        <div className="admin-brand flex items-center gap-3 py-6 px-4 mb-4">
           <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Logo className="w-6 h-6 invert brightness-0" />
           </div>
           <div className="flex flex-col">
              <span className="text-gray-900 font-extrabold text-sm tracking-tight leading-none uppercase">Chashmalay</span>
              <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Admin Panel</span>
           </div>
        </div>

        <nav className="flex flex-col gap-1.5 px-3 flex-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gray-50 text-red-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                  isActive ? 'bg-red-600 text-white shadow-md shadow-red-100' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm'
                }`}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pt-4 border-t border-gray-100 mt-4 flex flex-col gap-1.5">
          {bottomItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm">
                {item.icon}
              </div>
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </Link>
          ))}
          <button onClick={signOut} className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all group w-full text-left">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-400 group-hover:bg-white group-hover:shadow-sm">
              <LogOut size={18} />
            </div>
            <span className="text-sm font-bold tracking-tight">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 z-[1000]">
         <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-gray-900 font-black text-sm uppercase tracking-tight">Chashmalay Admin</span>
         </div>
         <button onClick={toggleMenu} className="p-2 text-gray-900 hover:bg-gray-50 rounded-xl">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] lg:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default AdminSidebar;
