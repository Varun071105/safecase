import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { BlacklistEntry } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Ban,
  Search,
  Filter,
  Plus,
  ShieldAlert,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const BlacklistPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useNotification();

  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [identifierType, setIdentifierType] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formType, setFormType] = useState('UPI ID');
  const [formValue, setFormValue] = useState('');
  const [formStatus, setFormStatus] = useState<'Reported' | 'Under Review' | 'Verified'>('Under Review');
  const [formReason, setFormReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlacklist = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (identifierType) params.append('identifier_type', identifierType);
      if (verificationStatus) params.append('verification_status', verificationStatus);

      const res = await api.get<{ items: BlacklistEntry[]; total: number }>(`/blacklist/?${params.toString()}`);
      setEntries(res.items);
      setTotal(res.total);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load blacklist database');
    } finally {
      setLoading(false);
    }
  }, [search, identifierType, verificationStatus, addToast]);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormType('UPI ID');
    setFormValue('');
    setFormStatus('Under Review');
    setFormReason('');
    setShowModal(true);
  };

  const handleOpenEdit = (entry: BlacklistEntry) => {
    setEditId(entry.id);
    setFormType(entry.identifier_type);
    setFormValue(entry.identifier_value);
    setFormStatus(entry.verification_status);
    setFormReason(entry.reason);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim() || !formReason.trim()) return;

    setIsSubmitting(true);
    try {
      if (editId) {
        await api.put(`/blacklist/${editId}`, {
          identifier_type: formType,
          identifier_value: formValue.trim(),
          verification_status: formStatus,
          reason: formReason.trim(),
        });
        addToast('success', 'Blacklist record updated successfully');
      } else {
        await api.post('/blacklist/', {
          identifier_type: formType,
          identifier_value: formValue.trim(),
          verification_status: formStatus,
          reason: formReason.trim(),
        });
        addToast('success', 'Identifier listed in scammer database');
      }
      setShowModal(false);
      fetchBlacklist();
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, val: string) => {
    if (!window.confirm(`Are you sure you want to remove "${val}" from the blacklist?`)) return;

    try {
      await api.delete(`/blacklist/${id}`);
      addToast('success', 'Blacklist entry removed');
      fetchBlacklist();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            FRAUD SURVEILLANCE & PREVENTION
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
            Scammer Blacklist Registry
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-1">
            Database of substantiated scam identifiers, UPI virtual payment addresses, URLs, and phone numbers.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-none self-start md:self-auto"
        >
          <Plus size={14} /> Add Identifier
        </button>
      </div>

      {/* Safeguard Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Verification Safeguard Policy:</span> A complaint does not automatically prove criminal ownership. Identifiers must be rigorously investigated before elevating to "Verified" status. All additions and modifications are logged in permanent audit trails.
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#E2E8F0] shadow-none">
        {/* Filter Bar */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search identifiers or reasons..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={identifierType}
              onChange={(e) => setIdentifierType(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] text-xs text-[#0C2038] rounded-none"
            >
              <option value="">All Identifier Types</option>
              <option value="UPI ID">UPI ID</option>
              <option value="Phone number">Phone number</option>
              <option value="Website URL">Website URL</option>
              <option value="Email address">Email address</option>
              <option value="Social media account">Social media account</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-[#CBD5E1] text-xs text-[#0C2038] rounded-none"
            >
              <option value="">All Verification States</option>
              <option value="Verified">Verified</option>
              <option value="Under Review">Under Review</option>
              <option value="Reported">Reported</option>
            </select>

            <button
              onClick={fetchBlacklist}
              className="p-2 border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8]"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Type</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Identifier Value</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Verification Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Documented Reason</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Related Case</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B]">Added By</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#0C2038]" />
                      <span>Loading blacklist entries...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <Ban size={28} className="mx-auto text-[#94A3B8] mb-2" />
                    <div className="font-semibold text-[#0C2038]">No blacklist records found</div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#0C2038] whitespace-nowrap">
                      {entry.identifier_type}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0C2038]">
                      {entry.identifier_value}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${
                          entry.verification_status === 'Verified'
                            ? 'bg-rose-50 text-rose-900 border-rose-300'
                            : entry.verification_status === 'Under Review'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {entry.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#0C2038] max-w-xs truncate" title={entry.reason}>
                      {entry.reason}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] font-mono whitespace-nowrap">
                      {entry.related_complaint_number || 'Direct Registry'}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                      {entry.creator_name || 'Staff Officer'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="p-1 text-[#64748B] hover:text-[#0C2038]"
                          title="Edit Verification Status"
                        >
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(entry.id, entry.identifier_value)}
                            className="p-1 text-[#64748B] hover:text-[#C93636]"
                            title="Remove Identifier (Admin only)"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-xl font-serif font-bold text-[#0C2038] mb-1">
              {editId ? 'Update Blacklist Record' : 'Add Scammer Identifier'}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Enter verified attributes to catalog the offending entity.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Identifier Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                >
                  <option value="UPI ID">UPI ID</option>
                  <option value="Phone number">Phone number</option>
                  <option value="Website URL">Website URL</option>
                  <option value="Email address">Email address</option>
                  <option value="Social media account">Social media account</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Identifier Value
                </label>
                <input
                  type="text"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="e.g. fraudulent.merchant@okaxis or https://fake-bank-kyc.com"
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Verification Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                >
                  <option value="Reported">Reported (Unverified Complainant Lead)</option>
                  <option value="Under Review">Under Review (Investigative Triage)</option>
                  <option value="Verified">Verified (Confirmed Criminal Modus Operandi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Reason for Listing
                </label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Provide supporting case notes, bank confirmation, or incident facts..."
                  rows={3}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-xs font-medium text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {isSubmitting ? 'Saving...' : editId ? 'Save Changes' : 'Add to Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
