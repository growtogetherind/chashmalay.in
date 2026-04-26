import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Ticket, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCoupons, createCoupon, deleteCoupon } from '../../lib/firebase';
import '../Admin.css';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    is_active: true
  });

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await getCoupons();
    if (error) {
      console.error("Coupon fetch error:", error);
      toast.error(error.message || "Failed to load coupons");
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_percentage) {
      toast.error("Please fill all fields");
      return;
    }
    
    setSaving(true);
    const { error } = await createCoupon({
      code: formData.code.toUpperCase(),
      discount_percentage: Number(formData.discount_percentage),
      is_active: formData.is_active
    });

    if (error) {
      toast.error('Failed to create coupon');
    } else {
      toast.success('Coupon created successfully');
      setShowForm(false);
      setFormData({ code: '', discount_percentage: '', is_active: true });
      fetchCoupons();
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    const { error } = await deleteCoupon(id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Coupon deleted");
      fetchCoupons();
    }
  };

  if (loading) return <div className="admin-loading">Loading coupons...</div>;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/products" className="admin-nav-item">🛍️ Products</Link>
          <Link to="/admin/inventory" className="admin-nav-item">📦 Inventory</Link>
          <Link to="/admin/orders" className="admin-nav-item">🧾 Orders</Link>
          <Link to="/admin/customers" className="admin-nav-item">👥 Customers</Link>
          <Link to="/admin/coupons" className="admin-nav-item active">🎟️ Coupons</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Coupons <span className="text-gray-300">({coupons.length})</span></h1>
          <button onClick={() => setShowForm(true)} className="admin-action-btn"><Plus size={16} /> Add Coupon</button>
        </div>

        <div className="admin-card">
          {coupons.length === 0 ? (
            <div className="admin-empty">
              <Ticket size={48} className="mx-auto mb-4 text-gray-300" />
              <h3>No coupons found</h3>
              <p>Create a coupon code to offer discounts to your customers.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td><div className="font-black text-primary-blue bg-blue-50 px-2 py-1 inline-block rounded">{coupon.code}</div></td>
                    <td className="font-bold">{coupon.discount_percentage * 100}% Off</td>
                    <td>
                      {coupon.is_active 
                        ? <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle size={14}/> Active</span>
                        : <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle size={14}/> Inactive</span>
                      }
                    </td>
                    <td className="text-gray-500 text-xs">{coupon.created_at?.toDate().toLocaleDateString() || 'Just now'}</td>
                    <td>
                      <div className="admin-actions">
                        <button onClick={() => handleDelete(coupon.id)} className="action-btn delete" title="Delete Coupon"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showForm && (
          <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="admin-modal max-w-sm" onClick={e => e.stopPropagation()}>
              <h2 className="admin-modal-title">Create New Coupon</h2>
              <form onSubmit={handleSave} className="admin-form">
                
                <div className="form-group">
                  <label>Coupon Code</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. BOGO50" required style={{textTransform: 'uppercase'}}/>
                </div>
                
                <div className="form-group">
                  <label>Discount Percentage (Decimal)</label>
                  <input type="number" step="0.01" min="0.01" max="1" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: e.target.value})} required placeholder="0.25 for 25% Off" />
                  <p className="text-xs text-gray-400 mt-1">Example: 0.25 equals 25% discount</p>
                </div>

                <div className="form-group checkbox">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                     <span>Active</span>
                   </label>
                </div>

                <div className="admin-modal-actions mt-6">
                  <button type="button" onClick={() => setShowForm(false)} className="admin-action-btn secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="admin-action-btn flex-1">{saving ? 'Saving...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCoupons;
