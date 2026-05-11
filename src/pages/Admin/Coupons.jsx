import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, IndianRupee, Tag, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCoupons, saveCoupon, deleteCoupon } from '../../lib/firebase';
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

  useEffect(() => { fetchCoupons(); }, []);

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
           <h1 className="admin-title">Coupons</h1>
           <button onClick={() => { setEditing(null); setFormData({ code: '', discount_percentage: '', min_purchase: '', max_discount: '', expiry_date: '', is_active: true }); setShowForm(true); }} className="admin-action-btn"><Plus size={16} /> New Coupon</button>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-12 font-black italic">Loading coupons...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min. Purchase</th>
                    <th>Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id}>
                      <td className="font-mono font-black text-primary-blue">{c.code}</td>
                      <td><span className="font-black text-gray-800">{c.discount_percentage}% OFF</span></td>
                      <td><span className="text-sm font-bold text-gray-600">₹{c.min_purchase || 0}</span></td>
                      <td>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Calendar size={12} /> {c.expiry_date || 'No Limit'}</span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                           <button onClick={() => { setFormData(c); setEditing(c.id); setShowForm(true); }} className="admin-table-btn edit"><Edit3 size={14} /></button>
                           <button onClick={() => handleDelete(c.id)} className="admin-table-btn delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && <tr><td colSpan="5" className="text-center py-12 text-gray-400 font-bold italic">No active coupons</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-900">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Coupon Code *</label>
                 <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. WELCOME20" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-black" required />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discount (%) *</label>
                    <input type="number" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" required />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Min. Purchase (₹)</label>
                    <input type="number" value={formData.min_purchase} onChange={e => setFormData({...formData, min_purchase: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Expiry Date</label>
                 <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black font-bold" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                {saving ? 'Creating...' : 'Save Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
