import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { authAPI } from '../services/api';

const API_BASE = `${API_BASE_URL}/api`;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [registrationStep, setRegistrationStep] = useState('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const googleBtnRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const googleResponseHandlerRef = useRef(null);

  // Initialize and render Google Sign In button
  useEffect(() => {
    if (!isOpen) return;

    let checkInterval = null;
    let loadTimeout = null;

    if (!GOOGLE_CLIENT_ID) {
      setGoogleError('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.');
      return;
    }

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return false;

      try {
        if (!googleInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => googleResponseHandlerRef.current?.(response),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleInitializedRef.current = true;
        }

        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: isLogin ? 'signin_with' : 'signup_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 320,
        });
        setGoogleError('');
      } catch (err) {
        console.error('Google Sign-In initialization failed:', err);
        setGoogleError('Google sign-in could not initialize. Check the Google Client ID and authorized origin.');
      }

      return true;
    };

    if (!initGoogle()) {
      checkInterval = setInterval(() => {
        if (initGoogle()) {
          clearInterval(checkInterval);
          clearTimeout(loadTimeout);
        }
      }, 300);
      loadTimeout = setTimeout(() => {
        clearInterval(checkInterval);
        setGoogleError('Google sign-in could not load. Check your internet connection and Google Identity Services access.');
      }, 10000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (loadTimeout) clearTimeout(loadTimeout);
    };
  }, [isOpen, isLogin]);

  if (!isOpen) return null;

  // Handle Google OAuth Credential
  const handleGoogleResponse = async (googleResponse) => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: googleResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Google authentication failed');
      }

      // Persist credentials
      if (data.token) localStorage.setItem('hotel_token', data.token);
      if (data.user) localStorage.setItem('hotel_user', JSON.stringify(data.user));

      setSuccessMsg(`Welcome, ${data.user.name || 'Guest'}!`);

      setTimeout(() => {
        if (onSuccess) onSuccess(data.user);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };
  googleResponseHandlerRef.current = handleGoogleResponse;

  // Handle Standard Email & Password Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await authAPI.login({ email: email.trim(), password });
      } else if (registrationStep === 'email') {
        data = await authAPI.requestRegistrationOtp(email.trim());
        if (!data.success) throw new Error(data.message || 'Could not send verification code');
        setRegistrationStep('otp');
        setSuccessMsg(data.message);
        return;
      } else if (registrationStep === 'otp') {
        data = await authAPI.verifyRegistrationOtp(email.trim(), otp);
        if (!data.success || !data.registrationToken) {
          throw new Error(data.message || 'Could not verify the code');
        }
        setRegistrationToken(data.registrationToken);
        setRegistrationStep('details');
        setOtp('');
        setSuccessMsg(data.message);
        return;
      } else {
        data = await authAPI.register({
        name: name.trim(),
        email: email.trim(),
        password,
        registrationToken,
        });
      }

      if (data.verificationRequired) {
        setVerificationPending(true);
        setSuccessMsg(data.message);
        setPassword('');
        return;
      }

      if (!data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save to localStorage
      if (data.token) localStorage.setItem('hotel_token', data.token);
      if (data.user) localStorage.setItem('hotel_user', JSON.stringify(data.user));

      setSuccessMsg(data.message || (isLogin ? 'Logged in successfully' : 'Registered successfully'));

      setTimeout(() => {
        if (onSuccess) onSuccess(data.user);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setResendingVerification(true);

    try {
      const data = await authAPI.resendVerification(email.trim());
      if (!data.success) {
        throw new Error(data.message || 'Could not resend verification email');
      }
      setSuccessMsg(data.message);
    } catch (err) {
      setErrorMsg(err.message || 'Could not resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setResendingVerification(true);

    try {
      const data = await authAPI.requestRegistrationOtp(email.trim());
      if (!data.success) {
        throw new Error(data.message || 'Could not resend verification code');
      }
      setSuccessMsg(data.message);
    } catch (err) {
      setErrorMsg(err.message || 'Could not resend verification code');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-hotel-emerald-dark border border-hotel-gold/40 rounded-2xl shadow-2xl overflow-hidden text-white font-sans max-h-[95vh] overflow-y-auto">
        
        {/* Top Decorative Header */}
        <div className="relative p-6 text-center border-b bg-gradient-to-r from-hotel-emerald-dark via-hotel-emerald to-hotel-emerald-dark border-hotel-gold/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 border rounded-full border-hotel-gold/50 bg-hotel-gold/10">
            <Sparkles className="w-5 h-5 text-hotel-gold" />
          </div>

          <h3 className="font-serif text-2xl font-bold tracking-wider text-hotel-gold">
            EQUALIRIO
          </h3>
          <p className="text-[11px] tracking-[0.25em] uppercase text-hotel-gold-light opacity-90 mt-0.5">
            Guest Concierge Portal
          </p>

          {/* Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 mt-5 border bg-black/30 rounded-xl border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMsg('');
                setSuccessMsg('');
                setVerificationPending(false);
                setRegistrationStep('email');
                setRegistrationToken('');
                setOtp('');
              }}
              className={`py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isLogin
                  ? 'bg-hotel-gold text-hotel-emerald-dark shadow-gold font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorMsg('');
                setSuccessMsg('');
                setVerificationPending(false);
                setRegistrationStep('email');
                setRegistrationToken('');
                setOtp('');
              }}
              className={`py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                !isLogin
                  ? 'bg-hotel-gold text-hotel-emerald-dark shadow-gold font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          
          {/* Official Google Sign-In Button */}
          <div className="flex flex-col items-center justify-center gap-2 pt-1">
            {GOOGLE_CLIENT_ID && (
              <div
                ref={googleBtnRef}
                className="w-full flex justify-center min-h-[44px]"
              ></div>
            )}
            {googleLoading && (
              <span className="text-xs text-hotel-gold animate-pulse">Connecting with Google...</span>
            )}
            {googleError && (
              <p role="status" className="text-xs text-center text-amber-200">
                {googleError}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t border-white/15"></div>
            <span className="bg-hotel-emerald-dark px-3 text-[10px] tracking-widest uppercase text-gray-400 shrink-0">
              or use email
            </span>
            <div className="w-full border-t border-white/15"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Register: Name Input */}
            {!isLogin && registrationStep === 'details' && (
              <div>
                <label className="block text-[11px] font-serif uppercase tracking-wider text-hotel-gold mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute w-4 h-4 text-hotel-gold/60 left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-[11px] font-serif uppercase tracking-wider text-hotel-gold mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute w-4 h-4 text-hotel-gold/60 left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!isLogin && registrationStep !== 'email'}
                  placeholder="guest@equalirio.com"
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold transition-colors read-only:opacity-70"
                />
              </div>
            </div>

            {!isLogin && registrationStep === 'otp' && (
              <div>
                <label className="block text-[11px] font-serif uppercase tracking-wider text-hotel-gold mb-1">
                  6-Digit Email Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter the code from your email"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-sm tracking-[0.3em] text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold transition-colors"
                />
              </div>
            )}

            {/* Password Input */}
            {(isLogin || registrationStep === 'details') && <div>
              <label className="block text-[11px] font-serif uppercase tracking-wider text-hotel-gold mb-1 flex items-center justify-between">
                <span>Password</span>
                {!isLogin && (
                  <span className="text-[10px] text-gray-400 font-sans">8+ chars</span>
                )}
              </label>
              <div className="relative">
                <Lock className="absolute w-4 h-4 text-hotel-gold/60 left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold transition-colors"
                />
              </div>
            </div>}

            {!isLogin && registrationStep === 'details' && (
              <p className="text-xs text-emerald-200">Email verified. Complete your details to create your account.</p>
            )}

            {/* Alerts */}
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 text-xs text-red-200 border bg-red-900/40 border-red-500/50 rounded-xl animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 text-xs border bg-emerald-900/40 border-emerald-500/50 rounded-xl text-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {verificationPending && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification || !email.trim()}
                className="w-full text-xs text-hotel-gold underline underline-offset-4 disabled:opacity-50"
              >
                {resendingVerification ? 'Sending verification email...' : 'Resend verification email'}
              </button>
            )}

            {!isLogin && registrationStep === 'otp' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResendRegistrationOtp}
                  disabled={resendingVerification || !email.trim()}
                  className="w-full text-xs text-hotel-gold underline underline-offset-4 disabled:opacity-50"
                >
                  {resendingVerification ? 'Sending code...' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationStep('email');
                    setOtp('');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="w-full text-xs text-gray-300 underline underline-offset-4"
                >
                  Change email address
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex items-center justify-center w-full gap-2 py-3 mt-2 text-xs font-bold tracking-widest uppercase transition-all rounded-xl bg-gradient-to-r from-hotel-gold to-hotel-gold-dark hover:from-hotel-gold-light hover:to-hotel-gold text-hotel-emerald-dark shadow-gold hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span>{!isLogin && registrationStep === 'email' ? 'Sending code...' : !isLogin && registrationStep === 'otp' ? 'Verifying code...' : !isLogin ? 'Creating account...' : 'Authenticating...'}</span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Equalirio</span>
                </>
              ) : registrationStep === 'email' ? (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send verification code</span>
                </>
              ) : registrationStep === 'otp' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify email</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Guest Profile</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-black/30 border-t border-white/10 text-center text-[11px] text-gray-400">
          By signing in, you access VIP suite reservations and personalized concierge services.
        </div>
      </div>
    </div>
  );
}
