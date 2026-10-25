import React, { useEffect, useState } from 'react';
import { BadgeCheck, Building2, Clock3, Home, LoaderCircle, Plus, RefreshCw, Send, X } from 'lucide-react';
import { hostAPI } from '../services/api';

const emptyListing = {
  title: '',
  description: '',
  propertyType: 'apartment',
  country: '',
  city: '',
  publicArea: '',
  guests: '2',
  bedrooms: '1',
  beds: '1',
  bathrooms: '1',
  nightlyPrice: '',
  currency: 'USD',
  photoUrl: '',
};

const statusStyles = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  approved: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  rejected: 'border-red-400/30 bg-red-400/10 text-red-200',
  suspended: 'border-red-400/30 bg-red-400/10 text-red-200',
  draft: 'border-white/20 bg-white/5 text-gray-200',
  pending_review: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  published: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  paused: 'border-white/20 bg-white/5 text-gray-200',
};

const formatStatus = (status = '') => status.replaceAll('_', ' ');

export default function HostDashboardModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [listings, setListings] = useState([]);
  const [listingForm, setListingForm] = useState(emptyListing);
  const [editingListingId, setEditingListingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
  const [savingListing, setSavingListing] = useState(false);
  const [submittingId, setSubmittingId] = useState('');
  const [pausingId, setPausingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await hostAPI.getMyProfile();
      const currentProfile = response.hostProfile || null;
      setProfile(currentProfile);
      setDisplayName(currentProfile?.displayName || '');
      setBio(currentProfile?.bio || '');
      if (currentProfile?.status === 'approved') {
        const listingResponse = await hostAPI.getMyListings();
        setListings(listingResponse.listings || []);
      } else {
        setListings([]);
      }
    } catch (loadError) {
      setError(loadError.message || 'Could not load your host dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadDashboard();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = async (event) => {
    event.preventDefault();
    setSavingApplication(true);
    setError('');
    setNotice('');
    try {
      const response = await hostAPI.apply({ displayName, bio });
      setProfile(response.hostProfile);
      setNotice(response.message || 'Host application saved.');
    } catch (submitError) {
      setError(submitError.message || 'Could not save your host application.');
    } finally {
      setSavingApplication(false);
    }
  };

  const handleCreateListing = async (event) => {
    event.preventDefault();
    setSavingListing(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        title: listingForm.title.trim(),
        description: listingForm.description.trim(),
        propertyType: listingForm.propertyType,
        location: {
          country: listingForm.country.trim(),
          city: listingForm.city.trim(),
          publicArea: listingForm.publicArea.trim(),
        },
        capacity: {
          guests: Number(listingForm.guests),
          bedrooms: Number(listingForm.bedrooms),
          beds: Number(listingForm.beds),
          bathrooms: Number(listingForm.bathrooms),
        },
        photos: listingForm.photoUrl.trim()
          ? [{ url: listingForm.photoUrl.trim(), alt: listingForm.title.trim(), isCover: true }]
          : [],
        nightlyPriceMinor: Math.round(Number(listingForm.nightlyPrice) * 100),
        currency: listingForm.currency,
      };
      const response = editingListingId
        ? await hostAPI.updateListing(editingListingId, payload)
        : await hostAPI.createListing(payload);
      setListings((current) => editingListingId
        ? current.map((listing) => listing._id === editingListingId ? response.listing : listing)
        : [response.listing, ...current]);
      setEditingListingId('');
      setListingForm(emptyListing);
      setNotice(editingListingId ? 'Draft updated. Submit it for review when it is ready.' : 'Draft created. Submit it for review when it is ready.');
    } catch (submitError) {
      setError(submitError.message || 'Could not create the listing.');
    } finally {
      setSavingListing(false);
    }
  };

  const handleSubmitForReview = async (listingId) => {
    setSubmittingId(listingId);
    setError('');
    setNotice('');
    try {
      const response = await hostAPI.submitListing(listingId);
      setListings((current) => current.map((listing) =>
        listing._id === listingId ? response.listing : listing
      ));
      setNotice(response.message || 'Listing submitted for review.');
    } catch (submitError) {
      setError(submitError.message || 'Could not submit this listing for review.');
    } finally {
      setSubmittingId('');
    }
  };

  const handlePauseListing = async (listingId) => {
    setPausingId(listingId);
    setError('');
    setNotice('');
    try {
      const response = await hostAPI.pauseListing(listingId);
      setListings((current) => current.map((listing) =>
        listing._id === listingId ? response.listing : listing
      ));
      setNotice(response.message || 'Listing paused and removed from public search.');
    } catch (pauseError) {
      setError(pauseError.message || 'Could not pause this listing.');
    } finally {
      setPausingId('');
    }
  };

  const handleEditListing = (listing) => {
    setEditingListingId(listing._id);
    setListingForm({
      title: listing.title || '',
      description: listing.description || '',
      propertyType: listing.propertyType || 'apartment',
      country: listing.location?.country || '',
      city: listing.location?.city || '',
      publicArea: listing.location?.publicArea || '',
      guests: String(listing.capacity?.guests || 2),
      bedrooms: String(listing.capacity?.bedrooms ?? 1),
      beds: String(listing.capacity?.beds || 1),
      bathrooms: String(listing.capacity?.bathrooms || 1),
      nightlyPrice: String(((listing.nightlyPriceMinor || 0) / 100).toFixed(2)),
      currency: listing.currency || 'USD',
      photoUrl: listing.photos?.[0]?.url || '',
    });
    setError('');
    setNotice(`Editing ${listing.title}. Save the changes before resubmitting.`);
  };

  const fieldClass = 'w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-hotel-gold focus:outline-none';
  const labelClass = 'mb-1.5 block text-xs font-medium text-gray-200';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-dashboard-title"
        className="my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-hotel-gold/30 bg-hotel-emerald-dark text-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-hotel-emerald-dark/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-hotel-gold/30 bg-hotel-gold/10 text-hotel-gold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-hotel-gold">EQUALIRIO Hosts</p>
              <h2 id="host-dashboard-title" className="font-serif text-xl sm:text-2xl">Host dashboard</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadDashboard} disabled={loading} aria-label="Refresh host dashboard" className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close host dashboard" className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-7">
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{notice}</p>}

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-300">
              <LoaderCircle className="h-5 w-5 animate-spin text-hotel-gold" />
              Loading your host dashboard...
            </div>
          ) : !profile || profile.status !== 'approved' ? (
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="rounded-2xl border border-hotel-gold/20 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-hotel-gold">
                  {profile?.status === 'pending' ? <Clock3 className="h-5 w-5" /> : <Home className="h-5 w-5" />}
                  <h3 className="font-serif text-xl">
                    {profile?.status === 'pending' ? 'Application under review' : 'Become an EQUALIRIO host'}
                  </h3>
                </div>
                {profile?.status === 'pending' ? (
                  <p className="text-sm leading-relaxed text-gray-300">
                    Your host application is waiting for the EQUALIRIO team to review it. You can return here to check its status.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-gray-300">
                    Tell us about your host profile. After approval, you can create accommodation listings and submit them for review.
                  </p>
                )}
                {profile?.status && (
                  <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs capitalize ${statusStyles[profile.status] || statusStyles.draft}`}>
                    {formatStatus(profile.status)}
                  </span>
                )}
                {profile?.reviewNote && (
                  <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                    Review note: {profile.reviewNote}
                  </p>
                )}
              </div>

              {!profile || profile.status === 'rejected' ? (
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label htmlFor="host-display-name" className={labelClass}>Public host name</label>
                    <input
                      id="host-display-name"
                      className={fieldClass}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      minLength={2}
                      maxLength={80}
                      required
                      placeholder="How guests will see you"
                    />
                  </div>
                  <div>
                    <label htmlFor="host-bio" className={labelClass}>About you</label>
                    <textarea
                      id="host-bio"
                      className={`${fieldClass} min-h-28 resize-y`}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      maxLength={1000}
                      placeholder="Share what makes you a thoughtful host."
                    />
                  </div>
                  <button type="submit" disabled={savingApplication} className="inline-flex items-center gap-2 rounded-xl bg-hotel-gold px-5 py-3 text-sm font-semibold text-hotel-emerald-dark hover:bg-hotel-gold-light disabled:opacity-50">
                    {savingApplication ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {profile?.status === 'rejected' ? 'Resubmit application' : 'Submit host application'}
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-6 w-6 text-emerald-300" />
                  <div>
                    <h3 className="font-semibold text-white">Welcome, {profile.displayName}</h3>
                    <p className="text-xs text-gray-300">Your host profile is approved. Create a draft stay listing to get started.</p>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs capitalize ${statusStyles.approved}`}>Approved host</span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <form onSubmit={handleCreateListing} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-hotel-gold" />
                    <h3 className="font-serif text-xl">{editingListingId ? 'Edit stay listing' : 'Create a stay listing'}</h3>
                  </div>
                  <div>
                    <label htmlFor="listing-title" className={labelClass}>Listing title</label>
                    <input id="listing-title" className={fieldClass} value={listingForm.title} onChange={(event) => setListingForm({ ...listingForm, title: event.target.value })} minLength={8} maxLength={120} required />
                  </div>
                  <div>
                    <label htmlFor="listing-description" className={labelClass}>Description</label>
                    <textarea id="listing-description" className={`${fieldClass} min-h-24 resize-y`} value={listingForm.description} onChange={(event) => setListingForm({ ...listingForm, description: event.target.value })} minLength={30} maxLength={5000} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="listing-type" className={labelClass}>Property type</label>
                      <select id="listing-type" className={fieldClass} value={listingForm.propertyType} onChange={(event) => setListingForm({ ...listingForm, propertyType: event.target.value })}>
                        {['house', 'apartment', 'villa', 'cabin', 'guesthouse', 'hotel', 'other'].map((type) => <option key={type} value={type} className="bg-hotel-emerald-dark capitalize">{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="listing-country" className={labelClass}>Country</label>
                      <input id="listing-country" className={fieldClass} value={listingForm.country} onChange={(event) => setListingForm({ ...listingForm, country: event.target.value })} maxLength={80} required />
                    </div>
                    <div>
                      <label htmlFor="listing-city" className={labelClass}>City</label>
                      <input id="listing-city" className={fieldClass} value={listingForm.city} onChange={(event) => setListingForm({ ...listingForm, city: event.target.value })} maxLength={100} required />
                    </div>
                    <div>
                      <label htmlFor="listing-area" className={labelClass}>Public area (optional)</label>
                      <input id="listing-area" className={fieldClass} value={listingForm.publicArea} onChange={(event) => setListingForm({ ...listingForm, publicArea: event.target.value })} maxLength={200} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['guests', 'Guests', 100],
                      ['bedrooms', 'Bedrooms', 100],
                      ['beds', 'Beds', 200],
                      ['bathrooms', 'Bathrooms', 100],
                    ].map(([field, label, max]) => (
                      <div key={field}>
                        <label htmlFor={`listing-${field}`} className={labelClass}>{label}</label>
                        <input id={`listing-${field}`} type="number" className={fieldClass} value={listingForm[field]} onChange={(event) => setListingForm({ ...listingForm, [field]: event.target.value })} min={field === 'bedrooms' ? 0 : 1} max={max} required />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                      <label htmlFor="listing-price" className={labelClass}>Nightly price</label>
                      <input id="listing-price" type="number" step="0.01" min="0.01" max="1000000" className={fieldClass} value={listingForm.nightlyPrice} onChange={(event) => setListingForm({ ...listingForm, nightlyPrice: event.target.value })} required />
                    </div>
                    <div>
                      <label htmlFor="listing-currency" className={labelClass}>Currency</label>
                      <select id="listing-currency" className={fieldClass} value={listingForm.currency} onChange={(event) => setListingForm({ ...listingForm, currency: event.target.value })}>
                        {['USD', 'INR', 'EUR', 'GBP'].map((currency) => <option key={currency} value={currency} className="bg-hotel-emerald-dark">{currency}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="listing-photo" className={labelClass}>Cover photo URL (HTTPS recommended)</label>
                    <input id="listing-photo" type="url" className={fieldClass} value={listingForm.photoUrl} onChange={(event) => setListingForm({ ...listingForm, photoUrl: event.target.value })} placeholder="https://..." required />
                  </div>
                  <button type="submit" disabled={savingListing} className="inline-flex items-center gap-2 rounded-xl bg-hotel-gold px-5 py-3 text-sm font-semibold text-hotel-emerald-dark hover:bg-hotel-gold-light disabled:opacity-50">
                    {savingListing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {editingListingId ? 'Save changes' : 'Save draft'}
                  </button>
                  {editingListingId && (
                    <button type="button" onClick={() => { setEditingListingId(''); setListingForm(emptyListing); }} className="ml-2 rounded-xl border border-white/15 px-4 py-3 text-sm text-gray-200 hover:bg-white/10">
                      Cancel edit
                    </button>
                  )}
                </form>

                <div className="space-y-3">
                  <h3 className="font-serif text-xl">Your listings <span className="text-sm text-gray-400">({listings.length})</span></h3>
                  {listings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-gray-400">
                      Your saved listings will appear here.
                    </div>
                  ) : listings.map((listing) => (
                    <article key={listing._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate font-semibold text-white">{listing.title}</h4>
                          <p className="mt-1 text-xs capitalize text-gray-400">{listing.propertyType} · {listing.location?.city}, {listing.location?.country}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] capitalize ${statusStyles[listing.status] || statusStyles.draft}`}>
                          {formatStatus(listing.status)}
                        </span>
                      </div>
                      {listing.reviewNote && <p className="mt-3 rounded-lg bg-red-400/10 p-2 text-xs text-red-100">{listing.reviewNote}</p>}
                      {['draft', 'rejected', 'paused'].includes(listing.status) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleEditListing(listing)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10">
                            Edit draft
                          </button>
                        <button type="button" onClick={() => handleSubmitForReview(listing._id)} disabled={submittingId === listing._id} className="inline-flex items-center gap-2 rounded-lg border border-hotel-gold/30 px-3 py-2 text-xs font-semibold text-hotel-gold hover:bg-hotel-gold/10 disabled:opacity-50">
                          {submittingId === listing._id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Submit for review
                        </button>
                        </div>
                      )}
                      {listing.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => handlePauseListing(listing._id)}
                          disabled={pausingId === listing._id}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-300/10 disabled:opacity-50"
                        >
                          {pausingId === listing._id && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                          Pause listing
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
