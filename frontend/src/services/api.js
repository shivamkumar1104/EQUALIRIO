/**
 * Centralized API service layer for the Equalirio Hotel frontend.
 * All backend calls go through this file — never fetch() directly in components.
 */

import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/api`;

/**
 * Core HTTP helper — attaches JWT token and handles JSON.
 */
const request = async (method, path, body = null, auth = false) => {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("hotel_token") || localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    credentials: "include",
  };

  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, config);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "API request failed");
    error.status = res.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (payload) => request("POST", "/auth/register", payload),
  login: (payload) => request("POST", "/auth/login", payload),
  googleLogin: (token) => request("POST", "/auth/google", { token }),
  verifyEmail: (token) =>
    request("GET", `/auth/verify-email?${new URLSearchParams({ token })}`),
  resendVerification: (email) =>
    request("POST", "/auth/resend-verification", { email }),
  getMe: () => request("GET", "/auth/me", null, true),
  updateProfile: (data) => request("PUT", "/auth/profile", data, true),
  getAdminCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/auth/admin/customers${query ? `?${query}` : ""}`, null, true);
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// ─── Suites ───────────────────────────────────────────────────────────────────

export const suitesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/suites${query ? `?${query}` : ""}`);
  },
  getById: (id) => request("GET", `/suites/${id}`),
  checkAvailability: (id, checkIn, checkOut) =>
    request("GET", `/suites/${id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`),
  // Admin
  create: (data) => request("POST", "/suites", data, true),
  update: (id, data) => request("PUT", `/suites/${id}`, data, true),
  delete: (id) => request("DELETE", `/suites/${id}`, null, true),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingsAPI = {
  create: (payload) => request("POST", "/bookings", payload, true),
  getMyBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/bookings/my${query ? `?${query}` : ""}`, null, true);
  },
  getById: (id) => request("GET", `/bookings/${id}`, null, true),
  cancel: (bookingId, reason) =>
    request("PATCH", `/bookings/${bookingId}/cancel`, { reason }, true),
  // Admin
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/bookings${query ? `?${query}` : ""}`, null, true);
  },
  updateStatus: (id, status, notes) =>
    request("PATCH", `/bookings/${id}/status`, { status, notes }, true),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviewsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/reviews${query ? `?${query}` : ""}`);
  },
  getSuiteReviews: (suiteId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/reviews/suite/${suiteId}${query ? `?${query}` : ""}`);
  },
  create: (data) => request("POST", "/reviews", data, true),
  update: (id, data) => request("PUT", `/reviews/${id}`, data, true),
  delete: (id) => request("DELETE", `/reviews/${id}`, null, true),
  respond: (id, message) => request("POST", `/reviews/${id}/respond`, { message }, true),
};

// ─── Dining ───────────────────────────────────────────────────────────────────

export const diningAPI = {
  createReservation: (data) => request("POST", "/dining", data, true),
  getMyReservations: () => request("GET", "/dining/my", null, true),
  cancel: (id, reason) => request("PATCH", `/dining/${id}/cancel`, { reason }, true),
  // Admin
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/dining${query ? `?${query}` : ""}`, null, true);
  },
  updateStatus: (id, status, tableNumber) =>
    request("PATCH", `/dining/${id}/status`, { status, tableNumber }, true),
};

// ─── Hotel Information ────────────────────────────────────────────────────────
export const hotelAPI = {
  getInfo: () => request("GET", "/hotel"),
  updateInfo: (data) => request("PUT", "/hotel", data, true),
};

// ─── Content (FAQs, Gallery, Amenities) ─────────────────────────────────────────
export const contentAPI = {
  getFAQs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/content/faqs${query ? `?${query}` : ""}`);
  },
  getGallery: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/content/gallery${query ? `?${query}` : ""}`);
  },
  getAmenities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request("GET", `/content/amenities${query ? `?${query}` : ""}`);
  },
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  getConfig: () => request("GET", "/payment/config"),
  createRazorpayOrder: (payload) => request("POST", "/payment/razorpay/create-order", payload, true),
  verifyPayment: (payload) => request("POST", "/payment/razorpay/verify", payload, true),
};

// ─── Membership / Newsletter ──────────────────────────────────────────────────
export const membershipAPI = {
  subscribe: (email) => request("POST", "/membership/subscribe", { email }),
  checkMembership: (email) => request("GET", `/membership/check/${encodeURIComponent(email)}`),
};

export default { authAPI, suitesAPI, bookingsAPI, reviewsAPI, diningAPI, paymentAPI, hotelAPI, contentAPI, membershipAPI };
