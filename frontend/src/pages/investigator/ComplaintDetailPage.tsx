import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ComplaintDetail, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  Phone,
  Mail,
  Download,
  Plus,
  Send,
  Lock,
  Globe,
  Ban,
  FileCheck,
  CheckCircle,
  RefreshCw,
  UploadCloud,
  FileText
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInvestigator, isAdmin } = useAuth();
  const { addToast } = useNotification();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Investigators list for assignment
  const [investigators, setInvestigators] = useState<User[]>([]);

  // Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [publicRemarks, setPublicRemarks] = useState('');
  const [internalRemarks, setInternalRemarks] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedInvestigatorId, setAssignedInvestigatorId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [isUpdatingAssign, setIsUpdatingAssign] = useState(false);

  // New Note State
  const [noteContent, setNoteContent] = useState('');
  const [noteIsInternal, setNoteIsInternal] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Evidence Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Blacklist Modal State
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blReason, setBlReason] = useState('');
  const [blStatus, setBlStatus] = useState<'Reported' | 'Under Review' | 'Verified'>('Verified');
  const [isAddingBlacklist, setIsAddingBlacklist] = useState(false);

  const fetchComplaintDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<ComplaintDetail>(`/complaints/${id}`);
      setComplaint(res);
      setTargetStatus(res.status);
      setAssignedInvestigatorId(res.assigned_investigator_id || '');
      setPriority(res.priority || 'Medium');
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve complaint record.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchInvestigators = useCallback(async () => {
    if (isInvestigator || isAdmin) {
      try {
        const invs = await api.get<User[]>('/users/investigators');
        setInvestigators(invs);
      } catch {
        // ignore
      }
    }
  }, [isInvestigator, isAdmin]);

  useEffect(() => {
    fetchComplaintDetail();
    fetchInvestigators();
  }, [fetchComplaintDetail, fetchInvestigators]);

  // Handle Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !targetStatus) return;

    setIsUpdatingStatus(true);
    try {
      await api.post(`/complaints/${complaint.id}/status`, {
        new_status: targetStatus,
        public_remarks: publicRemarks.trim() || undefined,
        internal_remarks: internalRemarks.trim() || undefined,
        resolution_summary: resolutionSummary.trim() || undefined,
      });

      addToast('success', `Case status transitioned to ${targetStatus}`);
      setShowStatusModal(false);
      setPublicRemarks('');
      setInternalRemarks('');
      setResolutionSummary('');
      fetchComplaintDetail();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Assignment Update
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setIsUpdatingAssign(true);
    try {
      await api.post(`/complaints/${complaint.id}/assign`, {
        assigned_investigator_id: assignedInvestigatorId || undefined,
        priority,
      });

      addToast('success', 'Case assignment and priority updated');
      setShowAssignModal(false);
      fetchComplaintDetail();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update assignment');
    } finally {
      setIsUpdatingAssign(false);
    }
  };

  // Handle Note Submit
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !noteContent.trim()) return;

    setIsAddingNote(true);
    try {
      await api.post(`/complaints/${complaint.id}/notes`, {
        content: noteContent.trim(),
        is_internal: noteIsInternal,
      });

      addToast('success', 'Investigation note recorded');
      setNoteContent('');
      fetchComplaintDetail();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle Evidence Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !uploadFile) return;

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      await api.upload(`/complaints/${complaint.id}/evidence`, formData);
      addToast('success', 'Evidence attachment uploaded securely');
      setUploadFile(null);
      fetchComplaintDetail();
    } catch (err: any) {
      addToast('error', err.message || 'Evidence upload rejected');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Handle Download Evidence Securely
  const handleDownloadEvidence = (evidenceId: string, filename: string) => {
    const token = localStorage.getItem('safecase_token');
    window.open(`/api/v1/complaints/${complaint?.id}/evidence/${evidenceId}/download?token=${token}`, '_blank');
  };

  // Handle Add to Blacklist
  const handleAddToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setIsAddingBlacklist(true);
    try {
      await api.post('/blacklist/', {
        identifier_type: complaint.scammer_identifier_type,
        identifier_value: complaint.scammer_identifier,
        verification_status: blStatus,
        reason: blReason.trim() || `Reported in scam complaint ${complaint.complaint_number}`,
        related_complaint_id: complaint.id,
      });

      addToast('success', `Scammer identifier added to blacklist database (${blStatus})`);
      setShowBlacklistModal(false);
      setBlReason('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to blacklist identifier');
    } finally {
      setIsAddingBlacklist(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#0C2038] mb-3" />
        <div className="text-xs uppercase tracking-wider text-[#64748B]">Loading casework details...</div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-8 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle size={32} className="text-[#C93636] mx-auto mb-3" />
        <h2 className="text-xl font-serif font-bold text-[#0C2038] mb-2">Complaint Not Accessible</h2>
        <p className="text-xs text-[#64748B] mb-6">{error || 'Record does not exist or access is forbidden.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#0C2038] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to previous screen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8]"
            title="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl lg:text-2xl font-bold text-[#0C2038]">
                {complaint.complaint_number}
              </span>
              <StatusBadge status={complaint.status} />
            </div>
            <div className="text-xs text-[#64748B] mt-0.5">
              Filed on {new Date(complaint.created_at).toLocaleString()} by {complaint.complainant_name}
            </div>
          </div>
        </div>

        {/* Action Buttons for Investigators */}
        {(isInvestigator || isAdmin) && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setTargetStatus(complaint.status);
                setShowStatusModal(true);
              }}
              className="px-3.5 py-2 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 rounded-none"
            >
              <FileCheck size={14} /> Update Status
            </button>
            <button
              onClick={() => {
                setAssignedInvestigatorId(complaint.assigned_investigator_id || '');
                setPriority(complaint.priority);
                setShowAssignModal(true);
              }}
              className="px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 rounded-none"
            >
              <UserIcon size={14} /> Reassign / Priority
            </button>
            <button
              onClick={() => {
                setBlReason(`Investigated in verified scam casework ${complaint.complaint_number}`);
                setShowBlacklistModal(true);
              }}
              className="px-3.5 py-2 bg-rose-50 border border-rose-300 text-[#C93636] hover:bg-rose-100 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 rounded-none"
            >
              <Ban size={14} /> Add to Blacklist
            </button>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Case Information & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details Panel */}
          <div className="bg-white border border-[#E2E8F0] p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-4">
              CASEWORK SPECIFICATIONS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Scam Category
                </span>
                <span className="text-sm font-semibold text-[#0C2038] mt-0.5 block">
                  {complaint.scam_type}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Reported Amount Lost
                </span>
                <span className="text-base font-serif font-bold text-[#C93636] mt-0.5 block">
                  ₹ {Number(complaint.amount_lost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Incident Date & Time
                </span>
                <span className="text-xs text-[#0C2038] mt-0.5 block">
                  {new Date(complaint.incident_date).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Incident Location
                </span>
                <span className="text-xs text-[#0C2038] mt-0.5 block">
                  {complaint.incident_location || 'Not specified'}
                </span>
              </div>
            </div>

            {/* Scammer Identifier Section */}
            <div className="py-5 border-b border-[#F1F5F9] bg-[#F8FAFC] -mx-6 px-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0C2038] mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-[#C93636]" />
                Target Scammer Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Identifier Type</span>
                  <span className="text-xs font-semibold text-[#0C2038] block mt-0.5">
                    {complaint.scammer_identifier_type}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Identifier Value</span>
                  <span className="text-xs font-mono font-bold text-[#0C2038] block mt-0.5 bg-white p-1.5 border border-[#CBD5E1]">
                    {complaint.scammer_identifier}
                  </span>
                </div>
                {complaint.transaction_reference && (
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-[#64748B] block">Transaction Reference / UTR</span>
                    <span className="text-xs font-mono text-[#0C2038] block mt-0.5">
                      {complaint.transaction_reference}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Incident Statement */}
            <div className="pt-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-2">
                Citizen Narrative Description
              </span>
              <p className="text-xs leading-relaxed text-[#0C2038] whitespace-pre-wrap bg-[#FBFBFB] p-4 border border-[#E2E8F0]">
                {complaint.incident_description}
              </p>
            </div>

            {complaint.resolution_summary && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1">
                  <CheckCircle size={14} /> Resolution Summary
                </div>
                <div className="text-xs text-emerald-800 whitespace-pre-wrap">
                  {complaint.resolution_summary}
                </div>
              </div>
            )}
          </div>

          {/* Evidence Vault Panel */}
          <div className="bg-white border border-[#E2E8F0] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636]">
                EVIDENTIARY ATTACHMENTS ({complaint.evidence.length})
              </div>
            </div>

            {/* Upload Supplementary Evidence Form */}
            <form onSubmit={handleFileUpload} className="mb-4 p-3.5 bg-[#F4F6F8] border border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="text-xs text-[#0C2038] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#0C2038] file:text-white hover:file:bg-[#132A47]"
              />
              <button
                type="submit"
                disabled={!uploadFile || isUploadingFile}
                className="py-1.5 px-3 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider rounded-none disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                <UploadCloud size={14} /> {isUploadingFile ? 'Uploading...' : 'Attach Evidence'}
              </button>
            </form>

            {complaint.evidence.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No supporting evidence files attached to this complaint yet.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {complaint.evidence.map((ev) => (
                  <div key={ev.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText size={18} className="text-[#64748B] shrink-0" />
                      <div className="truncate">
                        <div className="font-medium text-[#0C2038] truncate">{ev.filename}</div>
                        <div className="text-[10px] text-[#64748B]">
                          {(ev.file_size / 1024).toFixed(1)} KB · Uploaded by {ev.uploader_name || 'Complainant'} on{' '}
                          {new Date(ev.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadEvidence(ev.id, ev.filename)}
                      className="px-2.5 py-1.5 border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0"
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investigation Notes & Remarks Panel */}
          <div className="bg-white border border-[#E2E8F0] p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-4">
              INVESTIGATION NOTES & OFFICIAL REMARKS
            </div>

            {/* Add Note Form */}
            {(isInvestigator || isAdmin) && (
              <form onSubmit={handleAddNote} className="mb-6 space-y-3">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record an investigation finding or public notice..."
                  rows={3}
                  className="w-full p-3 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
                  required
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-[#64748B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteIsInternal}
                      onChange={(e) => setNoteIsInternal(e.target.checked)}
                      className="rounded-none border-[#CBD5E1] text-[#0C2038] focus:ring-0"
                    />
                    <span className="flex items-center gap-1">
                      {noteIsInternal ? (
                        <>
                          <Lock size={12} className="text-amber-700" /> Internal note (Officers only)
                        </>
                      ) : (
                        <>
                          <Globe size={12} className="text-blue-700" /> Public remark (Visible to complainant)
                        </>
                      )}
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isAddingNote || !noteContent.trim()}
                    className="py-1.5 px-4 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider rounded-none disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={12} /> {isAddingNote ? 'Recording...' : 'Add Record'}
                  </button>
                </div>
              </form>
            )}

            {/* Notes List */}
            {complaint.notes.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748B]">
                No investigation remarks posted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {complaint.notes.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 border text-xs ${
                      n.is_internal
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-blue-50/40 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0C2038]">
                          {n.author_name} ({n.author_role})
                        </span>
                        {n.is_internal ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 flex items-center gap-0.5">
                            <Lock size={10} /> Internal
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.2 flex items-center gap-0.5">
                            <Globe size={10} /> Public
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[#0C2038] whitespace-pre-wrap">{n.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Complainant Profile & Status History */}
        <div className="space-y-6">
          {/* Assignment & Complainant Card */}
          <div className="bg-white border border-[#E2E8F0] p-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636]">
              CASE ASSIGNMENT
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                Assigned Investigator
              </span>
              <span className="text-xs font-semibold text-[#0C2038] block mt-0.5">
                {complaint.assigned_investigator_name || 'Unassigned'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                Priority Level
              </span>
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 mt-0.5 ${
                complaint.priority === 'Critical'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : complaint.priority === 'High'
                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                  : 'bg-slate-100 text-slate-900 border border-slate-300'
              }`}>
                {complaint.priority}
              </span>
            </div>

            <div className="pt-4 border-t border-[#F1F5F9]">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">
                Complainant Record
              </div>
              <div className="text-xs text-[#0C2038] font-semibold">{complaint.complainant_name}</div>
              <div className="text-xs text-[#64748B]">{complaint.complainant_email}</div>
            </div>
          </div>

          {/* Status Progression Timeline */}
          <div className="bg-white border border-[#E2E8F0] p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-4">
              STATUS AUDIT TIMELINE
            </div>

            <div className="relative border-l-2 border-[#CBD5E1] ml-3 space-y-6 py-2">
              {complaint.status_history.map((h, idx) => (
                <div key={h.id + idx} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-[7px] top-0 w-3 h-3 bg-[#0C2038] rounded-full ring-4 ring-white" />

                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-[#0C2038]">{h.new_status}</span>
                    <span className="text-[10px] text-[#94A3B8]">
                      {new Date(h.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Updated by {h.actor_name || 'System Desk'} ({h.actor_role || 'Staff'})
                  </div>

                  {h.public_remarks && (
                    <div className="mt-1.5 p-2 bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0C2038]">
                      <span className="font-semibold text-[10px] text-[#64748B] block">Public Note:</span>
                      {h.public_remarks}
                    </div>
                  )}

                  {h.internal_remarks && (
                    <div className="mt-1.5 p-2 bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                      <span className="font-semibold text-[10px] text-amber-800 block flex items-center gap-1">
                        <Lock size={10} /> Internal Remark:
                      </span>
                      {h.internal_remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-xl font-serif font-bold text-[#0C2038] mb-1">
              Transition Case Status
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Current status is <span className="font-semibold text-[#0C2038]">{complaint.status}</span>. Select a valid next workflow state.
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  New Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Investigation Started">Investigation Started</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Public Remarks (Visible to Citizen)
                </label>
                <textarea
                  value={publicRemarks}
                  onChange={(e) => setPublicRemarks(e.target.value)}
                  placeholder="Official explanation visible on complainant portal..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Internal Remarks (Officers only)
                </label>
                <textarea
                  value={internalRemarks}
                  onChange={(e) => setInternalRemarks(e.target.value)}
                  placeholder="Private rationale, law enforcement nodal notes..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                />
              </div>

              {(targetStatus === 'Resolved' || targetStatus === 'Closed') && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                    Formal Resolution Summary
                  </label>
                  <textarea
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Document outcome (e.g. account frozen, chargeback issued, criminal case registered)..."
                    rows={2}
                    className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-xs font-medium text-[#64748B] hover:text-[#0C2038]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {isUpdatingStatus ? 'Saving...' : 'Apply Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment & Priority Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-xl font-serif font-bold text-[#0C2038] mb-1">
              Case Assignment & Priority
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Assign this investigation to an officer and set triage priority.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Assigned Officer
                </label>
                <select
                  value={assignedInvestigatorId}
                  onChange={(e) => setAssignedInvestigatorId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                >
                  <option value="">-- Unassigned --</option>
                  {investigators.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.full_name} ({inv.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-xs font-medium text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAssign}
                  className="px-4 py-2 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {isUpdatingAssign ? 'Updating...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blacklist Prompt Modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-xl font-serif font-bold text-[#0C2038] mb-1">
              Add Scammer to National Blacklist
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Add verified scammer identifier to the active surveillance registry.
            </p>

            <form onSubmit={handleAddToBlacklist} className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] text-xs">
                <div className="text-[#64748B]">Identifier:</div>
                <div className="font-mono font-bold text-[#0C2038] text-sm mt-0.5">
                  [{complaint.scammer_identifier_type}] {complaint.scammer_identifier}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Verification Status
                </label>
                <select
                  value={blStatus}
                  onChange={(e) => setBlStatus(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Reported">Reported</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1">
                  Substantiated Reason / Modus Operandi
                </label>
                <textarea
                  value={blReason}
                  onChange={(e) => setBlReason(e.target.value)}
                  placeholder="Detail reasons for blacklist listing..."
                  rows={3}
                  className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] rounded-none focus:outline-none focus:border-[#0C2038]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBlacklistModal(false)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] text-xs font-medium text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingBlacklist}
                  className="px-4 py-2 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  {isAddingBlacklist ? 'Adding...' : 'Confirm Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
