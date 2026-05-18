
import { Camera } from 'lucide-react';
import { FadeIn } from './Motion';

const REELS = [
  { id: 1, url: 'https://www.instagram.com/p/DXjtcJuiM3t/' },
  { id: 2, url: 'https://www.instagram.com/p/DXgjNkOCKX2/' },
  { id: 3, url: 'https://www.instagram.com/p/DXb_AJhCBTv/' }
];

const InstagramShowcase = () => {
  return (
    <section className="py-ej-6 bg-ej-surface-muted overflow-hidden border-t border-ej-border">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-ej-6 gap-ej-4">
           <div>
              <div className="flex items-center gap-2 text-ej-border mb-ej-2">
                 <Camera size={20} />
                 <span className="text-ej-xs font-bold font-sans uppercase">Social Feed</span>
              </div>
              <h2 className="text-ej-4xl font-bold tracking-tight text-ej-border uppercase">
                 In Motion
              </h2>
           </div>
           <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-ej-sm font-bold text-ej-border underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ej-border rounded-ej-xs p-1">
              Follow @Chashmalay
           </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-ej-4">
           {REELS.map((reel, idx) => (
             <FadeIn key={reel.id} delay={idx * 0.1}>
                <div className="relative aspect-[9/16] rounded-ej-xs overflow-hidden bg-ej-surface-raised border border-ej-border">
                   <iframe
                      src={`${reel.url}embed`}
                      className="w-full h-full border-none"
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
