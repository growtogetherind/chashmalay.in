import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye, Calendar, X, ExternalLink } from 'lucide-react';
import { getPrescriptions, savePrescription } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await getPrescriptions();
    setPrescriptions(data || []);
    setLoading(false);
  };

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
           <h1 className="admin-title">Prescriptions</h1>
        </div>

        <div className="admin-card">
          {loading ? <div className="text-gray-400 text-center p-12 font-black italic">Loading records...</div> : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer / ID</th>
                    <th>Date Uploaded</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-lg">📄</div>
                           <div>
                              <span className="font-black text-sm text-gray-800 block">{p.user_name || 'Customer'}</span>
                              <span className="text-[10px] text-gray-400 font-mono">#{p.id.slice(0, 8).toUpperCase()}</span>
                           </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                           <Calendar size={12} /> {new Date(p.created_at?.seconds * 1000 || p.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          p.status === 'verified' ? 'bg-green-100 text-green-600' : 
                          p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {p.status || 'pending'}
                        </span>
                      </td>
                      <td>
                         <button onClick={() => setSelected(p)} className="admin-table-btn edit"><Eye size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {prescriptions.length === 0 && <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic font-black">No prescriptions uploaded yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
               <h2 className="text-xl font-black text-gray-900">Prescription Detail</h2>
               <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Info</h3>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black">{selected.user_name?.[0]}</div>
                        <div>
                           <p className="font-black text-gray-800">{selected.user_name}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase">{selected.user_id}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Eye Details</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-[8px] font-black text-gray-400 uppercase">Right Eye (OD)</p>
                           <div className="text-xs font-black p-2 bg-gray-50 rounded-lg">SPH: {selected.right_eye?.sph || 'N/A'}</div>
                           <div className="text-xs font-black p-2 bg-gray-50 rounded-lg">CYL: {selected.right_eye?.cyl || 'N/A'}</div>
                           <div className="text-xs font-black p-2 bg-gray-50 rounded-lg">AXIS: {selected.right_eye?.axis || 'N/A'}</div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[8px] font-black text-gray-400 uppercase">Left Eye (OS)</p>
                           <div className="text-xs font-black p-2 bg-gray-50 rounded-lg">SPH: {selected.left_eye?.sph || 'N/A'}</div>
                           <div className="text-xs font-black p-2 bg-gray-50 rounded-lg">CYL: {selected.left_eye?.cyl || 'N/A'}</div>
                           <div className="text-xs font-black p-2 bg-gray-50 rounded-lg">AXIS: {selected.left_eye?.axis || 'N/A'}</div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <button onClick={() => handleVerify(selected.id, 'verified')} disabled={updating} className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Approve</button>
                     <button onClick={() => handleVerify(selected.id, 'rejected')} disabled={updating} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Reject</button>
                  </div>
               </div>

               <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Uploaded Document</h3>
                  <div className="relative group rounded-3xl overflow-hidden border-4 border-gray-100 aspect-[3/4] bg-gray-50 flex items-center justify-center">
                     {selected.image_url ? (
                        <>
                           <img src={selected.image_url} className="w-full h-full object-contain" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <a href={selected.image_url} target="_blank" className="p-3 bg-white rounded-full text-gray-900 shadow-xl"><ExternalLink size={20} /></a>
                              <a href={selected.image_url} download className="p-3 bg-white rounded-full text-gray-900 shadow-xl"><Download size={20} /></a>
                           </div>
                        </>
                     ) : (
                        <div className="text-center text-gray-300">
                           <FileText size={48} />
                           <p className="text-[10px] font-black uppercase mt-2">No File Preview</p>
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
