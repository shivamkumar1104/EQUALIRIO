import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Suites from './components/Suites';
import SuiteDetailModal from './components/SuiteDetailModal';
import Amenities from './components/Amenities';
import Dining from './components/Dining';
import Gallery from './components/Gallery';
import Reviews from './components/Reviews';
import FaqSection from './components/FaqSection';
import Footer from './components/Footer';

// Modals & Overlay Utilities
import BookingModal from './components/BookingModal';
import TableReservationModal from './components/TableReservationModal';
import ReviewModal from './components/ReviewModal';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import MyBookingsModal from './components/MyBookingsModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import SpaBookingModal from './components/SpaBookingModal';
import HostDashboardModal from './components/HostDashboardModal';
import MarketplaceReviewModal from './components/MarketplaceReviewModal';
import StaysMarketplace from './components/StaysMarketplace';
import LegalModal from './components/LegalModal';

import { HOTEL_INFO } from './data/hotelData';
import { reviewsAPI, hotelAPI, authAPI } from './services/api';

export default function App() {
  // User Auth State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global States
  const [currency, setCurrency] = useState('IND');
  const [toastMessage, setToastMessage] = useState(null);
  const [hotelInfo, setHotelInfo] = useState(HOTEL_INFO);
  const [legalPage, setLegalPage] = useState(null);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState(null);

  // Suite Detail Modal State
  const [selectedSuiteDetail, setSelectedSuiteDetail] = useState(null);

  // Table Reservation Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableRestaurant, setTableRestaurant] = useState('');

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: null, count: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');

  // Live Fetch on mount
  useEffect(() => {
    let isMounted = true;
    reviewsAPI.getAll({ limit: 12 })
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.reviews ?? res.data?.reviews;
        if (Array.isArray(fetched)) {
          setReviewsList(fetched);
          setReviewStats(res.stats || res.data?.stats || { average: null, count: 0 });
        } else {
          setReviewsError('Reviews could not be loaded. Please try again later.');
        }
      })
      .catch((err) => {
        console.error('Reviews could not be loaded:', err);
        if (isMounted) setReviewsError('Reviews could not be loaded. Please try again later.');
      })
      .finally(() => {
        if (isMounted) setReviewsLoading(false);
      });

    hotelAPI.getInfo()
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data?.hotel;
        if (fetched) {
          setHotelInfo((prev) => ({
            ...prev,
            name: fetched.name || prev.name,
            tagline: fetched.tagline || prev.tagline,
            subheading: fetched.subheading || prev.subheading,
            location: fetched.location || prev.location,
            address: fetched.address || prev.address,
            phone: fetched.contact?.phone || prev.phone,
            email: fetched.contact?.email || prev.email,
          }));
        }
      })
      .catch((err) => {
        console.warn('Hotel info fetch fallback:', err.message);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const verificationToken = hashParams.get('verifyEmail');
    if (!verificationToken) return;

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    authAPI.verifyEmail(verificationToken)
      .then((response) => {
        if (response.token) localStorage.setItem('hotel_token', response.token);
        if (response.user) {
          localStorage.setItem('hotel_user', JSON.stringify(response.user));
          setUser(response.user);
        }
        setToastMessage(response.message || 'Email verified. You are now signed in.');
      })
      .catch((error) => {
        setToastMessage(error.message || 'Email verification failed. Request a new link and try again.');
      });
  }, []);

  // My Bookings & Reservations Dashboard State
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);

  // Admin Management Portal State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHostDashboardOpen, setIsHostDashboardOpen] = useState(false);
  const [isMarketplaceReviewOpen, setIsMarketplaceReviewOpen] = useState(false);

  // Spa & Sanctuary Wellness Booking State
  const [isSpaModalOpen, setIsSpaModalOpen] = useState(false);

  // Handlers
  const handleOpenBooking = (data = null) => {
    setBookingInitialData(data);
    setIsBookingOpen(true);
  };

  const handleBookSuite = (suite) => {
    setBookingInitialData({ suite });
    setIsBookingOpen(true);
  };

  const handleReserveTable = (restaurantName) => {
    setTableRestaurant(restaurantName);
    setIsTableModalOpen(true);
  };

  const handleReviewSubmitted = async () => {
    try {
      const response = await reviewsAPI.getAll({ limit: 12 });
      const fetched = response.reviews ?? response.data?.reviews;
      if (Array.isArray(fetched)) {
        setReviewsList(fetched);
        setReviewStats(response.stats || response.data?.stats || { average: null, count: 0 });
        setReviewsError('');
      } else {
        setReviewsError('Reviews could not be loaded. Please reload the page to try again.');
      }
      setToastMessage("Thank you. Your verified-stay review has been submitted.");
    } catch (error) {
      console.error('Review submitted but review list could not be refreshed:', error);
      setReviewsError('Reviews could not be loaded. Please reload the page to try again.');
      setToastMessage("Your review was submitted, but the list could not refresh. Reload the page to check its status.");
    }
  };

  const handleOpenReview = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      setToastMessage("Sign in to review a stay you have completed.");
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleExperienceInquiry = (experienceTitle) => {
    setToastMessage(`Experience inquiry for "${experienceTitle}" submitted to Concierge.`);
  };

  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setToastMessage(`Welcome, ${loggedInUser.name || 'Guest'}!`);
  };

  const handleOpenHostDashboard = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      setToastMessage('Sign in or create an account to apply as a host.');
      return;
    }
    setIsHostDashboardOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hotel_user');
    localStorage.removeItem('hotel_token');
    setUser(null);
    setToastMessage('You have been signed out.');
  };

  return (
    <div className="min-h-screen bg-hotel-cream text-hotel-dark font-sans selection:bg-hotel-gold selection:text-hotel-emerald-dark" style={{overflowX: 'hidden', width: '100%'}}>
      
      {/* Sticky Header Navigation */}
      <Navbar
        onOpenBooking={() => handleOpenBooking()}
        currency={currency}
        setCurrency={setCurrency}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Sections */}
      <main>
        {/* Hero Banner with Quick Search */}
        <Hero
          hotelInfo={hotelInfo}
          reviewStats={reviewStats}
          onSearchBooking={(searchData) => handleOpenBooking(searchData)}
        />

        {/* Independently hosted stays marketplace */}
        <StaysMarketplace />

        {/* About Equalirio Philosophy & Stats */}
        <About />

        {/* Suites & Villas Showcase */}
        <Suites
          onSelectSuite={(suite) => setSelectedSuiteDetail(suite)}
          onBookSuite={(suite) => handleBookSuite(suite)}
          currency={currency}
        />

        {/* Amenities & VIP Privileges */}
        <Amenities
          onOpenInquiry={(title) => handleExperienceInquiry(title)}
          onOpenSpa={() => setIsSpaModalOpen(true)}
        />

        {/* Michelin Dining & Lounges */}
        <Dining
          onReserveTable={(name) => handleReserveTable(name)}
        />

        {/* Lookbook Visual Gallery & Lightbox */}
        <Gallery />

        {/* Guest Reviews & Testimonials */}
        <Reviews
          reviewsList={reviewsList}
          reviewStats={reviewStats}
          isLoading={reviewsLoading}
          loadError={reviewsError}
          onWriteReview={handleOpenReview}
        />

        {/* Accordion FAQs & Concierge Inquiry Box */}
        <FaqSection
          onToast={(msg) => setToastMessage(msg)}
        />
      </main>

      {/* Footer */}
      <Footer
        hotelInfo={hotelInfo}
        onToast={(msg) => setToastMessage(msg)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenLegal={setLegalPage}
      />

      <LegalModal type={legalPage} onClose={() => setLegalPage(null)} />

      {/* MODALS */}
      {/* 1. Multi-step Suite Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialData={bookingInitialData}
        currency={currency}
        onBookingSuccess={(details) => {
          setToastMessage(`Booking Confirmed! Reference #EQL-2026 for ${details.suite}`);
        }}
      />

      {/* 2. Suite Specs Detail Modal */}
      <SuiteDetailModal
        suite={selectedSuiteDetail}
        onClose={() => setSelectedSuiteDetail(null)}
        onBookNow={(suite) => handleBookSuite(suite)}
        currency={currency}
      />

      {/* 3. Dining Table Reservation Modal */}
      <TableReservationModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        restaurantName={tableRestaurant}
        user={user}
        onSuccess={(msg) => setToastMessage(msg)}
      />

      {/* 4. Write Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* 5. Toast Notification System */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* 6. Guest Auth Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* 7. Guest Stays & Dining Portfolio Dashboard */}
      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        user={user}
        currency={currency}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* 8. Management Operations Admin Dashboard */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        user={user}
        currency={currency}
        onOpenMarketplaceReview={() => {
          setIsAdminOpen(false);
          setIsMarketplaceReviewOpen(true);
        }}
      />

      <HostDashboardModal
        isOpen={isHostDashboardOpen}
        onClose={() => setIsHostDashboardOpen(false)}
      />

      <MarketplaceReviewModal
        isOpen={isMarketplaceReviewOpen}
        onClose={() => setIsMarketplaceReviewOpen(false)}
      />

      {/* 9. Aurelia Sanctuary Spa & Wellness Booking Modal */}
      <SpaBookingModal
        isOpen={isSpaModalOpen}
        onClose={() => setIsSpaModalOpen(false)}
        user={user}
        currency={currency}
        onSuccess={(msg) => setToastMessage(msg)}
      />
    </div>
  );
}
