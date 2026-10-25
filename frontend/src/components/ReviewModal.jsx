import React, { useEffect, useState } from 'react';
import { LoaderCircle, Star, X } from 'lucide-react';
import { bookingsAPI, reviewsAPI } from '../services/api';

const extractBookings = (response) => response.bookings ?? response.data?.bookings ?? [];

export default function ReviewModal({ isOpen, onClose, onReviewSubmitted }) {
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    let active = true;
    setLoading(true);
    setError('');
    bookingsAPI.getMyBookings({ status: 'checked_out', limit: 100 })
      .then((response) => {
        if (!active) return;
        const completedBookings = extractBookings(response).filter((booking) => booking.suite?._id || booking.suite);
        setBookings(completedBookings);
        setSelectedBookingId(completedBookings[0]?._id || '');
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Your completed bookings could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const booking = bookings.find((item) => item._id === selectedBookingId);
    const suiteId = booking?.suite?._id || booking?.suite;
    if (!booking || !suiteId) {
      setError('Choose a completed stay before submitting a review.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await reviewsAPI.create({
        bookingId: booking._id,
        suiteId,
        ratings: { overall: rating },
        title: title.trim(),
        comment: comment.trim(),
      });
      setComment('');
      setTitle('');
      onClose();
      await onReviewSubmitted();
    } catch (requestError) {
      setError(requestError.message || 'Your review could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="review-modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-hotel-gold/30 bg-hotel-emerald-dark p-6 text-white shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-hotel-gold">Completed stays only</p>
            <h2 id="review-modal-title" className="font-serif text-2xl">Share your experience</h2>
          </div>
          <button type="button" aria-label="Close review form" onClick={onClose} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/70">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Loading completed stays...
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/75">
            No completed stays are available for review yet. After a stay is checked out, it will appear here.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/80">
              Completed stay
              <select
                value={selectedBookingId}
                onChange={(event) => setSelectedBookingId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/15 bg-hotel-emerald p-3 text-sm normal-case tracking-normal text-white outline-none focus:border-hotel-gold"
                required
              >
                {bookings.map((booking) => (
                  <option key={booking._id} value={booking._id}>
                    {booking.suite?.name || booking.suiteSnapshot?.name || 'Completed stay'} · {booking.bookingId}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/80">Your rating</legend>
              <div className="flex items-center gap-2" aria-label={`Selected rating: ${rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    aria-pressed={rating === value}
                    onClick={() => setRating(value)}
                    className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-hotel-gold"
                  >
                    <Star className={`h-7 w-7 ${value <= rating ? 'fill-hotel-gold text-hotel-gold' : 'text-white/30'}`} />
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block text-xs font-semibold uppercase tracking-widest text-white/80">
              Title (optional)
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                className="mt-2 w-full rounded-lg border border-white/15 bg-hotel-emerald p-3 text-sm normal-case tracking-normal text-white outline-none placeholder:text-white/40 focus:border-hotel-gold"
                placeholder="A short summary"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-widest text-white/80">
              Your review
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                minLength={20}
                maxLength={2000}
                required
                rows={5}
                className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-hotel-emerald p-3 text-sm normal-case tracking-normal text-white outline-none placeholder:text-white/40 focus:border-hotel-gold"
                placeholder="Tell other guests about your real experience (at least 20 characters)."
              />
            </label>

            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !selectedBookingId || rating === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-hotel-gold px-4 py-3 text-sm font-bold text-hotel-emerald-dark transition hover:bg-hotel-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit verified review'}
            </button>
          </form>
        )}

        {!loading && error && bookings.length === 0 && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </section>
    </div>
  );
}
