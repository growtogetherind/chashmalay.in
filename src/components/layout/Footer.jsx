import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-oa bg-white text-[#8C867E] pt-40 pb-20 border-t border-[#161616]/5">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-40">
          <div className="lg:col-span-6">
            <h2 className="text-[10vw] lg:text-[6vw] font-black leading-none text-[#161616] opacity-10 mb-8 uppercase tracking-tighter select-none">
               CHASHMALY<br/><span className="serif-oa italic">STUDIO</span>
            </h2>
            <p className="max-w-md text-lg leading-relaxed mb-12 text-[#161616]">
               Defining the intersection of optical precision and architectural silhouette. Crafted for the visionary.
            </p>
            <div className="flex gap-8">
               <a href="#" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#A68B67]">
                  Instagram <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </a>
               <a href="#" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#A68B67]">
                  Behance <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </a>
            </div>
          </div>

          <div className="lg:col-span-3">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#161616]/40 mb-10">Collections</h4>
             <ul className="flex flex-col gap-4 text-sm font-medium">
                <li><Link to="/category/eyeglasses" className="hover:text-[#161616] transition-colors">Digital Eye Archive</Link></li>
                <li><Link to="/category/sunglasses" className="hover:text-[#161616] transition-colors">Soleil Collection</Link></li>
                <li><Link to="/category/contacts" className="hover:text-[#161616] transition-colors">Contact Lenses</Link></li>
                <li><Link to="/category/special-power" className="hover:text-[#161616] transition-colors italic font-serif text-lg">Special Edition</Link></li>
             </ul>
          </div>

          <div className="lg:col-span-3">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#161616]/40 mb-10">Studio</h4>
             <ul className="flex flex-col gap-4 text-sm font-medium">
                <li><Link to="/contact" className="hover:text-[#161616] transition-colors">Inquiries</Link></li>
                <li><Link to="/shipping" className="hover:text-[#161616] transition-colors">Shipping Log</Link></li>
                <li><Link to="/returns" className="hover:text-[#161616] transition-colors">Returns</Link></li>
                <li><Link to="/faq" className="hover:text-[#161616] transition-colors">FAQ</Link></li>
             </ul>
          </div>
        </div>

        <div className="footer-bottom-oa flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#161616]/5 relative z-10">
           <div className="text-[9px] font-black uppercase tracking-widest text-[#161616]/20 mb-4 md:mb-0">
              © {new Date().getFullYear()} Chashmaly Digital Studio. All Rights Reserved.
           </div>
           <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-[#161616]/20">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
           </div>
        </div>
      </div>
      
      {/* Decorative Floor Text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[15vw] font-black text-[#161616]/[0.02] pointer-events-none uppercase leading-none select-none italic text-center w-full">
         CHASHMALY
      </div>
    </footer>
  );
};

export default Footer;
