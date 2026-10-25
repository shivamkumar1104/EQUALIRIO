import React, { useEffect, useState } from 'react';
import { BadgeCheck, Building2, Check, LoaderCircle, RefreshCw, X, XCircle } from 'lucide-react';
import { hostAPI } from '../services/api';

export default function MarketplaceReviewModal({ isOpen, onClose }) {
  const [applications, setApplications] = useState([]);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadQueues = async () => {
    setLoading(true);
    setError('');
    try {
      const [applicationResponse, listingResponse] = await Promise.all([
        hostAPI.getApplicationQueue({ status: 'pending' }),
        hostAPI.getListingReviewQueue(),
      ]);
      setApplications(applicationResponse.hostProfiles || []);
      setListings(listingResponse.listings || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load marketplace review queues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadQueues();
  }, [isOpen]);

  if (!isOpen) return null;

  const decideApplication = async (profileId, status) => {
    setPendingId(profileId);
    setError('');
    setNotice('');
    try {
      await hostAPI.reviewApplication(profileId, { status });
      setApplications((current) => current.filter((profile) => profile._id !== profileId));
      setNotice(`Host application ${status}.`);
    } catch (actionError) {
      setError(actionError.message || 'Could not review host application.');
    } finally {
      setPendingId('');
    }
  };

  const decideListing = async (listingId, status) => {
    setPendingId(listingId);
    setError('');
    setNotice('');
    try {
      await hostAPI.reviewListing(listingId, { status });
      setListings((current) => current.filter((listing) => listing._id !== listingId));
      setNotice(`Listing ${status === 'published' ? 'approved and published' : 'rejected'}.`);
    } catch (actionError) {
      setError(actionError.message || 'Could not review listing.');
    } finally {
      setPendingId('');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="marketplace-review-title" className="my-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-hotel-gold/30 bg-hotel-emerald-dark text-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-hotel-gold/30 bg-hotel-gold/10 text-hotel-gold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-hotel-gold">Marketplace moderation</p>
              <h2 id="marketplace-review-title" className="font-serif text-xl sm:text-2xl">Host & listing review</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadQueues} disabled={loading} aria-label="Refresh review queues" className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close marketplace review" className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <nav className="flex gap-2 border-b border-white/10 px-5 py-3 sm:px-7" aria-label="Marketplace review queue">
          <button type="button" onClick={() => setActiveTab('applications')} className={`rounded-lg px-3 py-2 text-sm ${activeTab === 'applications' ? 'bg-hotel-gold text-hotel-emerald-dark' : 'text-gray-300 hover:bg-white/10'}`}>
            Host applications ({applications.length})
          </button>
          <button type="button" onClick={() => setActiveTab('listings')} className={`rounded-lg px-3 py-2 text-sm ${activeTab === 'listings' ? 'bg-hotel-gold text-hotel-emerald-dark' : 'text-gray-300 hover:bg-white/10'}`}>
            Stay listings ({listings.length})
          </button>
        </nav>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-7">
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{notice}</p>}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-300">
              <LoaderCircle className="h-5 w-5 animate-spin text-hotel-gold" /> Loading moderation queues...
            </div>
          ) : activeTab === 'applications' ? (
            applications.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-gray-400">No host applications are waiting for review.</p>
            ) : applications.map((application) => (
              <article key={application._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{application.displayName}</h3>
                    <p className="mt-1 text-xs text-gray-400">{application.user?.name} · {application.user?.email}</p>
                    <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{application.bio || 'No host bio provided.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => decideApplication(application._id, 'approved')} disabled={pendingId === application._id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50">
                      {pendingId === application._id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                    </button>
                    <button type="button" onClick={() => decideApplication(application._id, 'rejected')} disabled={pendingId === application._id} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : listings.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-gray-400">No stay listings are waiting for review.</p>
          ) : listings.map((listing) => (
            <article key={listing._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                {listing.photos?.[0]?.url && <img src={listing.photos[0].url} alt="" className="h-36 w-full rounded-xl object-cover sm:w-48" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-hotel-gold">{listing.host?.displayName} · {listing.host?.user?.email}</p>
                  <h3 className="mt-1 font-serif text-xl">{listing.title}</h3>
                  <p className="mt-1 text-xs capitalize text-gray-400">{listing.propertyType} · {listing.location?.city}, {listing.location?.country} · {listing.capacity?.guests} guests</p>
                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{listing.description}</p>
                  <p className="mt-2 text-sm font-semibold text-hotel-gold">{listing.currency} {(listing.nightlyPriceMinor / 100).toFixed(2)} <span className="font-normal text-gray-400">/ night</span></p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => decideListing(listing._id, 'published')} disabled={pendingId === listing._id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50">
                      {pendingId === listing._id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />} Approve & publish
                    </button>
                    <button type="button" onClick={() => decideListing(listing._id, 'rejected')} disabled={pendingId === listing._id} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
