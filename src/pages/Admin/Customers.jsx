import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import { getAllProfiles } from '../../lib/firebase';
import '../Admin.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      const { data } = await getAllProfiles();
      setCustomers(data || []);
      setLoading(false);
    };
    loadCustomers();
  }, []);

  const filtered = customers.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">Chashmaly <span>ADMIN</span></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/products" className="admin-nav-item">🛍️ Products</Link>
          <Link to="/admin/orders" className="admin-nav-item">📦 Orders</Link>
          <Link to="/admin/customers" className="admin-nav-item active">👥 Customers</Link>
          <Link to="/admin/coupons" className="admin-nav-item">🎟️ Coupons</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Customers <span className="text-gray-300 ml-2">({customers.length})</span></h1>
          <div className="admin-search-box">
             <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-primary-blue transition-colors"
            />
          </div>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-8">Loading customers...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Joined</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(customer => (
                    <tr key={customer.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-primary-blue flex items-center justify-center font-black text-xs">
                            {customer.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{customer.full_name || 'Unnamed'}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{customer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600"><Mail size={12} /> {customer.email}</div>
                          {customer.phone && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Phone size={12} /> {customer.phone}</div>}
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">
                         <div className="flex items-center gap-1.5"><Calendar size={12} /> {customer.created_at?.toDate ? customer.created_at.toDate().toLocaleDateString('en-IN') : 'N/A'}</div>
                      </td>
                      <td>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase">View Details</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center text-gray-400 py-8 font-bold">No customers found.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCustomers;
