export type UserRole = 'CITIZEN' | 'INVESTIGATOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Investigation Started'
  | 'Resolved'
  | 'Closed';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ComplaintEvidence {
  id: string;
  complaint_id: string;
  uploaded_by_id: string;
  filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
  uploader_name?: string | null;
}

export interface ComplaintStatusHistory {
  id: string;
  complaint_id: string;
  actor_id: string;
  previous_status: string;
  new_status: string;
  public_remarks?: string | null;
  internal_remarks?: string | null;
  created_at: string;
  actor_name?: string | null;
  actor_role?: string | null;
}

export interface InvestigationNote {
  id: string;
  complaint_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author_name?: string | null;
  author_role?: string | null;
}

export interface Complaint {
  id: string;
  complaint_number: string;
  user_id: string;
  scam_type: string;
  amount_lost: string | number;
  incident_date: string;
  scammer_identifier_type: string;
  scammer_identifier: string;
  transaction_reference?: string | null;
  incident_description: string;
  incident_location?: string | null;
  consent_given: boolean;
  status: ComplaintStatus;
  priority: PriorityLevel;
  assigned_investigator_id?: string | null;
  resolution_summary?: string | null;
  created_at: string;
  updated_at: string;
  complainant_name?: string | null;
  complainant_email?: string | null;
  assigned_investigator_name?: string | null;
  evidence_count: number;
}

export interface ComplaintDetail extends Complaint {
  evidence: ComplaintEvidence[];
  status_history: ComplaintStatusHistory[];
  notes: InvestigationNote[];
}

export interface BlacklistEntry {
  id: string;
  identifier_type: string;
  identifier_value: string;
  verification_status: 'Reported' | 'Under Review' | 'Verified';
  reason: string;
  related_complaint_id?: string | null;
  related_complaint_number?: string | null;
  created_by_id: string;
  creator_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScamCategory {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface StatsSummary {
  total_complaints: number;
  active_cases: number;
  resolved_cases: number;
  evidence_files: number;
  total_reported_lost: string | number;
}

export interface ScamTypeCount {
  scam_type: string;
  count: number;
  total_reported_amount: string | number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface TrendPoint {
  period: string;
  count: number;
  amount: string | number;
}

export interface AnalyticsData {
  stats: StatsSummary;
  by_scam_type: ScamTypeCount[];
  by_status: StatusDistribution[];
  timeline: TrendPoint[];
  recent_activity_count: number;
}
