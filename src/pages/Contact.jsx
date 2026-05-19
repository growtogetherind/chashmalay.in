import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendTelegramNotification } from '../lib/firebase';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const telegramMessage = `✉️ *New Contact Inquiry!*\n\n*Name:* ${formData.name}\n*Email:* ${formData.email}\n*Phone:* ${formData.phone || 'Not Provided'}\n*Subject:* ${formData.subject || 'General Inquiry'}\n\n*Message:*\n${formData.message}`;
      await sendTelegramNotification(telegramMessage);
    } catch (err) {
      console.error("Failed to send Telegram notification:", err);
    }

    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Your message has been sent successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600">
            Have questions about our products, orders, or prescription fittings? Get in touch with us. We’d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 bg-gray-900 text-white rounded-3xl p-8 md:p-10 shadow-xl space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Get in Touch</h2>
              <p className="text-gray-400 text-sm">
                Fill out the form or reach out through our official contact coordinates.
              </p>
            </div>

            <div className="space-y-6">
              
              {/* Address */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Our Store Address</h3>
                  <p className="text-gray-200 mt-1 leading-relaxed text-sm">
                    Shop no 7, Trimurti Plaza,<br />
                    Somatne Phata, Somatane,<br />
                    Maharashtra 410506
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Call Us</h3>
                  <a href="tel:+919319484119" className="text-gray-200 mt-1 block hover:text-blue-400 transition-colors text-sm">
                    +91 9319484119
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Email Support</h3>
                  <a href="mailto:info@chashmalay.in" className="text-gray-200 mt-1 block hover:text-blue-400 transition-colors text-sm">
                    info@chashmalay.in
                  </a>
                </div>
              </div>

              {/* Timing */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Store Hours</h3>
                  <p className="text-gray-200 mt-1 text-sm">
                    Monday - Sunday: 10:00 AM - 9:00 PM
                  </p>
                </div>
              </div>

            </div>

            {/* Subtle Map visual placeholder */}
            <div className="h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-center p-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                📍 Located at Trimurti Plaza, next to Somatne Phata main road. Easy access and parking available.
              </p>
            </div>

          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={36} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your message has been received. Our support team will get in touch with you shortly.
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Send a Message</h2>
                  <p className="text-gray-500 text-sm">
                    Drop us a message, and we will reply as soon as possible.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Your Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary transition-all text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Subject</label>
                    <input 
                      type="text" 
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Fittings, prescription, etc." 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Your Message *</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5" 
                    placeholder="How can we help you?" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary transition-all text-sm resize-none"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 active:scale-[0.98] transition-all disabled:opacity-50 text-sm shadow-md"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
