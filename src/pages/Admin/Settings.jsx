import { useEffect, useState } from 'react';
import { Save, Mail, Wrench, Globe, Truck, Bell, Eye, EyeOff, Send } from 'lucide-react';
import { saveSettings, subscribeSettings, getPrivateSettings } from '../../lib/firebase';
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
    carousel_interval: 5,
    telegram_bot_token: '',
    telegram_chat_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showToken, setShowToken] = useState(false);
  const [fetchingChatId, setFetchingChatId] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [botUsername, setBotUsername] = useState('Chashmalay_bot');

  useEffect(() => {
    // Public settings stream live from settings/global.
    const unsubscribe = subscribeSettings((data) => {
      setForm(prev => ({ ...prev, ...data }));
      setLoading(false);
    }, () => setLoading(false));

    // Secrets (Telegram token/chat id) live in the admin-only settings/private
    // doc and must be fetched separately to prefill the form.
    getPrivateSettings().then(({ data }) => {
      if (data && Object.keys(data).length) {
        setForm(prev => ({ ...prev, ...data }));
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (form.telegram_bot_token) {
      const fetchBotInfo = async () => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${form.telegram_bot_token}/getMe`);
          const data = await res.json();
          if (data.ok && data.result?.username) {
            setBotUsername(data.result.username);
          }
        } catch (err) {
          console.error("Error fetching bot info:", err);
        }
      };
      fetchBotInfo();
    }
  }, [form.telegram_bot_token]);

  const handleFetchChatId = async () => {
    if (!form.telegram_bot_token) {
      toast.error('Please enter the Telegram Bot Token first.');
      return;
    }
    
    setFetchingChatId(true);
    const toastId = toast.loading('Querying Telegram Bot API updates...');
    
    try {
      const res = await fetch(`https://api.telegram.org/bot${form.telegram_bot_token}/getUpdates`);
      const data = await res.json();
      
      if (!data.ok) {
        throw new Error(data.description || 'Failed to fetch updates from Telegram');
      }
      
      const updates = data.result || [];
      if (updates.length === 0) {
        toast.error(
          `No recent messages. Please search for @${botUsername} on Telegram, tap "Start", then try syncing again.`,
          { id: toastId, duration: 6000 }
        );
        setFetchingChatId(false);
        return;
      }
      
      // Find the latest message update containing a chat ID
      const latestUpdate = [...updates].reverse().find(upd => upd.message?.chat?.id);
      
      if (latestUpdate) {
        const chatId = latestUpdate.message.chat.id;
        const firstName = latestUpdate.message.from?.first_name || 'Admin';
        const username = latestUpdate.message.from?.username ? `@${latestUpdate.message.from.username}` : '';
        
        setForm(prev => ({ ...prev, telegram_chat_id: String(chatId) }));
        toast.success(`Connected! Found Chat ID: ${chatId} (${firstName} ${username})`, { id: toastId, duration: 4000 });
      } else {
        toast.error('Could not extract Chat ID. Please make sure you sent a message to the bot.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Sync error: ${err.message}`, { id: toastId });
    } finally {
      setFetchingChatId(false);
    }
  };

  const handleTestAlert = async () => {
    if (!form.telegram_bot_token || !form.telegram_chat_id) {
      toast.error('Bot Token and Chat ID are both required to test connection.');
      return;
    }
    
    setTestingConnection(true);
    const toastId = toast.loading('Routing test alert to Telegram...');
    
    try {
      const res = await fetch(`https://api.telegram.org/bot${form.telegram_bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: form.telegram_chat_id,
          text: `🔔 *Chashmalay Alert Intelligence* 🚀\n\nConnection verified successfully! Your shop gateway is now fully synced with your Telegram account.\n\n*Immediate Alerts Active:* \n• 🛒 New Customer Orders\n• ✉️ Contact Form Inquiries\n• 📑 Prescription Uploads\n\n_Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`,
          parse_mode: 'Markdown'
        })
      });
      
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.description || 'Telegram rejected the message');
      }
      
      toast.success('Test alert routed successfully! Check your Telegram app.', { id: toastId, duration: 4500 });
    } catch (err) {
      console.error(err);
      toast.error(`Connection failed: ${err.message}`, { id: toastId, duration: 5000 });
    } finally {
      setTestingConnection(false);
    }
  };

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
                  <label className="flex items-center justify-between p-8 bg-red-50 rounded-[32px] border border-red-100 group/toggle shadow-sm cursor-pointer">
                     <div className="flex-1">
                        <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Maintenance Mode
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[240px]">
                          {form.maintenance_mode ? 'Storefront is currently hidden from visitors.' : 'Turn this on to temporarily hide the storefront while updates are in progress.'}
                        </p>
                     </div>
                     <div className="relative inline-flex items-center">
                        <input
                          id="maintenance-mode-toggle"
                          type="checkbox"
                          checked={form.maintenance_mode}
                          onChange={e => setForm({...form, maintenance_mode: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 shadow-inner relative"></div>
                     </div>
                  </label>
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

              <div className="admin-card !p-10 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-slate-100">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none"><Bell size={120} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-emerald-600 flex items-center gap-4 mb-10">
                  <span className="w-10 h-0.5 bg-emerald-500/20"></span> Telegram Alert System
                </h3>
                
                <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-[20px]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Setup Sequence</p>
                  <ol className="text-[11px] text-slate-500 font-bold list-decimal list-inside space-y-2.5 leading-relaxed">
                    <li>Message the bot <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline hover:text-emerald-600 font-black">@{botUsername}</a> and tap <strong>Start</strong>.</li>
                    <li>Input your Bot Token below (pre-filled with your active token).</li>
                    <li>Click <strong>Sync Chat ID</strong> to automatically locate and link your Chat ID.</li>
                    <li>Click <strong>Send Test Alert</strong> to verify connection, then click <strong>Save Settings</strong>.</li>
                  </ol>
                </div>

                <div className="space-y-8">
                  <div className="form-group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Telegram Bot Token</label>
                    <div className="relative">
                      <input 
                        type={showToken ? "text" : "password"} 
                        value={form.telegram_bot_token} 
                        onChange={e => setForm({...form, telegram_bot_token: e.target.value})} 
                        placeholder="Enter Bot Token"
                        className="w-full bg-slate-50 border border-slate-100 p-5 pr-14 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Telegram Chat ID</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        value={form.telegram_chat_id} 
                        onChange={e => setForm({...form, telegram_chat_id: e.target.value})} 
                        placeholder="No Chat ID Linked"
                        className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-slate-900 text-sm font-bold focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner" 
                      />
                      <button 
                        type="button"
                        onClick={handleFetchChatId}
                        disabled={fetchingChatId}
                        className="px-6 py-5 rounded-[20px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 whitespace-nowrap active:scale-[0.97]"
                      >
                        {fetchingChatId ? 'SYNCING...' : 'SYNC CHAT ID'}
                      </button>
                    </div>
                  </div>

                  {form.telegram_chat_id && form.telegram_bot_token && (
                    <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-dashed border-slate-200">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-full flex items-center gap-2 tracking-[1px] uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> BOT READY TO ROUTE ALERTS
                      </span>
                      <button 
                        type="button" 
                        onClick={handleTestAlert}
                        disabled={testingConnection}
                        className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-[0.97]"
                      >
                        <Send size={12} strokeWidth={2.5} />
                        <span>{testingConnection ? 'TESTING...' : 'SEND TEST ALERT'}</span>
                      </button>
                    </div>
                  )}
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
