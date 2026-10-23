import React, { useState } from 'react';
import { HOTEL_INFO } from '../data/hotelData';
import { membershipAPI } from '../services/api';
import { Sparkles, MapPin, Phone, Mail, Send, Instagram, Facebook, Youtube, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function Footer({ onToast, hotelInfo, onOpenAuth }) {
  const info = hotelInfo || HOTEL_INFO;
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMembershipPopup, setShowMembershipPopup] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await membershipAPI.subscribe(newsletterEmail.trim());

      if (result.status === 'already_member') {
        // Member exists — email sent
        onToast(result.message || `Exclusive offers have been sent to ${newsletterEmail}`);
        setNewsletterEmail('');
      } else if (result.status === 'subscribed') {
        // New membership created for registered user — welcome email sent
        onToast(result.message || `Welcome! A welcome email has been sent to ${newsletterEmail}`);
        setNewsletterEmail('');
      } else if (result.status === 'not_registered') {
        // Email not registered — show membership popup
        setShowMembershipPopup(true);
      }
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
      onToast(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePopup = () => {
    setShowMembershipPopup(false);
  };

  const handleRegisterClick = () => {
    setShowMembershipPopup(false);
    setNewsletterEmail('');
    if (onOpenAuth) onOpenAuth();
  };

  return (
    <>
      <footer className="bg-hotel-emerald-dark text-white border-t border-hotel-gold/20 pt-16 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
            
            {/* Brand Info */}
            <div className="lg:col-span-4 flex flex-col items-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border border-hotel-gold flex items-center justify-center bg-hotel-emerald">
                  <Sparkles className="w-5 h-5 text-hotel-gold" />
                </div>
                <span className="font-serif text-3xl tracking-[0.2em] font-bold text-white">
                  {info.name}
                </span>
              </div>

              <p className="text-gray-300 text-xs font-light leading-relaxed mb-6 max-w-sm">
                "{info.tagline}". An exclusive eco-resort sanctuary committed to modern equilibrium, sustainable luxury, and unforgettable stays.
              </p>

              <div className="flex items-center gap-4 text-hotel-gold">
                <a href="#" className="p-2 rounded-full border border-white/10 hover:border-hotel-gold hover:bg-white/10 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full border border-white/10 hover:border-hotel-gold hover:bg-white/10 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full border border-white/10 hover:border-hotel-gold hover:bg-white/10 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="text-xs uppercase tracking-widest text-hotel-gold font-semibold mb-4">
                Accommodations
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-300 font-light">
                <li><a href="#suites" className="hover:text-hotel-gold transition-colors">Suites & Villas</a></li>
                <li><a href="#suites" className="hover:text-hotel-gold transition-colors">Penthouses</a></li>
                <li><a href="#suites" className="hover:text-hotel-gold transition-colors">Eco Suites</a></li>
                <li><a href="#gallery" className="hover:text-hotel-gold transition-colors">Resort Gallery</a></li>
              </ul>
            </div>

            {/* Resort Experiences */}
            <div className="lg:col-span-2">
              <h4 className="text-xs uppercase tracking-widest text-hotel-gold font-semibold mb-4">
                Experiences
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-300 font-light">
                <li><a href="#amenities" className="hover:text-hotel-gold transition-colors">Spa & Wellness</a></li>
                <li><a href="#dining" className="hover:text-hotel-gold transition-colors">Fine Dining</a></li>
                <li><a href="#amenities" className="hover:text-hotel-gold transition-colors">Activities</a></li>
                <li><a href="#reviews" className="hover:text-hotel-gold transition-colors">Guest Reviews</a></li>
              </ul>
            </div>

            {/* Newsletter Box */}
            <div className="lg:col-span-4 bg-white/5 border border-white/10 p-6 rounded-2xl">
              <h4 className="text-xs uppercase tracking-widest text-hotel-gold font-semibold mb-2">
                Privé Privilege Club
              </h4>
              <p className="text-xs text-gray-300 font-light mb-4 leading-relaxed">
                Subscribe to receive private villa release dates, seasonal culinary tasting invitations, and exclusive guest packages.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your VIP email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-hotel-gold disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all shadow-gold flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Bottom Contact & Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-light">
            <div className="flex flex-wrap items-center gap-6">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-hotel-gold" />
                {info.address}
              </span>
              {info.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-hotel-gold" />
                  {info.phone}
                </span>
              )}
            </div>

            <div>
              © 2026 {info.name} Luxury Resort & Spa. All Rights Reserved.
            </div>
          </div>

        </div>
      </footer>

      {/* Membership Required Popup */}
      {showMembershipPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-hotel-emerald-dark border border-hotel-gold/40 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-hotel-gold/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-hotel-gold" />
                <h3 className="font-serif text-lg text-white">Membership Required</h3>
              </div>
              <button
                onClick={handleClosePopup}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 bg-hotel-gold/10 border border-hotel-gold/20 rounded-xl p-4">
                <Mail className="w-5 h-5 text-hotel-gold shrink-0" />
                <p className="text-xs text-gray-300">
                  <span className="text-white font-medium">{newsletterEmail}</span> is not registered with us.
                </p>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                To join our <span className="text-hotel-gold font-semibold">Privé Privilege Club</span> and receive exclusive offers, seasonal culinary invitations, and VIP packages, please create an account first.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleClosePopup}
                  className="flex-1 py-2.5 text-xs uppercase tracking-wider font-semibold text-gray-300 border border-white/15 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="flex-1 py-2.5 text-xs uppercase tracking-wider font-bold bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark rounded-xl shadow-gold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
