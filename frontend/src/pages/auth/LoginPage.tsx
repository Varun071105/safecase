import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      // Route based on role
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'INVESTIGATOR') {
        navigate('/investigation');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect credentials or deactivated account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (role: 'citizen' | 'investigator' | 'admin') => {
    setError(null);
    if (role === 'citizen') {
      setEmail('citizen.varun@example.com');
      setPassword('CitizenPass#2026');
    } else if (role === 'investigator') {
      setEmail('officer.sharma@safecase.gov');
      setPassword('Investigator#2026');
    } else {
      setEmail('admin@safecase.gov');
      setPassword('AdminSafecase#2026');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Split Panel (Reference 1) */}
      <div className="bg-[#0C2038] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative grid/border lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div>
          {/* Red square shield icon */}
          <div className="w-12 h-12 bg-[#C93636] flex items-center justify-center mb-6 shadow-sm">
            <ShieldAlert size={26} className="text-white" strokeWidth={2.2} />
          </div>

          {/* Small uppercase label */}
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-3">
            PUBLIC SAFETY PORTAL
          </div>

          {/* Large serif heading */}
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-serif font-bold text-white leading-tight mb-5 max-w-lg">
            Report scams. Recover control.
          </h1>

          {/* Supporting text */}
          <p className="text-sm lg:text-base text-[#94A3B8] leading-relaxed max-w-md">
            A secure civic service for documenting fraud, protecting your community, and following every investigation.
          </p>
        </div>

        {/* Small footer indicator */}
        <div className="pt-8 border-t border-[#1B3557] text-xs text-[#64748B] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Secure complaint handling · Available online</span>
        </div>
      </div>

      {/* Right Split Panel (Reference 1) */}
      <div className="bg-white p-8 lg:p-16 flex flex-col justify-center max-w-xl mx-auto w-full">
        <div className="w-full">
          {/* Small red uppercase label */}
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-2">
            SAFECASE / ANTI-SCAM DESK
          </div>

          {/* Large serif heading */}
          <h2 className="text-3xl font-serif font-bold text-[#0C2038] mb-2">
            Welcome back
          </h2>

          {/* Supporting text */}
          <p className="text-sm text-[#64748B] mb-8">
            Sign in to view your casework.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-[#C93636] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] focus:ring-1 focus:ring-[#0C2038] rounded-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] focus:ring-1 focus:ring-[#0C2038] rounded-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#0C2038]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Red full-width Sign in button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 rounded-none disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              {!isSubmitting && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Don't have an account?</span>
            <Link to="/register" className="font-semibold text-[#0C2038] hover:underline">
              Register as a citizen
            </Link>
          </div>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-8 p-3.5 bg-[#F4F6F8] border border-[#E2E8F0]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Development Test Accounts (Click to Fill)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('citizen')}
                className="py-1.5 px-2 bg-white border border-[#CBD5E1] text-[11px] font-medium text-[#0C2038] hover:border-[#0C2038] text-center"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => fillDemo('investigator')}
                className="py-1.5 px-2 bg-white border border-[#CBD5E1] text-[11px] font-medium text-[#0C2038] hover:border-[#0C2038] text-center"
              >
                Investigator
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="py-1.5 px-2 bg-white border border-[#CBD5E1] text-[11px] font-medium text-[#0C2038] hover:border-[#0C2038] text-center"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
