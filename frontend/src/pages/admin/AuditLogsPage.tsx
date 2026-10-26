import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { AuditLog } from '../../types';
import { ShieldCheck, Search, Filter, RefreshCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (actionFilter) params.append('action', actionFilter);
      if (targetTypeFilter) params.append('target_type', targetTypeFilter);

      const res = await api.get<AuditLog[]>(`/audit/?${params.toString()}`);
      setLogs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, targetTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            IMMUTABLE SECURITY RECORDS
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            System Audit Trail
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Tamper-evident logs of authentication events, casework modifications, status transitions, and user provisioning.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] shadow-none">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions or details..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] text-xs text-[#0C2038] rounded-none"
            >
              <option value="">All Actions</option>
              <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
              <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
              <option value="AUTH_REGISTER">AUTH_REGISTER</option>
              <option value="COMPLAINT_CREATED">COMPLAINT_CREATED</option>
              <option value="COMPLAINT_STATUS_CHANGE">COMPLAINT_STATUS_CHANGE</option>
              <option value="BLACKLIST_ADD">BLACKLIST_ADD</option>
              <option value="BLACKLIST_UPDATE">BLACKLIST_UPDATE</option>
              <option value="USER_ADMIN_CREATE">USER_ADMIN_CREATE</option>
              <option value="USER_ADMIN_UPDATE">USER_ADMIN_UPDATE</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] text-xs text-[#0C2038] rounded-none"
            >
              <option value="">All Target Types</option>
              <option value="User">User</option>
              <option value="Complaint">Complaint</option>
              <option value="ComplaintEvidence">ComplaintEvidence</option>
              <option value="BlacklistEntry">BlacklistEntry</option>
              <option value="ScamCategory">ScamCategory</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Timestamp</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Action</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Actor</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Target</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Details</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    No audit log records match filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0C2038] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-[#0C2038] font-medium whitespace-nowrap">
                      {log.actor_name || 'System / Anonymous'}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                      <span className="font-semibold text-[#0C2038]">{log.target_type}</span>
                      {log.target_id && (
                        <span className="font-mono text-[10px] text-[#94A3B8] ml-1">
                          ({log.target_id.slice(0, 8)}...)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#0C2038] max-w-sm truncate" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] font-mono text-[11px] whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
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
