import React from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { FadeIn } from './Motion';

const testimonials = [
  {
    id: 1,
    name: "Arjun Sharma",
    role: "Verified Buyer",
    avatar: "https://i.pravatar.cc/80?img=12",
    rating: 5,
    comment: "Absolutely love these glasses! High quality frames and excellent lens clarity. Will definitely buy again.",
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Verified Buyer",
    avatar: "https://i.pravatar.cc/80?img=47",
    rating: 5,
    comment: "Fast delivery, perfect fit and the prescription accuracy is spot on. Best eyewear I've ever bought online.",
  },
  {
    id: 3,
    name: "Vikram Singh",
    role: "Verified Buyer",
    avatar: "https://i.pravatar.cc/80?img=8",
    rating: 4,
    comment: "Premium packaging and great customer support. The frames look even better in person. Highly recommended!",
  }
];

const TestimonialStack = () => {
  return (
    <section className="py-10 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Our customers</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Testimonials</h2>
          </div>
          {/* Navigation dots styled like screenshot */}
          <div className="flex gap-2">
            <button className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-red-600 hover:text-red-600 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-red-600 hover:text-red-600 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <FadeIn key={t.id} delay={idx * 0.1}>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                {/* Comment */}
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.comment}"</p>
                {/* Author */}
                <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${t.name}&background=f3f4f6&color=374151&size=80`; }}
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialStack;
