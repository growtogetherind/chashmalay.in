import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { getReviews, updateReviewStatus, deleteReview } from '../../lib/firebase';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import '../Admin.css';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const { confirm } = useConfirm();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await getReviews();
    setReviews(data || []);
    setLoading(false);
  };

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
           <h1 className="admin-title">Product Reviews</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
           {['pending', 'approved', 'rejected', 'all'].map(s => (
             <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${filter === s ? 'bg-black text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>{s}</button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? <div className="col-span-full text-center p-12 text-gray-400 font-black italic">Loading reviews...</div> : filtered.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col hover:shadow-xl transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                    review.status === 'approved' ? 'bg-green-100 text-green-600' :
                    review.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {review.status || 'pending'}
                  </span>
               </div>
               
               <p className="text-sm font-black text-gray-800 mb-2">{review.product_name || 'Eyewear Product'}</p>
               <p className="text-xs text-gray-500 italic mb-6 flex-1">"{review.comment}"</p>

               <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">{review.user_name?.[0]}</div>
                     <div>
                        <p className="text-[10px] font-black text-gray-700">{review.user_name}</p>
                        <p className="text-[8px] text-gray-400">{new Date(review.created_at?.seconds * 1000 || review.created_at).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     {review.status !== 'approved' && <button onClick={() => handleStatus(review.id, 'approved')} className="admin-table-btn edit bg-green-50 text-green-600"><CheckCircle size={14} /></button>}
                     {review.status !== 'rejected' && <button onClick={() => handleStatus(review.id, 'rejected')} className="admin-table-btn delete"><XCircle size={14} /></button>}
                     <button onClick={() => handleDelete(review.id)} className="admin-table-btn edit"><Trash2 size={14} /></button>
                  </div>
               </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && <div className="col-span-full text-center py-20 text-gray-400 italic font-bold">No reviews found under this filter</div>}
        </div>
      </main>
    </div>
  );
};

export default AdminReviews;
