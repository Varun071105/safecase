import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AnalyticsData } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { FileText, Clock, CheckCircle2, Paperclip, RefreshCw, AlertCircle } from 'lucide-react';

const STATUS_COLORS: { [key: string]: string } = {
  Submitted: '#94A3B8',
  'Under Review': '#F59E0B',
  'Investigation Started': '#3B82F6',
  Resolved: '#10B981',
  Closed: '#64748B',
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<AnalyticsData>('/analytics/');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load system analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#0C2038] mb-3" />
        <div className="text-xs uppercase tracking-wider text-[#64748B]">Calculating system aggregates...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-white border border-[#E2E8F0] text-center max-w-lg mx-auto">
        <AlertCircle size={28} className="text-[#C93636] mx-auto mb-2" />
        <h2 className="text-lg font-serif font-bold text-[#0C2038] mb-1">Analytics Unavailable</h2>
        <p className="text-xs text-[#64748B] mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-[#0C2038] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Retry aggregation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            CRIME INTELLIGENCE & METRICS
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            Casework Analytics & Trends
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Real-time aggregation of complaint patterns, scam distributions, and reported financial losses.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 border border-[#CBD5E1] bg-white text-[#0C2038] hover:bg-[#F4F6F8] self-start sm:self-auto"
          title="Refresh Metrics"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={data.stats.total_complaints}
          subtitle="All filed casework"
          icon={FileText}
        />
        <StatCard
          title="Active Cases"
          value={data.stats.active_cases}
          subtitle="Investigation in progress"
          icon={Clock}
          badgeText="Active"
        />
        <StatCard
          title="Resolved Cases"
          value={data.stats.resolved_cases}
          subtitle="Finalized outcomes"
          icon={CheckCircle2}
          badgeText="Resolved"
        />
        <StatCard
          title="Evidence Files"
          value={data.stats.evidence_files}
          subtitle="Verified digital attachments"
          icon={Paperclip}
        />
      </div>

      {/* Financial Loss Banner */}
      <div className="bg-white border border-[#E2E8F0] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
            Reported Financial Losses (INR)
          </span>
          <span className="text-3xl font-serif font-bold text-[#C93636] mt-1 block">
            ₹{' '}
            {Number(data.stats.total_reported_lost).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <p className="text-xs text-[#64748B] max-w-lg leading-relaxed">
          <strong className="text-[#0C2038]">Legal Note on Financial Figures:</strong> These metrics reflect
          unilateral citizen reported damages submitted at the time of complaint filing. They do not constitute
          independently recovered funds or judicially confirmed restitution amounts.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Complaints by Scam Type */}
        <div className="bg-white border border-[#E2E8F0] p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            DISTRIBUTION BY FRAUD CATEGORY
          </div>
          <h3 className="text-base font-serif font-bold text-[#0C2038] mb-4">
            Complaints by Scam Type
          </h3>

          <div className="h-72 w-full">
            {data.by_scam_type.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                No complaint category records available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_scam_type} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="scam_type"
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C2038', color: '#fff', fontSize: '11px', border: 'none' }}
                  />
                  <Bar dataKey="count" fill="#0C2038" radius={[2, 2, 0, 0]} name="Complaints" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie/Donut Chart: Casework Status Distribution */}
        <div className="bg-white border border-[#E2E8F0] p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            WORKFLOW PROGRESSION
          </div>
          <h3 className="text-base font-serif font-bold text-[#0C2038] mb-4">
            Complaint Status Breakdown
          </h3>

          <div className="h-72 w-full flex items-center justify-center">
            {data.by_status.length === 0 ? (
              <div className="text-xs text-[#94A3B8]">No status records available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.by_status.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#0C2038'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C2038', color: '#fff', fontSize: '11px', border: 'none' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="square"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Timeline Trend Line Chart */}
        <div className="bg-white border border-[#E2E8F0] p-6 lg:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            TEMPORAL VOLUME
          </div>
          <h3 className="text-base font-serif font-bold text-[#0C2038] mb-4">
            Complaint Filing Frequency Over Time
          </h3>

          <div className="h-64 w-full">
            {data.timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                Insufficient chronological data to render timeline curve
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C2038', color: '#fff', fontSize: '11px', border: 'none' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#C93636"
                    strokeWidth={2.5}
                    dot={{ fill: '#C93636', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Complaints Filed"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
