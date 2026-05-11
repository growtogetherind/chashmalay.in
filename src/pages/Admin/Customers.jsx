import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, Phone, Calendar, ShoppingBag, MapPin, X, ShieldAlert, ShieldCheck, ExternalLink, Search } from 'lucide-react';
import { getAllProfiles, toggleUserBlock, getUserOrders } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await getAllProfiles();
    setCustomers(data || []);
    setLoading(false);
  };

  const handleToggleBlock = async (customer) => {
    const newStatus = !customer.is_blocked;
    const confirmMsg = newStatus ? `Block ${customer.full_name}? They won't be able to place orders.` : `Unblock ${customer.full_name}?`;
    
    if (!(await confirm({ title: 'Customer Status', message: confirmMsg }))) return;

    const { error } = await toggleUserBlock(customer.id, newStatus);
    if (error) toast.error('Action failed');
    else {
      toast.success(newStatus ? 'User blocked' : 'User unblocked');
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, is_blocked: newStatus } : c));
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(prev => ({ ...prev, is_blocked: newStatus }));
      }
    }
  };

  const handleViewDetails = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    const { data } = await getUserOrders(customer.id);
    setCustomerOrders(data || []);
    setLoadingOrders(false);
  };

  const filtered = customers.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Customer Base</h1>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">{customers.length} Registered Users</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
           <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-search-box pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-primary-blue font-bold text-xs w-full" />
           </div>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-12 font-black italic">Loading users...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(customer => (
                    <tr key={customer.id} className={customer.is_blocked ? 'bg-red-50/30' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${customer.is_blocked ? 'bg-red-100 text-red-500' : 'bg-blue-50 text-primary-blue'}`}>
                            {customer.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-black text-sm text-gray-800">{customer.full_name || 'Anonymous'}</p>
                            <p className="text-[10px] text-gray-400 font-bold">ID: {customer.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-bold text-gray-600">{customer.email}</p>
                          {customer.phone && <p className="text-[10px] text-gray-400">{customer.phone}</p>}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${customer.is_blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                           {customer.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                           <button onClick={() => handleViewDetails(customer)} className="admin-table-btn edit"><ExternalLink size={14} /></button>
                           <button onClick={() => handleToggleBlock(customer)} className={`admin-table-btn ${customer.is_blocked ? 'bg-green-500 text-white' : 'delete'}`}>
                             {customer.is_blocked ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="admin-modal-overlay" onClick={() => setSelectedCustomer(null)}>
            <div className="admin-modal max-w-4xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <h2 className="text-xl font-black text-gray-900">Customer Profile</h2>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="w-20 h-20 rounded-full bg-primary-blue text-white flex items-center justify-center text-2xl font-black mb-4 shadow-xl">
                      {selectedCustomer.full_name?.[0]?.toUpperCase()}
                    </div>
                    <h3 className="text-lg font-black text-gray-900">{selectedCustomer.full_name}</h3>
                    <p className="text-xs text-gray-400 font-bold mb-4">{selectedCustomer.email}</p>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${selectedCustomer.is_blocked ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                       {selectedCustomer.is_blocked ? 'Blocked' : 'Verified Member'}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Order History</h4>
                  {loadingOrders ? (
                    <div className="p-8 text-center text-gray-400 italic">Fetching orders...</div>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders.map(order => (
                        <div key={order.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary-blue"><ShoppingBag size={18} /></div>
                            <div>
                               <p className="text-sm font-black text-gray-800">#{order.id.slice(0, 8).toUpperCase()}</p>
                               <p className="text-[10px] text-gray-400 font-bold">{new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-primary-blue">₹{Number(order.total_amount).toLocaleString()}</p>
                             <span className="text-[9px] font-black uppercase text-gray-400">{order.status}</span>
                          </div>
                        </div>
                      ))}
                      {customerOrders.length === 0 && <div className="p-12 bg-gray-50 rounded-3xl text-center text-gray-400 italic font-bold">No orders placed yet</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCustomers;
