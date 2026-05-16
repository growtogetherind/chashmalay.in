import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { subscribeSettings } from '../../lib/firebase';

const Facebook = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const Instagram = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const Twitter = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const Youtube = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 7.1C2.5 7.1 2.3 5.4 3 4.6c.9-.9 2-.9 2.4-1C8.7 3.4 12 3.4 12 3.4s3.3 0 6.6.2c.4.1 1.5.1 2.4 1 .7.8.5 2.5.5 2.5s.2 2 .2 4.1v1.6c0 2.1-.2 4.1-.2 4.1s.2 1.7-.5 2.5c-.9.9-2.1.8-2.6 1-3.6.3-6.4.3-6.4.3s-3.3 0-6.6-.2c-.4-.1-1.5-.1-2.4-1-.7-.8-.5-2.5-.5-2.5s-.2-2-.2-4.1V11.2c0-2.1.2-4.1.2-4.1z"/><polygon points="9.7 15.4 15.8 11.2 9.7 7"/></svg>
);

const Footer = () => {
  const [settings, setSettings] = React.useState({});

  React.useEffect(() => {
    const unsubscribe = subscribeSettings(setSettings);
    return unsubscribe;
  }, []);

  const phone = settings.contact_phone || '+91-9319484119';
  const email = settings.contact_email || 'info@chashmaly.in';
  const address = settings.address || 'Karol Bagh, New Delhi - 110005, India';

  return (
    <footer className="bg-white border-t border-gray-200">

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Column 1 - Brand */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {settings.store_name || 'Chashmaly'}<span className="text-primary">.in</span>
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Optical precision meets everyday style. Premium eyewear for every face and every occasion.
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Facebook size={15} />, href: settings.facebook || '#' },
                { icon: <Instagram size={15} />, href: settings.instagram || '#' },
                { icon: <Twitter size={15} />, href: settings.twitter || '#' },
                { icon: <Youtube size={15} />, href: '#' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 - Contact Us */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Contact us</h4>
            <ul className="flex flex-col gap-3 text-xs text-gray-500">
              <li className="flex items-start gap-2">
                <MapPin size={13} className="text-primary mt-0.5 flex-shrink-0" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={13} className="text-primary flex-shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-primary transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-primary flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
              </li>
            </ul>
          </div>

          {/* Column 3 - Information */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Information</h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-500">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Delivery Info', href: '/shipping' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Contact Us', href: '/contact' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="hover:text-primary transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Privacy & Newsletter */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Privacy & terms</h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-500 mb-6">
              {[
                { label: 'Return Policy', href: '/returns' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Shipping Policy', href: '/shipping' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="hover:text-primary transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Subscribe us</h4>
              <p className="text-xs text-gray-500 mb-3">
                Subscribe to our newsletter to receive promotions and news
              </p>
              <div className="flex overflow-hidden border border-gray-300 rounded">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="text-xs px-3 py-2 flex-1 outline-none"
                />
                <button className="bg-primary text-white px-3 flex items-center hover:bg-blue-900 transition-colors">
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Chashmaly.in. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
