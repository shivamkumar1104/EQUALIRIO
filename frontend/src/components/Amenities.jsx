import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AMENITIES_DATA } from '../data/hotelData';
import { contentAPI } from '../services/api';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';

export default function Amenities({ onOpenInquiry, onOpenSpa }) {
  const { t } = useTranslation();
  const [amenitiesList, setAmenitiesList] = useState(AMENITIES_DATA);
  const [selectedAmenity, setSelectedAmenity] = useState(AMENITIES_DATA[0]);

  useEffect(() => {
    let isMounted = true;
    contentAPI.getAmenities()
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data?.amenities;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const formatted = fetched.map((item, idx) => ({
            id: item._id || item.id || `amenity-${idx}`,
            title: item.title,
            category: item.category,
            image: item.image || AMENITIES_DATA[idx % AMENITIES_DATA.length]?.image,
            description: item.description,
          }));
          setAmenitiesList(formatted);
          setSelectedAmenity(formatted[0]);
        }
      })
      .catch((err) => {
        console.warn('Live amenities fetch fallback to initial data:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  const currentAmenity = selectedAmenity || amenitiesList[0] || AMENITIES_DATA[0];

  return (
    <section id="amenities" className="py-24 px-4 sm:px-6 lg:px-8 bg-hotel-cream relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-hotel-gold-dark text-xs uppercase tracking-[0.3em] font-medium mb-2">
            <Sparkles className="w-4 h-4 text-hotel-emerald" /> {t('amenities.subtitle')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-hotel-emerald-dark font-normal mb-4">
            {t('amenities.title')}
          </h2>
          <p className="text-gray-600 text-sm font-light leading-relaxed">
            {t('amenities.desc')}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Amenities Selector Buttons */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {amenitiesList.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAmenity(item)}
                className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border ${
                  currentAmenity.id === item.id
                    ? 'bg-hotel-emerald text-white border-hotel-gold shadow-luxury scale-[1.02]'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-hotel-gold/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full ${
                    currentAmenity.id === item.id ? 'bg-hotel-gold text-hotel-emerald-dark' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.category}
                  </span>
                  <Compass className={`w-4 h-4 ${currentAmenity.id === item.id ? 'text-hotel-gold' : 'text-gray-400'}`} />
                </div>
                
                <h3 className="font-serif text-2xl font-normal mb-1">
                  {item.title}
                </h3>
                <p className={`text-xs line-clamp-2 font-light ${currentAmenity.id === item.id ? 'text-gray-200' : 'text-gray-500'}`}>
                  {item.description}
                </p>
              </button>
            ))}
          </div>

          {/* Featured Showcase Card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
              <img
                src={currentAmenity.image}
                alt={currentAmenity.title}
                className="w-full h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-hotel-emerald-dark via-hotel-emerald-dark/40 to-transparent"></div>

              <div className="absolute bottom-0 inset-x-0 p-8 sm:p-10 text-white">
                <span className="text-xs uppercase tracking-widest text-hotel-gold font-bold mb-2 block">
                  {t('amenities.subtitle')}
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl font-normal text-white mb-3">
                  {currentAmenity.title}
                </h3>
                <p className="text-gray-200 text-sm font-light max-w-xl leading-relaxed mb-6">
                  {currentAmenity.description}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {currentAmenity.category === 'Wellness' || currentAmenity.title.toLowerCase().includes('spa') ? (
                    <button
                      onClick={() => (onOpenSpa ? onOpenSpa() : onOpenInquiry(currentAmenity.title))}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-hotel-gold to-hotel-gold-dark hover:from-hotel-gold-light hover:to-hotel-gold text-hotel-emerald-dark font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full shadow-gold transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Book Spa Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenInquiry(currentAmenity.title)}
                      className="inline-flex items-center gap-2 bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full shadow-gold transition-all"
                    >
                      <span>{t('amenities.inquireBtn')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
