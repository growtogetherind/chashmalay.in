import { useEffect, useState } from 'react';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { updateReviewStatus, deleteReview, subscribeReviews } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const { confirm } = useConfirm();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeReviews((data) => {
      setReviews(data || []);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  const handleStatus = async (id, status) => {
    const { error } = await updateReviewStatus(id, status);
    if (error) toast.error('Action failed');
    else {
      toast.success(`Review ${status}`);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: 'Delete Review', message: 'Are you sure you want to delete this review?' }))) return;
    const { error } = await deleteReview(id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Review deleted');
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  const filtered = reviews.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
           <div>
             <h1 className="admin-title">Reviews</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-[2px] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {reviews.length} customer reviews
             </p>
           </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-12">
           {['pending', 'approved', 'rejected', 'all'].map(s => (
             <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all border ${filter === s ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900 hover:bg-slate-50 shadow-sm'}`}
             >
               {s}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px]">Loading reviews...</p>
            </div>
          ) : filtered.map(review => (
            <div key={review.id} className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/40">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all"></div>

               <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="flex gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? 'text-emerald-500' : 'text-slate-100'}
                        fill={i < review.rating ? 'currentColor' : 'none'}
                        strokeWidth={2.5}
                      />
                    ))}
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[2px] border shadow-sm ${
                    review.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    review.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {review.status || 'pending moderation'}
                  </span>
               </div>

               <div className="relative z-10 mb-8">
                 <p className="text-sm font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{review.product_name || 'Eyewear Product'}</p>
                 <div className="relative">
                    <span className="absolute -left-3 -top-2 text-3xl text-emerald-100 font-serif leading-none opacity-0 group-hover:opacity-100 transition-all">“</span>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed italic line-clamp-4 pl-2 border-l-2 border-slate-50 group-hover:border-emerald-100 transition-colors">
                      {review.comment}
                    </p>
                 </div>
               </div>

               <div className="pt-8 border-t border-slate-50 flex items-center justify-between mt-auto relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-emerald-500/20">
                       {(review.reviewer_name || review.user_name || '?')?.[0]}
                     </div>
                     <div>
                        <p className="text-[11px] font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{review.reviewer_name || review.user_name || 'Customer'}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1 font-black tracking-widest uppercase">
                          {new Date(review.created_at?.seconds * 1000 || review.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     {review.status !== 'approved' && (
                       <button onClick={() => handleStatus(review.id, 'approved')} className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                         <CheckCircle size={16} strokeWidth={2.5} />
                       </button>
                     )}
                     {review.status !== 'rejected' && (
                       <button onClick={() => handleStatus(review.id, 'rejected')} className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                         <XCircle size={16} strokeWidth={2.5} />
                       </button>
                     )}
                     <button onClick={() => handleDelete(review.id)} className="p-3 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                       <Trash2 size={16} strokeWidth={2.5} />
                     </button>
                  </div>
               </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[60px] border border-slate-100 border-dashed">
               <Star size={64} strokeWidth={1} className="text-slate-200 mb-6 opacity-40" />
               <p className="text-[11px] font-black text-slate-300 uppercase tracking-[3px]">No matching reviews</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminReviews;
