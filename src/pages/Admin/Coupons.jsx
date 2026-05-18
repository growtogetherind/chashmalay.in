import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, IndianRupee, Tag, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCoupons, saveCoupon, deleteCoupon, subscribeCoupons } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import '../Admin.css';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    min_purchase: '',
    max_discount: '',
    expiry_date: '',
    is_active: true
  });

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await getCoupons();
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCoupons((data) => {
      setCoupons(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_percentage) return toast.error("Fill required fields");
    
    setSaving(true);
    const payload = {
      ...formData,
      discount_percentage: Number(formData.discount_percentage),
      min_purchase: Number(formData.min_purchase) || 0,
      max_discount: Number(formData.max_discount) || 0,
    };

    const { error } = await saveCoupon(payload, editing);

    if (error) toast.error('Failed to save coupon');
    else {
      toast.success(editing ? 'Coupon updated' : 'Coupon created');
      setShowForm(false);
      setEditing(null);
      setFormData({ code: '', discount_percentage: '', min_purchase: '', max_discount: '', expiry_date: '', is_active: true });
      fetchCoupons();
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: 'Delete Coupon', message: 'Are you sure you want to delete this coupon?' }))) return;
    const { error } = await deleteCoupon(id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Coupon deleted");
      fetchCoupons();
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <div>
             <h1 className="admin-title">Coupons</h1>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{coupons.length} discount codes</p>
           </div>
           <button onClick={() => { setEditing(null); setFormData({ code: '', discount_percentage: '', min_purchase: '', max_discount: '', expiry_date: '', is_active: true }); setShowForm(true); }} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
             <Plus size={18} /> <span className="ml-1">Add Coupon</span>
           </button>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading coupons...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Discount</th>
                    <th>Minimum Threshold</th>
                    <th>Expiry Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="group">
                      <td>
                        <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-mono font-black text-xs tracking-[2px] group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                          {c.code}
                        </span>
                      </td>
                      <td>
                        <div className="font-black text-slate-900 text-sm">{c.discount_percentage}% off</div>
                        {c.max_discount > 0 && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[1px] mt-1">Capped at ₹{c.max_discount}</p>}
                      </td>
                      <td>
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1"><IndianRupee size={12} className="text-slate-300" />{c.min_purchase || 0}</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[1px] mt-1">Order Minimum</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                          <Calendar size={14} className="text-emerald-500" /> {c.expiry_date ? c.expiry_date.toUpperCase() : 'INDEFINITE'}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-3">
                           <button onClick={() => { setFormData(c); setEditing(c.id); setShowForm(true); }} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all"><Edit3 size={16} /></button>
                           <button onClick={() => handleDelete(c.id)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-24 text-slate-300">
                        <Tag size={48} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-[3px]">No coupons yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-lg p-8 md:p-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Technical Modification' : 'Entity Initialization'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1.5">Configure discount logic and constraints</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-10">
              <div className="form-group">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Protocol Identity (Code) *</label>
                 <div className="relative group">
                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. ALPHA_SYNC_2024" className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-mono font-black tracking-[3px] uppercase transition-all shadow-inner" required />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div className="form-group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Yield Multiplier (%) *</label>
                    <input type="number" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: e.target.value})} className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-black transition-all shadow-inner" required />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Min. Purchase (₹)</label>
                    <input type="number" value={formData.min_purchase} onChange={e => setFormData({...formData, min_purchase: e.target.value})} className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-bold transition-all shadow-inner" />
                 </div>
              </div>
              <div className="form-group">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Termination Lifecycle (Expiry)</label>
                 <div className="relative group">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={20} />
                    <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-bold transition-all shadow-inner [color-scheme:light]" />
                 </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/10 disabled:opacity-50">
                {saving ? 'Synchronizing Cloud Ecosystem...' : (editing ? 'Apply Protocol Updates' : 'Initialize Promotion Protocol')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
