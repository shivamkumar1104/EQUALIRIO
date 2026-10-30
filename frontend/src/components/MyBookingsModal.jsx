import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Utensils,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  BedDouble,
  Receipt,
  User,
  Coffee,
  Plane,
  Sparkle
} from 'lucide-react';
import { bookingsAPI, diningAPI } from '../services/api';

export default function MyBookingsModal({
  isOpen,
  onClose,
  user,
  currency = 'IND',
  onOpenBooking
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('suites'); // 'suites' | 'dining'
  const [suiteBookings, setSuiteBookings] = useState([]);
  const [diningReservations, setDiningReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [cancelModalItem, setCancelModalItem] = useState(null); // item to cancel
  const [cancelReason, setCancelReason] = useState('Change of travel schedule');
  const [selectedVoucher, setSelectedVoucher] = useState(null); // view printable voucher

  const currencyRates = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.78 },
    JPY: { symbol: '¥', rate: 155.0 },
    IND: { symbol: '₹', rate: 85 }
  };
  const curr = currencyRates[currency] || currencyRates.USD;

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingsRes, diningRes] = await Promise.allSettled([
        bookingsAPI.getMyBookings(),
        diningAPI.getMyReservations()
      ]);

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.data?.bookings) {
        setSuiteBookings(bookingsRes.value.data.bookings);
      } else {
        // Fallback to local storage if API returned no data
        const local = JSON.parse(localStorage.getItem('eql_recent_bookings') || '[]');
        setSuiteBookings(local);
      }

      if (diningRes.status === 'fulfilled' && diningRes.value?.data?.reservations) {
        setDiningReservations(diningRes.value.data.reservations);
      } else {
        const localDining = JSON.parse(localStorage.getItem('eql_recent_dining') || '[]');
        setDiningReservations(localDining);
      }
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
      const local = JSON.parse(localStorage.getItem('eql_recent_bookings') || '[]');
      const localDining = JSON.parse(localStorage.getItem('eql_recent_dining') || '[]');
      setSuiteBookings(local);
      setDiningReservations(localDining);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDashboardData();
    }
  }, [isOpen]);

  const handleCancelBooking = async () => {
    if (!cancelModalItem) return;
    setActionError('');
    setActionLoadingId(cancelModalItem._id || cancelModalItem.bookingId);
    try {
      if (cancelModalItem.type === 'dining') {
        const id = cancelModalItem._id || cancelModalItem.reservationId;
        const response = await diningAPI.cancel(id, cancelReason);
        const cancelled = response?.data?.reservation;
        setDiningReservations((prev) => prev.map((item) => (
          item._id === id || item.reservationId === id
            ? { ...item, ...(cancelled || {}), status: 'cancelled' }
            : item
        )));
      } else {
        const id = cancelModalItem.bookingId || cancelModalItem._id;
        const response = await bookingsAPI.cancel(id, cancelReason);
        const cancelled = response?.data?.booking;
        setSuiteBookings((prev) => prev.map((booking) => (
          booking.bookingId === id || booking._id === id
            ? { ...booking, ...(cancelled || {}), status: 'cancelled' }
            : booking
        )));
      }
      setCancelModalItem(null);
      await fetchDashboardData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel reservation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Stay
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Currently In-House
          </span>
        );
      case 'checked_out':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Stay Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending Confirmation
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-hotel-emerald-dark border border-hotel-gold/30 rounded-3xl shadow-2xl text-white my-auto overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-hotel-gold/15 border border-hotel-gold/30 flex items-center justify-center text-hotel-gold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-hotel-gold font-bold">
                  Guest Concierge Portal
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-hotel-gold"></span>
                <span className="text-xs text-gray-400">Equalirio Sanctuary</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-white">
                My Stays & Reservations
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh Records"
              className="p-2 rounded-xl text-gray-400 hover:text-hotel-gold hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-hotel-gold' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guest Summary Banner */}
        <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-hotel-gold/10 via-transparent to-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-hotel-gold text-hotel-emerald-dark font-bold text-xs flex items-center justify-center">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div>
              <div className="font-semibold text-white">{user?.name || 'Equalirio Guest'}</div>
              <div className="text-gray-400 text-[11px]">{user?.email || 'Registered Member'}</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="block text-hotel-gold font-serif text-lg font-bold leading-tight">
                {suiteBookings.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Suite Bookings</span>
            </div>
            <div className="w-px h-6 bg-white/15"></div>
            <div className="text-center">
              <span className="block text-hotel-gold font-serif text-lg font-bold leading-tight">
                {diningReservations.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Dining Tables</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 pt-4 pb-2 border-b border-white/10 flex gap-4 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('suites')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'suites'
                ? 'border-hotel-gold text-hotel-gold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Suite Stays ({suiteBookings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('dining')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'dining'
                ? 'border-hotel-gold text-hotel-gold'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Dining Reservations ({diningReservations.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
          {actionError && (
            <div role="alert" className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {actionError}
            </div>
          )}
          
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-hotel-gold animate-spin mx-auto" />
              <p className="font-serif text-lg text-white">Loading your sanctuary portfolio...</p>
              <p className="text-xs text-gray-400">Communicating with Equalirio Guest Services.</p>
            </div>
          ) : activeTab === 'suites' ? (
            /* SUITE BOOKINGS TAB */
            suiteBookings.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-white/[0.02] border border-white/10 rounded-3xl p-8">
                <BedDouble className="w-12 h-12 text-hotel-gold/60 mx-auto" />
                <h3 className="font-serif text-xl text-white">No Suite Reservations Found</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  You have not reserved any suites or villas yet. Treat yourself to our private rainforest coastline sanctuary.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenBooking) onOpenBooking();
                  }}
                  className="inline-flex items-center gap-2 bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full shadow-gold transition-transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Reserve a Suite Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {suiteBookings.map((b) => {
                  const suiteName = b.suiteSnapshot?.name || b.suite?.name || 'Luxury Villa Suite';
                  const suiteCategory = b.suiteSnapshot?.category || b.suite?.category || 'Ocean Villa';
                  const suiteImage = b.suiteSnapshot?.image || b.suite?.images?.[0] || '/images/Infinity Pool Ocean Villa exterior.jpg';
                  const bookingRef = b.bookingId || `#EQL-${(b._id || '').slice(-6).toUpperCase()}`;
                  const isCancelable = ['pending', 'confirmed'].includes((b.status || '').toLowerCase());
                  const totalFormatted = b.pricing?.totalAmount
                    ? `${curr.symbol}${Math.round(b.pricing.totalAmount * (b.pricing.currency === 'USD' ? curr.rate : 1)).toLocaleString()}`
                    : 'Paid';

                  return (
                    <div
                      key={b._id || b.bookingId}
                      className="bg-white/5 border border-white/15 hover:border-hotel-gold/50 rounded-2xl p-5 sm:p-6 transition-all shadow-xl group"
                    >
                      <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                        
                        {/* Suite Info + Image */}
                        <div className="flex gap-4 items-center">
                          <img
                            src={suiteImage}
                            alt={suiteName}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[11px] font-bold text-hotel-gold tracking-wider">
                                {bookingRef}
                              </span>
                              {getStatusBadge(b.status)}
                            </div>
                            <h4 className="font-serif text-lg sm:text-xl text-white group-hover:text-hotel-gold-light transition-colors">
                              {suiteName}
                            </h4>
                            <span className="text-[11px] text-gray-400 capitalize block mb-2">
                              {suiteCategory} • {b.guests?.adults || 2} Guests
                            </span>
                            <div className="flex items-center gap-3 text-xs text-gray-300">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-hotel-gold" />
                                {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="font-mono text-hotel-gold font-bold">
                                {b.pricing?.numberOfNights || 1} Night(s)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10 gap-3">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Total Rate</span>
                            <span className="font-serif text-xl font-bold text-white text-hotel-gold">
                              {totalFormatted}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedVoucher(b)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5 text-hotel-gold" />
                              <span>Voucher</span>
                            </button>

                            {isCancelable && (
                              <button
                                onClick={() => setCancelModalItem({ ...b, type: 'suite' })}
                                disabled={actionLoadingId === (b.bookingId || b._id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Add-ons breakdown if any */}
                      {b.addons && b.addons.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2 text-[11px]">
                          <span className="text-gray-400">Included Experiences:</span>
                          {b.addons.map((addon, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-hotel-gold-light"
                            >
                              ✨ {addon.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* DINING RESERVATIONS TAB */
            diningReservations.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-white/[0.02] border border-white/10 rounded-3xl p-8">
                <Utensils className="w-12 h-12 text-hotel-gold/60 mx-auto" />
                <h3 className="font-serif text-xl text-white">No Table Reservations Found</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  Experience Michelin-curated gastronomy and artisanal oceanfront cocktails by reserving a table at our dining pavilions.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    const diningSec = document.getElementById('dining');
                    if (diningSec) diningSec.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full shadow-gold transition-transform hover:-translate-y-0.5"
                >
                  <Utensils className="w-3.5 h-3.5" /> Explore Dining Venues
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {diningReservations.map((d) => {
                  const ref = d.reservationId || `#DIN-${(d._id || '').slice(-6).toUpperCase()}`;
                  const isCancelable = ['pending', 'confirmed'].includes((d.status || '').toLowerCase());

                  return (
                    <div
                      key={d._id || d.reservationId}
                      className="bg-white/5 border border-white/15 hover:border-hotel-gold/50 rounded-2xl p-5 sm:p-6 transition-all shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-hotel-gold tracking-wider">
                            {ref}
                          </span>
                          {getStatusBadge(d.status)}
                          {d.tableNumber && (
                            <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded border border-white/15">
                              Table #{d.tableNumber}
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif text-xl text-white font-normal mb-1">
                          {d.restaurant}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-hotel-gold" />
                            {formatDate(d.date)}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-hotel-gold" />
                            {d.time}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-hotel-gold" />
                            {d.guests} Guest(s)
                          </span>
                        </div>
                        {d.specialRequests && (
                          <p className="text-[11px] text-gray-400 mt-2 italic">
                            Note: "{d.specialRequests}"
                          </p>
                        )}
                      </div>

                      {isCancelable && (
                        <button
                          onClick={() => setCancelModalItem({ ...d, type: 'dining' })}
                          disabled={actionLoadingId === (d._id || d.reservationId)}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Table</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

        </div>

        {/* Footer info note */}
        <div className="px-6 sm:px-8 py-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-hotel-gold" /> Equalirio 24/7 Butler & Concierge Support
          </span>
          <span className="text-hotel-gold font-mono tracking-widest">ECO-SANCTUARY 2026</span>
        </div>

      </div>

      {/* ─── CANCEL CONFIRMATION MODAL ─────────────────────────────────────── */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-md bg-hotel-emerald-dark border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-xl text-white">Cancel Reservation?</h3>
              <p className="text-xs text-gray-300">
                Are you sure you wish to cancel {cancelModalItem.type === 'dining' ? 'your dining table' : 'your suite stay'}?
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-gray-300 uppercase tracking-wider block">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-hotel-gold [&>option]:bg-hotel-emerald-dark"
              >
                <option>Change of travel schedule</option>
                <option>Emergency circumstances</option>
                <option>Rescheduling for another season</option>
                <option>Other reasons</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelModalItem(null)}
                className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={Boolean(actionLoadingId)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-colors disabled:opacity-50"
              >
                {actionLoadingId ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE VOUCHER PREVIEW MODAL ──────────────────────────────── */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-hotel-cream text-hotel-dark rounded-3xl p-6 sm:p-8 shadow-2xl my-auto border-2 border-hotel-gold">
            <button
              onClick={() => setSelectedVoucher(null)}
              className="absolute top-4 right-4 text-hotel-dark/60 hover:text-hotel-dark"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center pb-4 border-b border-hotel-dark/15 space-y-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-hotel-emerald-dark font-bold">
                Official Guest Stay Voucher
              </span>
              <h2 className="font-serif text-3xl text-hotel-emerald-dark font-bold">
                EQUALIRIO
              </h2>
              <p className="text-[11px] text-hotel-dark/70 italic">
                Eco Luxury Hotel & Sanctuary Spa • Rio Sanctuary Bay
              </p>
            </div>

            {/* Details */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-hotel-dark/10">
                <span className="text-hotel-dark/60 uppercase tracking-wider text-[10px]">Booking Reference</span>
                <span className="font-mono font-bold text-sm text-hotel-emerald-dark">
                  {selectedVoucher.bookingId || `#EQL-${(selectedVoucher._id || '').slice(-6).toUpperCase()}`}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-hotel-dark/10">
                <span className="text-hotel-dark/60 uppercase tracking-wider text-[10px]">Suite Reserved</span>
                <span className="font-serif font-bold text-hotel-emerald-dark">
                  {selectedVoucher.suiteSnapshot?.name || selectedVoucher.suite?.name || 'Luxury Villa'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-hotel-dark/10">
                <span className="text-hotel-dark/60 uppercase tracking-wider text-[10px]">Check-In / Out</span>
                <span className="font-semibold text-hotel-emerald-dark">
                  {formatDate(selectedVoucher.checkIn)} → {formatDate(selectedVoucher.checkOut)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-hotel-dark/10">
                <span className="text-hotel-dark/60 uppercase tracking-wider text-[10px]">Guest Name</span>
                <span className="font-semibold text-hotel-emerald-dark">
                  {selectedVoucher.guestInfo?.fullName || user?.name || 'Valued Guest'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-hotel-dark/10">
                <span className="text-hotel-dark/60 uppercase tracking-wider text-[10px]">Status</span>
                <span className="font-bold uppercase text-emerald-800 tracking-wider">
                  {selectedVoucher.status || 'Confirmed'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 bg-hotel-emerald-dark hover:bg-hotel-emerald text-hotel-gold font-bold text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Luxury Voucher
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
