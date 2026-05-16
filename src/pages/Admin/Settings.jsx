import React, { useEffect, useState } from 'react';
import { Save, Mail, Wrench, Globe, Truck } from 'lucide-react';
import { saveSettings, subscribeSettings } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminSettings = () => {
  const [form, setForm] = useState({
    store_name: 'Chashmalay',
    contact_email: '',
    contact_phone: '',
    address: '',
    instagram: '',
    facebook: '',
    twitter: '',
    free_shipping_min: 0,
    maintenance_mode: false,
    store_logo: '',
    carousel_interval: 5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSettings((data) => {
      setForm(prev => ({ ...prev, ...data }));
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
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
           <div>
             <h1 className="admin-title">Store Settings</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-[2px] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Contact, shipping, and storefront settings
             </p>
           </div>
           <button onClick={handleSave} disabled={saving} className="admin-primary-btn px-10 shadow-lg shadow-emerald-500/10 font-black">
             <Save size={18} strokeWidth={3} /> <span>{saving ? 'SAVING...' : 'SAVE SETTINGS'}</span>
           </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
            <div className="space-y-12">
              <div className="admin-card !p-10 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-slate-100">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none"><Wrench size={120} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-emerald-600 flex items-center gap-4 mb-10">
                  <span className="w-10 h-0.5 bg-emerald-500/20"></span> Store Basics
                </h3>
                <div className="space-y-8">
                  <div className="form-group">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Store Name</label>
                     <input value={form.store_name} onChange={e => setForm({...form, store_name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                  </div>
                  <div className="flex items-center justify-between p-8 bg-red-50 rounded-[32px] border border-red-100 group/toggle shadow-sm">
                     <div className="flex-1">
                        <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Maintenance Mode
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[240px]">Temporarily hide the storefront while you make important updates.</p>
                     </div>
                     <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.maintenance_mode}
                          onChange={e => setForm({...form, maintenance_mode: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
                     </div>
                  </div>
                  <div className="form-group pt-4">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Carousel Slide Duration (Seconds)</label>
                     <div className="relative">
                        <input type="number" value={form.carousel_interval} onChange={e => setForm({...form, carousel_interval: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">Seconds</span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="admin-card !p-10 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-slate-100">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none"><Mail size={120} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-emerald-600 flex items-center gap-4 mb-10">
                  <span className="w-10 h-0.5 bg-emerald-500/20"></span> Communication Node
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="form-group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Primary Admin Gateway</label>
                    <input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                  </div>
                  <div className="form-group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Support Intelligence Line</label>
                    <input type="text" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                  </div>
                </div>
                <div className="form-group mt-8">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Global Headquarters (Physical Address)</label>
                  <textarea rows={4} value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[24px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner resize-none leading-relaxed" />
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="admin-card !p-10 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-slate-100">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none"><Truck size={120} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-emerald-600 flex items-center gap-4 mb-10">
                  <span className="w-10 h-0.5 bg-emerald-500/20"></span> Logistics Logic
                </h3>
                <div className="form-group">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Zero-Cost Shipment Threshold (INR)</label>
                   <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">₹</span>
                      <input type="number" value={form.free_shipping_min} onChange={e => setForm({...form, free_shipping_min: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 pl-12 pr-6 py-5 rounded-[20px] text-slate-900 text-xl font-black focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                   </div>
                   <p className="text-[9px] text-slate-400 mt-5 font-black uppercase tracking-[2px] bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 italic">Automatic logistics waiver sequence active for orders exceeding this digital value.</p>
                </div>
              </div>

              <div className="admin-card !p-10 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-slate-100">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none"><Globe size={120} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-emerald-600 flex items-center gap-4 mb-10">
                  <span className="w-10 h-0.5 bg-emerald-500/20"></span> External Ecosystem Sync
                </h3>
                <div className="space-y-8">
                  <div className="form-group">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Instagram Meta-Data Stream</label>
                     <input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="https://instagram.com/chashmalay" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                  </div>
                  <div className="form-group">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Facebook Public Interface</label>
                     <input value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                  </div>
                  <div className="form-group">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">X (Twitter) Intelligence Protocol</label>
                     <input value={form.twitter} onChange={e => setForm({...form, twitter: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" />
                  </div>
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
