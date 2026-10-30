import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HOTEL_INFO } from '../data/hotelData';
import { Calendar, Users, Sparkles, Star, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero({ onSearchBooking, hotelInfo, reviewStats }) {
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
    <section className="equalirio-hero relative flex items-center justify-center min-h-screen px-4 pt-24 pb-16 overflow-hidden sm:px-6 lg:px-8 bg-hotel-emerald-dark">
      
      {/* Background Media & Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=90"
          alt={`${info.name} Luxury Resort & Bay`}
          className="object-cover object-center w-full h-full filter brightness-75"
        />
        {/* Layered overlays for dramatic contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-hotel-emerald-dark via-black/40 to-black/70"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80"></div>
      </div>

      {/* Decorative Golden Ambient Glows */}
      <div className="absolute z-0 -translate-x-1/2 rounded-full pointer-events-none top-1/4 left-1/2 w-96 h-96 bg-hotel-gold/15 blur-3xl"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto text-center px-2">
        
        {/* Top Award Pill */}
        {reviewStats?.count > 0 && (
          <div className="inline-flex items-center gap-2 bg-hotel-emerald/80 border border-hotel-gold/40 px-4 py-1.5 rounded-md backdrop-blur-md mb-6 animate-fade-in">
            <Star className="w-4 h-4 text-hotel-gold fill-hotel-gold flex-shrink-0" />
            <span className="text-xs font-medium tracking-widest uppercase text-hotel-gold-light whitespace-nowrap">
              Guest rating
            </span>
            <span className="w-1 h-1 rounded-full bg-hotel-gold flex-shrink-0"></span>
            <span className="font-mono text-xs text-white/90 whitespace-nowrap">
              {Number(reviewStats.average).toFixed(1)} rating ({reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-white font-normal tracking-wide leading-[1.1] mb-6 drop-shadow-2xl">
          {info.name}
        </h1>

        <p className="max-w-2xl mb-4 font-serif text-base sm:text-lg md:text-2xl italic font-light tracking-wide text-hotel-gold-light">
          &ldquo;{t('hero.title1')} {t('hero.title2')}&rdquo;
        </p>

        <p className="max-w-xl mb-8 text-sm font-light leading-relaxed text-gray-300 sm:text-base">
          {t('hero.desc')}
        </p>

        {/* Floating Quick Reservation Engine Box */}
        <div className="equalirio-hero-search w-full max-w-4xl p-3 sm:p-5 border shadow-2xl bg-hotel-emerald-dark/85 backdrop-blur-xl border-hotel-gold/30 rounded-2xl gold-border-glow">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Check In */}
            <div className="flex flex-col pb-3 text-left border-b lg:border-b-0 lg:border-r border-white/10 lg:pb-0 lg:pr-4">
              <label className="text-[10px] uppercase tracking-widest text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> {t('hero.checkIn')}
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="text-xs sm:text-sm text-white bg-transparent cursor-pointer focus:outline-none focus:text-hotel-gold w-full"
              />
            </div>

            {/* Check Out */}
            <div className="flex flex-col pb-3 text-left border-b lg:border-b-0 lg:border-r border-white/10 lg:pb-0 lg:pr-4">
              <label className="text-[10px] uppercase tracking-widest text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> {t('hero.checkOut')}
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="text-xs sm:text-sm text-white bg-transparent cursor-pointer focus:outline-none focus:text-hotel-gold w-full"
              />
            </div>

            {/* Guests & Category */}
            <div className="flex flex-col pb-3 text-left border-b lg:border-b-0 lg:border-r border-white/10 lg:pb-0 lg:pr-4">
              <label className="text-[10px] uppercase tracking-widest text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> {t('hero.guests')}
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="bg-transparent text-white text-xs sm:text-sm focus:outline-none cursor-pointer [&>option]:bg-hotel-emerald-dark [&>option]:text-white w-full"
              >
                <option value="1 Guest">1 Guest (Single Suite)</option>
                <option value="2 Guests">2 Guests (Couples Villa)</option>
                <option value="4 Guests">4 Guests (Family Residence)</option>
                <option value="6+ VIP">6+ Guests (Royal Penthouse)</option>
              </select>
            </div>

            {/* Search CTA */}
            <div className="flex items-end col-span-2 lg:col-span-1">
              <button
                type="submit"
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-hotel-gold via-hotel-gold-light to-hotel-gold text-hotel-emerald-dark font-bold text-xs tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all transform hover:scale-[1.02]"
              >
                <span>{t('hero.searchRooms')}</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>

          </form>
        </div>

        {/* Feature Badges under search */}
        <div className="flex flex-wrap items-center justify-center mt-6 text-xs font-light text-gray-300 gap-4 sm:gap-x-8">
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-hotel-gold shrink-0" />
            <span>Best Rate Guarantee</span>
          </div>
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-hotel-gold shrink-0" />
            <span>Complimentary Helipad Transfer</span>
          </div>
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <MapPin className="w-4 h-4 text-hotel-gold shrink-0" />
            <span>Private Coastal Sanctuary</span>
          </div>
        </div>

      </div>

      {/* Down Scroll Indicator */}
      <a
        href="#about"
        className="absolute z-10 flex flex-col items-center gap-2 transition-colors -translate-x-1/2 bottom-6 left-1/2 text-white/60 hover:text-hotel-gold group"
      >
        <div className="flex items-start justify-center w-5 h-8 p-1 border rounded-full border-white/30 group-hover:border-hotel-gold">
          <div className="w-1 h-2 rounded-full bg-hotel-gold animate-bounce"></div>
        </div>
      </a>

    </section>
  );
}
