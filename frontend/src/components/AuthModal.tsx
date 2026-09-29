import React, { useState } from 'react';
import { X, User, Lock, Phone, MapPin, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { authModal, closeAuthModal, login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(authModal.mode);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');

  // Password Reset states
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [codePreview, setCodePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!authModal.isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(phone.trim(), password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Invalid phone or password');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await register({
      fullName: fullName.trim(),
      phone: phone.trim(),
      password,
      confirmPassword,
      address: address.trim(),
    });
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Registration successful! Your account is PENDING_APPROVAL by administrator before placing orders.');
      setTimeout(() => {
        closeAuthModal();
      }, 2500);
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setResetStep('confirm');
        if (data.data?.resetCodePreview) {
          setCodePreview(data.data.resetCodePreview);
          setResetCode(data.data.resetCodePreview);
        }
        setSuccessMessage('Reset code generated. Enter the code and your new password.');
      } else {
        setError(data.message || 'Unable to request reset');
      }
    } catch {
      setLoading(false);
      setError('Network error connecting to reset service');
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          resetCode: resetCode.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setSuccessMessage('Password reset successfully! You can now sign in.');
        setTimeout(() => {
          setTab('login');
          setResetStep('request');
          setPassword(newPassword);
        }, 1500);
      } else {
        setError(data.message || 'Reset failed');
      }
    } catch {
      setLoading(false);
      setError('Network error during password reset');
    }
  };

  const fillQuickCredentials = (type: 'super_admin' | 'moderator' | 'customer') => {
    setTab('login');
    if (type === 'super_admin') {
      setPhone('01700000000');
      setPassword('Admin@123456');
    } else if (type === 'moderator') {
      setPhone('01711111111');
      setPassword('Moderator@123456');
    } else {
      setPhone('01800000000');
      setPassword('Customer@123456');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full my-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Close */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-3.5 text-xs font-black uppercase tracking-wider transition ${
              tab === 'login'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-3.5 text-xs font-black uppercase tracking-wider transition ${
              tab === 'register'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => {
              setTab('forgot');
              setError(null);
            }}
            className={`py-3.5 text-xs font-black uppercase tracking-wider transition ${
              tab === 'forgot'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reset Pass
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number (01X)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono font-bold"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setError(null);
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              {/* Quick Fill Demo Accounts */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Quick 1-Click Demo Login:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuickCredentials('customer')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-bold text-left transition"
                  >
                    👤 Customer
                    <span className="block text-[9px] text-slate-400 font-normal">01800000000</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickCredentials('moderator')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-bold text-left transition"
                  >
                    ⚖️ Moderator
                    <span className="block text-[9px] text-slate-400 font-normal">01711111111</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickCredentials('super_admin')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-bold text-left transition"
                  >
                    🛡️ Super Admin
                    <span className="block text-[9px] text-slate-400 font-normal">01700000000</span>
                  </button>
                </div>
              </div>
            </form>
          ) : tab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (Bangladeshi 01X) *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Address *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, Road, Area, Dhaka"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Approval Notice */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Customer Approval Required:</strong> As per Liton Brothers policy, new customer accounts require admin approval before ordering.
                </span>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-60"
              >
                {loading ? 'Registering Account...' : 'Submit & Register'}
              </button>
            </form>
          ) : (
            /* Forgot Password Flow */
            <div className="space-y-4 text-xs">
              {resetStep === 'request' ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-slate-600 text-xs">
                    Enter your registered Bangladeshi mobile number to receive a secure 6-digit password reset code.
                  </p>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number (01X)</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono font-bold"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-60"
                  >
                    {loading ? 'Requesting Code...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  {codePreview && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-mono text-center">
                      <div className="text-[10px] text-emerald-700 uppercase font-sans font-bold">Generated Verification Code:</div>
                      <div className="text-2xl font-black tracking-widest">{codePreview}</div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">6-Digit Reset Code *</label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none font-mono font-bold text-center text-lg tracking-wider"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">New Password *</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-60"
                  >
                    {loading ? 'Resetting Password...' : 'Confirm Password Reset'}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
