import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, Phone, ShoppingBag, X, ShieldAlert, ShieldCheck, ExternalLink, Search, Download } from 'lucide-react';
import { toggleUserBlock, getUserOrders, subscribeAllProfiles } from '../../lib/firebase';
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

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllProfiles((data) => {
      setCustomers(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const handleToggleBlock = async (customer) => {
    const newStatus = !customer.is_blocked;
    const confirmMsg = newStatus ? `Block ${customer.full_name}? They won't be able to place orders.` : `Unblock ${customer.full_name}?`;

    if (!(await confirm({ title: 'Customer Status', message: confirmMsg }))) return;

    const { error } = await toggleUserBlock(customer.id, newStatus);
    if (error) toast.error('Action failed');
    else {
      toast.success(newStatus ? 'User blocked' : 'User unblocked');
      // No manual setCustomers call needed as we have a real-time subscription
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

  const downloadCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Created At', 'Status'];
    const data = filtered.map(c => [
      c.full_name || 'Anonymous',
      c.email || 'N/A',
      c.phone || 'N/A',
      c.created_at ? new Date(c.created_at?.seconds * 1000).toLocaleDateString() : 'N/A',
      c.is_blocked ? 'Blocked' : 'Active'
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_crm_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CRM Data Exported');
  };

  const filtered = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
          <div className="flex items-center gap-4">
            <button onClick={downloadCSV} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl flex items-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-xs shadow-sm">
              <Download size={18} className="text-emerald-500" /> Export CRM Data
            </button>
            <div>
              <h1 className="admin-title">Customers</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{customers.length} customer profiles</p>
            </div>
          </div>

        <div className="flex flex-wrap gap-4 mb-10">
           <div className="flex-1 min-w-[300px] relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 text-sm transition-all placeholder:text-slate-300 font-bold shadow-sm"
              />
           </div>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading customers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact Details</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(customer => (
                    <tr key={customer.id} className={`group ${customer.is_blocked ? 'bg-red-50/30' : ''}`}>
                      <td>
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${customer.is_blocked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                            {customer.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{customer.full_name || 'Anonymous Customer'}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-bold tracking-widest mt-1 uppercase">ID: {customer.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                             <Mail size={14} className="text-slate-300" /> {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400">
                               <Phone size={12} className="text-slate-200" /> {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[1.5px] border ${customer.is_blocked ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                           {customer.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-3">
                           <button onClick={() => handleViewDetails(customer)} className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all"><ExternalLink size={16} /></button>
                           <button onClick={() => handleToggleBlock(customer)} className={`p-2.5 rounded-lg border transition-all ${customer.is_blocked ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'}`}>
                             {customer.is_blocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-24 text-slate-300">
                         <Users size={48} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-[3px]">No matching customers found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="admin-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="admin-modal max-w-5xl p-10 md:p-12" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Identity Dossier: Profile Overview</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Secure Access Protocol Active
                </p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm"><X size={20} /></button>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                  <div className="flex flex-col items-center text-center p-10 bg-slate-50 rounded-[40px] border border-slate-100 relative overflow-hidden group shadow-inner">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                       <Users size={120} />
                    </div>
                    <div className="w-28 h-28 rounded-[32px] bg-emerald-500 text-white flex items-center justify-center text-4xl font-black mb-8 shadow-2xl shadow-emerald-500/40 relative z-10">
                      {selectedCustomer.full_name?.[0]?.toUpperCase()}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 relative z-10">{selectedCustomer.full_name}</h3>
                    <p className="text-sm text-slate-500 font-bold mb-8 relative z-10">{selectedCustomer.email}</p>
                    <div className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-sm relative z-10 ${selectedCustomer.is_blocked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                       {selectedCustomer.is_blocked ? 'Account: Suspended' : 'Status: Trusted Entity'}
                    </div>

                    <div className="w-full mt-12 pt-10 border-t border-slate-200/60 space-y-5 relative z-10">
                       <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-black uppercase tracking-widest">Protocol Start</span>
                          <span className="text-slate-900 font-bold">{selectedCustomer.created_at ? new Date(selectedCustomer.created_at?.seconds * 1000).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'}</span>
                       </div>
                       <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-black uppercase tracking-widest">Phone Link</span>
                          <span className="text-slate-900 font-bold">{selectedCustomer.phone || 'NO LINK'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[3px] flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Transaction History
                    </h4>
                    <span className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">{customerOrders.length} Records</span>
                  </div>

                  {loadingOrders ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-50 rounded-[40px] border border-slate-100 border-dashed">
                       <div className="w-8 h-8 border-3 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px]">Decrypting Interaction Ledger...</p>
                    </div>
                  ) : (
                    <div className="space-y-5 max-h-[550px] overflow-y-auto pr-6 custom-scrollbar">
                      {customerOrders.map(order => (
                        <div key={order.id} className="p-6 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group cursor-default">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all border border-slate-100 shadow-inner">
                               <ShoppingBag size={24} strokeWidth={1.5} />
                            </div>
                            <div>
                               <p className="text-base font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">#{order.id.slice(0, 10).toUpperCase()}</p>
                               <div className="flex items-center gap-3">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.created_at?.seconds * 1000 || order.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                                 <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                 <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{order.status}</span>
                               </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black text-slate-900 tracking-tighter">₹{Number(order.total_amount).toLocaleString()}</p>
                             <div className="flex justify-end gap-1.5 mt-2">
                                {order.items?.slice(0, 3).map((item, i) => (
                                   <div key={i} className="w-2 h-2 bg-emerald-500/20 rounded-full group-hover:bg-emerald-500/40 transition-colors"></div>
                                ))}
                             </div>
                          </div>
                        </div>
                      ))}
                      {customerOrders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-28 bg-slate-50 rounded-[40px] border border-slate-100 border-dashed">
                           <ShoppingBag size={48} strokeWidth={1} className="text-slate-200 mb-6" />
                           <p className="text-[11px] font-black text-slate-300 uppercase tracking-[3px] italic">No procurement records found for this entity</p>
                        </div>
                      )}
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
