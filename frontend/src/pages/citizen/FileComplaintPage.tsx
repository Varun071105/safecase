import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ScamCategory, Complaint } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  ShieldAlert,
  AlertCircle,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  Info,
  Calendar,
  IndianRupee,
  Lock
} from 'lucide-react';

export const FileComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [categories, setCategories] = useState<ScamCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Form Fields
  const [scamType, setScamType] = useState('');
  const [amountLost, setAmountLost] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [identifierType, setIdentifierType] = useState('UPI ID');
  const [scammerIdentifier, setScammerIdentifier] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // File Uploads
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submission Confirmation State
  const [registeredComplaint, setRegisteredComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.get<ScamCategory[]>('/categories/');
        setCategories(data);
        if (data.length > 0) {
          setScamType(data[0].name);
        }
      } catch {
        // Fallback default list if API fails
        setCategories([
          { id: '1', name: 'UPI Fraud', is_active: true, display_order: 1, created_at: '' },
          { id: '2', name: 'Phishing', is_active: true, display_order: 2, created_at: '' },
          { id: '3', name: 'Online Shopping Fraud', is_active: true, display_order: 3, created_at: '' },
          { id: '4', name: 'Job or Employment Fraud', is_active: true, display_order: 4, created_at: '' },
          { id: '5', name: 'Investment Fraud', is_active: true, display_order: 5, created_at: '' },
          { id: '6', name: 'Impersonation', is_active: true, display_order: 6, created_at: '' },
          { id: '7', name: 'Loan or Credit Fraud', is_active: true, display_order: 7, created_at: '' },
          { id: '8', name: 'Other', is_active: true, display_order: 8, created_at: '' },
        ]);
        setScamType('UPI Fraud');
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      // Validate extensions
      const valid = selected.filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'pdf';
      });
      setFiles((prev) => [...prev, ...valid].slice(0, 5)); // limit to 5
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consentGiven) {
      setError('You must check the consent and accuracy declaration before submitting.');
      return;
    }

    if (!incidentDate) {
      setError('Please provide the date of the scam incident.');
      return;
    }

    if (incidentDescription.trim().length < 20) {
      setError('Please provide a descriptive incident account (minimum 20 characters).');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create complaint record
      const complaintRes = await api.post<Complaint>('/complaints/', {
        scam_type: scamType,
        amount_lost: amountLost ? parseFloat(amountLost) : 0,
        incident_date: new Date(incidentDate).toISOString(),
        scammer_identifier_type: identifierType,
        scammer_identifier: scammerIdentifier.trim(),
        transaction_reference: transactionRef.trim() || undefined,
        incident_description: incidentDescription.trim(),
        incident_location: incidentLocation.trim() || undefined,
        consent_given: true,
      });

      // 2. Upload any attachments
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            await api.upload(`/complaints/${complaintRes.id}/evidence`, formData);
          } catch (uploadErr) {
            console.error('Failed uploading file:', file.name, uploadErr);
          }
        }
      }

      setRegisteredComplaint(complaintRes);
      addToast('success', `Complaint ${complaintRes.complaint_number} filed successfully!`);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check form values and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // If registered successfully, show confirmation screen
  if (registeredComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white border border-[#E2E8F0] p-8 lg:p-12 text-center shadow-none">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>

          <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
            SUBMISSION CONFIRMED
          </div>

          <h2 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038] mb-2">
            Complaint Registered Successfully
          </h2>

          <p className="text-xs text-[#64748B] max-w-md mx-auto mb-6">
            Your scam incident has been formally recorded in the SAFECASE anti-fraud registry and queued for officer review.
          </p>

          <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] inline-block mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
              Official Reference ID
            </span>
            <span className="text-xl lg:text-2xl font-mono font-bold text-[#0C2038] mt-1 block">
              {registeredComplaint.complaint_number}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/dashboard/complaints/${registeredComplaint.id}`}
              className="w-full sm:w-auto px-6 py-3 bg-[#0C2038] hover:bg-[#132A47] text-white text-xs font-semibold uppercase tracking-wider text-center"
            >
              Track Case Progress
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-[#CBD5E1] text-[#0C2038] hover:bg-[#F4F6F8] text-xs font-semibold uppercase tracking-wider text-center"
            >
              Return to My Complaints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-[#C93636] mb-1">
          PUBLIC SAFETY SERVICE
        </div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#0C2038]">
          File a Scam Complaint
        </h1>
        <p className="text-xs lg:text-sm text-[#64748B] mt-1">
          Complete the official incident intake form to report fraudulent schemes and initiate verification.
        </p>
      </div>

      {/* Security Warning Callout */}
      <div className="bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Security Warning:</strong> Never submit sensitive authentication credentials such as net-banking passwords, UPI PINs, OTP codes, or 16-digit debit/credit card CVV numbers. Official investigators will never solicit your authorization codes.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-[#C93636] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaint Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8F0] p-6 lg:p-8 space-y-8">
        {/* Section 1: Incident Categorization */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0C2038] pb-2 border-b border-[#E2E8F0] mb-4">
            1. Scam Classification & Monetary Impact
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Scam Type <span className="text-[#C93636]">*</span>
              </label>
              <select
                value={scamType}
                onChange={(e) => setScamType(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] focus:outline-none focus:border-[#0C2038] rounded-none"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Reported Amount Lost (INR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountLost}
                  onChange={(e) => setAmountLost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Incident Date & Time <span className="text-[#C93636]">*</span>
              </label>
              <input
                type="datetime-local"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] focus:outline-none focus:border-[#0C2038] rounded-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Offender Identifier */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0C2038] pb-2 border-b border-[#E2E8F0] mb-4">
            2. Scammer Identification
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Identifier Type <span className="text-[#C93636]">*</span>
              </label>
              <select
                value={identifierType}
                onChange={(e) => setIdentifierType(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] focus:outline-none focus:border-[#0C2038] rounded-none"
                required
              >
                <option value="UPI ID">UPI ID (e.g. name@okaxis)</option>
                <option value="Phone number">Phone number / WhatsApp</option>
                <option value="Website URL">Website URL (e.g. https://...)</option>
                <option value="Email address">Email address</option>
                <option value="Social media account">Social media account / Telegram</option>
                <option value="Other">Other Identifier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Scammer Identifier Value <span className="text-[#C93636]">*</span>
              </label>
              <input
                type="text"
                value={scammerIdentifier}
                onChange={(e) => setScammerIdentifier(e.target.value)}
                placeholder="Enter exact phone, UPI ID, or URL..."
                className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Bank UTR / Transaction Reference (Optional)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI/123456789 or IMPS reference number"
                className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Incident Location (Optional)
              </label>
              <input
                type="text"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                placeholder="City, State / Region where you were located"
                className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Incident Narrative */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0C2038] pb-2 border-b border-[#E2E8F0] mb-4">
            3. Incident Account & Evidence
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#0C2038]">
                  Detailed Incident Description <span className="text-[#C93636]">*</span>
                </label>
                <span className="text-[11px] text-[#94A3B8]">
                  {incidentDescription.length} characters (min 20)
                </span>
              </div>
              <textarea
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Describe how the scam occurred, sequence of communications, promises made, and instructions given by the offender..."
                rows={5}
                className="w-full p-3 text-xs bg-white border border-[#CBD5E1] text-[#0C2038] placeholder-[#94A3B8] focus:outline-none focus:border-[#0C2038] rounded-none leading-relaxed"
                required
              />
            </div>

            {/* Evidence Attachments Upload Box */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0C2038] mb-1.5">
                Supporting Evidence Attachments (PNG, JPG, PDF — Max 15MB each)
              </label>
              <div className="p-6 border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center hover:bg-[#F1F5F9] transition-colors cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud size={24} className="mx-auto text-[#64748B] mb-2" />
                <div className="text-xs font-semibold text-[#0C2038]">
                  Click or drag screenshots, payment receipts, or chat logs here
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">
                  Supports PNG, JPG, and PDF. Maximum 5 attachments.
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#F4F6F8] border border-[#E2E8F0] flex items-center justify-between text-xs"
                    >
                      <span className="truncate text-[#0C2038] font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-[#C93636] hover:underline text-[11px] ml-2 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Consent & Declaration */}
        <div className="pt-4 border-t border-[#E2E8F0]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded-none border-[#CBD5E1] text-[#C93636] focus:ring-0"
              required
            />
            <span className="text-xs text-[#0C2038] leading-relaxed">
              I hereby declare that the particulars provided in this complaint are true and correct to the best of my knowledge and belief. I acknowledge that submitting false or fabricated claims to public safety portals constitutes an offense under cyber regulations.
            </span>
          </label>
        </div>

        {/* Form Submission Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-white border border-[#CBD5E1] text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#0C2038]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !consentGiven}
            className="px-6 py-2.5 bg-[#C93636] hover:bg-[#B22B2B] text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 rounded-none"
          >
            {submitting ? 'Registering Casework...' : 'Submit Scam Complaint'}
            {!submitting && <ArrowRight size={14} />}
          </button>
        </div>
      </form>
    </div>
  );
};
