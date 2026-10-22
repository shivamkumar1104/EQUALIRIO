import React from 'react';
import { useTranslation } from 'react-i18next';
import { REVIEWS_DATA } from '../data/hotelData';
import { Star, Quote, MessageSquarePlus, Award, CheckCircle } from 'lucide-react';

export default function Reviews({ onWriteReview, reviewsList }) {
  const { t } = useTranslation();
  const reviews = reviewsList || REVIEWS_DATA;

  return (
    <section id="reviews" className="py-24 px-4 sm:px-6 lg:px-8 bg-hotel-emerald-dark text-white relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-hotel-gold text-xs uppercase tracking-[0.3em] font-medium mb-2">
            <Award className="w-4 h-4" /> {t('reviews.subtitle')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-white font-normal mb-4">
            {t('reviews.title')}
          </h2>
          <p className="text-gray-300 text-sm font-light leading-relaxed">
            {t('reviews.basedOn')}
          </p>
        </div>

        {/* Rating Breakdown Banner */}
        {(() => {
          // Compute dynamic ratings from reviews
          const allRatings = reviews.map(r => Number(r.rating || r.ratings?.overall || 5));
          const overallRating = allRatings.length > 0
            ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)
            : '4.98';

          // Compute sub-ratings from reviews that have detailed ratings
          const subCategories = [
            { key: 'service', label: 'Service & Butler' },
            { key: 'cleanliness', label: 'Villa Privacy' },
            { key: 'dining', label: 'Gastronomy' },
            { key: 'spa', label: 'Spa & Wellness' },
          ];

          const computeSubRating = (key) => {
            const vals = reviews
              .filter(r => r.ratings && r.ratings[key] != null)
              .map(r => Number(r.ratings[key]));
            if (vals.length > 0) return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
            // Fallback: derive from overall
            const base = parseFloat(overallRating);
            const jitter = key === 'dining' ? -0.08 : key === 'spa' ? 0.02 : 0;
            return Math.min(5, base + jitter).toFixed(1);
          };

          return (
        <div className="bg-hotel-emerald/40 border border-hotel-gold/30 rounded-3xl p-6 sm:p-8 mb-16 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-hotel-gold text-hotel-emerald-dark flex items-center justify-center font-serif text-3xl font-bold shadow-gold">
              {overallRating}
            </div>
            <div>
              <div className="flex text-hotel-gold gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-hotel-gold" />
                ))}
              </div>
              <span className="text-xs uppercase tracking-widest text-white font-semibold">
                {t('reviews.basedOn')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs text-gray-300 font-light border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            {subCategories.map((cat) => (
              <div key={cat.key}>
                <span className="block text-hotel-gold font-bold text-base font-serif">{computeSubRating(cat.key)} / 5</span>
                <span className="text-[10px] uppercase">{cat.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onWriteReview}
            className="shrink-0 bg-white/10 hover:bg-hotel-gold hover:text-hotel-emerald-dark text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full border border-hotel-gold/40 transition-all flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{t('reviews.writeReview')}</span>
          </button>

        </div>
          );
        })()}

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {reviews.map((rev, idx) => {
            const author = rev.author || rev.user?.name || 'Verified Guest';
            const avatar = rev.avatar || rev.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
            const rating = Number(rev.rating || rev.ratings?.overall || 5);
            const content = rev.content || rev.comment || '';
            const title = rev.title || 'Exceptional Stay';
            const role = rev.role || (rev.isVerifiedStay ? 'Verified Stay Guest' : (rev.guestType ? `${rev.guestType.charAt(0).toUpperCase() + rev.guestType.slice(1)} Traveler` : 'Guest Reviewer'));
            const date = rev.date || rev.stayedInMonth || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recent Stay');

            return (
              <div
                key={rev._id || rev.id || `rev-${idx}`}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-hotel-gold/50 transition-all duration-300 relative group"
              >
                <div>
                  <Quote className="w-8 h-8 text-hotel-gold/30 mb-4 group-hover:text-hotel-gold/60 transition-colors" />

                  <div className="flex text-hotel-gold gap-1 mb-3">
                    {[...Array(Math.min(5, Math.max(1, rating)))].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-hotel-gold" />
                    ))}
                  </div>

                  <h3 className="font-serif text-xl text-white font-normal mb-2">
                    "{title}"
                  </h3>

                  <p className="text-gray-300 text-xs font-light leading-relaxed mb-4 italic">
                    "{content}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <img
                    src={avatar}
                    alt={author}
                    className="w-10 h-10 rounded-full object-cover border border-hotel-gold/40"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1">
                      <span>{author}</span>
                      <CheckCircle className="w-3 h-3 text-hotel-gold" />
                    </h4>
                    <span className="text-[10px] text-gray-400 block">{role} • {date}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
