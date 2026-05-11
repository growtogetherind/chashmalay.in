import React, { useEffect, useState } from 'react';
import { Save, Mail, Wrench, Globe, Truck } from 'lucide-react';
import { getSettings, saveSettings } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminSettings = () => {
  const [form, setForm] = useState({
    store_name: 'Chashmaly',
    contact_email: '',
    contact_phone: '',
    address: '',
    instagram: '',
    facebook: '',
    twitter: '',
    free_shipping_min: 0,
    maintenance_mode: false,
    store_logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await getSettings();
      if (data) setForm(prev => ({ ...prev, ...data }));
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await saveSettings(form);
    if (error) toast.error('Failed to update settings');
    else toast.success('Settings saved successfully');
    setSaving(false);
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <h1 className="admin-title">Store Settings</h1>
           <button onClick={handleSave} disabled={saving} className="admin-action-btn flex items-center gap-2 bg-black text-white">
             <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>

        {loading ? <div className="p-12 text-center text-gray-400 italic">Loading configuration...</div> : (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="admin-card p-6 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Wrench size={14} /> General Config</h3>
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Store Name</label>
                   <input value={form.store_name} onChange={e => setForm({...form, store_name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                   <div>
                      <p className="text-xs font-black text-red-700 uppercase">Maintenance Mode</p>
                      <p className="text-[10px] text-red-500">Enable this to block all user access to the frontend.</p>
                   </div>
                   <input type="checkbox" checked={form.maintenance_mode} onChange={e => setForm({...form, maintenance_mode: e.target.checked})} className="w-5 h-5 accent-red-600" />
                </div>
              </div>

              <div className="admin-card p-6 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Mail size={14} /> Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Support Email</label>
                    <input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Support Phone</label>
                    <input type="text" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Business Address</label>
                  <textarea rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="admin-card p-6 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Truck size={14} /> Business Rules</h3>
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Free Shipping Min. Order (₹)</label>
                   <input type="number" value={form.free_shipping_min} onChange={e => setForm({...form, free_shipping_min: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                   <p className="text-[10px] text-gray-400 mt-1">Orders above this amount will have free shipping applied.</p>
                </div>
              </div>

              <div className="admin-card p-6 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Globe size={14} /> Social Presence</h3>
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Instagram URL</label>
                   <input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="https://instagram.com/..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Facebook URL</label>
                   <input value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Twitter (X) URL</label>
                   <input value={form.twitter} onChange={e => setForm({...form, twitter: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default AdminSettings;
