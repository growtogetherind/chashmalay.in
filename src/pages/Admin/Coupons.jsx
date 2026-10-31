import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, IndianRupee, Tag, Edit3, X, Users, AlertCircle, CheckCircle } from 'lucide-react';
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
    usage_limit: '',
    used_count: 0,
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

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: '',
      min_purchase: '',
      max_discount: '',
      expiry_date: '',
      usage_limit: '',
      used_count: 0,
      is_active: true
    });
    setEditing(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (c) => {
    setFormData({
      code: c.code || '',
      discount_percentage: c.discount_percentage ?? '',
      min_purchase: c.min_purchase ?? '',
      max_discount: c.max_discount ?? '',
      expiry_date: c.expiry_date || '',
      usage_limit: c.usage_limit ?? '',
      used_count: c.used_count ?? 0,
      is_active: c.is_active !== false
    });
    setEditing(c.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_percentage) return toast.error("Fill required fields");
    
    setSaving(true);
    const payload = {
      ...formData,
      discount_percentage: Number(formData.discount_percentage),
      min_purchase: Number(formData.min_purchase) || 0,
      max_discount: Number(formData.max_discount) || 0,
      usage_limit: formData.usage_limit !== '' && formData.usage_limit !== null ? Number(formData.usage_limit) : null,
      used_count: Number(formData.used_count) || 0,
    };

    const { error } = await saveCoupon(payload, editing);

    if (error) toast.error('Failed to save coupon');
    else {
      toast.success(editing ? 'Coupon updated' : 'Coupon created');
      setShowForm(false);
      resetForm();
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
           <button onClick={handleOpenAdd} className="admin-primary-btn px-6 shadow-lg shadow-emerald-500/20">
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
                    <th>Usage & Redemptions</th>
                    <th>Expiry Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => {
                    const hasLimit = c.usage_limit !== undefined && c.usage_limit !== null && Number(c.usage_limit) > 0;
                    const used = Number(c.used_count || 0);
                    const limit = hasLimit ? Number(c.usage_limit) : null;
                    const isExhausted = hasLimit && used >= limit;
                    const remaining = hasLimit ? Math.max(0, limit - used) : null;
                    const pctUsed = hasLimit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

                    return (
                      <tr key={c.id} className="group">
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-mono font-black text-xs tracking-[2px] group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                              {c.code}
                            </span>
                            {isExhausted && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                Exhausted
                              </span>
                            )}
                          </div>
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
                          {hasLimit ? (
                            <div className="min-w-[140px]">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                                <span>{used} / {limit} redeemed</span>
                                <span className={isExhausted ? "text-red-600" : "text-emerald-600"}>
                                  {isExhausted ? "0 left" : `${remaining} left`}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${isExhausted ? 'bg-red-500' : pctUsed > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${pctUsed}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold text-xs text-slate-800">{used} redeemed</div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[1px] mt-0.5">Unlimited Uses</p>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                            <Calendar size={14} className="text-emerald-500" /> {c.expiry_date ? c.expiry_date.toUpperCase() : 'INDEFINITE'}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-3">
                             <button onClick={() => handleOpenEdit(c)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all" title="Edit Coupon"><Edit3 size={16} /></button>
                             <button onClick={() => handleDelete(c.id)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-100 hover:border-red-100 transition-all" title="Delete Coupon"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-24 text-slate-300">
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

      {/* Coupon Modal: Scrollable, and DOES NOT close on accidental outside click */}
      {showForm && (
        <div className="admin-modal-overlay">
          <div
            className="admin-modal max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl rounded-3xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Coupon Protocol' : 'Create New Coupon'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1">Configure discount rules, redemptions & limits</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Code */}
              <div className="form-group">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Coupon Code *</label>
                 <div className="relative group">
                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. DIWALI20"
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-mono font-black tracking-[3px] uppercase transition-all shadow-inner"
                      required
                    />
                 </div>
              </div>

              {/* Discount % & Min Purchase */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="form-group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Discount (%) *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={e => setFormData({...formData, discount_percentage: e.target.value})}
                      placeholder="e.g. 20"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-black transition-all shadow-inner"
                      required
                    />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Min. Order (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.min_purchase}
                      onChange={e => setFormData({...formData, min_purchase: e.target.value})}
                      placeholder="e.g. 999"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-bold transition-all shadow-inner"
                    />
                 </div>
              </div>

              {/* Max Discount & Usage Limit */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="form-group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Max Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_discount}
                      onChange={e => setFormData({...formData, max_discount: e.target.value})}
                      placeholder="e.g. 500 (0 for no cap)"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-bold transition-all shadow-inner"
                    />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Max Redemptions</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={e => setFormData({...formData, usage_limit: e.target.value})}
                      placeholder="e.g. 50 (Blank = Unlimited)"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-bold transition-all shadow-inner"
                    />
                 </div>
              </div>

              {/* Expiry Date */}
              <div className="form-group">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expiration Date</label>
                 <div className="relative group">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={20} />
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white text-slate-900 text-sm font-bold transition-all shadow-inner [color-scheme:light]"
                    />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1">Leave blank for indefinite validity.</p>
              </div>

              {/* Admin used count override when editing */}
              {editing && (
                <div className="form-group bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-600" />
                    Times Already Redeemed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.used_count}
                    onChange={e => setFormData({...formData, used_count: Number(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-900 text-sm font-bold transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Automatically increments when orders use this code. You can manually reset or adjust this count anytime.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-2/3 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editing ? 'Update Coupon' : 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
