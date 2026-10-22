import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HOTEL_INFO } from '../data/hotelData';
import { Calendar, Users, Sparkles, Star, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero({ onSearchBooking, hotelInfo }) {
  const { t } = useTranslation();
  const info = hotelInfo || HOTEL_INFO;
  const [checkIn, setCheckIn] = useState('2026-09-10');
  const [checkOut, setCheckOut] = useState('2026-09-15');
  const [guests, setGuests] = useState('2 Guests');
  const [category, setCategory] = useState('All Suites');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchBooking({
      checkIn,
      checkOut,
      guests,
      category
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-hotel-emerald-dark overflow-hidden">
      
      {/* Background Media & Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=90"
          alt={`${info.name} Luxury Resort & Bay`}
          className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-transform duration-10000 animate-pulse"
          style={{ animationDuration: '20s' }}
        />
        {/* Layered overlays for dramatic contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-hotel-emerald-dark via-black/40 to-black/70"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80"></div>
      </div>

      {/* Decorative Golden Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-hotel-gold/15 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* Top Award Pill */}
        <div className="inline-flex items-center gap-2 bg-hotel-emerald/80 border border-hotel-gold/40 px-4 py-1.5 rounded-full backdrop-blur-md mb-6 animate-fade-in">
          <Star className="w-4 h-4 text-hotel-gold fill-hotel-gold" />
          <span className="text-xs uppercase tracking-widest text-hotel-gold-light font-medium">
            {t('hero.badge')}
          </span>
          <span className="w-1 h-1 rounded-full bg-hotel-gold"></span>
          <span className="text-xs text-white/90 font-mono">{info.rating} ⭐ ({info.reviewCount} Reviews)</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-white font-normal tracking-wide leading-[1.1] mb-6 drop-shadow-2xl">
          {info.name}
        </h1>

        <p className="text-lg sm:text-2xl font-serif italic text-hotel-gold-light max-w-2xl mb-4 font-light tracking-wide">
          "{t('hero.title1')} {t('hero.title2')}"
        </p>

        <p className="text-sm sm:text-base text-gray-300 max-w-xl mb-10 leading-relaxed font-light">
          {t('hero.desc')}
        </p>

        {/* Floating Quick Reservation Engine Box */}
        <div className="w-full max-w-4xl bg-hotel-emerald-dark/85 backdrop-blur-xl border border-hotel-gold/30 rounded-2xl p-4 sm:p-6 shadow-2xl gold-border-glow">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Check In */}
            <div className="flex flex-col text-left border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 sm:pr-4">
              <label className="text-[10px] uppercase tracking-widest text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {t('hero.checkIn')}
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none focus:text-hotel-gold cursor-pointer"
              />
            </div>

            {/* Check Out */}
            <div className="flex flex-col text-left border-b sm:border-b-0 lg:border-r border-white/10 pb-3 sm:pb-0 sm:pr-4">
              <label className="text-[10px] uppercase tracking-widest text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {t('hero.checkOut')}
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none focus:text-hotel-gold cursor-pointer"
              />
            </div>

            {/* Guests & Category */}
            <div className="flex flex-col text-left border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 sm:pr-4">
              <label className="text-[10px] uppercase tracking-widest text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {t('hero.guests')}
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer [&>option]:bg-hotel-emerald-dark [&>option]:text-white"
              >
                <option value="1 Guest">1 Guest (Single Suite)</option>
                <option value="2 Guests">2 Guests (Couples Villa)</option>
                <option value="4 Guests">4 Guests (Family Residence)</option>
                <option value="6+ VIP">6+ Guests (Royal Penthouse)</option>
              </select>
            </div>

            {/* Search CTA */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-hotel-gold via-hotel-gold-light to-hotel-gold text-hotel-emerald-dark font-bold text-xs tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all transform hover:scale-[1.02]"
              >
                <span>{t('hero.searchRooms')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

        {/* Feature Badges under search */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-xs text-gray-300 font-light">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-hotel-gold shrink-0" />
            <span>Best Rate Guarantee</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-hotel-gold shrink-0" />
            <span>Complimentary Helipad Transfer</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <MapPin className="w-4 h-4 text-hotel-gold shrink-0" />
            <span>Private Coastal Sanctuary</span>
          </div>
        </div>

      </div>

      {/* Down Scroll Indicator */}
      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60 hover:text-hotel-gold transition-colors group"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">Explore</span>
        <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1 group-hover:border-hotel-gold">
          <div className="w-1 h-2 bg-hotel-gold rounded-full animate-bounce"></div>
        </div>
      </a>

    </section>
  );
}
