import React, { useCallback, useEffect, useState } from 'react';
import { Search, MapPin, Users, BedDouble, Bath, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { staysAPI } from '../services/api';

const formatNightlyPrice = (minorUnits, currency) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minorUnits / 100);
  } catch {
    return `${currency} ${(minorUnits / 100).toFixed(2)}`;
  }
};

export default function StaysMarketplace() {
  const [destination, setDestination] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const loadListings = useCallback(async (filters = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await staysAPI.search({
        limit: 12,
        ...(filters.destination ? { city: filters.destination } : {}),
        ...(filters.guests ? { guests: filters.guests } : {}),
        ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
      });
      setListings(response.listings || []);
    } catch (loadError) {
      setError(loadError.message || 'Stays could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleSearch = (event) => {
    event.preventDefault();
    setHasSearched(true);
    loadListings({
      destination: destination.trim(),
      guests: guestCount,
      propertyType,
    });
  };

  return (
    <section id="stays-marketplace" className="relative overflow-hidden bg-hotel-cream px-4 py-20 text-hotel-dark sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-hotel-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-hotel-emerald">
            <Sparkles className="h-4 w-4" />
            EQUALIRIO stays
          </div>
          <h2 className="font-serif text-3xl font-normal text-hotel-emerald-dark sm:text-5xl">Find a place to feel at home</h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Explore independently hosted stays selected for memorable trips. Search by destination and guest capacity.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mx-auto mb-10 grid max-w-5xl gap-3 rounded-3xl border border-hotel-emerald/10 bg-white p-3 shadow-xl md:grid-cols-[1.4fr_0.7fr_0.9fr_auto] md:items-end md:rounded-full md:p-2">
          <div className="px-3 py-2">
            <label htmlFor="stay-destination" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-hotel-emerald-dark">Destination</label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-hotel-gold-dark" />
              <input id="stay-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="City" maxLength={100} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
            </div>
          </div>
          <div className="px-3 py-2">
            <label htmlFor="stay-guests" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-hotel-emerald-dark">Guests</label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-hotel-gold-dark" />
              <input id="stay-guests" type="number" min="1" max="100" value={guestCount} onChange={(event) => setGuestCount(event.target.value)} placeholder="Any" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
            </div>
          </div>
          <div className="px-3 py-2">
            <label htmlFor="stay-property-type" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-hotel-emerald-dark">Stay type</label>
            <select id="stay-property-type" value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="w-full bg-transparent text-sm outline-none">
              <option value="">All types</option>
              {['house', 'apartment', 'villa', 'cabin', 'guesthouse', 'hotel', 'other'].map((type) => <option key={type} value={type} className="capitalize">{type}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-hotel-emerald-dark px-6 text-sm font-semibold text-white transition-colors hover:bg-hotel-emerald disabled:opacity-60">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search stays
          </button>
        </form>

        {error && (
          <div role="alert" className="mx-auto mb-8 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button type="button" onClick={() => loadListings({ destination: destination.trim(), guests: guestCount, propertyType })} className="inline-flex items-center gap-2 font-semibold underline underline-offset-4">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-600" role="status">
            <LoaderCircle className="h-5 w-5 animate-spin text-hotel-emerald" />
            Finding published stays...
          </div>
        ) : listings.length === 0 ? (
          <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-hotel-emerald/20 bg-white/70 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-hotel-emerald/10 text-hotel-emerald">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl text-hotel-emerald-dark">
              {hasSearched ? 'No stays match those filters yet' : 'New stays are on their way'}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
              {hasSearched
                ? 'Try a different city, guest count, or stay type.'
                : 'Approved hosts can publish stays here. Check back soon for new places to discover.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const cover = listing.photos?.find((photo) => photo.isCover) || listing.photos?.[0];
              return (
                <article key={listing._id} className="group overflow-hidden rounded-3xl border border-hotel-emerald/10 bg-white shadow-sm transition-shadow hover:shadow-xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-hotel-emerald/5">
                    {cover?.url ? (
                      <img src={cover.url} alt={cover.alt || listing.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">Photo coming soon</div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-hotel-emerald-dark backdrop-blur">
                      {listing.propertyType}
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 font-serif text-lg text-hotel-emerald-dark">{listing.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{[listing.location?.publicArea, listing.location?.city, listing.location?.country].filter(Boolean).join(', ')}</span>
                        </p>
                      </div>
                      {listing.host?.displayName && <span className="max-w-24 shrink-0 truncate rounded-full bg-hotel-emerald/5 px-2.5 py-1 text-[10px] text-hotel-emerald-dark">Host {listing.host.displayName}</span>}
                    </div>
                    <div className="flex items-center gap-4 border-y border-gray-100 py-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-hotel-gold-dark" />{listing.capacity?.guests} guests</span>
                      <span className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5 text-hotel-gold-dark" />{listing.capacity?.beds} beds</span>
                      <span className="inline-flex items-center gap-1.5"><Bath className="h-3.5 w-3.5 text-hotel-gold-dark" />{listing.capacity?.bathrooms} baths</span>
                    </div>
                    {listing.amenities?.length > 0 && <p className="line-clamp-1 text-xs text-gray-500">{listing.amenities.slice(0, 3).join(' · ')}</p>}
                    <p className="text-sm text-gray-600">
                      <strong className="text-base text-hotel-emerald-dark">{formatNightlyPrice(listing.nightlyPriceMinor, listing.currency)}</strong>
                      <span className="ml-1 text-xs">nightly rate · before any applicable taxes or fees</span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
