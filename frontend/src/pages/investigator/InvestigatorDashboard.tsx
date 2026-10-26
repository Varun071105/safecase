import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Complaint, AnalyticsData, ScamCategory } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileText,
  Clock,
  CheckCircle2,
  Paperclip,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const InvestigatorDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Stats & Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [categories, setCategories] = useState<ScamCategory[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Complaints Table State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedScamType, setSelectedScamType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await api.get<AnalyticsData>('/analytics/');
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Categories for Filter
  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.get<ScamCategory[]>('/categories/');
      setCategories(cats);
    } catch {
      // ignore
    }
  }, []);

  // Fetch Complaints
  const fetchComplaints = useCallback(async () => {
    try {
      setTableLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (selectedScamType) params.append('scam_type', selectedScamType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (assignedToMe) params.append('assigned_to_me', 'true');

      const res = await api.get<{
        items: Complaint[];
        total: number;
        page: number;
        page_size: number;
      }>(`/complaints/?${params.toString()}`);

      setComplaints(res.items);
      setTotalCount(res.total);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve casework records.');
    } finally {
      setTableLoading(false);
    }
  }, [page, pageSize, search, selectedScamType, selectedStatus, assignedToMe]);

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, [fetchStats, fetchCategories]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Export CSV
  const handleExportCSV = () => {
    const token = localStorage.getItem('safecase_token');
    window.open(`/api/v1/complaints/export/csv?token=${token}`, '_blank');
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header (Reference 2) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            INVESTIGATION DESK
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            Investigation Casework
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Monitor reported fraud incidents, assign cases, and track resolution timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStats();
              fetchComplaints();
            }}
            className="p-2 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-[#CBD5E1] text-xs font-semibold uppercase tracking-wider text-[#0C2038] hover:bg-[#F4F6F8] transition-colors flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 Clean Statistic Cards (Reference 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={statsLoading ? '...' : analytics?.stats.total_complaints ?? 0}
          subtitle="Cumulative cases registered"
          icon={FileText}
        />
        <StatCard
          title="Active Cases"
          value={statsLoading ? '...' : analytics?.stats.active_cases ?? 0}
          subtitle="Submitted & under investigation"
          icon={Clock}
          badgeText="Active"
        />
        <StatCard
          title="Resolved Cases"
          value={statsLoading ? '...' : analytics?.stats.resolved_cases ?? 0}
          subtitle="Completed resolution actions"
          icon={CheckCircle2}
          badgeText="Resolved"
        />
        <StatCard
          title="Evidence Files"
          value={statsLoading ? '...' : analytics?.stats.evidence_files ?? 0}
          subtitle="Screenshots, logs & PDFs"
          icon={Paperclip}
        />
      </div>

      {/* Reported Financial Losses Banner */}
      <div className="bg-white border border-[#E2E8F0] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Reported Financial Losses
          </div>
          <div className="text-xl font-serif font-bold text-[#0C2038] mt-0.5">
            ₹{' '}
            {Number(analytics?.stats.total_reported_lost || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="text-xs text-[#64748B] max-w-md">
          <span className="font-semibold text-[#0C2038]">Note:</span> Figure represents aggregate
          reported amount lost across complaints, pending independent banking ledger verification.
        </div>
      </div>

      {/* Main Casework Table Panel (Reference 2) */}
      <div className="bg-white border border-[#E2E8F0] shadow-none">
        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Complaint ID or Scammer identifier..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scam Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[#64748B]" />
              <select
                value={selectedScamType}
                onChange={(e) => {
                  setSelectedScamType(e.target.value);
                  setPage(1);
                }}
                className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] text-xs text-[#0C2038] focus:outline-none focus:border-[#0C2038] rounded-none"
              >
                <option value="">All Scam Types</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] text-xs text-[#0C2038] focus:outline-none focus:border-[#0C2038] rounded-none"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Investigation Started">Investigation Started</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Assigned to Me Filter Toggle */}
            <button
              onClick={() => {
                setAssignedToMe(!assignedToMe);
                setPage(1);
              }}
              className={`py-1.5 px-3 border text-xs font-medium rounded-none transition-colors ${
                assignedToMe
                  ? 'bg-[#0C2038] text-white border-[#0C2038]'
                  : 'bg-white text-[#0C2038] border-[#CBD5E1] hover:border-[#0C2038]'
              }`}
            >
              Assigned to Me
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="text-[#C93636]" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Complaint ID
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Scam Type
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Date Filed
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Amount Lost
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Assigned Investigator
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Status
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {tableLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#0C2038]" />
                      <span>Loading casework records...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="max-w-xs mx-auto">
                      <FileText size={28} className="mx-auto text-[#94A3B8] mb-2" />
                      <div className="font-semibold text-[#0C2038]">No complaints found</div>
                      <div className="text-[11px] mt-1 text-[#94A3B8]">
                        Try adjusting your search criteria or filter options.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/investigation/complaints/${c.id}`)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#0C2038] group-hover:text-[#C93636] transition-colors">
                      {c.complaint_number}
                    </td>
                    <td className="py-3 px-4 text-[#0C2038] font-medium">
                      {c.scam_type}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-[#0C2038] font-medium">
                      ₹ {Number(c.amount_lost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {c.assigned_investigator_name ? (
                        <span>{c.assigned_investigator_name}</span>
                      ) : (
                        <span className="text-amber-800 italic bg-amber-50 px-2 py-0.5">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/investigation/complaints/${c.id}`);
                        }}
                        className="p-1 text-[#64748B] hover:text-[#0C2038] hover:bg-slate-100 rounded-none inline-flex items-center"
                        title="View Casework Details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <div>
            Showing <span className="font-semibold text-[#0C2038]">{complaints.length}</span> of{' '}
            <span className="font-semibold text-[#0C2038]">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="py-1 px-2.5 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] disabled:opacity-40 rounded-none flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="py-1 px-2.5 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] disabled:opacity-40 rounded-none flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
