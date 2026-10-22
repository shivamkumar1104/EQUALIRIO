import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  User,
  Heart,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Flower2,
  Waves,
  Sun,
  Flame,
  Printer
} from 'lucide-react';

export const SPA_TREATMENTS = [
  {
    id: 'spa-hydrotherapy',
    name: 'Aurelia Deep Forest Hydrotherapy',
    duration: '90 Mins',
    price: 220,
    category: 'Signature Ritual',
    description: 'Immerse in mineral-infused rainforest hot springs followed by a full-body volcanic clay exfoliation and aromatherapy massage.'
  },
  {
    id: 'spa-sound-bath',
    name: 'Tibetan Sound Immersion & Reiki',
    duration: '60 Mins',
    price: 160,
    category: 'Holistic Energy',
    description: 'Resonant bronze singing bowls and Tibetan gongs harmonize chakra frequencies in our open-air bamboo sound sanctuary.'
  },
  {
    id: 'spa-hot-stone',
    name: 'Volcanic Basalt Stone Therapy',
    duration: '75 Mins',
    price: 190,
    category: 'Therapeutic',
    description: 'Heated volcanic river stones aligned along energy meridians to melt deep muscle tension with warm botanical jojoba oil.'
  },
  {
    id: 'spa-marine-facial',
    name: 'Marine Collagen Botanical Facial',
    duration: '60 Mins',
    price: 175,
    category: 'Skin Wellness',
    description: 'Pure bio-marine algae, pearl extract, and organic rosehip serum restoring luminosity, hydration, and youthful radiance.'
  },
  {
    id: 'spa-couples-twilight',
    name: 'Twilight Pavilion Couple’s Sanctuary',
    duration: '120 Mins',
    price: 380,
    category: 'Romance & Couples',
    description: 'Private oceanfront pavilion with tandem aromatic massage, organic rose-petal floral soaking bath, and chilled vintage champagne.'
  }
];

export default function SpaBookingModal({
  isOpen,
  onClose,
  initialTreatment = null,
  user,
  currency = 'IND',
  onSuccess
}) {
  if (!isOpen) return null;

  const [selectedTreatment, setSelectedTreatment] = useState(
    initialTreatment || SPA_TREATMENTS[0]
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDate);
  const [timeSlot, setTimeSlot] = useState('16:00');
  const [guestsCount, setGuestsCount] = useState('1');
  const [therapistPref, setTherapistPref] = useState('any'); // 'any' | 'female' | 'male'
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [confirmedSpa, setConfirmedSpa] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currencyRates = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.78 },
    JPY: { symbol: '¥', rate: 155.0 },
    IND: { symbol: '₹', rate: 85 }
  };
  const curr = currencyRates[currency] || currencyRates.USD;

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!email) setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const spaRef = `SPA-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const spaRecord = {
      bookingId: spaRef,
      _id: spaRef,
      treatment: selectedTreatment.name,
      duration: selectedTreatment.duration,
      date,
      timeSlot,
      guestsCount,
      therapistPref,
      guestInfo: {
        fullName: name || 'Valued Guest',
        email: email || 'guest@equalirio-resort.com',
        phone
      },
      healthNotes,
      priceUSD: selectedTreatment.price * (parseInt(guestsCount, 10) || 1),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Store in local storage portfolio
    try {
      const local = JSON.parse(localStorage.getItem('eql_recent_spa') || '[]');
      localStorage.setItem('eql_recent_spa', JSON.stringify([spaRecord, ...local]));
    } catch (err) {
      console.warn('Spa local save error:', err);
    }

    setTimeout(() => {
      setSubmitting(false);
      setConfirmedSpa(spaRecord);
      if (onSuccess) {
        onSuccess(`Spa session reserved: ${selectedTreatment.name} on ${date} at ${timeSlot}`);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-hotel-emerald-dark border border-hotel-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-auto overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedSpa ? (
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-hotel-gold/15 border border-hotel-gold/40 flex items-center justify-center text-hotel-gold mx-auto">
              <Sparkles className="w-8 h-8 text-hotel-gold" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold text-hotel-gold tracking-widest uppercase">
                Sanctuary Spa Appointment Confirmed
              </span>
              <h3 className="font-serif text-3xl text-white mt-1">
                Your Wellness Journey Begins
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                Appointment Reference:{' '}
                <span className="font-mono font-bold text-hotel-gold">
                  {confirmedSpa.bookingId}
                </span>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-xs space-y-2.5 text-left max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-gray-400">Treatment:</span>
                <span className="font-semibold text-white">{confirmedSpa.treatment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-hotel-gold font-medium">{confirmedSpa.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Appointment Date:</span>
                <span className="font-semibold text-white">{confirmedSpa.date} at {confirmedSpa.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Guest:</span>
                <span className="text-white font-medium">{confirmedSpa.guestInfo.fullName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-gray-400 font-medium">Session Fee:</span>
                <span className="font-serif text-lg text-hotel-gold font-bold">
                  {curr.symbol}{Math.round(confirmedSpa.priceUSD * curr.rate).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Please arrive 15 minutes prior to your appointment at the Aurelia Spa Pavilion. Herbal botanical infusions will be served upon arrival.
            </p>

            <button
              onClick={onClose}
              className="w-full max-w-md mx-auto block bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-gold transition-all"
            >
              Done & Return to Resort
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div>
              <div className="flex items-center gap-2 text-hotel-gold text-xs uppercase tracking-widest font-semibold mb-1">
                <Flower2 className="w-4 h-4" /> Aurelia Holistic Spa & Wellness
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                Reserve Spa & Ritual Experience
              </h2>
              <p className="text-gray-300 text-xs mt-1">
                Ancient Balinese & Tibetan healing rituals designed for spiritual and physical renewal.
              </p>
            </div>

            {/* Treatment Picker */}
            <div>
              <label className="block text-gray-300 uppercase tracking-wider mb-2 font-semibold">
                Select Holistic Treatment
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {SPA_TREATMENTS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTreatment(item)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTreatment.id === item.id
                        ? 'bg-hotel-gold/15 border-hotel-gold shadow-gold ring-1 ring-hotel-gold/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{item.name}</span>
                        <span className="text-[10px] text-hotel-gold bg-hotel-gold/15 px-2 py-0.5 rounded-full font-mono">
                          {item.duration}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-light mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 pl-3">
                      <span className="font-serif text-sm font-bold text-hotel-gold">
                        {curr.symbol}{Math.round(item.price * curr.rate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Slot Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1 font-medium">Session Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1 font-medium">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-hotel-gold [&>option]:bg-hotel-emerald-dark"
                >
                  <option value="09:00">09:00 AM (Morning Mist)</option>
                  <option value="11:30">11:30 AM (Solar Zen)</option>
                  <option value="14:00">02:00 PM (Afternoon Calm)</option>
                  <option value="16:00">04:00 PM (Golden Hour)</option>
                  <option value="18:30">06:30 PM (Sunset Twilight)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1 font-medium">Guests</label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-hotel-gold [&>option]:bg-hotel-emerald-dark"
                >
                  <option value="1">1 Person (Solo Ritual)</option>
                  <option value="2">2 Persons (Couple)</option>
                </select>
              </div>
            </div>

            {/* Guest Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1 font-medium">Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="Eleanor Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-hotel-gold"
                />
              </div>
              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1 font-medium">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>

            {/* Special Wellness Preferences */}
            <div>
              <label className="block text-gray-300 uppercase tracking-wider mb-1 font-medium">
                Health Notes & Pressure Preference
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Medium to firm pressure, lavender allergy, lower back tension focus..."
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-hotel-gold resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-hotel-gold to-hotel-gold-dark hover:from-hotel-gold-light hover:to-hotel-gold text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-gold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirm Spa Appointment • {curr.symbol}{Math.round(selectedTreatment.price * (parseInt(guestsCount, 10) || 1) * curr.rate).toLocaleString()}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
