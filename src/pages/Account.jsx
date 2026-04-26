import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, MapPin, Edit3, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../lib/firebase';
import './Account.css';

const ORDER_STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const Account = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
  }, [profile]);

  useEffect(() => {
    if (user) {
      getUserOrders(user.uid).then(({ data }) => setOrders(data || []));
    }
  }, [user]);

  const handleProfileSave = async () => {
    await updateProfile(form);
    setEditMode(false);
  };

  return (
    <div className="account-page container">
      {/* Sidebar */}
      <aside className="account-sidebar">
        <div className="account-avatar">
          <div className="avatar-circle">{profile?.full_name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <p className="font-black text-gray-900">{profile?.full_name || 'My Account'}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <nav className="account-nav">
          {[
            { id: 'orders', icon: Package, label: 'My Orders' },
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'addresses', icon: MapPin, label: 'Addresses' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`account-nav-item ${activeTab === id ? 'active' : ''}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
          <button onClick={signOut} className="account-nav-item text-red-500">
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>

      {/* Content */}
      <div className="account-content">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <h2 className="account-title">My Orders</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <Package size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-500 font-bold">No orders yet.</p>
                <Link to="/" className="btn btn-primary mt-4">Start Shopping</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <Link key={order.id} to={`/account/orders/${order.id}`} className="order-card group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-black text-gray-800 text-sm">Order #{order.id?.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.created_at?.toDate ? order.created_at.toDate().toLocaleDateString('en-IN', { dateStyle: 'medium' }) : new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {order.order_items?.slice(0, 3).map((item, i) => (
                          <img key={i} src={item.frame_image || item.products?.frame_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGMUY1RjkiLz48cGF0aCBkPSJNMTQgMThIMTBhMiAyIDAgMCAwLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMi0ydi00YTIgMiAwIDAgMC0yLTJ6TTI4IDE4SDI0YTIgMiAwIDAgMC0yIDJ2NGEyIDIgMCAwIDAgMiAyaDRhMiAyIDAgMCAwIDItMnYtNGEyIDIgMCAwIDAtMi0yck0xOCAyMGg0IiBzdHJva2U9IiM5NEEzQjgiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4='} alt="Item" className="w-10 h-10 object-contain bg-gray-50 rounded-lg border border-gray-100" />
                        ))}
                        {order.order_items?.length > 3 && <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-100 flex items-center justify-center text-xs font-black text-gray-500">+{order.order_items.length - 3}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-primary-blue">₹{Number(order.total_amount).toFixed(0)}</span>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-primary-blue transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="account-title">Profile</h2>
              <button onClick={() => editMode ? handleProfileSave() : setEditMode(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full text-xs font-black">
                <Edit3 size={14} /> {editMode ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input name="full_name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} disabled={!editMode} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input value={user?.email} disabled className="bg-gray-50" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={!editMode} placeholder="Add phone number" />
              </div>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="animate-fade-in">
            <h2 className="account-title">Saved Address</h2>
            {profile?.address ? (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-black text-gray-900">{profile.full_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{profile.address.line1}</p>
                    {profile.address.line2 && <p className="text-sm text-gray-600">{profile.address.line2}</p>}
                    <p className="text-sm text-gray-600">{profile.address.city}, {profile.address.state} - {profile.address.pincode}</p>
                    <p className="text-sm text-gray-600 mt-2 font-medium">📞 {profile.phone}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase rounded-full">Default</span>
                </div>
                <p className="text-xs text-gray-400">To edit your address, simply change it during your next checkout. It will automatically save here.</p>
              </div>
            ) : (
              <div className="empty-state">
                <MapPin size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-500 font-bold">No saved address yet.</p>
                <p className="text-xs text-gray-400 mt-1">Your address will be saved securely on your first checkout.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Account;
