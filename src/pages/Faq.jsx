import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShoppingBag, Truck, RotateCcw, Shield } from 'lucide-react';

const Faq = () => {
  const faqCategories = [
    {
      id: 'general',
      title: 'General',
      icon: <HelpCircle className="text-primary shrink-0" size={20} />,
      items: [
        {
          q: 'Where is your main branch located?',
          a: 'Our main store is located at Shop no 7, Trimurti Plaza, Somatne Phata, Somatane, Maharashtra 410506. We started our operations here in 2020.'
        },
        {
          q: 'How can I contact Chashmalay customer support?',
          a: 'You can reach us through our customer care phone number +91 9319484119 or via email at info@chashmalay.in. Our team is available Monday through Sunday from 10:00 AM to 9:00 PM.'
        },
        {
          q: 'Can I purchase prescription lenses online?',
          a: 'Yes! You can easily place an order online. For customized prescription glasses, you can upload your prescription directly on the product details page or send it via email alongside your order number.'
        }
      ]
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      icon: <Truck className="text-primary shrink-0" size={20} />,
      items: [
        {
          q: 'Do you charge for shipping?',
          a: 'No, we deliver all products free of cost across India.'
        },
        {
          q: 'How long does delivery take?',
          a: 'Estimated time of delivery is 5 to 10 working days. Some customized prescription items or specialized contact lenses may take slightly longer.'
        },
        {
          q: 'What should I do if the parcel seal is broken?',
          a: 'Please do not accept the delivery if the parcel seal is broken or tampered with. Reach out to our customer care immediately so we can assist you.'
        }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & Cancellations',
      icon: <RotateCcw className="text-primary shrink-0" size={20} />,
      items: [
        {
          q: 'What is your return policy?',
          a: 'We offer an easy 7-day return policy for manufacturing defects. Products must be in brand new, unworn condition with all original packaging, price tags, and accessories intact. We request you to record a video while unboxing your parcel to help process returns smoothly.'
        },
        {
          q: 'Can I cancel my order?',
          a: 'For frames, sunglasses, or contact lenses, orders can be cancelled within 12 hours of booking or before the product is shipped (whichever is earlier). For complete spectacles (frame + powered lens), cancellation must be done within 4 hours since lenses are custom crafted.'
        },
        {
          q: 'Are custom lenses refundable?',
          a: 'No, the cost of powered lenses cannot be refunded under any circumstances as they are custom-ground to your unique prescription. For spectacles return, only the frame cost can be refunded if it is returned in brand new condition.'
        }
      ]
    },
    {
      id: 'warranty',
      title: 'Warranty & Customization',
      icon: <Shield className="text-primary shrink-0" size={20} />,
      items: [
        {
          q: 'Do products come with a warranty?',
          a: 'Yes, we provide a 3-month warranty against manufacturing defects (such as hinges and welding points on frames). For branded products, we forward the standard manufacturer warranty directly to you.'
        },
        {
          q: 'Are Ray-Ban Meta Smart Glasses compatible with prescriptions?',
          a: 'Yes! Ray-Ban Meta Smart Glasses are compatible with prescription lenses for total power (Sph + Cyl) between -6.00 and +4.00. However, please note that no heat or frame bending adjustments can be applied to smart glasses frames.'
        }
      ]
    }
  ];

  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (catId, index) => {
    const key = `${catId}-${index}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectedCategory = faqCategories.find(c => c.id === activeCategory);

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600">
            Find answers to commonly asked questions about our products, shipping, returns, and ordering processes.
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex flex-wrap gap-2 justify-center mb-10 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
          {faqCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {cat.icon}
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
            {selectedCategory.icon}
            <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.title}</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {selectedCategory.items.map((item, index) => {
              const isOpen = !!openItems[`${activeCategory}-${index}`];
              return (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  <button
                    onClick={() => toggleItem(activeCategory, index)}
                    className="w-full flex items-center justify-between text-left gap-4 py-2 group focus:outline-none"
                  >
                    <span className="font-bold text-gray-800 group-hover:text-primary transition-colors leading-relaxed">
                      {item.q}
                    </span>
                    <span className="text-gray-400 shrink-0">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  
                  {isOpen && (
                    <div className="mt-3 text-sm text-gray-600 leading-relaxed pl-1 animate-fadeIn">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Faq;
