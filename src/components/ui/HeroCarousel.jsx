import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCarouselItems } from '../../lib/firebase';

const HeroCarousel = () => {
    const [items, setItems] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCarousel = async () => {
            const { data } = await getCarouselItems();
            setItems(data?.filter(i => i.is_active) || []);
            setLoading(false);
        };
        fetchCarousel();
    }, []);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % items.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [items.length]);

    const next = () => setCurrent(prev => (prev + 1) % items.length);
    const prev = () => setCurrent(prev => (prev - 1 + items.length) % items.length);

    if (loading) return <div className="w-full aspect-[21/9] bg-slate-100 animate-pulse rounded-[3rem]" />;
    if (items.length === 0) return null;

    return (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[2rem] md:rounded-[4rem] overflow-hidden group shadow-2xl">
            <AnimatePresence mode="wait">
                <motion.div
                    key={items[current].id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                    className="absolute inset-0"
                >
                    <img 
                        src={items[current].image} 
                        alt={items[current].title} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                    
                    <div className="absolute inset-0 flex items-center">
                        <div className="container mx-auto px-8 md:px-20">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className="max-w-2xl"
                            >
                                {items[current].title && (
                                    <h2 className="text-4xl md:text-7xl font-black text-white mb-4 italic tracking-tight leading-none uppercase">
                                        {items[current].title}
                                    </h2>
                                )}
                                {items[current].subtitle && (
                                    <p className="text-lg md:text-2xl text-white/80 mb-8 font-medium max-w-lg leading-relaxed">
                                        {items[current].subtitle}
                                    </p>
                                )}
                                {items[current].link && (
                                    <Link 
                                        to={items[current].link} 
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-black text-sm uppercase tracking-widest hover:bg-primary-blue hover:text-white transition-all transform hover:scale-105"
                                    >
                                        Explore Collection <ArrowRight size={18} />
                                    </Link>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {items.length > 1 && (
                <>
                    <button 
                        onClick={prev}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 hover:bg-white hover:text-black"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={next}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 hover:bg-white hover:text-black"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                        {items.map((_, i) => (
                            <button 
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all duration-700 ${i === current ? 'w-12 bg-white' : 'w-2 bg-white/40'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default HeroCarousel;
