import { useEffect, useState } from 'react';
import { FileText, Download, Eye, Calendar, X, ExternalLink } from 'lucide-react';
import { savePrescription, subscribePrescriptions } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribePrescriptions((data) => {
      setPrescriptions(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const handleVerify = async (id, status) => {
    setUpdating(true);
    const { error } = await savePrescription({ status, verified_at: new Date() }, id);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(`Prescription ${status}`);
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    }
    setUpdating(false);
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <div>
             <h1 className="admin-title">Prescriptions</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-[2px] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Review uploaded prescriptions
             </p>
           </div>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading prescriptions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map(p => (
                    <tr key={p.id} className="group">
                      <td>
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all shadow-inner">
                             <FileText size={22} strokeWidth={1.5} />
                           </div>
                           <div>
                              <span className="font-black text-sm text-slate-900 block group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{p.user_name || 'Customer'}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold tracking-widest mt-1">REG-ID: #{p.id.slice(0, 10).toUpperCase()}</span>
                           </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit">
                           <Calendar size={14} className="text-emerald-500" /> {new Date(p.created_at?.seconds * 1000 || p.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] border shadow-sm ${
                          p.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          p.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {p.status || 'pending audit'}
                        </span>
                      </td>
                      <td className="text-right">
                         <button onClick={() => setSelected(p)} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all shadow-sm"><Eye size={18} strokeWidth={2.5} /></button>
                      </td>
                    </tr>
                  ))}
                  {prescriptions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-24 text-slate-300">
                        <FileText size={56} strokeWidth={1} className="mx-auto mb-6 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[3px]">No prescriptions pending review</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal max-w-5xl p-10 md:p-12" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Clinical Audit: Rx Detailed View</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Secure Medical Channel Active
                  </p>
               </div>
               <button onClick={() => setSelected(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-10">
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Patient Identity
                     </h3>
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-500/20">{selected.user_name?.[0]}</div>
                        <div>
                           <p className="font-black text-slate-900 text-xl tracking-tight">{selected.user_name}</p>
                           <p className="text-[11px] text-slate-400 font-mono font-bold mt-1.5 uppercase tracking-widest">UID: {selected.user_id}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
                     <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[3px] mb-8 border-b border-slate-50 pb-6">Clinical Measurements</h3>
                     <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] bg-emerald-50 w-fit px-3 py-1.5 rounded-lg">Right Eye (OD)</p>
                           <div className="space-y-4">
                             <div className="flex justify-between items-center text-xs font-black py-2 border-b border-slate-50"><span className="text-slate-400 uppercase tracking-widest">SPH</span> <span className="text-slate-900 text-base">{selected.right_eye?.sph || '0.00'}</span></div>
                             <div className="flex justify-between items-center text-xs font-black py-2 border-b border-slate-50"><span className="text-slate-400 uppercase tracking-widest">CYL</span> <span className="text-slate-900 text-base">{selected.right_eye?.cyl || '0.00'}</span></div>
                             <div className="flex justify-between items-center text-xs font-black py-2"><span className="text-slate-400 uppercase tracking-widest">AXIS</span> <span className="text-slate-900 text-base">{selected.right_eye?.axis || '0°'}</span></div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] bg-emerald-50 w-fit px-3 py-1.5 rounded-lg">Left Eye (OS)</p>
                           <div className="space-y-4">
                             <div className="flex justify-between items-center text-xs font-black py-2 border-b border-slate-50"><span className="text-slate-400 uppercase tracking-widest">SPH</span> <span className="text-slate-900 text-base">{selected.left_eye?.sph || '0.00'}</span></div>
                             <div className="flex justify-between items-center text-xs font-black py-2 border-b border-slate-50"><span className="text-slate-400 uppercase tracking-widest">CYL</span> <span className="text-slate-900 text-base">{selected.left_eye?.cyl || '0.00'}</span></div>
                             <div className="flex justify-between items-center text-xs font-black py-2"><span className="text-slate-400 uppercase tracking-widest">AXIS</span> <span className="text-slate-900 text-base">{selected.left_eye?.axis || '0°'}</span></div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-6 pt-4">
                     <button onClick={() => handleVerify(selected.id, 'verified')} disabled={updating} className="flex-1 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[3px] hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 transition-all disabled:opacity-50">Authorize Rx</button>
                     <button onClick={() => handleVerify(selected.id, 'rejected')} disabled={updating} className="flex-1 py-5 bg-red-50 text-red-600 border border-red-100 rounded-[24px] font-black text-[11px] uppercase tracking-[3px] hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">Reject Rx</button>
                  </div>
               </div>

               <div>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Original Artifact
                  </h3>
                  <div className="relative group rounded-[40px] overflow-hidden border border-slate-100 aspect-[3/4.2] bg-slate-50 flex items-center justify-center p-4 shadow-inner">
                     {selected.image_url ? (
                        <>
                           <img src={selected.image_url} className="w-full h-full object-contain rounded-2xl transition-transform group-hover:scale-[1.02]" />
                           <div className="absolute inset-0 bg-emerald-900/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 backdrop-blur-[2px]">
                              <a href={selected.image_url} target="_blank" rel="noopener noreferrer" className="p-5 bg-white text-emerald-600 rounded-[24px] shadow-2xl hover:scale-110 transition-transform"><ExternalLink size={24} strokeWidth={2.5} /></a>
                              <a href={selected.image_url} download className="p-5 bg-white text-emerald-600 rounded-[24px] shadow-2xl hover:scale-110 transition-transform"><Download size={24} strokeWidth={2.5} /></a>
                           </div>
                        </>
                     ) : (
                        <div className="text-center">
                           <FileText size={80} strokeWidth={1} className="mx-auto mb-6 text-slate-200" />
                           <p className="text-[11px] font-black uppercase tracking-[3px] text-slate-300 italic">No Artifact Uploaded</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptions;
