import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HOTEL_INFO } from '../data/hotelData';
import { Calendar, Globe, Menu, X, Sparkles, ChevronDown, User, LogOut, Receipt, Utensils, LayoutDashboard } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../i18n';

export default function Navbar({
  onOpenBooking,
  currency,
  setCurrency,
  user,
  onOpenAuth,
  onLogout,
  onOpenMyBookings,
  onOpenAdmin
}) {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => i18n.language || 'en');

  useEffect(() => {
    setCurrentLang(i18n.language || 'en');
  }, [i18n.language]);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setCurrentLang(langCode);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.suites'), href: '#suites' },
    { name: t('nav.amenities'), href: '#amenities' },
    { name: t('nav.dining'), href: '#dining' },
    { name: t('nav.gallery'), href: '#gallery' },
    { name: t('nav.reviews'), href: '#reviews' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-hotel-emerald-dark/90 backdrop-blur-md py-3 shadow-luxury border-b border-hotel-gold/20'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand Logo - Left Aligned */}
          <a href="#" className="flex items-center gap-3 group shrink-0 mr-2">
            <div className="w-10 h-10 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-emerald/40 group-hover:border-hotel-gold transition-colors">
              <Sparkles className="w-5 h-5 text-hotel-gold group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl tracking-[0.25em] font-bold text-white group-hover:text-hotel-gold transition-colors notranslate" translate="no">
                {HOTEL_INFO.name}
              </span>
              <span className="text-[9px] tracking-[0.3em] uppercase text-hotel-gold-light opacity-80 -mt-1 font-sans">
                Resort & Spa
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links - Centered */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs uppercase tracking-[0.2em] text-gray-200 hover:text-hotel-gold transition-colors relative py-1 whitespace-nowrap after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-hotel-gold hover:after:w-full after:transition-all after:duration-300"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Actions: Currency Selector, Contact & CTA */}
          <div className="hidden sm:flex items-center gap-3 xl:gap-4 shrink-0 ml-2 pr-1">
            
            {/* Currency & Language Selector */}
            {/* Currency & Language Selector */}
            <div className="relative notranslate" translate="no">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-hotel-gold px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors notranslate"
                translate="no"
                title="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-hotel-gold notranslate" />
                <span className="text-[11px] font-mono font-semibold tracking-wider text-hotel-gold uppercase notranslate" translate="no">
                  Language
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 notranslate" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-hotel-emerald-dark border border-hotel-gold/30 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in text-white notranslate" translate="no">
                  <div className="p-1.5 max-h-60 overflow-y-auto notranslate" translate="no">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          handleLanguageChange(l.code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors notranslate ${
                          currentLang === l.code
                            ? 'bg-hotel-gold/20 text-hotel-gold font-bold'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                        translate="no"
                      >
                        <div className="flex items-center gap-2.5 notranslate" translate="no">
                          <span className="text-sm notranslate">{l.flag}</span>
                          <div className="flex flex-col notranslate" translate="no">
                            <span className="font-medium notranslate" translate="no">{l.native}</span>
                            <span className="text-[10px] text-gray-400 notranslate" translate="no">{l.label}</span>
                          </div>
                        </div>
                        {currentLang === l.code && <span className="w-1.5 h-1.5 rounded-full bg-hotel-gold notranslate" translate="no"></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
            </div>

            {/* CTA Reserve Suite */}
            <button
              onClick={() => onOpenBooking()}
              className="flex items-center gap-2 bg-gradient-to-r from-hotel-gold to-hotel-gold-dark hover:from-hotel-gold-light hover:to-hotel-gold text-hotel-emerald-dark font-semibold text-xs tracking-wider uppercase px-5 py-2.5 rounded-full shadow-gold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('nav.reserveSuite')}</span>
            </button>

            {/* Auth Profile / Sign In */}
            {user ? (
              <div className="relative flex items-center gap-2 pl-2 border-l border-white/15">
                {/* My Stays Direct CTA Button */}
                <button
                  onClick={onOpenMyBookings}
                  className="flex items-center gap-1.5 text-xs text-hotel-gold bg-hotel-gold/10 hover:bg-hotel-gold/20 px-3 py-1.5 rounded-full border border-hotel-gold/30 transition-all shadow-sm"
                  title="View My Bookings & Reservations"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span className="font-serif tracking-wider uppercase text-[11px] font-semibold">My Stays</span>
                </button>

                {/* Admin Operations Button (if admin) */}
                {user.role === 'admin' && (
                  <button
                    onClick={onOpenAdmin}
                    className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 px-3 py-1.5 rounded-full border border-amber-400/40 transition-all shadow-sm"
                    title="Open Admin Operations Console"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="font-serif tracking-wider uppercase text-[11px] font-semibold">Admin</span>
                  </button>
                )}

                {/* User Dropdown Pill */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 text-xs text-hotel-gold bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-full border border-hotel-gold/30 transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        className="w-5 h-5 rounded-full object-cover border border-hotel-gold/50"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-hotel-gold text-hotel-emerald-dark font-bold text-[10px] flex items-center justify-center">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="font-serif tracking-wider max-w-[80px] truncate">{user.name ? user.name.split(' ')[0] : 'Guest'}</span>
                    {user.role === 'admin' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-hotel-gold/70" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-hotel-emerald-dark border border-hotel-gold/30 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in text-white p-1.5">
                      <div className="px-3 py-2 border-b border-white/10">
                        <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onOpenAdmin) onOpenAdmin();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 text-amber-300 hover:bg-amber-400/15 transition-colors font-semibold border-b border-white/10 mb-1"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                          <span>Admin Console</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenMyBookings) onOpenMyBookings();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 text-gray-200 hover:bg-white/10 hover:text-hotel-gold transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-hotel-gold" />
                        <span>My Stays & Bookings</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenMyBookings) onOpenMyBookings();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 text-gray-200 hover:bg-white/10 hover:text-hotel-gold transition-colors"
                      >
                        <Utensils className="w-3.5 h-3.5 text-hotel-gold" />
                        <span>Dining Reservations</span>
                      </button>

                      <div className="my-1 border-t border-white/10"></div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs text-gray-200 hover:text-hotel-gold px-3.5 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-hotel-gold" />
                <span className="font-serif tracking-wider uppercase text-[11px]">{t('nav.signIn')}</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => onOpenBooking()}
              className="sm:hidden flex items-center gap-1 bg-hotel-gold text-hotel-emerald-dark text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full"
            >
              <Calendar className="w-3 h-3" />
              <span>{t('nav.reserveSuite')}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:text-hotel-gold hover:bg-white/10 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] bg-hotel-emerald-dark/95 backdrop-blur-xl border-b border-hotel-gold/30 py-6 px-6 shadow-2xl animate-fade-in">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-serif tracking-widest text-gray-200 hover:text-hotel-gold transition-colors border-b border-white/5 pb-2"
              >
                {link.name}
              </a>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              {/* Mobile Language Selector */}
              <div className="flex items-center justify-between text-xs text-gray-400 notranslate py-2 border-b border-white/5" translate="no">
                <span className="flex items-center gap-1.5 text-gray-300 font-medium notranslate" translate="no">
                  <Globe className="w-3.5 h-3.5 text-hotel-gold notranslate" />
                  Language:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-end notranslate" translate="no">
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        handleLanguageChange(l.code);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors notranslate flex items-center gap-1 ${
                        currentLang === l.code
                          ? 'bg-hotel-gold text-hotel-emerald-dark font-bold'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                      translate="no"
                      title={l.label}
                    >
                      <span>{l.flag}</span>
                      <span>{l.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Auth Button */}
              {user ? (
                <div className="p-3 rounded-xl bg-white/5 border border-hotel-gold/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-hotel-gold text-hotel-emerald-dark font-bold text-xs flex items-center justify-center">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-[150px]">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 bg-red-950/40 rounded-lg border border-red-800/40"
                    >
                      {t('nav.signOut')}
                    </button>
                  </div>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenAdmin) onOpenAdmin();
                      }}
                      className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold uppercase tracking-wider"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Admin Operations Console</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenMyBookings) onOpenMyBookings();
                    }}
                    className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-hotel-gold/15 text-hotel-gold border border-hotel-gold/30 text-xs font-semibold uppercase tracking-wider"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>My Stays & Dining Bookings</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-hotel-gold border border-hotel-gold/40 text-xs font-bold uppercase tracking-wider"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t('nav.register')}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs tracking-widest uppercase py-3 rounded-xl shadow-gold"
              >
                <Calendar className="w-4 h-4" />
                <span>{t('nav.reserveSuite')}</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
