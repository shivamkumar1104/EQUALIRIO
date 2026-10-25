import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Quote, MessageSquarePlus, Award, CheckCircle } from 'lucide-react';

export default function Reviews({
  onWriteReview,
  reviewsList = [],
  reviewStats = { average: null, count: 0 },
  isLoading = false,
  loadError = '',
}) {
  const { t } = useTranslation();
  const hasReviews = reviewsList.length > 0 && reviewStats.count > 0;

  return (
    <section id="reviews" className="relative bg-hotel-emerald-dark px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-hotel-gold">
            <Award className="h-4 w-4" /> {t('reviews.subtitle')}
          </div>
          <h2 className="mb-4 font-serif text-3xl font-normal text-white sm:text-5xl">
            {t('reviews.title')}
          </h2>
          <p className="text-sm font-light leading-relaxed text-gray-300">
            Reviews are shared by guests after a completed stay.
          </p>
        </div>

        {isLoading ? (
          <p role="status" className="py-10 text-center text-sm text-gray-300">Loading guest reviews...</p>
        ) : loadError ? (
          <p role="alert" className="py-10 text-center text-sm text-red-200">{loadError}</p>
        ) : hasReviews ? (
          <>
            <div className="mb-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-hotel-gold/30 bg-hotel-emerald/40 p-6 shadow-2xl md:flex-row sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-hotel-gold font-serif text-3xl font-bold text-hotel-emerald-dark shadow-gold">
                  {Number(reviewStats.average).toFixed(1)}
                </div>
                <div>
                  <div className="mb-1 flex gap-1 text-hotel-gold">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${index < Math.round(reviewStats.average) ? 'fill-hotel-gold' : 'opacity-30'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-white">
                    Based on {reviewStats.count} verified {reviewStats.count === 1 ? 'stay' : 'stays'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onWriteReview}
                className="flex shrink-0 items-center gap-2 rounded-full border border-hotel-gold/40 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-hotel-gold hover:text-hotel-emerald-dark"
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>{t('reviews.writeReview')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
              {reviewsList.map((review) => {
                const rating = Number(review.ratings?.overall) || 0;
                const author = review.user?.name || 'Guest';
                const date = review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                  : '';

                return (
                  <article
                    key={review._id}
                    className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-hotel-gold/50 sm:p-6"
                  >
                    <div>
                      <Quote className="mb-4 h-8 w-8 text-hotel-gold/40" />
                      <div className="mb-3 flex gap-1 text-hotel-gold" aria-label={`${rating} out of 5 stars`}>
                        {[...Array(5)].map((_, index) => (
                          <Star key={index} className={`h-3.5 w-3.5 ${index < Math.round(rating) ? 'fill-hotel-gold' : 'opacity-30'}`} />
                        ))}
                      </div>
                      {review.title && <h3 className="mb-2 font-serif text-xl font-normal text-white">{review.title}</h3>}
                      <p className="mb-4 whitespace-pre-wrap text-xs font-light italic leading-relaxed text-gray-300">{review.comment}</p>
                    </div>
                    <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                      {review.user?.avatar ? (
                        <img
                          src={review.user.avatar}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 rounded-full border border-hotel-gold/40 object-cover"
                        />
                      ) : (
                        <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-hotel-gold/40 bg-hotel-gold/10 text-sm font-semibold text-hotel-gold">
                          {author.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="flex items-center gap-1 text-xs font-semibold text-white">
                          <span>{author}</span>
                          {review.isVerifiedStay && <CheckCircle className="h-3 w-3 text-hotel-gold" aria-label="Verified stay" />}
                        </h4>
                        <span className="block text-[10px] text-gray-400">
                          {review.isVerifiedStay ? 'Verified stay' : 'Guest'}{date ? ` · ${date}` : ''}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-hotel-gold/30 bg-white/[0.03] px-6 py-10 text-center">
            <MessageSquarePlus className="mx-auto mb-3 h-8 w-8 text-hotel-gold/70" />
            <h3 className="font-serif text-xl text-white">No guest reviews yet</h3>
            <p className="mt-2 text-sm text-gray-300">After your completed stay, you can share an honest review here.</p>
            <button
              type="button"
              onClick={onWriteReview}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-hotel-gold/40 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-hotel-gold hover:text-hotel-emerald-dark"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>{t('reviews.writeReview')}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
