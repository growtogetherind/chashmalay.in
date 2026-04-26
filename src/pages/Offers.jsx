import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Sparkles, Copy, ChevronRight } from 'lucide-react';
import { getOffers } from '../lib/firebase';
import toast from 'react-hot-toast';
import './Category.css'; // Reuse some grid styles

const Offers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOffers = async () => {
            const { data } = await getOffers();
            setOffers(data?.filter(o => o.is_active) || []);
            setLoading(false);
        };
        loadOffers();
        window.scrollTo(0, 0);
    }, []);

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success(`Code ${code} copied!`);
    };

    if (loading) return <div className="py-40 text-center font-black text-2xl animate-pulse">Scanning for best deals...</div>;

    return (
        <div className="offers-page min-h-screen py-12 bg-slate-50">
            <div className="container px-4">
                <header className="mb-12 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                    >
                        <Sparkles size={14} /> Exclusive Promotions
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">THE CHASHMALY OFFERS</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto font-medium">Discover premium luxury at unbeatable prices. From seasonal sales to first-order specials, we clear the way for your style.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {offers.map((offer, idx) => (
                        <motion.div 
                            key={offer.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 group border border-slate-100"
                        >
                            <div className="h-64 relative overflow-hidden">
                                {offer.bg_image && (
                                    <img 
                                        src={offer.bg_image} 
                                        alt={offer.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                )}
                                <div className={`absolute inset-0 bg-gradient-to-t ${offer.color_preset || 'from-blue-900/90 to-transparent'}`} />
                                <div className="absolute bottom-6 left-8 right-8 text-white">
                                    <h3 className="text-3xl font-black leading-tight mb-2 italic tracking-tight">{offer.title}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                                        <Tag size={12} /> Special Promotion
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                <p className="text-slate-600 leading-relaxed font-medium mb-8">
                                    {offer.description}
                                </p>
                                
                                {offer.code && (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-between group/code hover:border-blue-400 transition-colors">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PROMO CODE</div>
                                            <div className="text-lg font-black text-slate-800 tracking-wider font-mono">{offer.code}</div>
                                        </div>
                                        <button 
                                            onClick={() => copyCode(offer.code)}
                                            className="p-3 bg-white text-slate-600 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all transform hover:rotate-6"
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                )}

                                <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200">
                                    Shop Now <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {offers.length === 0 && (
                    <div className="py-40 text-center">
                        <div className="text-slate-300 mb-6 flex justify-center"><Tag size={80} strokeWidth={1} /></div>
                        <h2 className="text-2xl font-black text-slate-400">No active offers at the moment.</h2>
                        <p className="text-slate-400">Check back soon for exciting deals!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Offers;
