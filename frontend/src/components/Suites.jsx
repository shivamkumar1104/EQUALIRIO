import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUITES_DATA } from '../data/hotelData';
import { suitesAPI } from '../services/api';
import { Users, Maximize2, Eye, Sparkles, Bed, Check, ArrowRight } from 'lucide-react';

const normalizeSuite = (s) => ({
  id: s._id || s.id,
  _id: s._id || s.id,
  name: s.name,
  category: s.category
    ? (s.category.toLowerCase() === 'villa' ? 'Villas' :
       s.category.toLowerCase() === 'penthouse' ? 'Penthouses' :
       s.category.toLowerCase() === 'suite' ? 'Eco Suites' :
       s.category.charAt(0).toUpperCase() + s.category.slice(1))
    : 'Villas',
  tag: s.tag || (s.isFeatured ? "Most Popular" : "Luxury Haven"),
  price: s.pricePerNight || s.price || 950,
  currency: s.currency || "USD",
  size: s.size ? (typeof s.size === 'object' ? `${s.size.sqm || 185} m² / ${s.size.sqft || 1990} sq ft` : s.size) : '185 m² / 1,990 sq ft',
  guests: s.guests || `${s.maxGuests || 2} Guests`,
  beds: s.beds || `${s.bedrooms || 1} King ${s.bedrooms > 1 ? 'Suites' : '+ 1 Daybed'}`,
  view: s.view ? `${s.view.charAt(0).toUpperCase() + s.view.slice(1)} View` : "Panoramic Ocean View",
  image: (Array.isArray(s.images) && s.images[0] ? (typeof s.images[0] === 'object' ? s.images[0].url : s.images[0]) : s.image) || "/images/Infinity Pool Ocean Villa exterior.jpg",
  images: Array.isArray(s.images) && s.images.length > 0 ? s.images.map(img => typeof img === 'object' ? img.url : img) : (s.images || [s.image]),
  description: s.description || s.shortDescription,
  amenities: Array.isArray(s.amenities) ? s.amenities : [],
  addons: s.addons || []
});

export default function Suites({ onSelectSuite, onBookSuite, currency }) {
  const { t } = useTranslation();
  const [suitesList, setSuitesList] = useState(SUITES_DATA);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let isMounted = true;
    suitesAPI.getAll()
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data?.suites;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const normalized = fetched.map(normalizeSuite);
          setSuitesList(normalized);
        }
      })
      .catch((err) => {
        console.warn('Suites fetch fallback to hotelData:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  const categories = [
    { key: 'All', label: t('suites.filterAll') },
    { key: 'Villas', label: t('suites.filterVillas') },
    { key: 'Penthouses', label: t('suites.filterPenthouses') },
    { key: 'Eco Suites', label: t('suites.filterEcoSuites') }
  ];

  // Currency multiplier map for display demo
  const currencyRates = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.78 },
    JPY: { symbol: '¥', rate: 155.0 },
    IND: { symbol: '₹', rate: 85 }
  };

  const curr = currencyRates[currency] || currencyRates.USD;

  const filteredSuites = activeCategory === 'All'
    ? suitesList
    : suitesList.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase() || (activeCategory === 'Villas' && s.category === 'Villas'));

  const formatPrice = (priceUSD) => {
    const converted = Math.round(priceUSD * curr.rate);
    return `${curr.symbol}${converted.toLocaleString()}`;
  };

  return (
    <section id="suites" className="py-24 px-4 sm:px-6 lg:px-8 bg-hotel-emerald-dark text-white relative">
      
      {/* Decorative Gold Radial Light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-hotel-gold/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-hotel-gold text-xs uppercase tracking-[0.3em] font-medium mb-2">
            <Sparkles className="w-4 h-4" /> {t('suites.subtitle')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white mb-4">
            {t('suites.title')}
          </h2>
          <p className="text-gray-300 text-sm font-light leading-relaxed">
            {t('suites.desc')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center items-center gap-2 sm:gap-4 mb-16 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
                activeCategory === cat.key
                  ? 'bg-hotel-gold text-hotel-emerald-dark shadow-gold scale-105'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Suites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredSuites.map((suite) => (
            <div
              key={suite.id}
              className="bg-hotel-emerald/40 border border-hotel-gold/20 rounded-3xl overflow-hidden hover:border-hotel-gold/60 transition-all duration-500 group flex flex-col justify-between shadow-2xl"
            >
              <div>
                
                {/* Suite Image & Overlay Tag */}
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={suite.image}
                    alt={suite.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-hotel-emerald-dark via-transparent to-black/30"></div>
                  
                  {/* Tag Pill */}
                  <span className="absolute top-4 left-4 bg-hotel-gold text-hotel-emerald-dark font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    {suite.tag}
                  </span>

                  {/* Capacity Pill */}
                  <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-hotel-gold" />
                    <span>{suite.guests}</span>
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6">
                  
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-xl sm:text-2xl text-white font-normal group-hover:text-hotel-gold-light transition-colors">
                      {suite.name}
                    </h3>
                  </div>

                  <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed mb-4 line-clamp-2">
                    {suite.description}
                  </p>

                  {/* Key Details Bar */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/10 text-xs text-gray-300 mb-4 font-light">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-hotel-gold shrink-0" />
                      <span>{suite.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-hotel-gold shrink-0" />
                      <span>{suite.beds}</span>
                    </div>
                  </div>

                  {/* Highlights Bullet Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {suite.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-md flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-hotel-gold" />
                        {amenity}
                      </span>
                    ))}
                    {suite.amenities.length > 3 && (
                      <span className="text-[11px] text-hotel-gold-light self-center ml-1">
                        +{suite.amenities.length - 3} more perks
                      </span>
                    )}
                  </div>

                </div>

              </div>

              {/* Price & Card Actions */}
              <div className="px-5 sm:px-6 py-4 pt-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 block">Starting From</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl text-hotel-gold font-bold">
                      {formatPrice(suite.price)}
                    </span>
                    <span className="text-xs text-gray-400 font-light">{t('suites.perNight')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => onSelectSuite(suite)}
                    className="flex-1 sm:flex-none border border-white/20 hover:border-hotel-gold text-white text-xs uppercase tracking-wider font-semibold px-4 py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-hotel-gold" />
                    <span>{t('suites.viewDetails')}</span>
                  </button>

                  <button
                    onClick={() => onBookSuite(suite)}
                    className="flex-1 sm:flex-none bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-gold flex items-center justify-center gap-1.5"
                  >
                    <span>{t('suites.bookNow')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
