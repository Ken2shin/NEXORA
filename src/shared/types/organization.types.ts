export type EmploymentStatus = 'active' | 'inactive' | 'on_leave' | 'terminated'
export type ResponsibilityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director'

export interface Department {
  id: string
  name: string
  code: string
  description: string
  manager_id: string | null
  manager_name?: string
  objectives: string
  functions: string[]
  is_active: boolean
  group_count?: number
  employee_count?: number
  created_at: string
  updated_at: string
}

export interface WorkGroup {
  id: string
  department_id: string
  department_name?: string
  name: string
  code: string
  leader_id: string | null
  leader_name?: string
  objective: string
  specialties: string[]
  max_capacity: number
  member_count: number
  services_assigned: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  title: string
  department_id: string
  department_name?: string
  hierarchy_level: ResponsibilityLevel
  description: string
  responsibilities: string[]
  required_skills: string[]
  required_education: string
  specialties: string[]
  supervisor_position_id: string | null
  supervisor_title?: string
  is_active: boolean
  employee_count?: number
  created_at: string
}

export interface Employee {
  id: string
  internal_id: string
  user_id?: string
  full_name: string
  email: string
  phone: string
  address?: string
  avatar_url?: string
  hire_date: string
  status: EmploymentStatus
  department_id: string
  department_name?: string
  group_id: string | null
  group_name?: string
  position_id: string
  position_title?: string
  profession: string
  career: string
  specialties: string[]
  skills: string[]
  years_experience: number
  responsibility_level: ResponsibilityLevel
  supervisor_id: string | null
  supervisor_name?: string
  assigned_permissions: string[]
  active_tasks_count?: number
  created_at: string
}

export interface HrLeaveRequest {
  id: string
  employee_id: string
  employee_name: string
  leave_type: 'vacation' | 'medical' | 'personal' | 'parental'
  start_date: string
  end_date: string
  days_count: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  created_at: string
}

export interface HrVacancy {
  id: string
  title: string
  department_id: string
  department_name: string
  position_id: string
  openings_count: number
  candidates_count: number
  status: 'open' | 'interviewing' | 'closed'
  description: string
  requirements: string[]
  created_at: string
}

export interface HrPerformanceReview {
  id: string
  employee_id: string
  employee_name: string
  reviewer_name: string
  period: string
  score: number
  goals_met: string[]
  feedback: string
  status: 'draft' | 'completed'
  created_at: string
}

export interface FinanceTransaction {
  id: string
  type: 'income' | 'expense'
  category: string
  department_id?: string
  department_name?: string
  service_id?: string
  service_name?: string
  amount: number
  currency: string
  concept: string
  reference_code: string
  receipt_filename?: string
  transaction_date: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export interface FinanceInvoice {
  id: string
  invoice_number: string
  client_id: string
  client_name: string
  concept: string
  amount: number
  tax_amount: number
  total_amount: number
  currency: string
  issue_date: string
  due_date: string
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
}

export interface FinanceBudget {
  id: string
  department_id: string
  department_name: string
  period: string
  allocated_amount: number
  spent_amount: number
  currency: string
}

export interface LegalCase {
  id: string
  case_number: string
  title: string
  case_type: 'contract' | 'labor' | 'compliance' | 'intellectual_property' | 'litigation'
  responsible_lawyer: string
  status: 'open' | 'in_review' | 'resolved' | 'archived'
  opening_date: string
  due_date?: string
  description: string
  document_count: number
}

export interface LegalContract {
  id: string
  contract_number: string
  title: string
  contract_type: 'service_agreement' | 'nda' | 'employment' | 'vendor' | 'partnership'
  parties: string[]
  effective_date: string
  expiration_date: string
  auto_renew: boolean
  status: 'draft' | 'in_negotiation' | 'active' | 'expired' | 'terminated'
}

export interface LegalInternalRequest {
  id: string
  request_number: string
  requester_name: string
  requester_dept: string
  subject: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_analysis' | 'answered'
  response?: string
  created_at: string
}

export interface OrgNotification {
  id: string
  recipient_scope: 'personal' | 'department' | 'group'
  target_id: string
  title: string
  message: string
  related_entity_type?: 'request' | 'employee' | 'contract' | 'invoice'
  related_entity_id?: string
  is_read: boolean
  created_at: string
}

export type ConversationStatus =
  | 'new'
  | 'pending_assignment'
  | 'assigned'
  | 'in_progress'
  | 'waiting_client'
  | 'solution_proposed'
  | 'resolved'
  | 'closed'

export type ConversationCategory =
  | 'tech_support'
  | 'billing_finance'
  | 'account_access'
  | 'service_inquiry'
  | 'legal_compliance'
  | 'cybersecurity'
  | 'software_dev'
  | 'general'

export interface TransferRecord {
  from_dept: string
  from_group?: string
  to_dept: string
  to_group?: string
  transferred_by: string
  reason: string
  transferred_at: string
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_role: 'client' | 'employee' | 'admin'
  ciphertext: string
  iv: string
  is_internal: boolean
  attachment_name?: string
  attachment_data?: string
  created_at: string
  deleted_for_all?: boolean
  deleted_for_users?: string[]
}

export interface Conversation {
  id: string
  conversation_number: string
  client_id: string
  client_name: string
  client_email: string
  subject: string
  initial_query: string
  category: ConversationCategory
  department_id: string
  department_name: string
  group_id?: string
  group_name?: string
  assigned_employee_id?: string
  assigned_employee_name?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: ConversationStatus
  e2ee_key_base64: string
  last_activity_at: string
  solution_proposed_at?: string
  resolution_confirmed?: boolean
  resolved_at?: string
  closed_at?: string
  closed_reason?: 'confirmed_solution' | 'inactivity' | 'admin_action'
  transfer_history: TransferRecord[]
  created_at: string
}

export interface TemporaryCredential {
  employee_id: string
  email: string
  full_name: string
  department_name: string
  position_title: string
  temporary_password: string
  must_change_password: boolean
  generated_at: string
  expires_at: string
}

export interface SecurityIncident {
  id: string
  incident_number: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'unauthorized_access' | 'brute_force' | 'privilege_escalation' | 'ddos_anomaly' | 'data_leak'
  status: 'open' | 'investigating' | 'mitigated' | 'closed'
  assigned_group_id: string
  assigned_group_name: string
  reported_at: string
  resolved_at?: string
  source_ip: string
  description: string
  defensive_action?: string
}

export interface SecurityEvent {
  id: string
  event_type: 'login_failed' | 'login_success' | 'password_reset' | 'role_escalation' | 'token_revoked'
  user_email: string
  ip_address: string
  user_agent: string
  status: 'allowed' | 'blocked' | 'flagged'
  details: string
  created_at: string
}

export interface DevProject {
  id: string
  name: string
  code: string
  description: string
  repository_url: string
  current_version: string
  status: 'active' | 'maintenance' | 'deprecated'
  lead_employee_id?: string
  lead_employee_name?: string
  updated_at: string
}

export interface DevTask {
  id: string
  task_number: string
  project_id: string
  project_name: string
  title: string
  type: 'feature' | 'bugfix' | 'refactor' | 'security_patch'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'backlog' | 'in_progress' | 'in_review' | 'done'
  assigned_employee_id?: string
  assigned_employee_name?: string
  estimated_hours: number
  created_at: string
}

export interface SlaRadarDetail {
  request_id: string
  request_number: string
  service_name: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department_id: string
  group_id?: string
  created_at: string
  first_response_at?: string
  first_response_limit_hours: number
  first_response_met?: boolean
  resolution_limit_hours: number
  resolved_at?: string
  resolution_met?: boolean
  current_status: string
  risk_state: 'within_sla' | 'near_breach' | 'at_risk' | 'breached' | 'paused' | 'no_policy'
  remaining_minutes: number
  percent_used: number
  escalated_to?: string
}