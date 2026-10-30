import React from 'react';
import { useTranslation } from 'react-i18next';
import { DINING_DATA } from '../data/hotelData';
import { Utensils, Clock, ChefHat, Calendar } from 'lucide-react';

export default function Dining({ onReserveTable }) {
  const { t } = useTranslation();

  return (
    <section id="dining" className="equalirio-dining py-14 px-4 sm:px-6 lg:px-8 bg-hotel-emerald-dark text-white relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-hotel-gold text-xs uppercase tracking-[0.3em] font-medium mb-2">
            <ChefHat className="w-4 h-4" /> {t('dining.subtitle')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-white font-normal mb-4">
            {t('dining.title')}
          </h2>
          <p className="text-gray-300 text-sm font-light leading-relaxed">
            {t('dining.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {DINING_DATA.map((venue) => (
            <div
              key={venue.id}
              className="bg-hotel-emerald/30 border border-hotel-gold/30 rounded-3xl overflow-hidden hover:border-hotel-gold transition-all duration-500 flex flex-col justify-between shadow-2xl group"
            >
              <div>
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-hotel-emerald-dark via-transparent to-black/30"></div>
                  
                  <span className="absolute top-4 left-4 bg-hotel-gold text-hotel-emerald-dark font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                    {venue.cuisine}
                  </span>

                  <span className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-hotel-gold" />
                    <span>{venue.hours}</span>
                  </span>
                </div>

                <div className="p-6 sm:p-8">
                  <h3 className="font-serif text-3xl font-normal text-white mb-2 group-hover:text-hotel-gold-light transition-colors">
                    {venue.name}
                  </h3>

                  <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed mb-6">
                    {venue.description}
                  </p>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                    <span className="text-[10px] uppercase tracking-widest text-hotel-gold font-semibold block mb-1">
                      Chef's Signature Creation
                    </span>
                    <span className="text-sm font-serif italic text-white font-medium">
                      "{venue.signatureDish}"
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Utensils className="w-4 h-4 text-hotel-gold" />
                  <span>Dress Code: Smart Resort Casual</span>
                </div>

                <button
                  onClick={() => onReserveTable(venue.name)}
                  className="bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-gold flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('dining.reserveTable')}</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
