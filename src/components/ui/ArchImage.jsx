import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ArchImage = ({ src, alt, className = '', containerClass = '' }) => {
    const ref = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);

    return (
        <div 
            ref={ref}
            className={`relative overflow-hidden mask-arch shadow-2xl ${containerClass}`}
            style={{ 
                boxShadow: "inset 0 0 50px rgba(0,0,0,0.1), 0 30px 60px rgba(0,0,0,0.05)"
            }}
        >
            <motion.img 
                src={src} 
                alt={alt} 
                className={`w-full h-full object-cover ${className}`}
                style={{ y, scale }}
            />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-black/5 rounded-[inherit]" />
        </div>
    );
};

export default ArchImage;
