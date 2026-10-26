import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Paperclip,
  Eye,
  RefreshCw,
  Search,
  AlertCircle
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchMyComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: Complaint[]; total: number }>('/complaints/?page=1&page_size=50');
      setComplaints(res.items);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve your complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  // Derived statistics for citizen
  const totalCount = complaints.length;
  const activeCount = complaints.filter((c) =>
    ['Submitted', 'Under Review', 'Investigation Started'].includes(c.status)
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ['Resolved', 'Closed'].includes(c.status)
  ).length;
  const totalEvidenceCount = complaints.reduce((acc, c) => acc + (c.evidence_count || 0), 0);

  const filtered = complaints.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.complaint_number.toLowerCase().includes(s) ||
      c.scam_type.toLowerCase().includes(s) ||
      c.scammer_identifier.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            CITIZEN CASEWORK PORTAL
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            My Reported Scam Cases
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Track status updates, follow up with investigating officers, and upload supplementary records.
          </p>
        </div>

        <Link
          to="/dashboard/file"
          className="px-4 py-2.5 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-none self-start sm:self-auto"
        >
          <Plus size={14} /> File New Complaint
        </Link>
      </div>

      {/* Citizen 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Complaints"
          value={loading ? '...' : totalCount}
          subtitle="Total cases registered"
          icon={FileText}
        />
        <StatCard
          title="Active Inquiries"
          value={loading ? '...' : activeCount}
          subtitle="Currently under investigation"
          icon={Clock}
          badgeText="Active"
        />
        <StatCard
          title="Resolved"
          value={loading ? '...' : resolvedCount}
          subtitle="Formal resolution reached"
          icon={CheckCircle2}
          badgeText="Completed"
        />
        <StatCard
          title="Evidence Files"
          value={loading ? '...' : totalEvidenceCount}
          subtitle="Submitted documents & logs"
          icon={Paperclip}
        />
      </div>

      {/* My Complaints List Panel */}
      <div className="bg-white border border-[#E2E8F0] shadow-none">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Complaint ID or Scam type..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
            />
          </div>

          <button
            onClick={fetchMyComplaints}
            className="p-1.5 border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8]"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="text-[#C93636]" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Complaint ID</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Scam Type</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Date Filed</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Amount Lost</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#0C2038]" />
                      <span>Loading your records...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    <FileText size={28} className="mx-auto text-[#94A3B8] mb-2" />
                    <div className="font-semibold text-[#0C2038]">No complaints filed yet</div>
                    <div className="text-[11px] text-[#94A3B8] mt-1 mb-4">
                      Document fraudulent transactions or phishing incidents to begin investigation.
                    </div>
                    <Link
                      to="/dashboard/file"
                      className="inline-block px-4 py-2 bg-[#0C2038] text-white text-xs font-semibold uppercase tracking-wider"
                    >
                      File First Complaint
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/dashboard/complaints/${c.id}`)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#0C2038] group-hover:text-[#C93636] transition-colors">
                      {c.complaint_number}
                    </td>
                    <td className="py-3 px-4 text-[#0C2038] font-medium">{c.scam_type}</td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {new Date(c.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-[#0C2038] font-medium">
                      ₹ {Number(c.amount_lost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/dashboard/complaints/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 border border-[#CBD5E1] text-[#0C2038] hover:bg-white text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1"
                      >
                        <Eye size={12} /> Track
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
