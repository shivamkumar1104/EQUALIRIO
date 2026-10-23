import React, { useState, useEffect } from 'react';
import { SUITES_DATA } from '../data/hotelData';
import {
  X,
  Calendar,
  Users,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Download,
  Plane,
  Coffee,
  Sparkle,
  Lock,
  QrCode,
  Smartphone,
  Building2,
  AlertCircle,
  Loader2,
  Printer,
  Tag,
  Percent,
  Gift
} from 'lucide-react';
import { paymentAPI } from '../services/api';

/**
 * Dynamically load Razorpay checkout script if not already present in DOM
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BookingModal({
  isOpen,
  onClose,
  initialData,
  currency = 'IND',
  onBookingSuccess
}) {
  if (!isOpen) return null;

  // 1: Suite & Dates, 2: Add-ons, 3: Guest Info, 4: Payment Gateway, 5: Confirmed Voucher
  const [step, setStep] = useState(1);
  const [selectedSuite, setSelectedSuite] = useState(initialData?.suite || SUITES_DATA[0]);
  const [checkIn, setCheckIn] = useState(initialData?.checkIn || '2026-09-10');
  const [checkOut, setCheckOut] = useState(initialData?.checkOut || '2026-09-15');
  const [guestsCount, setGuestsCount] = useState(initialData?.guests || '2 Guests');

  // Addons state
  const [addons, setAddons] = useState({
    helicopter: false,
    spa: false,
    champagneBreakfast: true
  });

  // Guest details state (prefill from localStorage user if available)
  const [guestInfo, setGuestInfo] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('hotel_user') || '{}');
      return {
        fullName: savedUser.name || '',
        email: savedUser.email || '',
        phone: savedUser.phone || '',
        specialRequests: ''
      };
    } catch {
      return { fullName: '', email: '', phone: '', specialRequests: '' };
    }
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'pay_at_hotel'
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [simulationPrompt, setSimulationPrompt] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // VIP Promo & Voucher State
  const PROMO_CODES = {
    'EQUALIRIO2026': { type: 'percent', value: 15, label: '15% Sanctuary Privilege Discount' },
    'LUXURY2026': { type: 'flat', value: 200, label: '$200 VIP Sanctuary Credit' },
    'WELCOME10': { type: 'percent', value: 10, label: '10% Welcome Stays Discount' },
    'HONEYMOON': { type: 'percent', value: 18, label: '18% Romantic Escape Celebration' }
  };
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');

  const currencyRates = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.78 },
    JPY: { symbol: '¥', rate: 155.0 },
    IND: { symbol: '₹', rate: 85 }
  };

  const curr = currencyRates[currency] || currencyRates.USD;

  // Calculate nights
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = Math.max(d2 - d1, 86400000);
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) || 3;

  // Addon pricing in USD
  const addonPrices = {
    helicopter: 450,
    spa: 220,
    champagneBreakfast: 80
  };

  const basePriceUSD = (selectedSuite?.price || 950) * nights;
  const addonsTotalUSD =
    (addons.helicopter ? addonPrices.helicopter : 0) +
    (addons.spa ? addonPrices.spa : 0) +
    (addons.champagneBreakfast ? addonPrices.champagneBreakfast : 0);

  const subtotalUSD = basePriceUSD + addonsTotalUSD;

  // Real-time promo discount calculation
  let discountUSD = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percent') {
      discountUSD = Math.round(subtotalUSD * (appliedPromo.value / 100));
    } else if (appliedPromo.type === 'flat') {
      discountUSD = Math.min(appliedPromo.value, subtotalUSD);
    }
  }

  const netPayableUSD = Math.max(0, subtotalUSD - discountUSD);
  const taxUSD = Math.round(netPayableUSD * 0.12);
  const grandTotalUSD = netPayableUSD + taxUSD;

  // Razorpay base INR amount (1 USD = 85 INR)
  const grandTotalINR = Math.round(grandTotalUSD * 85);

  const formatAmount = (usd) => {
    return `${curr.symbol}${Math.round(usd * curr.rate).toLocaleString()}`;
  };

  // Promo Code Handlers
  const handleApplyPromo = (codeToApply = null) => {
    const rawCode = (codeToApply || promoCodeInput).trim().toUpperCase();
    setPromoError('');
    if (!rawCode) {
      setPromoError('Please enter a voucher or promo code.');
      return;
    }
    const found = PROMO_CODES[rawCode];
    if (found) {
      setAppliedPromo({ ...found, code: rawCode });
      setPromoMessage(`VIP Voucher "${rawCode}" activated: ${found.label}`);
      setPromoCodeInput(rawCode);
    } else {
      setPromoError('Invalid or expired voucher code. Try "EQUALIRIO2026".');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoMessage('');
    setPromoError('');
    setPromoCodeInput('');
  };

  // Pre-load Razorpay SDK script on component mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Validate step transitions
  const handleNextStep = () => {
    setPaymentError('');
    if (step === 1) {
      if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
        setPaymentError('Please select valid check-in and check-out dates.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!guestInfo.fullName.trim() || !guestInfo.email.trim() || !guestInfo.phone.trim()) {
        setPaymentError('Please fill in your name, email, and phone number to proceed.');
        return;
      }
      setStep(4);
    }
  };

  // Convert selected addons to backend format
  const getSelectedAddonsArray = () => {
    const list = [];
    if (addons.helicopter) {
      list.push({ name: 'Private Helipad Airport Charter', price: addonPrices.helicopter, quantity: 1 });
    }
    if (addons.spa) {
      list.push({ name: 'Aurelia Couple’s Hydrotherapy Ritual', price: addonPrices.spa, quantity: 1 });
    }
    if (addons.champagneBreakfast) {
      list.push({ name: 'Floating Champagne Breakfast', price: addonPrices.champagneBreakfast, quantity: 1 });
    }
    return list;
  };

  // Parse guest count numbers
  const parseGuests = () => {
    const num = parseInt(guestsCount, 10) || 2;
    return { adults: num, children: 0 };
  };

  const saveBookingLocally = (bId, status = 'confirmed', paymentStatus = 'PAID') => {
    try {
      const newBooking = {
        bookingId: bId,
        _id: bId,
        suiteSnapshot: {
          name: selectedSuite?.name || 'Luxury Suite',
          category: selectedSuite?.category || 'Suite',
          pricePerNight: selectedSuite?.price || 950,
          image: selectedSuite?.image || '/images/Infinity Pool Ocean Villa exterior.jpg'
        },
        checkIn,
        checkOut,
        guests: parseGuests(),
        addons: getSelectedAddonsArray(),
        guestInfo: {
          fullName: guestInfo.fullName,
          email: guestInfo.email,
          phone: guestInfo.phone
        },
        pricing: {
          nightlyRate: selectedSuite?.price || 950,
          numberOfNights: nights,
          totalAmount: grandTotalUSD,
          currency: 'USD'
        },
        status,
        paymentStatus,
        createdAt: new Date().toISOString()
      };
      const local = JSON.parse(localStorage.getItem('eql_recent_bookings') || '[]');
      localStorage.setItem('eql_recent_bookings', JSON.stringify([newBooking, ...local]));
    } catch (e) {
      console.warn('Local storage save error:', e);
    }
  };

  // Trigger Razorpay Payment Flow
  const handleProcessPayment = async () => {
    setPaymentError('');
    setPaymentLoading(true);

    try {
      if (paymentMethod === 'pay_at_hotel') {
        // Direct pay at hotel reservation
        const payload = {
          suiteId: selectedSuite.id || null,
          suiteName: selectedSuite.name,
          suitePrice: selectedSuite.price,
          suiteImage: selectedSuite.image,
          category: selectedSuite.category?.toLowerCase() || 'suite',
          checkIn,
          checkOut,
          guests: parseGuests(),
          addons: getSelectedAddonsArray(),
          specialRequests: guestInfo.specialRequests,
          guestInfo: {
            fullName: guestInfo.fullName,
            email: guestInfo.email,
            phone: guestInfo.phone
          },
          currency: 'USD'
        };

        const res = await paymentAPI.createRazorpayOrder(payload);
        const booking = res.data?.booking;
        const bId = booking?.bookingId || `#EQL-${Date.now().toString().slice(-6)}`;

        setConfirmedBooking({
          bookingId: bId,
          paymentMethod: 'Pay Upon Arrival (At Property Concierge)',
          paymentStatus: 'Pending (At Check-In)',
          paymentId: 'PAY-LATER-DESK',
          amountPaid: formatAmount(grandTotalUSD),
          amountINR: `₹${grandTotalINR.toLocaleString()}`
        });

        saveBookingLocally(bId, 'confirmed', 'Pending (At Arrival)');

        setStep(5);
        if (onBookingSuccess) {
          onBookingSuccess({
            suite: selectedSuite.name,
            nights,
            total: formatAmount(grandTotalUSD),
            guest: guestInfo.fullName,
            bookingId: bId
          });
        }
        setPaymentLoading(false);
        return;
      }

      // ─── Razorpay Online Gateway Flow ─────────────────────────────────────
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded && !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please verify your internet connection.');
      }

      // 1. Create order on backend
      const orderPayload = {
        suiteId: selectedSuite.id || null,
        suiteName: selectedSuite.name,
        suitePrice: selectedSuite.price,
        suiteImage: selectedSuite.image,
        category: selectedSuite.category?.toLowerCase() || 'suite',
        checkIn,
        checkOut,
        guests: parseGuests(),
        addons: getSelectedAddonsArray(),
        specialRequests: guestInfo.specialRequests,
        guestInfo: {
          fullName: guestInfo.fullName,
          email: guestInfo.email,
          phone: guestInfo.phone
        },
        currency: 'IND'
      };

      const orderRes = await paymentAPI.createRazorpayOrder(orderPayload);
      const orderData = orderRes.data;

      // 2. Check if backend is in Developer Test/Simulation mode
      if (orderData.isMock) {
        setSimulationPrompt({
          orderData,
          amountINR: orderData.amountInINR || grandTotalINR
        });
        setPaymentLoading(false);
        return;
      }

      // 3. Launch Official Razorpay Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'Equalirio Luxury Resort & Spa',
        description: `${selectedSuite.name} • ${nights} Nights Stay`,
        image: 'https://cdn-icons-png.flaticon.com/512/2933/2933804.png',
        order_id: orderData.orderId,
        prefill: {
          name: guestInfo.fullName,
          email: guestInfo.email,
          contact: guestInfo.phone
        },
        notes: {
          bookingId: orderData.bookingId,
          suite: selectedSuite.name
        },
        theme: {
          color: '#C5A880' // Equalirio Gold
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          }
        },
        handler: async function (response) {
          try {
            // Verify HMAC signature with backend
            const verifyRes = await paymentAPI.verifyPayment({
              bookingId: orderData.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentMethod: 'razorpay'
            });

            const bRef = verifiedBooking?.bookingId || orderData.bookingId;
            setConfirmedBooking({
              bookingId: bRef,
              paymentMethod: 'Razorpay (Instant Online Settlement)',
              paymentStatus: 'PAID (Verified)',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amountPaid: formatAmount(grandTotalUSD),
              amountINR: `₹${(orderData.amountInINR || grandTotalINR).toLocaleString()}`
            });

            saveBookingLocally(bRef, 'confirmed', 'PAID (Verified)');

            setStep(5);
            if (onBookingSuccess) {
              onBookingSuccess({
                suite: selectedSuite.name,
                nights,
                total: formatAmount(grandTotalUSD),
                guest: guestInfo.fullName,
                paymentId: response.razorpay_payment_id,
                bookingId: bRef
              });
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            setPaymentError(err.message || 'Payment signature verification failed.');
          } finally {
            setPaymentLoading(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (failResponse) {
        console.error('Razorpay Payment Failed:', failResponse);
        setPaymentError(
          failResponse.error?.description || 'Payment was declined or cancelled. Please try again.'
        );
        setPaymentLoading(false);
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      setPaymentError(err.message || 'Failed to initiate payment gateway.');
      setPaymentLoading(false);
    }
  };

  // Execute Simulated Test Payment (when in test mode without live keys)
  const handleSimulatedPaymentSuccess = async () => {
    if (!simulationPrompt) return;
    setPaymentLoading(true);

    try {
      const mockPaymentId = `pay_mock_${Date.now().toString().slice(-8)}`;
      const mockSignature = `sig_mock_${Math.random().toString(36).substring(2)}`;

      const verifyRes = await paymentAPI.verifyPayment({
        bookingId: simulationPrompt.orderData.bookingId,
        razorpay_order_id: simulationPrompt.orderData.orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        paymentMethod: 'razorpay'
      });

      const verifiedBooking = verifyRes.data?.booking;
      const simBRef = verifiedBooking?.bookingId || simulationPrompt.orderData.bookingId;

      setConfirmedBooking({
        bookingId: simBRef,
        paymentMethod: 'Razorpay Sandbox (Test Simulation)',
        paymentStatus: 'PAID (Simulated Success)',
        paymentId: mockPaymentId,
        orderId: simulationPrompt.orderData.orderId,
        amountPaid: formatAmount(grandTotalUSD),
        amountINR: `₹${simulationPrompt.amountINR.toLocaleString()}`
      });

      saveBookingLocally(simBRef, 'confirmed', 'PAID (Sandbox)');

      setSimulationPrompt(null);
      setStep(5);

      if (onBookingSuccess) {
        onBookingSuccess({
          suite: selectedSuite.name,
          nights,
          total: formatAmount(grandTotalUSD),
          guest: guestInfo.fullName,
          paymentId: mockPaymentId,
          bookingId: verifiedBooking?.bookingId || simulationPrompt.orderData.bookingId
        });
      }
    } catch (err) {
      setPaymentError(err.message || 'Simulation verification error');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative flex w-full max-w-3xl max-h-[calc(100dvh-2rem)] flex-col bg-hotel-emerald-dark border border-hotel-gold/40 rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-hotel-gold text-white hover:text-hotel-emerald-dark transition-colors flex items-center justify-center border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="shrink-0 p-6 pr-16 sm:p-8 sm:pr-20 bg-gradient-to-r from-hotel-emerald to-hotel-emerald-dark border-b border-hotel-gold/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-hotel-gold text-xs uppercase tracking-widest font-semibold">
            <Sparkles className="w-4 h-4" /> Equalirio Reservation & Payment Gateway
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
            {step === 5
              ? 'Reservation Confirmed'
              : step === 4
              ? 'Secure Payment Checkout'
              : 'Reserve Your Luxury Sanctuary'}
          </h2>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step >= i ? 'bg-hotel-gold' : 'bg-white/10'
                }`}
              ></div>
            ))}
          </div>

          <div className="flex justify-between text-[11px] text-gray-400 font-mono mt-1 px-1">
            <span className={step >= 1 ? 'text-hotel-gold font-medium' : ''}>1. Suite</span>
            <span className={step >= 2 ? 'text-hotel-gold font-medium' : ''}>2. VIP Addons</span>
            <span className={step >= 3 ? 'text-hotel-gold font-medium' : ''}>3. Guest Details</span>
            <span className={step >= 4 ? 'text-hotel-gold font-medium' : ''}>4. Payment</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 p-6 sm:p-8 overflow-y-auto">
          {paymentError && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/40 border border-red-500/50 flex items-center gap-3 text-red-200 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* STEP 1: Select Suite & Dates */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-widest text-hotel-gold font-semibold">
                Step 1: Choose Accommodation & Dates
              </h3>

              {/* Dates & Guests selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div>
                  <label className="text-[10px] uppercase text-gray-400 block mb-1">Check-In</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-none focus:text-hotel-gold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-gray-400 block mb-1">Check-Out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-none focus:text-hotel-gold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-gray-400 block mb-1">Guests</label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer [&>option]:bg-hotel-emerald-dark"
                  >
                    <option value="1 Guest">1 Guest</option>
                    <option value="2 Guests">2 Guests</option>
                    <option value="4 Guests">4 Guests</option>
                    <option value="6+ VIP">6+ VIP Guests</option>
                  </select>
                </div>
              </div>

              {/* Suite Options list */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase text-gray-400 tracking-wider block">
                  Available Accommodations:
                </label>
                {SUITES_DATA.map((suite) => (
                  <div
                    key={suite.id}
                    onClick={() => setSelectedSuite(suite)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      selectedSuite.id === suite.id
                        ? 'bg-hotel-gold/15 border-hotel-gold shadow-gold'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={suite.image}
                        alt={suite.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="font-serif text-lg text-white font-medium">{suite.name}</h4>
                        <span className="text-xs text-gray-300 font-light">
                          {suite.size} • {suite.guests}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-xl text-hotel-gold font-bold">
                        {formatAmount(suite.price)}
                      </span>
                      <span className="text-[10px] text-gray-400 block">/ night</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: VIP Add-ons */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-widest text-hotel-gold font-semibold">
                Step 2: Enhance Your Experience (VIP Add-ons)
              </h3>

              <div className="space-y-4">
                {/* Helicopter Addon */}
                <div
                  onClick={() => setAddons({ ...addons, helicopter: !addons.helicopter })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    addons.helicopter
                      ? 'bg-hotel-gold/15 border-hotel-gold'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-hotel-gold/20 text-hotel-gold">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Private Helipad Airport Charter</h4>
                      <p className="text-xs text-gray-300 font-light">
                        Direct scenic flight to Equalirio resort helipad
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-lg text-hotel-gold font-bold">
                      +{formatAmount(addonPrices.helicopter)}
                    </span>
                    {addons.helicopter && (
                      <CheckCircle2 className="w-5 h-5 text-hotel-gold ml-auto mt-1" />
                    )}
                  </div>
                </div>

                {/* Spa Addon */}
                <div
                  onClick={() => setAddons({ ...addons, spa: !addons.spa })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    addons.spa ? 'bg-hotel-gold/15 border-hotel-gold' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-hotel-gold/20 text-hotel-gold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Aurelia Couple’s Hydrotherapy Ritual</h4>
                      <p className="text-xs text-gray-300 font-light">
                        90 min hot stone & organic essential oils massage
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-lg text-hotel-gold font-bold">
                      +{formatAmount(addonPrices.spa)}
                    </span>
                    {addons.spa && <CheckCircle2 className="w-5 h-5 text-hotel-gold ml-auto mt-1" />}
                  </div>
                </div>

                {/* Champagne Breakfast Addon */}
                <div
                  onClick={() =>
                    setAddons({ ...addons, champagneBreakfast: !addons.champagneBreakfast })
                  }
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    addons.champagneBreakfast
                      ? 'bg-hotel-gold/15 border-hotel-gold'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-hotel-gold/20 text-hotel-gold">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Floating Champagne Breakfast</h4>
                      <p className="text-xs text-gray-300 font-light">
                        Served in your private infinity pool deck
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-lg text-hotel-gold font-bold">
                      +{formatAmount(addonPrices.champagneBreakfast)}
                    </span>
                    {addons.champagneBreakfast && (
                      <CheckCircle2 className="w-5 h-5 text-hotel-gold ml-auto mt-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Guest Details */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-widest text-hotel-gold font-semibold">
                Step 3: Primary Guest Information
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lord Alexander Wright"
                    value={guestInfo.fullName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, fullName: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hotel-gold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alexander@luxury.com"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hotel-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 uppercase tracking-wider mb-1">
                      Mobile Phone (with Country Code) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hotel-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 uppercase tracking-wider mb-1">
                    Special Concierge Requests
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Dietary requirements, anniversary surprises, preferred pillow type, early check-in notes..."
                    value={guestInfo.specialRequests}
                    onChange={(e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hotel-gold"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Razorpay Payment Gateway Selection & Breakdown */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-hotel-gold font-semibold">
                  Step 4: Select Payment Method & Finalize
                </h3>
                <span className="flex items-center gap-1.5 text-[11px] text-green-400 font-medium bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Bank Encrypted
                </span>
              </div>

              {/* Payment Methods Options */}
              <div className="space-y-3">
                {/* Option 1: Razorpay (Recommended) */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'bg-hotel-gold/15 border-hotel-gold shadow-gold ring-1 ring-hotel-gold/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center border-hotel-gold">
                        {paymentMethod === 'razorpay' && (
                          <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white text-sm">
                            Razorpay Secure Checkout
                          </h4>
                          <span className="bg-hotel-gold text-hotel-emerald-dark font-bold text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                            Instant Confirmation
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-light mt-1">
                          UPI (GPay, PhonePe, Paytm, QR), Credit & Debit Cards, NetBanking, Wallets
                        </p>
                      </div>
                    </div>
                    <CreditCard className="w-6 h-6 text-hotel-gold" />
                  </div>

                  {/* Payment Channel Badges */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-200 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-hotel-gold" /> UPI / QR Codes
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-200 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-hotel-gold" /> Visa / Master / RuPay
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-200 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-hotel-gold" /> 50+ Banks NetBanking
                    </span>
                  </div>
                </div>

                {/* Option 2: Pay at Hotel */}
                <div
                  onClick={() => setPaymentMethod('pay_at_hotel')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'pay_at_hotel'
                      ? 'bg-hotel-gold/15 border-hotel-gold shadow-gold ring-1 ring-hotel-gold/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center border-hotel-gold">
                        {paymentMethod === 'pay_at_hotel' && (
                          <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">Pay at Resort Concierge</h4>
                        <p className="text-xs text-gray-300 font-light mt-1">
                          Settle payment with Card or Cash upon check-in at Equalirio Resort
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Voucher / Promo Code Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-hotel-gold/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-hotel-gold font-semibold uppercase tracking-wider text-[11px]">
                    <Tag className="w-3.5 h-3.5" /> VIP Voucher & Privileges
                  </span>
                  {appliedPromo && (
                    <button
                      onClick={handleRemovePromo}
                      className="text-[11px] text-red-400 hover:text-red-300 font-medium underline"
                    >
                      Remove Code
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. EQUALIRIO2026)"
                    value={promoCodeInput}
                    disabled={Boolean(appliedPromo)}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white uppercase tracking-wider placeholder:text-gray-500 focus:outline-none focus:border-hotel-gold disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleApplyPromo()}
                    disabled={Boolean(appliedPromo) || !promoCodeInput.trim()}
                    className="px-4 py-2 bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>

                {promoMessage && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 animate-fade-in font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{promoMessage}</span>
                  </p>
                )}

                {promoError && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{promoError}</span>
                  </p>
                )}

                {/* Quick Suggestion Pills */}
                {!appliedPromo && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-gray-400">Available:</span>
                    <button
                      onClick={() => handleApplyPromo('EQUALIRIO2026')}
                      className="px-2 py-0.5 rounded-full bg-hotel-gold/15 hover:bg-hotel-gold/25 text-hotel-gold border border-hotel-gold/30 transition-colors"
                    >
                      ✨ EQUALIRIO2026 (15% OFF)
                    </button>
                    <button
                      onClick={() => handleApplyPromo('LUXURY2026')}
                      className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 border border-white/15 transition-colors"
                    >
                      🎁 LUXURY2026 ($200 Flat)
                    </button>
                  </div>
                )}
              </div>

              {/* Reservation Breakdown Ticket */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>
                    {selectedSuite.name} ({nights} {nights === 1 ? 'Night' : 'Nights'})
                  </span>
                  <span>{formatAmount(basePriceUSD)}</span>
                </div>

                {addonsTotalUSD > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>VIP Selected Experiences & Add-ons</span>
                    <span className="text-hotel-gold">+{formatAmount(addonsTotalUSD)}</span>
                  </div>
                )}

                {discountUSD > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> VIP Voucher Discount ({appliedPromo?.code})
                    </span>
                    <span>-{formatAmount(discountUSD)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-300">
                  <span>Eco-Sanctuary Luxury & Resort Tax (12%)</span>
                  <span>{formatAmount(taxUSD)}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-sm block">Total Payable</span>
                    <span className="text-[10px] text-gray-400">
                      Razorpay Settlement: ₹{grandTotalINR.toLocaleString()} INR
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-2xl text-hotel-gold font-bold block">
                      {formatAmount(grandTotalUSD)}
                    </span>
                    <span className="text-[10px] text-hotel-gold/80 font-mono">
                      (₹{grandTotalINR.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Notice Modal / Drawer if triggered */}
              {simulationPrompt && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-hotel-gold/20 to-hotel-emerald/40 border border-hotel-gold/60 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-hotel-gold font-semibold text-sm">
                    <Sparkles className="w-4 h-4" /> Razorpay Test Sandbox Mode
                  </div>
                  <p className="text-xs text-gray-200 font-light leading-relaxed">
                    Live Razorpay credentials are currently running in test simulation mode. You can
                    complete this booking with a mock test payment immediately, or enter your official{' '}
                    <code className="text-hotel-gold bg-black/50 px-1 py-0.5 rounded">RAZORPAY_KEY_ID</code>{' '}
                    in <code className="text-hotel-gold bg-black/50 px-1 py-0.5 rounded">backend/.env</code> for real checkout.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleSimulatedPaymentSuccess}
                      disabled={paymentLoading}
                      className="flex-1 bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-gold flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Simulate Successful Payment</span>
                    </button>
                    <button
                      onClick={() => setSimulationPrompt(null)}
                      className="px-4 py-3 rounded-xl border border-white/20 text-xs text-gray-300 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Booking & Payment Confirmation Voucher */}
          {step === 5 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-hotel-gold/20 border-2 border-hotel-gold text-hotel-gold mx-auto flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-2">
                  Payment Verified & Guaranteed
                </span>
                <h3 className="font-serif text-3xl text-hotel-gold font-normal">
                  Reservation Confirmed!
                </h3>
              </div>

              <p className="text-gray-300 text-xs font-light max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white font-semibold">{guestInfo.fullName || 'Valued Guest'}</strong>.
                Your sanctuary at Equalirio Resort has been officially locked and your stay itinerary dispatched to{' '}
                <span className="text-hotel-gold underline">{guestInfo.email}</span>.
              </p>

              {/* Voucher Ticket Box */}
              <div className="bg-hotel-emerald/60 border border-hotel-gold/40 rounded-2xl p-6 text-left space-y-3 font-mono text-xs shadow-2xl relative overflow-hidden">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Booking Reference:</span>
                  <span className="text-hotel-gold font-bold">
                    {confirmedBooking?.bookingId || '#EQL-2026-8942'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Reference:</span>
                  <span className="text-green-400 font-semibold">
                    {confirmedBooking?.paymentId || 'PAY-ONLINE-VERIFIED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gateway Method:</span>
                  <span className="text-white">{confirmedBooking?.paymentMethod || 'Razorpay'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Selected Suite:</span>
                  <span className="text-white font-medium">{selectedSuite.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration of Stay:</span>
                  <span className="text-white">
                    {nights} Nights ({checkIn} to {checkOut})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Butler Concierge:</span>
                  <span className="text-hotel-gold-light">Assigned (24/7 Dedicated)</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-sm">
                  <span className="text-white">Total Amount Paid:</span>
                  <div className="text-right">
                    <span className="text-hotel-gold">{formatAmount(grandTotalUSD)}</span>
                    <span className="text-[10px] text-gray-400 block font-normal">
                      (₹{grandTotalINR.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-hotel-gold/40 text-hotel-gold hover:bg-hotel-gold hover:text-hotel-emerald-dark font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-full shadow-gold"
                >
                  Close & Return
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Pricing Summary & Step Buttons */}
        {step < 5 && (
          <div className="p-6 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">
                Total ({nights} {nights === 1 ? 'Night' : 'Nights'} + Addons + Tax)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-hotel-gold font-bold">
                  {formatAmount(grandTotalUSD)}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  (₹{grandTotalINR.toLocaleString()})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {step > 1 && (
                <button
                  onClick={() => {
                    setPaymentError('');
                    setStep(step - 1);
                  }}
                  disabled={paymentLoading}
                  className="px-5 py-3 rounded-xl border border-white/20 text-xs uppercase tracking-wider text-gray-300 hover:text-white"
                >
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="flex-1 sm:flex-none bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-xl shadow-gold flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleProcessPayment}
                  disabled={paymentLoading}
                  className="flex-1 sm:flex-none bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-gold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting Gateway...</span>
                    </>
                  ) : paymentMethod === 'razorpay' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{grandTotalINR.toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Pay at Resort</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
