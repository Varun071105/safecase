import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User, Mail, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        full_name: fullName,
        email,
        phone_number: phone,
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Split Panel */}
      <div className="bg-[#0C2038] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div>
          <div className="w-12 h-12 bg-[#C93636] flex items-center justify-center mb-6 shadow-sm">
            <ShieldAlert size={26} className="text-white" strokeWidth={2.2} />
          </div>

          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-3">
            PUBLIC SAFETY PORTAL
          </div>

          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-serif font-bold text-white leading-tight mb-5 max-w-lg">
            Citizen Registration
          </h1>

          <p className="text-sm lg:text-base text-[#94A3B8] leading-relaxed max-w-md">
            Create an official verified account to document fraud incidents, upload evidentiary materials, and track investigation updates in real time.
          </p>
        </div>

        <div className="pt-8 border-t border-[#1B3557] text-xs text-[#64748B] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Encrypted citizen records · Compliant with civic privacy standards</span>
        </div>
      </div>

      {/* Right Split Panel */}
      <div className="bg-white p-8 lg:p-16 flex flex-col justify-center max-w-xl mx-auto w-full">
        <div className="w-full">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-2">
            SAFECASE / CITIZEN DESK
          </div>

          <h2 className="text-3xl font-serif font-bold text-[#0C2038] mb-2">
            Create an account
          </h2>

          <p className="text-sm text-[#64748B] mb-8">
            Enter your details to register as a citizen complainant.
          </p>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-[#C93636] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Full Legal Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Varun Singh"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] focus:ring-1 focus:ring-[#0C2038] rounded-none"
                  required
                />
              </div>
            </div>

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
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] focus:ring-1 focus:ring-[#0C2038] rounded-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] focus:ring-1 focus:ring-[#0C2038] rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] focus:ring-1 focus:ring-[#0C2038] rounded-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] focus:ring-1 focus:ring-[#0C2038] rounded-none"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 rounded-none disabled:opacity-60"
            >
              {isSubmitting ? 'Registering...' : 'Register as Citizen'}
              {!isSubmitting && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Already have an account?</span>
            <Link to="/login" className="font-semibold text-[#0C2038] hover:underline">
              Sign in to casework
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
