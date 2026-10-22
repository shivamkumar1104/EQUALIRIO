/**
 * Pricing Service
 * Handles all pricing calculations for suite bookings.
 */

const TAX_RATE = 0.12; // 12% tax

const ADDON_CATALOG = {
  helicopter: { name: "Helicopter Transfer", price: 800 },
  spa: { name: "Sunset Spa Ritual", price: 350 },
  champagneBreakfast: { name: "Champagne Breakfast", price: 120 },
  privateChef: { name: "Private Chef Dinner", price: 500 },
  sailingTrip: { name: "Private Sailing Trip", price: 600 },
  jungleYoga: { name: "Jungle Yoga Session", price: 90 },
};

/**
 * Calculate number of nights between two dates
 */
export const calculateNights = (checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate full booking pricing breakdown
 * @param {Object} params
 * @param {number} params.pricePerNight
 * @param {Date|string} params.checkIn
 * @param {Date|string} params.checkOut
 * @param {Array} params.addons - Array of { name, price, quantity }
 * @param {string} params.currency
 */
export const calculateBookingPrice = ({ pricePerNight, checkIn, checkOut, addons = [], currency = "USD" }) => {
  const nights = calculateNights(checkIn, checkOut);
  const nightlyTotal = pricePerNight * nights;

  const addonsTotal = addons.reduce((sum, addon) => {
    const qty = addon.quantity || 1;
    return sum + addon.price * qty;
  }, 0);

  const subtotal = nightlyTotal + addonsTotal;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    nightlyRate: pricePerNight,
    numberOfNights: nights,
    nightlyTotal: Math.round(nightlyTotal * 100) / 100,
    addonsTotal: Math.round(addonsTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate: TAX_RATE,
    taxAmount,
    totalAmount,
    currency,
  };
};

/**
 * Get addon details by key
 */
export const getAddonByKey = (key) => ADDON_CATALOG[key] || null;

/**
 * Get the full addon catalog
 */
export const getAddonCatalog = () => ADDON_CATALOG;

/**
 * Validate that all addons in a request are valid
 */
export const validateAddons = (addons) => {
  const errors = [];
  addons.forEach((addon, i) => {
    if (!addon.name) errors.push(`Addon ${i + 1}: name is required`);
    if (typeof addon.price !== "number" || addon.price < 0)
      errors.push(`Addon ${i + 1}: price must be a non-negative number`);
  });
  return errors;
};
