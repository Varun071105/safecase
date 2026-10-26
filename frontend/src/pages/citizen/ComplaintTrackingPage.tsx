import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { ComplaintDetail } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  UploadCloud,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Globe
} from 'lucide-react';

const WORKFLOW_STEPS = [
  { label: 'Submitted', desc: 'Received & queued' },
  { label: 'Under Review', desc: 'Triage & verification' },
  { label: 'Investigation Started', desc: 'Authorities engaged' },
  { label: 'Resolved', desc: 'Case conclusion' },
  { label: 'Closed', desc: 'Archived' },
];

export const ComplaintTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supplementary evidence upload
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<ComplaintDetail>(`/complaints/${id}`);
      setComplaint(res);
    } catch (err: any) {
      setError(err.message || 'Unable to load case record.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUploadSupplementary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/complaints/${complaint.id}/evidence`, formData);
      addToast('success', 'Supplementary evidence uploaded successfully');
      setFile(null);
      fetchDetail();
    } catch (err: any) {
      addToast('error', err.message || 'Evidence upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (evidenceId: string) => {
    const token = localStorage.getItem('safecase_token');
    window.open(`/api/v1/complaints/${complaint?.id}/evidence/${evidenceId}/download?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#0C2038] mb-3" />
        <div className="text-xs uppercase tracking-wider text-[#64748B]">Loading case tracking details...</div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-8 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle size={32} className="text-[#C93636] mx-auto mb-3" />
        <h2 className="text-xl font-serif font-bold text-[#0C2038] mb-2">Unauthorized or Not Found</h2>
        <p className="text-xs text-[#64748B] mb-6">{error || 'You are not authorized to view this complaint casework.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-[#0C2038] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to My Complaints
        </button>
      </div>
    );
  }

  // Determine current step index
  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => s.label === complaint.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8]"
            title="Back to complaints"
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
              Registration Date: {new Date(complaint.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <button
          onClick={fetchDetail}
          className="p-2 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] self-start sm:self-auto"
          title="Refresh status"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Workflow Stepper Progression */}
      <div className="bg-white border border-[#E2E8F0] p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-6">
          INVESTIGATION WORKFLOW PROGRESSION
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={step.label}
                className={`p-3 border transition-colors ${
                  isCurrent
                    ? 'bg-[#0C2038] text-white border-[#0C2038]'
                    : isCompleted
                    ? 'bg-[#F8FAFC] text-[#0C2038] border-emerald-300'
                    : 'bg-white text-[#94A3B8] border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                  {isCompleted && !isCurrent && (
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  )}
                  {isCurrent && (
                    <Clock size={12} className="text-amber-400 animate-spin" />
                  )}
                </div>
                <div className="font-semibold text-xs leading-tight">{step.label}</div>
                <div className={`text-[10px] mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-[#64748B]'}`}>
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Overview Card */}
          <div className="bg-white border border-[#E2E8F0] p-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636]">
              COMPLAINT RECORD OVERVIEW
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Scam Type
                </span>
                <span className="text-xs font-semibold text-[#0C2038] mt-0.5 block">
                  {complaint.scam_type}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Reported Amount Lost
                </span>
                <span className="text-sm font-serif font-bold text-[#C93636] mt-0.5 block">
                  ₹ {Number(complaint.amount_lost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Reported Offender Identifier
                </span>
                <span className="text-xs font-mono font-bold text-[#0C2038] mt-0.5 block bg-[#F8FAFC] p-1.5 border border-[#E2E8F0]">
                  [{complaint.scammer_identifier_type}] {complaint.scammer_identifier}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Incident Date
                </span>
                <span className="text-xs text-[#0C2038] mt-0.5 block">
                  {new Date(complaint.incident_date).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1.5">
                Narrative Statement
              </span>
              <p className="text-xs leading-relaxed text-[#0C2038] bg-[#F8FAFC] p-3.5 border border-[#E2E8F0] whitespace-pre-wrap">
                {complaint.incident_description}
              </p>
            </div>

            {complaint.resolution_summary && (
              <div className="p-4 bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Official Resolution Conclusion
                </div>
                <div className="text-xs text-emerald-800 whitespace-pre-wrap">
                  {complaint.resolution_summary}
                </div>
              </div>
            )}
          </div>

          {/* Public Investigator Remarks & Status Updates */}
          <div className="bg-white border border-[#E2E8F0] p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-4">
              OFFICIAL INVESTIGATION UPDATES
            </div>

            {complaint.notes.length === 0 && complaint.status_history.filter(h => h.public_remarks).length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                Your complaint is queued for preliminary review. Official investigator remarks will appear here once casework triage commences.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Status history public remarks */}
                {complaint.status_history.filter(h => h.public_remarks).map((h) => (
                  <div key={h.id} className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#0C2038]">
                        Status Update: {h.new_status}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[#0C2038] mt-1">{h.public_remarks}</p>
                  </div>
                ))}

                {/* Public notes */}
                {complaint.notes.map((n) => (
                  <div key={n.id} className="p-3.5 bg-blue-50/50 border border-blue-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-blue-900 flex items-center gap-1">
                        <Globe size={11} /> {n.author_name} ({n.author_role})
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[#0C2038] mt-1 whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) - Evidence Attachments & Supplementary Upload */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-4">
              EVIDENCE VAULT ({complaint.evidence.length})
            </div>

            {/* Supplementary Upload Form (if case not closed) */}
            {!['Resolved', 'Closed'].includes(complaint.status) && (
              <form onSubmit={handleUploadSupplementary} className="mb-6 space-y-2.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Attach Supplementary File
                </label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#0C2038] file:mr-2 file:py-1 file:px-2.5 file:border-0 file:text-[11px] file:bg-[#0C2038] file:text-white"
                />
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full py-2 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider rounded-none disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <UploadCloud size={13} /> {uploading ? 'Uploading...' : 'Submit Extra Evidence'}
                </button>
              </form>
            )}

            {complaint.evidence.length === 0 ? (
              <div className="text-xs text-[#64748B] text-center py-4">
                No attachments uploaded.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {complaint.evidence.map((ev) => (
                  <div key={ev.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <div className="font-medium text-[#0C2038] truncate">{ev.filename}</div>
                      <div className="text-[10px] text-[#94A3B8]">
                        {(ev.file_size / 1024).toFixed(1)} KB · {new Date(ev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(ev.id)}
                      className="p-1.5 text-[#0C2038] hover:bg-slate-100 border border-[#CBD5E1]"
                      title="Download Evidence"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
