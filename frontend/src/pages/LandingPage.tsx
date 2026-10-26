import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  FileText,
  Lock,
  Clock,
  CheckCircle,
  HelpCircle,
  PhoneCall
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'INVESTIGATOR') return '/investigation';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col">
      {/* Top Banner & Navigation */}
      <nav className="h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C93636] flex items-center justify-center">
            <ShieldAlert size={18} className="text-white" strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-serif font-bold tracking-wider text-base text-[#0C2038] block leading-none">
              SAFECASE
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#64748B] font-semibold block mt-0.5">
              ANTI-SCAM COMPLAINT & INVESTIGATION DESK
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={getDashboardLink()}
              className="px-4 py-2 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              Open Casework Console <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#0C2038] hover:text-[#C93636]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Citizen Portal
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section (Design System Matching Reference 1) */}
      <section className="bg-[#0C2038] text-white py-16 lg:py-24 px-4 lg:px-12 border-b border-[#1B3557] relative">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-block text-xs font-semibold uppercase tracking-widest text-[#C93636] bg-[#132A47] px-3 py-1 border border-[#1B3557]">
            PUBLIC SAFETY & CYBER DEFENSE INITIATIVE
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
            Report scams. Recover control.
          </h1>

          <p className="text-sm md:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            A secure civic service for documenting fraud, protecting your community, and following every investigation with institutional transparency.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/dashboard/file' : '/register'}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              File Scam Incident Report <ArrowRight size={14} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-transparent border border-[#94A3B8] hover:border-white text-white text-xs font-semibold uppercase tracking-wider text-center"
            >
              Sign In to Track Casework
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="py-12 px-4 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] text-center mb-2">
          OFFICIAL PROTOCOL
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#0C2038] text-center mb-8">
          Standardized Investigation Lifecycle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] p-5">
            <div className="text-xs font-mono font-bold text-[#C93636] mb-2">01. INTAKE</div>
            <h3 className="font-serif font-bold text-sm text-[#0C2038] mb-1">Formal Complaint</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Citizens register scam details, monetary losses, and attach evidentiary screenshots securely.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5">
            <div className="text-xs font-mono font-bold text-[#C93636] mb-2">02. TRIAGE</div>
            <h3 className="font-serif font-bold text-sm text-[#0C2038] mb-1">Under Review</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Case officers verify transaction references and corroborate identifier patterns.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5">
            <div className="text-xs font-mono font-bold text-[#C93636] mb-2">03. ACTION</div>
            <h3 className="font-serif font-bold text-sm text-[#0C2038] mb-1">Investigation Active</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Notices dispatched to telecom operators and payment providers; identifiers blacklisted.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5">
            <div className="text-xs font-mono font-bold text-[#C93636] mb-2">04. CLOSURE</div>
            <h3 className="font-serif font-bold text-sm text-[#0C2038] mb-1">Resolution & Audit</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Case conclusion documented with formal restitution summaries and permanent audit records.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-[#E2E8F0] py-8 px-4 lg:px-12 text-center text-xs text-[#64748B]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-medium text-[#0C2038]">
            SAFECASE — Anti-Scam Complaint & Investigation Management System
          </div>
          <div>Available Online · Secure Civic Service · 2026</div>
        </div>
      </footer>
    </div>
  );
};
