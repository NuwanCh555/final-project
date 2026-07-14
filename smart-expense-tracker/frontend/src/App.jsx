import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Icons } from './components/Icons';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Standard Recharts imports for dynamic data analytics
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

// ==========================================
// ROUTE GUARDS (R-AUTH-6)
// ==========================================
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return token ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return !token ? children : <Navigate to="/dashboard" replace />;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
  </div>
);

// ==========================================
// NOTIFICATION ALERT DROPDOWN WRAPPER
// ==========================================
const AlertCenter = ({ alerts, clearAlerts }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-brand-500 hover:bg-slate-100 rounded-full transition-all duration-200"
      >
        <Icons.Bell className="w-6 h-6" />
        {alerts.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 animate-slide-in overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">Notifications</h3>
            {alerts.length > 0 && (
              <button
                onClick={() => {
                  clearAlerts();
                  setOpen(false);
                }}
                className="text-xs text-brand-500 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No active notifications.
              </div>
            ) : (
              alerts.map((a, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 p-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors ${
                    a.type === 'critical' ? 'bg-rose-50/20' : 'bg-amber-50/20'
                  }`}
                >
                  <Icons.AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 ${
                      a.type === 'critical' ? 'text-rose-500' : 'text-amber-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 font-medium">{a.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {format(new Date(a.date), 'h:mm a, MMM d')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SIDEBAR COLLAPSIBLE COMPONENT (SDS Wireframe Style)
// ==========================================
const Sidebar = ({ expanded, toggle }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'Home' },
    { name: 'Transactions', path: '/transactions', icon: 'Coins' },
    { name: 'Categories', path: '/categories', icon: 'Tag' },
    { name: 'Budgets', path: '/budgets', icon: 'TrendingUp' },
    { name: 'Reports', path: '/reports', icon: 'FileText' },
    { name: 'Settings', path: '/settings', icon: 'Settings' },
  ];

  return (
    <div
      className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-40 ${
        expanded ? 'w-64' : 'w-20'
      } hidden md:flex`}
    >
      <div>
        {/* Brand Header with abstract cobalt logo */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-extrabold shadow-sm animate-float">
            💎
          </div>
          {expanded && (
            <span className="font-extrabold text-slate-800 text-md tracking-tight font-sans">
              SMART EXPENSE
            </span>
          )}
        </div>

        {/* User Card — links to Settings */}
        {expanded && user && (
          <Link
            to="/settings"
            className="m-4 p-4 bg-slate-50 hover:bg-brand-50 rounded-2xl flex items-center gap-3 border border-slate-100 hover:border-brand-200 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-lg group-hover:ring-2 group-hover:ring-brand-400 group-hover:ring-offset-1 transition-all overflow-hidden shrink-0">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate">
              <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-brand-600 transition-colors">{user.name}</h4>
              <p className="text-xs text-slate-400 truncate">View Profile</p>
            </div>
          </Link>
        )}

        {/* Menu Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1f2937] text-white shadow-md' // SDS Dark grey-blue active item
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-500'
                }`}
              >
                <Icons.Dynamic name={item.icon} className="w-5 h-5 flex-shrink-0" />
                {expanded && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Link */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-xl font-bold text-sm transition-all duration-200"
        >
          <Icons.LogOut className="w-5 h-5 flex-shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// SYSTEM LAYOUT PACKAGER
// ==========================================
const AppLayout = ({ children, alerts, clearAlerts }) => {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const titleMap = {
    '/dashboard': 'Dashboard',
    '/transactions': 'Transactions Ledger',
    '/categories': 'Category Manager',
    '/budgets': 'Budget Limits & Warnings',
    '/reports': 'Financial Intelligence Reports',
    '/settings': 'System Configurations',
  };

  const title = titleMap[location.pathname] || 'Smart Expense Tracker';

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Collapsible Sidebar */}
      <Sidebar expanded={expanded} toggle={() => setExpanded(!expanded)} />

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 md:hidden backdrop-blur-sm transition-all duration-300">
          <div className="w-64 bg-white min-h-screen flex flex-col justify-between p-4 animate-slide-in">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <span className="font-extrabold text-slate-800 text-lg">🪙 SMART EXPENSE</span>
                <button onClick={() => setMobileOpen(false)}>
                  <Icons.X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {user && (
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="p-4 bg-slate-50 hover:bg-brand-50 rounded-2xl flex items-center gap-3 mb-6 border border-transparent hover:border-brand-200 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-lg group-hover:ring-2 group-hover:ring-brand-400 group-hover:ring-offset-1 transition-all overflow-hidden shrink-0">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-brand-600 transition-colors">{user.name}</h4>
                    <p className="text-xs text-slate-400 truncate">View Profile</p>
                  </div>
                </Link>
              )}

              <nav className="space-y-1">
                {[
                  { name: 'Dashboard', path: '/dashboard', icon: 'Home' },
                  { name: 'Transactions', path: '/transactions', icon: 'Coins' },
                  { name: 'Categories', path: '/categories', icon: 'Tag' },
                  { name: 'Budgets', path: '/budgets', icon: 'TrendingUp' },
                  { name: 'Reports', path: '/reports', icon: 'FileText' },
                  { name: 'Settings', path: '/settings', icon: 'Settings' },
                ].map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-[#1f2937] text-white shadow-md'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-brand-500'
                      }`}
                    >
                      <Icons.Dynamic name={item.icon} className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-xl font-medium text-sm transition-all"
            >
              <Icons.LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Icons.Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="hidden md:block p-1 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-brand-500 transition-colors"
            >
              <Icons.Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-slate-800 text-base md:text-lg tracking-tight truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Warning & Critical Alerts dropdown */}
            <AlertCenter alerts={alerts} clearAlerts={clearAlerts} />

            {/* Profile Indicator — links to Settings */}
            {user && (
              <Link
                to="/settings"
                className="flex items-center gap-2 border-l border-slate-200 pl-4 group cursor-pointer"
                title="Go to Settings"
              >
                <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-sm group-hover:bg-brand-500 group-hover:text-white group-hover:ring-2 group-hover:ring-brand-400 group-hover:ring-offset-1 transition-all duration-200 overflow-hidden shrink-0">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-bold text-slate-600 hidden sm:block group-hover:text-brand-600 transition-colors duration-200">
                  {user.name}
                </span>
              </Link>
            )}
          </div>
        </header>

        {/* Dynamic Route Container */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// ==========================================
// PAGE 1: PUBLIC LANDING PAGE
// ==========================================
const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 relative overflow-hidden">
      {/* Background radial soft lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-200/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-income/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-float">🪙</span>
          <span className="font-extrabold text-slate-800 tracking-tight text-lg">SMART EXPENSE</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-brand-500">
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-brand-500 text-white px-4 py-2 rounded-xl hover:bg-brand-600 hover:shadow-lg transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto z-10 py-12">
        <span className="text-xs font-extrabold uppercase bg-brand-500/10 text-brand-600 px-3 py-1.5 rounded-full mb-6">
          Premium Personal Finance Dashboard
        </span>
        <h1 className="font-extrabold text-slate-800 text-4xl sm:text-6xl tracking-tight leading-none mb-6">
          Automate and Simplify <br />
          <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-income text-transparent bg-clip-text">
            Your Monthly Spending
          </span>
        </h1>
        <p className="text-slate-500 text-md sm:text-lg max-w-2xl mb-10 leading-relaxed">
          Record your income, categorize transactions with interactive details, configure custom
          monthly budget thresholds, and prevent overspending with dynamic, auto-triggered visual and
          email notifications.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            to="/register"
            className="bg-brand-500 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-100 transition-all text-base"
          >
            Create Your Free Account
          </Link>
          <Link
            to="/login"
            className="bg-white border border-slate-200 text-slate-600 font-semibold px-8 py-4 rounded-2xl hover:bg-slate-50 transition-all text-base"
          >
            Access Existing Session
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white border-t border-slate-100 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Detailed Analytical Graphs',
              desc: 'Leverage Recharts integration to monitor expense categories and net balance flows instantly.',
              icon: 'PieChart',
              color: 'text-brand-500 bg-brand-50',
            },
            {
              title: 'Interactive Budgets & Alerts',
              desc: 'Receive alerts when spending exceeds 80% warnings or 100% critical limits.',
              icon: 'AlertTriangle',
              color: 'text-warning bg-warning-light/40',
            },
            {
              title: 'Bulk CSV Ledger Upload',
              desc: 'Seamlessly upload templates containing rows of past statements and compile them.',
              icon: 'Upload',
              color: 'text-income bg-income-light',
            },
          ].map((f, i) => (
            <div key={i} className="p-8 border border-slate-100 rounded-3xl glass-panel-hover">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${f.color}`}>
                <Icons.Dynamic name={f.icon} className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="h-16 border-t border-slate-100 bg-white/70 flex items-center justify-center px-6">
        <p className="text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Smart Expense Tracker Web System. Prepared by M.C. Nuwan.
        </p>
      </footer>
    </div>
  );
};

// ==========================================
// PAGES 2 & 3: AUTHENTICATION (SDS Dark Wireframe Style)
// ==========================================
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP flow states
  const [step, setStep] = useState('login'); // 'login', 'forgot', 'verify', 'reset'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login attempt failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccessMsg(res.message || 'OTP sent to your email.');
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.verifyOTP(email, otp);
      setSuccessMsg(res.message || 'OTP verified successfully.');
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmNewPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(email, otp, newPassword);
      setSuccessMsg(res.message || 'Password updated successfully. You can now login.');
      setStep('login');
      // Clear fields
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-[#1e2235] text-white rounded-3xl p-8 shadow-2xl z-10 border border-slate-800">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          {/* Glowing Green Hex Shield Logo */}
          <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 animate-float">
            $
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {step === 'login' && 'Smart Expense Tracker'}
            {step === 'forgot' && 'Reset Password'}
            {step === 'verify' && 'Enter OTP'}
            {step === 'reset' && 'Create New Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'login' && 'ATI Rathnapura • Final Year Project'}
            {step === 'forgot' && 'Step 1: Enter your registered email'}
            {step === 'verify' && 'Step 2: Enter the 6-digit OTP code sent to your email'}
            {step === 'reset' && 'Step 3: Enter your new strong password'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border-l-4 border-rose-500 rounded-xl text-xs text-rose-300 font-medium flex gap-2 animate-slide-in">
            <Icons.AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/40 border-l-4 border-emerald-500 rounded-xl text-xs text-emerald-300 font-medium flex gap-2 animate-slide-in">
            <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-700 py-2.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
                placeholder="e.g. nuwan@student.ac.lk"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setStep('forgot');
                  }}
                  className="text-[10px] font-bold text-brand-400 hover:text-brand-300 hover:underline uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-700 py-2.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4b5585] hover:bg-[#3f4773] text-white font-bold rounded-2xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-700 py-2.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
                placeholder="e.g. nuwan@student.ac.lk"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4b5585] hover:bg-[#3f4773] text-white font-bold rounded-2xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setStep('login');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white font-semibold block mt-4"
            >
              Back to Login
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-700 py-2.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold tracking-widest text-center"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4b5585] hover:bg-[#3f4773] text-white font-bold rounded-2xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setStep('forgot');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white font-semibold block mt-4"
            >
              Resend OTP
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-700 py-2.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
                placeholder="Min. 8 characters with strength"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-700 py-2.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
                placeholder="Re-enter new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'login' && (
          <p className="mt-8 text-center text-xs text-slate-400 font-medium">
            <Link to="/register" className="text-white hover:underline font-bold">
              Register
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Confirm password details do not match');
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-[#1e2235] text-white rounded-3xl p-8 shadow-2xl z-10 border border-slate-800">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 animate-float">
            $
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Start tracking your finances today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border-l-4 border-rose-500 rounded-xl text-xs text-rose-300 font-medium flex gap-2">
            <Icons.AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-700 py-1.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
              placeholder="e.g. M.C. Nuwan"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-700 py-1.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
              placeholder="e.g. nuwan@student.ac.lk"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-700 py-1.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-700 py-1.5 outline-none focus:border-brand-500 transition-colors text-sm font-semibold"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-[#4b5585] hover:bg-[#3f4773] text-white font-bold rounded-2xl shadow-lg transition-all text-sm"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          Already registered?{' '}
          <Link to="/login" className="text-white hover:underline font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

// ==========================================
// PAGE 4: DASHBOARD MAIN PAGE (SDS Style)
// ==========================================
const DashboardPage = ({ addAlert }) => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month-Year selections
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const txRes = await api.getTransactions({ limit: 10 });
        setTransactions(txRes.data);

        const bdgRes = await api.getBudgets(currentMonth, currentYear);
        setBudgets(bdgRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [currentMonth, currentYear]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const currentMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });

    const income = currentMonthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = currentMonthTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return { income, expenses, balance, savingsRate };
  }, [transactions, currentMonth, currentYear]);

  // Recharts Chart Formatter
  const categoryChartData = useMemo(() => {
    const expenses = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        new Date(t.date).getMonth() + 1 === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
    );

    const map = {};
    expenses.forEach((t) => {
      const catName = t.category?.name || 'Other';
      const catColor = t.category?.color || '#94a3b8';
      if (!map[catName]) {
        map[catName] = { name: catName, value: 0, color: catColor };
      }
      map[catName].value += t.amount;
    });

    return Object.values(map);
  }, [transactions, currentMonth, currentYear]);

  const trendsChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'MMM d');
      
      const dayTxs = transactions.filter((t) => {
        const txD = new Date(t.date);
        return txD.getDate() === d.getDate() && txD.getMonth() === d.getMonth() && txD.getFullYear() === d.getFullYear();
      });

      const income = dayTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      data.push({ name: dateStr, Income: income, Expenses: expenses });
    }
    return data;
  }, [transactions]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* SDS Layout Grid: Left total balance dark card, Right income and expense scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Balance Card (SDS Dark Card style with circular progress gauge) */}
        <div className="bg-[#202938] text-white p-6 rounded-3xl shadow-sm flex items-center justify-between border border-slate-800 lg:col-span-1 min-h-[140px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              Total Balance
            </span>
            <span className="text-3xl font-extrabold block tracking-tight">
              LKR {stats.balance.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Dashboard Paid</span>
            </div>
          </div>
          {/* Radial progress ring gauge matching SDS wireframe total balance */}
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="30"
                className="stroke-slate-700 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="30"
                className="stroke-emerald-500 fill-none transition-all duration-500"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - Math.min(Math.max(stats.savingsRate / 100, 0), 1))}`}
              />
            </svg>
            <div className="absolute font-extrabold text-xs text-emerald-400">
              {stats.savingsRate >= 0 ? `${stats.savingsRate.toFixed(0)}%` : '0%'}
            </div>
          </div>
        </div>

        {/* Income Card (SDS clean white border scorecard) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between shadow-sm min-h-[140px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Income
            </span>
            <span className="text-2xl font-extrabold text-slate-700 block tracking-tight">
              LKR {stats.income.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-income-light text-income">
            <Icons.Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Expense Card (SDS clean white border scorecard) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between shadow-sm min-h-[140px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Expense
            </span>
            <span className="text-2xl font-extrabold text-slate-700 block tracking-tight">
              LKR {stats.expenses.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-expense-light text-expense">
            <Icons.Trash className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recurring Budget bar (SDS Wireframe styled progress) */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold mb-2 text-slate-600">
          <span>Recurring Budget Used</span>
          <span className="text-slate-800 font-extrabold">80% Used</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: '80%' }}></div>
        </div>
      </div>

      {/* Charts & Ledger Tables (SDS layouts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SDS category distribution Pie Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between h-[380px] shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                Expense Category
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Chart</span>
            </div>
            <div className="w-full h-[220px] flex items-center justify-center">
              {categoryChartData.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-10 font-medium">
                  No expense records found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Custom Labels List */}
          <div className="max-h-24 overflow-y-auto space-y-1.5 mt-2 border-t border-slate-50 pt-2">
            {categoryChartData.slice(0, 3).map((c, i) => (
              <div key={i} className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}></span>
                  <span className="text-slate-500 font-bold truncate">{c.name}</span>
                </div>
                <span className="font-extrabold text-slate-800">LKR {c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SDS Transactions List (Bottom Left in Page 11 wireframe) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl h-[380px] shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                Transactions
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Latest</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-[11px]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-slate-400 py-16">
                        No transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    transactions.slice(0, 4).map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 text-slate-400">
                          {format(new Date(t.date), 'MM-dd')}
                        </td>
                        <td className="py-2.5 text-slate-700 truncate max-w-24">{t.description}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                              t.type === 'income'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {t.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 text-right font-extrabold ${
                            t.type === 'income' ? 'text-income' : 'text-expense'
                          }`}
                        >
                          LKR {t.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Link
            to="/transactions"
            className="text-[10px] text-brand-500 font-extrabold hover:underline block text-right"
          >
            View Full Ledger &rarr;
          </Link>
        </div>

        {/* SDS Monthly Bar Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl h-[380px] shadow-sm flex flex-col justify-between">
          <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-4">
            Monthly
          </h3>
          <div className="flex-1 w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                  }}
                />
                <Bar dataKey="Expenses" fill="#f03e3e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PAGE 5: TRANSACTIONS LEDGER (CRUD + BULK) (SDS Form + Table style)
// ==========================================
const TransactionsPage = ({ addAlert }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter States
  const [typeFilter, setTypeFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // CSV Import States
  const [importStatus, setImportStatus] = useState(null);

  // Modal CRUD controllers
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Form Fields states (SDS Page 12 Style)
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState('expense');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formDesc, setFormDesc] = useState('');
  const [formPayment, setFormPayment] = useState('cash');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      const filters = {
        type: typeFilter,
        category: catFilter,
        page,
        limit: 8, // Set to 8 rows for optimal spreadsheet sizing
      };
      const txRes = await api.getTransactions(filters);
      setTransactions(txRes.data);
      setPages(txRes.pagination.pages);

      const catRes = await api.getCategories();
      setCategories(catRes.data);

      const bdgRes = await api.getBudgets();
      setBudgets(bdgRes.data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, catFilter, page]);

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingTx(null);
    setFormAmount('');
    setFormType('expense');
    setFormCategory(categories.find(c => c.type === 'expense')?._id || '');
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormDesc('');
    setFormPayment('cash');
    setFormNotes('');
    setFormError('');
    setShowModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setFormAmount(tx.amount.toString());
    setFormType(tx.type);
    setFormCategory(tx.category?._id || '');
    setFormDate(format(new Date(tx.date), 'yyyy-MM-dd'));
    setFormDesc(tx.description || '');
    setFormPayment(tx.paymentMethod || 'cash');
    setFormNotes(tx.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Save creation/update transaction (CRUD)
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formAmount || isNaN(formAmount) || parseFloat(formAmount) <= 0) {
      return setFormError('Please enter a valid positive decimal amount');
    }

    if (!formCategory) {
      return setFormError('Please associate a transaction category');
    }

    try {
      if (editingTx) {
        const res = await api.updateTransaction(editingTx._id, {
          amount: formAmount,
          category: formCategory,
          date: formDate,
          description: formDesc,
          paymentMethod: formPayment,
          notes: formNotes,
        });

        if (res.alert) {
          addAlert(res.alert);
        }
      } else {
        const res = await api.createTransaction(
          formAmount,
          formType,
          formCategory,
          formDate,
          formDesc,
          formPayment,
          formNotes
        );

        if (res.alert) {
          addAlert(res.alert);
        }
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Saving transaction failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction ledger record?')) {
      try {
        await api.deleteTransaction(id);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',');
      const parsedRecords = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = line.split(',');
        const record = {};
        headers.forEach((h, idx) => {
          record[h.trim()] = cells[idx] ? cells[idx].replace(/"/g, '').trim() : '';
        });

        if (record.amount && record.type) {
          parsedRecords.push(record);
        }
      }

      if (parsedRecords.length === 0) {
        return setImportStatus({ error: 'No valid records parsed from CSV sheet template' });
      }

      try {
        setImportStatus({ processing: true });
        const res = await api.importTransactions(parsedRecords);
        setImportStatus({
          success: true,
          count: res.importedCount,
          errorCount: res.errorCount,
          errors: res.errors,
        });
        loadData();
      } catch (err) {
        setImportStatus({ error: err.message });
      }
    };
    reader.readAsText(file);
  };

  const searchedTransactions = useMemo(() => {
    if (!search) return transactions;
    return transactions.filter(
      (t) =>
        (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()))
    );
  }, [transactions, search]);

  const filteredCategories = categories.filter((c) => c.type === formType);

  return (
    <div className="space-y-6">
      {/* SDS Layout: Large persistent search bar & Tabs toggles */}
      <div className="space-y-4">
        {/* Large search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 shadow-sm outline-none focus:border-brand-500 font-medium text-sm transition-all"
          />
          <Icons.Filter className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        </div>

        {/* Tab Selection Filter System (All, Income, Expense) matching Page 13 perfectly */}
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {[
            { label: 'All', value: '' },
            { label: 'Income', value: 'income' },
            { label: 'Expense', value: 'expense' },
          ].map((tab) => {
            const isActive = typeFilter === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setTypeFilter(tab.value);
                  setPage(1);
                }}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-all ${
                  isActive
                    ? 'border-brand-500 text-brand-600 bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Structured Operations Actions Row */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-3">
        <div className="flex gap-2">
          {/* Custom Category dropdown */}
          <select
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {/* CSV Bulk upload trigger */}
          <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all">
            <Icons.Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>

          {/* Add transaction */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-100 animate-float"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* CSV feedback reports */}
      {importStatus && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">CSV Upload Report</h4>
            <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-slate-600">
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
          {importStatus.success && (
            <p className="text-xs text-income font-semibold">Successfully imported {importStatus.count} transaction records!</p>
          )}
          {importStatus.error && (
            <p className="text-xs text-rose-500 font-semibold">{importStatus.error}</p>
          )}
        </div>
      )}

      {/* SDS Tabular Spreadsheet Format arranging records chronologically (R-INC-4) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Date</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {searchedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-slate-400 py-16">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                searchedTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 text-slate-400">
                      {format(new Date(t.date), 'yyyy-MM-dd')}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-800 truncate max-w-44">
                      {t.description}
                    </td>
                    <td className="py-3.5">
                      {/* Explicit green/red type tags based on categorization */}
                      <span
                        className={`text-[10px] font-extrabold tracking-wider ${
                          t.type === 'income' ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {t.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 text-right font-extrabold text-sm ${
                        t.type === 'income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      LKR {t.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Explicit button markers as per page 13 */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="px-3 py-1 bg-[#2b6cb0] hover:bg-[#23588f] text-white rounded-lg text-[10px] font-extrabold transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="px-3 py-1 bg-[#2d3748] hover:bg-[#1a202c] text-white rounded-lg text-[10px] font-extrabold transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls with Arrow, 1-X counts, and Export alignment */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6 flex-wrap gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
          >
            &lt;
          </button>
          
          <span className="text-xs text-slate-500 font-extrabold">
            {page} of {pages || 1}
          </span>
          
          <div className="flex gap-2 items-center">
            <button
              disabled={page === pages || pages === 0}
              onClick={() => setPage(page + 1)}
              className="p-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all disabled:opacity-40 mr-4"
            >
              &gt;
            </button>

            <button
              onClick={() => api.exportTransactions()}
              className="bg-[#2b6cb0] hover:bg-[#23588f] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* SDS WIREFRAME STYLE MODAL FOR ADD/EDIT (Page 12 Style) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-slide-in">
            {/* Modal Title matching Page 12 header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-wider font-sans">
                {formType === 'income' ? 'Income' : 'Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-xs text-rose-600 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* SDS Side-by-side Type toggle buttons */}
              {!editingTx && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('income');
                      setFormCategory(categories.find((c) => c.type === 'income')?._id || '');
                    }}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all uppercase tracking-wider ${
                      formType === 'income'
                        ? 'bg-[#2f855a] text-white shadow-lg' // SDS Green button
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('expense');
                      setFormCategory(categories.find((c) => c.type === 'expense')?._id || '');
                    }}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all uppercase tracking-wider ${
                      formType === 'expense'
                        ? 'bg-[#c53030] text-white shadow-lg' // SDS Red button
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              )}

              {/* Side-by-side Amount & Date grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 outline-none font-semibold focus:bg-white focus:border-brand-500 text-sm"
                    placeholder="| 700"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50/50 rounded-xl pl-4 pr-10 py-2.5 outline-none font-semibold focus:bg-white focus:border-brand-500 text-sm"
                  />
                  <div className="absolute right-3 top-8 pointer-events-none text-slate-400">
                    <Icons.Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Category selector matching Page 12 drop-down */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 outline-none font-semibold focus:bg-white focus:border-brand-500 text-sm"
                >
                  <option value="">Select Category</option>
                  {filteredCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 outline-none font-semibold focus:bg-white focus:border-brand-500 text-sm"
                  placeholder="e.g. Myltohet"
                />
              </div>

              {/* Payment Method drop-down */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={formPayment}
                  onChange={(e) => setFormPayment(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 outline-none font-semibold focus:bg-white focus:border-brand-500 text-sm uppercase text-[10px] tracking-wider font-bold"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="digital">Digital Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Extended Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 outline-none font-semibold focus:bg-white focus:border-brand-500 text-xs h-16"
                  placeholder="Additional context notes..."
                />
              </div>

              {/* Huge Solid Green Save button matching page 12 */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#2f855a] hover:bg-[#225c3e] text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider"
              >
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// PAGE 6: CATEGORY MANAGER
// ==========================================
const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#4f6fff');
  const [icon, setIcon] = useState('Tag');
  const [error, setError] = useState('');

  const colorsList = ['#4f6fff', '#0ca678', '#f03e3e', '#f59f00', '#10b981', '#3b82f6', '#f43f5e', '#fb923c', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];
  const iconsList = ['Coins', 'Briefcase', 'Utensils', 'Home', 'FileText', 'Tag', 'HelpCircle', 'Settings', 'Calendar', 'User', 'PieChart', 'Bell'];

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter a category name');

    try {
      await api.createCategory(name, type, color, icon);
      setName('');
      loadCategories();
    } catch (err) {
      setError(err.message || 'Creating custom category failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom category?')) {
      try {
        await api.deleteCategory(id);
        loadCategories();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Category Creation Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm h-fit">
        <h3 className="font-extrabold text-slate-700 text-xs mb-4 uppercase tracking-wider text-slate-400">
          Create Custom Category
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input"
              placeholder="e.g. Groceries, Dividends"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Classification
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'expense' ? 'bg-white text-expense shadow' : 'text-slate-400'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'income' ? 'bg-white text-income shadow' : 'text-slate-400'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Color grid picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Theme Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colorsList.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                ></button>
              ))}
            </div>
          </div>

          {/* Icon list picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Graphic Icon
            </label>
            <div className="grid grid-cols-6 gap-2 border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
              {iconsList.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-500 flex items-center justify-center transition-all ${
                    icon === i ? 'bg-white text-brand-500 shadow-sm ring-1 ring-slate-200' : ''
                  }`}
                >
                  <Icons.Dynamic name={i} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2b6cb0] hover:bg-[#23588f] text-white font-extrabold rounded-2xl shadow-lg transition-all text-xs uppercase tracking-wider"
          >
            Create Category
          </button>
        </form>
      </div>

      {/* Grid of existing Categories */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm lg:col-span-2">
        <h3 className="font-extrabold text-slate-700 text-xs mb-4 uppercase tracking-wider text-slate-400">
          Available Categories
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c._id}
              className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition-shadow bg-white"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: c.color }}
                >
                  <Icons.Dynamic name={c.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{c.name}</h4>
                  <span
                    className={`text-[9px] uppercase font-extrabold tracking-wider ${
                      c.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {c.type}
                  </span>
                </div>
              </div>

              {c.user ? (
                <button
                  onClick={() => handleDelete(c._id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Icons.Trash className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded">
                  System
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PAGE 7: BUDGETS MANAGER (SDS Progress meters Style)
// ==========================================
const BudgetsPage = ({ addAlert }) => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [formCategory, setFormCategory] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formWarning, setFormWarning] = useState('0.8');
  const [formError, setFormError] = useState('');

  const loadBudgetsData = async () => {
    try {
      const bdgRes = await api.getBudgets();
      setBudgets(bdgRes.data);

      const catRes = await api.getCategories();
      const expenseCats = catRes.data.filter((c) => c.type === 'expense');
      setCategories(expenseCats);
      if (expenseCats.length > 0) {
        setFormCategory(expenseCats[0]._id);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetsData();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formLimit || isNaN(formLimit) || parseFloat(formLimit) <= 0) {
      return setFormError('Please enter a valid positive monthly budget limit');
    }

    try {
      await api.createOrUpdateBudget(formCategory, formLimit, formWarning, '1.0');
      setFormLimit('');
      loadBudgetsData();
    } catch (err) {
      setFormError(err.message || 'Saving budget allocation failed');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to remove this budget spending threshold?')) {
      try {
        await api.deleteBudget(id);
        loadBudgetsData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Limit Setup Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm h-fit">
        <h3 className="font-extrabold text-slate-700 text-xs mb-4 uppercase tracking-wider text-slate-400">
          Configure Budget Limits
        </h3>

        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-xs text-rose-600 font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full glass-input bg-white text-slate-600"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Monthly Limit (LKR)
            </label>
            <input
              type="number"
              required
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
              className="w-full glass-input"
              placeholder="e.g. 15000"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Warning Trigger Threshold
            </label>
            <select
              value={formWarning}
              onChange={(e) => setFormWarning(e.target.value)}
              className="w-full glass-input bg-white text-slate-600"
            >
              <option value="0.7">Approach Warning at 70% Limit</option>
              <option value="0.8">Approach Warning at 80% Limit</option>
              <option value="0.9">Approach Warning at 90% Limit</option>
            </select>
            <p className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">
              Critical alerts trigger automatically at 100% of limits.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#2b6cb0] hover:bg-[#23588f] text-white font-extrabold rounded-2xl shadow-lg transition-all text-xs uppercase tracking-wider"
          >
            Save Limit
          </button>
        </form>
      </div>

      {/* Category Threshold Progress Meters (SDS Section 4.4 Style) */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-6">
        <h3 className="font-extrabold text-slate-700 text-xs mb-4 uppercase tracking-wider text-slate-400">
          Monthly Spent vs. Budget Thresholds
        </h3>

        {budgets.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-16">
            No spending limits configured yet for this month.
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.map((b) => {
              const overLimit = b.totalSpent >= b.limit;
              const warningLimit = b.totalSpent >= b.limit * b.warningThreshold && !overLimit;

              return (
                <div key={b._id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 shadow-sm">
                  {/* Category, limits info */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: b.category?.color }}
                      >
                        <Icons.Dynamic name={b.category?.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-700 text-xs">{b.category?.name}</h4>
                        <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                          {warningLimit ? (
                            <span className="text-amber-500">Approaching Warning Threshold</span>
                          ) : overLimit ? (
                            <span className="text-rose-500 font-bold">CRITICAL: Limit Exceeded!</span>
                          ) : (
                            <span className="text-income">Spending within safe bounds</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-800 block">
                          LKR {b.totalSpent.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          of LKR {b.limit.toLocaleString()} monthly limit
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteBudget(b._id)}
                        className="p-1.5 text-slate-350 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Utilization bar */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner relative">
                    <div
                      className="absolute top-0 bottom-0 border-l border-white/50 z-10"
                      style={{ left: `${b.warningThreshold * 100}%` }}
                    ></div>

                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        overLimit ? 'bg-[#c53030]' : warningLimit ? 'bg-[#d69e2e]' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// PAGE 8: REPORTS & EXPORTS (SDS Base View style)
// ==========================================
const ReportsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month-Year boundaries
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const txRes = await api.getTransactions({ limit: 1000 });
        setTransactions(txRes.data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  const dataMetrics = useMemo(() => {
    const monthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === m && d.getFullYear() === y;
    });

    const incomeTotal = monthTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = monthTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsTotal = incomeTotal - expenseTotal;

    const expMap = {};
    monthTxs.filter((t) => t.type === 'expense').forEach((t) => {
      const name = t.category?.name || 'Other';
      const color = t.category?.color || '#cbd5e1';
      if (!expMap[name]) expMap[name] = { name, value: 0, color };
      expMap[name].value += t.amount;
    });

    const methodMap = { cash: 0, card: 0, digital: 0 };
    monthTxs.filter((t) => t.type === 'expense').forEach((t) => {
      const method = t.paymentMethod || 'cash';
      methodMap[method] = (methodMap[method] || 0) + t.amount;
    });

    const methodData = Object.keys(methodMap).map((key) => ({
      name: key.toUpperCase(),
      value: methodMap[key],
    }));

    return {
      incomeTotal,
      expenseTotal,
      savingsTotal,
      categoryData: Object.values(expMap),
      methodData,
      recordsCount: monthTxs.length,
    };
  }, [transactions, m, y]);

  const triggerPDFPrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 printable-report">
      {/* Report Header (hidden in normal screen, visible on print!) */}
      <div className="hidden print:block text-center border-b-2 border-slate-100 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Financial Intelligence Summary Report</h1>
        <p className="text-xs text-slate-400 mt-1">Generated by Smart Expense Tracker Web System | Prepared by M.C. Nuwan</p>
        <span className="text-[10px] text-slate-500 mt-2 block">Report Period: {format(new Date(), 'MMMM yyyy')}</span>
      </div>

      {/* SDS Reports Base View: Data-filtering parameters with download buttons */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:hidden flex-wrap gap-4">
        <div>
          <h3 className="font-extrabold text-slate-700 text-sm">Statement Filtering & Exports</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Export interactive ledger as print-ready PDF</p>
        </div>

        {/* SDS Date Filtering mockup boxes */}
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="date"
            defaultValue={format(startOfMonth(new Date()), 'yyyy-MM-dd')}
            className="border border-slate-200 bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none"
          />
          <span className="text-slate-400 font-bold text-xs">-</span>
          <input
            type="date"
            defaultValue={format(endOfMonth(new Date()), 'yyyy-MM-dd')}
            className="border border-slate-200 bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none mr-2"
          />
          
          <button
            onClick={triggerPDFPrint}
            className="bg-[#2b6cb0] hover:bg-[#23588f] text-white text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-100"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Metrics Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: 'Income Generated', value: `LKR ${dataMetrics.incomeTotal.toLocaleString()}`, color: 'text-income' },
          { title: 'Expenditure Total', value: `LKR ${dataMetrics.expenseTotal.toLocaleString()}`, color: 'text-expense' },
          { title: 'Net Saving Balance', value: `LKR ${dataMetrics.savingsTotal.toLocaleString()}`, color: dataMetrics.savingsTotal >= 0 ? 'text-income' : 'text-expense' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl text-center shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">{item.title}</span>
            <span className={`text-2xl font-extrabold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Data tables metrics breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Expense Table breakdown */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider text-slate-400 mb-4">
            Category Spending Distribution
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {dataMetrics.categoryData.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center text-slate-400 py-10">No records found.</td>
                </tr>
              ) : (
                dataMetrics.categoryData.map((c, i) => {
                  const percent = dataMetrics.expenseTotal > 0 ? (c.value / dataMetrics.expenseTotal) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}></span>
                        <span className="text-slate-700 font-bold">{c.name}</span>
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-slate-800">LKR {c.value.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-400 font-semibold">{percent.toFixed(1)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Methods Allocation table */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider text-slate-400 mb-4">
            Payment Method Allocation
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-2">Payment Method</th>
                <th className="pb-2 text-right">Total Amount</th>
                <th className="pb-2 text-right">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {dataMetrics.expenseTotal === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center text-slate-400 py-10">No records found.</td>
                </tr>
              ) : (
                dataMetrics.methodData.map((m, i) => {
                  const percent = dataMetrics.expenseTotal > 0 ? (m.value / dataMetrics.expenseTotal) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold">{m.name}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-800">LKR {m.value.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-400 font-semibold">{percent.toFixed(1)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PAGE 9: SETTINGS & PRESETS CONFIGS
// ==========================================
const SettingsPage = () => {
  const { user, updateProfile, uploadProfilePicture } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setError('');
      await uploadProfilePicture(file);
      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirm) {
      return setError('New passwords do not match');
    }

    try {
      await updateProfile(name, email, password);
      setSuccess('Profile configuration settings saved successfully!');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.message || 'Updating profile failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
      <h3 className="font-extrabold text-slate-700 text-xs mb-4 uppercase tracking-wider text-slate-400">
        Account Profile Settings
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-xs text-rose-600 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-xs text-emerald-600 font-medium">
          {success}
        </div>
      )}

      {/* Profile Picture Uploader */}
      <div className="mb-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-3xl overflow-hidden shrink-0 border-2 border-brand-200">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h4 className="font-bold text-slate-700 text-sm mb-2">Profile Picture</h4>
          <label className={`cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Icons.Upload className="w-4 h-4" />
            <span>{uploadingAvatar ? 'Uploading...' : 'Upload New Picture'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
          </label>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">JPG, JPEG, or PNG formats only.</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full glass-input"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full glass-input"
          />
        </div>

        <div className="border-t border-slate-100 pt-4 mt-6">
          <h4 className="font-bold text-slate-750 text-xs mb-3">Change Password (Optional)</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input text-xs"
                placeholder="Leave blank to keep current"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full glass-input text-xs"
                placeholder="Re-enter new password"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-2xl shadow-lg transition-all text-xs uppercase tracking-wider"
        >
          Save Configurations
        </button>
      </form>
    </div>
  );
};

// ==========================================
// CORE APP ROUTER & SHELL ORCHESTRATOR
// ==========================================
const AppContent = () => {
  const { user, sessionTimeoutAlert, setSessionTimeoutAlert } = useAuth();
  
  // High-priority Warning & Critical alerts notifications state
  const [alerts, setAlerts] = useState(() => {
    return [
      {
        message: 'Welcome! Smart Expense Tracker system initialized successfully in MERN Full-Stack Mode.',
        type: 'warning',
        date: new Date().toISOString(),
      },
    ];
  });

  const addAlert = (alert) => {
    setAlerts((prev) => [
      {
        message: alert.message,
        type: alert.alertType,
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const clearAlerts = () => setAlerts([]);

  return (
    <>
      {/* Session timeout popup indicator */}
      {sessionTimeoutAlert && (
        <div className="fixed inset-x-0 top-4 mx-auto w-full max-w-sm bg-amber-50 border-l-4 border-amber-500 p-4 rounded-2xl shadow-2xl z-50 flex gap-3 items-center animate-slide-in">
          <Icons.AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-amber-800 text-xs">Session Timeout Triggered</h4>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">
              Logged out due to 30 minutes of inactivity. Please re-authenticate.
            </p>
          </div>
          <button
            onClick={() => setSessionTimeoutAlert(false)}
            className="text-amber-500 hover:text-amber-700 ml-auto"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout alerts={alerts} clearAlerts={clearAlerts}>
                <DashboardPage addAlert={addAlert} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AppLayout alerts={alerts} clearAlerts={clearAlerts}>
                <TransactionsPage addAlert={addAlert} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AppLayout alerts={alerts} clearAlerts={clearAlerts}>
                <CategoriesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <AppLayout alerts={alerts} clearAlerts={clearAlerts}>
                <BudgetsPage addAlert={addAlert} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout alerts={alerts} clearAlerts={clearAlerts}>
                <ReportsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout alerts={alerts} clearAlerts={clearAlerts}>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback router */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}
