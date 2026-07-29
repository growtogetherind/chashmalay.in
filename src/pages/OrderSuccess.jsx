import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag } from 'lucide-react';
import { getOrderById } from '../lib/firebase';

const CanvasConfetti = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = ['#1e3f8a', '#329cd5', '#f49f3e', '#ffffff'];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 2 * Math.PI,
      spinSpeed: Math.random() * 0.1 - 0.05,
      rotation: Math.random() * 360,
    }));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      particles.forEach((p) => {
        p.y += p.speed;
        p.rotation += p.spinSpeed;
        p.x += Math.sin(p.rotation) * 0.5;

        if (p.y < height) {
          alive = true;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (orderId && orderId !== 'undefined') {
      getOrderById(orderId).then(({ data }) => setOrder(data));
    }
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {showConfetti && <CanvasConfetti />}
      
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed! 🎉</h1>
        <p className="text-gray-500 mb-6">Thank you for shopping with Chashmalay.in. Your frames are being prepared with love.</p>

        {order && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-primary-blue" />
              <span className="text-xs font-black uppercase tracking-widest text-primary-blue">Order Details</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Order ID</span>
                <span className="font-black text-gray-800 text-xs">{order.id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Amount Paid</span>
                <span className="font-black text-green-600">₹{Number(order.total_amount).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Status</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-black rounded-full uppercase">{order.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Estimated Delivery</span>
                <span className="font-black text-gray-800">5–7 Business Days</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/account/orders" className="px-6 py-3 bg-primary-blue text-white rounded-full font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors">
            <Package size={16} /> Track My Order
          </Link>
          <Link to="/" className="px-6 py-3 bg-gray-100 text-gray-800 rounded-full font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
            <ShoppingBag size={16} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
