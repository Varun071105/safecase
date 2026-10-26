import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { AnalyticsData, User, ScamCategory } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import {
  ShieldCheck,
  Users,
  FolderLock,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [usersCount, setUsersCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const [analyticsData, users, categories] = await Promise.all([
        api.get<AnalyticsData>('/analytics/'),
        api.get<User[]>('/users/'),
        api.get<ScamCategory[]>('/categories/all'),
      ]);
      setAnalytics(analyticsData);
      setUsersCount(users.length);
      setCategoriesCount(categories.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            EXECUTIVE CONTROL CONSOLE
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            System Administration
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Global governance of civic complaints, officer credentialing, categories, and audit verification.
          </p>
        </div>

        <button
          onClick={fetchAdminStats}
          className="p-2 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="System Complaints"
          value={loading ? '...' : analytics?.stats.total_complaints ?? 0}
          subtitle="System-wide complaints filed"
          icon={FileText}
        />
        <StatCard
          title="Active Users"
          value={loading ? '...' : usersCount}
          subtitle="Citizens, officers & administrators"
          icon={Users}
        />
        <StatCard
          title="Scam Categories"
          value={loading ? '...' : categoriesCount}
          subtitle="Active crime classification schemas"
          icon={FolderLock}
        />
        <StatCard
          title="Active Casework"
          value={loading ? '...' : analytics?.stats.active_cases ?? 0}
          subtitle="Ongoing investigations"
          icon={Clock}
          badgeText="Active"
        />
      </div>

      {/* Administrative Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-[#F4F6F8] text-[#0C2038] flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <h3 className="text-base font-serif font-bold text-[#0C2038] mb-1">
              User & Officer Management
            </h3>
            <p className="text-xs text-[#64748B] mb-6">
              Create investigator credentials, provision civic accounts, activate or deactivate user logins.
            </p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-[#0C2038] hover:text-[#C93636] flex items-center gap-1.5 uppercase tracking-wider"
          >
            Manage Accounts <ArrowRight size={13} />
          </Link>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-[#F4F6F8] text-[#0C2038] flex items-center justify-center mb-4">
              <FolderLock size={20} />
            </div>
            <h3 className="text-base font-serif font-bold text-[#0C2038] mb-1">
              Scam Category Schema
            </h3>
            <p className="text-xs text-[#64748B] mb-6">
              Maintain dynamic taxonomy of scam types, descriptions, and citizen complaint intake options.
            </p>
          </div>
          <Link
            to="/admin/categories"
            className="text-xs font-semibold text-[#0C2038] hover:text-[#C93636] flex items-center gap-1.5 uppercase tracking-wider"
          >
            Manage Categories <ArrowRight size={13} />
          </Link>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-[#F4F6F8] text-[#0C2038] flex items-center justify-center mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-serif font-bold text-[#0C2038] mb-1">
              Immutable Security Audit Logs
            </h3>
            <p className="text-xs text-[#64748B] mb-6">
              Inspect authentication attempts, administrative role changes, and casework status transitions.
            </p>
          </div>
          <Link
            to="/admin/audit"
            className="text-xs font-semibold text-[#0C2038] hover:text-[#C93636] flex items-center gap-1.5 uppercase tracking-wider"
          >
            Review Audit Trail <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};
