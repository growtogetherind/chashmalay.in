// src/components/layout/AdminOrderAlertBanner.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, ExternalLink, AlertTriangle, Volume2 } from 'lucide-react';
import { subscribeAlertState, stopContinuousOrderAlert } from '../../lib/adminAlertManager';

const AdminOrderAlertBanner = () => {
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    return subscribeAlertState(setActiveAlert);
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-2xl px-4 py-3 md:py-3.5 animate-pulse transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 animate-bounce">
            <Volume2 size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="bg-white text-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                New Order Incoming
              </span>
              <span className="text-xs font-bold text-white/90">
                #{activeAlert.orderIdShort}
              </span>
            </div>
            <p className="text-sm font-black tracking-tight text-white mt-0.5">
              ₹{Number(activeAlert.amount).toLocaleString()} from {activeAlert.customer} ({activeAlert.itemCount} items)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/admin/orders"
            onClick={stopContinuousOrderAlert}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <ExternalLink size={14} /> View Order
          </Link>
          <button
            onClick={stopContinuousOrderAlert}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black/40 hover:bg-black/60 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-white/20 active:scale-95"
          >
            <BellOff size={14} /> Stop Alarm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderAlertBanner;

