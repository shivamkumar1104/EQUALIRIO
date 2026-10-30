import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GALLERY_DATA } from '../data/hotelData';
import { contentAPI } from '../services/api';
import { Camera, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Gallery() {
  const { t } = useTranslation();
  const [galleryList, setGalleryList] = useState(GALLERY_DATA);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let isMounted = true;
    contentAPI.getGallery({ limit: 30 })
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data?.items;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const formatted = fetched.map((item, idx) => ({
            id: item._id || item.id || `g-${idx}`,
            title: item.title,
            category: item.category,
            image: typeof item.image === 'object' ? item.image.url : item.image,
          }));
          setGalleryList(formatted);
        }
      })
      .catch((err) => {
        console.warn('Gallery live fetch fallback to initial data:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  const categories = [
    { key: 'All', label: t('gallery.all') },
    { key: 'Architecture', label: t('gallery.architecture') },
    { key: 'Suites', label: t('gallery.villas') },
    { key: 'Wellness', label: t('gallery.wellness') },
    { key: 'Dining', label: t('gallery.gastronomy') }
  ];

  const filteredGallery = activeCategory === 'All'
    ? galleryList
    : galleryList.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === 0 ? filteredGallery.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === filteredGallery.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="gallery" className="py-14 px-4 sm:px-6 lg:px-8 bg-hotel-cream relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 text-hotel-gold-dark text-xs uppercase tracking-[0.3em] font-medium mb-2">
            <Camera className="w-4 h-4 text-hotel-emerald" /> {t('gallery.subtitle')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-hotel-emerald-dark font-normal mb-4">
            {t('gallery.title')}
          </h2>
          <p className="text-gray-600 text-sm font-light leading-relaxed">
            Immerse yourself in our architectural symmetry, pristine overwater suites, and natural sanctuary surroundings.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-md text-xs uppercase tracking-widest font-semibold transition-all ${
                activeCategory === cat.key
                  ? 'bg-hotel-emerald text-white shadow-luxury'
                  : 'bg-white text-gray-600 hover:text-hotel-emerald border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGallery.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleOpenLightbox(idx)}
              className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg cursor-pointer group border-2 border-white"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-[10px] uppercase tracking-widest text-hotel-gold font-bold mb-1">
                  {item.category}
                </span>
                <h3 className="font-serif text-xl text-white font-normal flex items-center justify-between">
                  <span>{item.title}</span>
                  <Maximize2 className="w-4 h-4 text-hotel-gold" />
                </h3>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          onClick={handleCloseLightbox}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            onClick={handleCloseLightbox}
            className="absolute top-6 right-6 text-white hover:text-hotel-gold p-2 transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={handlePrev}
            className="absolute left-6 text-white hover:text-hotel-gold p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-6 text-white hover:text-hotel-gold p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] flex flex-col items-center"
          >
            <img
              src={filteredGallery[lightboxIndex].image}
              alt={filteredGallery[lightboxIndex].title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border-2 border-white/20"
            />
            <div className="mt-4 text-center text-white">
              <span className="text-xs uppercase tracking-widest text-hotel-gold block">
                {filteredGallery[lightboxIndex].category}
              </span>
              <h3 className="font-serif text-2xl font-normal">
                {filteredGallery[lightboxIndex].title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
