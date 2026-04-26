import React from 'react';
import { Camera, Play, Heart, MessageCircle } from 'lucide-react';
import { FadeIn } from './Motion';

const REELS = [
  { id: 1, url: 'https://www.instagram.com/p/DXjtcJuiM3t/', thumbnail: 'https://cdn.pixabay.com/vimeo/328229415/eyewear-22927.mp4?width=1280' },
  { id: 2, url: 'https://www.instagram.com/p/DXgjNkOCKX2/', thumbnail: 'https://cdn.pixabay.com/vimeo/328229415/eyewear-22927.mp4?width=1280' },
  { id: 3, url: 'https://www.instagram.com/p/DXb_AJhCBTv/', thumbnail: 'https://cdn.pixabay.com/vimeo/328229415/eyewear-22927.mp4?width=1280' },
  { id: 4, url: 'https://www.instagram.com/p/DXjtcJuiM3t/', thumbnail: 'https://cdn.pixabay.com/vimeo/328229415/eyewear-22927.mp4?width=1280' }
];

const InstagramShowcase = () => {
  return (
    <section className="py-24 bg-background overflow-hidden border-t border-divider">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
           <div>
              <div className="flex items-center gap-3 text-accent-dark mb-4">
                 <Camera size={20} />
                 <span className="text-xs font-sans font-bold uppercase tracking-[0.3em]">On Instagram</span>
              </div>
              <h2 className="text-4xl md:text-6xl text-primary tracking-tighter">
                 Seen in <span className="italic font-light text-secondary">Motion.</span>
              </h2>
           </div>
           <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-xs font-sans font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2 hover:border-accent-dark transition-colors">
              Follow @Chashmaly
           </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {REELS.slice(0, 3).map((reel, idx) => (
             <FadeIn key={reel.id} delay={idx * 0.1}>
                <div className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-surface-flat border border-divider shadow-sm">
                   <iframe
                      src={`${reel.url}embed`}
                      className="w-full h-full border-none"
                      allowTransparency="true"
                      allow="encrypted-media"
                      frameBorder="0"
                      scrolling="no"
                      title={`Instagram-${reel.id}`}
                      loading="lazy"
                   ></iframe>
                </div>
             </FadeIn>
           ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramShowcase;
