/* ── Enums ─────────────────────────────────────────────────────── */

export enum UserRole {
  FACTORY_SUPERVISOR = "factory_supervisor",
  SALES_MANAGER = "sales_manager",
  MARKETER = "marketer",
  CUSTOMER_CARE = "customer_care",
  ADMIN = "admin",
  HR_MANAGEMENT = "hr_management",
}

export enum SyncStatus {
  PENDING = "pending",
  SYNCED = "synced",
  CONFLICT = "conflict",
  FAILED = "failed",
}

export enum LogStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum TransferStatus {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DISPATCHED = "dispatched",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
  OVERDUE = "overdue",
}

export enum QueryType {
  MISSED_LOG = "missed_log",
  LATE_SUBMISSION = "late_submission",
  POLICY_VIOLATION = "policy_violation",
  INVENTORY_DISCREPANCY = "inventory_discrepancy",
  UNAUTHORIZED_ACTION = "unauthorized_action",
}

export enum PayrollStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  PAID = "paid",
  DISPUTED = "disputed",
}

export enum CampaignStatus {
  PLANNED = "planned",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum FeedbackType {
  COMPLAINT = "complaint",
  SUGGESTION = "suggestion",
  INQUIRY = "inquiry",
  COMPLIMENT = "compliment",
}

export enum ConflictResolution {
  PENDING = "pending",
  CLIENT_WINS = "client_wins",
  SERVER_WINS = "server_wins",
  MERGED = "merged",
  MANUAL = "manual",
}

/* ── User Types ──────────────────────────────────────────────── */

export interface User {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  device_id?: string;
  device_bound_at?: string;
  has_consented: boolean;
  consent_date?: string;
  permissions?: Record<string, boolean>;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  password: string;
  permissions?: Record<string, boolean>;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  is_active?: boolean;
  permissions?: Record<string, boolean>;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_id: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface ConsentSubmission {
  accepted: boolean;
  digital_signature: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  device_id?: string;
  timestamp: string;
}

/* ── Inventory Types ─────────────────────────────────────────── */

export interface RawMaterial {
  id: string;
  item_id: string;
  name: string;
  batch_number: string;
  supplier: string;
  quantity_received: number;
  quantity_available: number;
  unit_cost: number;
  total_cost: number;
  unit_of_measure: string;
  expiry_date?: string;
  received_date: string;
  received_by: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface RawMaterialCreate {
  name: string;
  batch_number: string;
  supplier: string;
  quantity_received: number;
  unit_cost: number;
  unit_of_measure?: string;
  expiry_date?: string;
  notes?: string;
}

export interface ProductionLog {
  id: string;
  production_id: string;
  product_name: string;
  batch_number: string;
  quantity_produced: number;
  quantity_output: number;
  wastage_quantity: number;
  wastage_percentage: number;
  production_date: string;
  supervisor_id: string;
  supervisor_signature: string;
  raw_materials_used: ProductionRawMaterial[];
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
}

export interface ProductionRawMaterial {
  raw_material_id: string;
  raw_material_name?: string;
  quantity_used: number;
}

export interface ProductionLogCreate {
  product_name: string;
  batch_number: string;
  quantity_produced: number;
  quantity_output: number;
  supervisor_signature: string;
  raw_materials_used: ProductionRawMaterial[];
  notes?: string;
}

export interface FinishedGood {
  id: string;
  product_id: string;
  name: string;
  batch_number: string;
  quantity_produced: number;
  quantity_available: number;
  unit_price: number;
  production_log_id?: string;
  manufactured_date: string;
  expiry_date?: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface FinishedGoodCreate {
  name: string;
  batch_number: string;
  quantity_produced: number;
  unit_price: number;
  production_log_id?: string;
  expiry_date?: string;
  notes?: string;
}

export interface InventoryTransfer {
  id: string;
  transfer_id: string;
  finished_good_id: string;
  product_name?: string;
  quantity: number;
  from_location: string;
  to_location: string;
  status: TransferStatus;
  initiated_by: string;
  initiator_name?: string;
  initiator_signature: string;
  approved_by?: string;
  approver_name?: string;
  approver_signature?: string;
  rejection_reason?: string;
  transfer_date: string;
  completion_date?: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface InventoryTransferCreate {
  finished_good_id: string;
  quantity: number;
  from_location: string;
  to_location: string;
  initiator_signature: string;
  notes?: string;
}

export interface TransferApproval {
  approved: boolean;
  approver_signature: string;
  rejection_reason?: string;
}

/* ── Sales Types ─────────────────────────────────────────────── */

export interface CustomerCategory {
  id: string;
  name: string;
  description?: string;
  risk_score: number;
  credit_limit: number;
  payment_cycle_days: number;
  created_at: string;
}

export interface CustomerCategoryCreate {
  name: string;
  description?: string;
  risk_score?: number;
  credit_limit?: number;
  payment_cycle_days?: number;
}

export interface Customer {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category_id?: string;
  category_name?: string;
  total_revenue: number;
  credit_exposure: number;
  risk_score: number;
  is_active: boolean;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface CustomerCreate {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category_id?: string;
}

export interface Order {
  id: string;
  tracking_id: string;
  customer_id: string;
  customer_name?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  order_date: string;
  delivery_date?: string;
  created_by: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  finished_good_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderCreate {
  customer_id: string;
  items: Array<{
    finished_good_id: string;
    quantity: number;
    unit_price: number;
  }>;
  tax_amount?: number;
  discount_amount?: number;
  delivery_date?: string;
  notes?: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
}

export interface OrderPaymentUpdate {
  amount_paid: number;
  payment_method?: string;
}

export interface SalesDailyLog {
  id: string;
  log_date: string;
  user_id: string;
  opening_stock: Record<string, number>;
  closing_stock: Record<string, number>;
  orders_received: number;
  orders_fulfilled: number;
  total_revenue: number;
  total_receivables: number;
  notes?: string;
  sync_status: SyncStatus;
  created_at: string;
}

export interface SalesDailyLogCreate {
  log_date: string;
  opening_stock: Record<string, number>;
  closing_stock: Record<string, number>;
  orders_received: number;
  orders_fulfilled: number;
  total_revenue: number;
  total_receivables: number;
  notes?: string;
}

/* ── Marketing Types ─────────────────────────────────────────── */

export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: string;
  status: CampaignStatus;
  start_date: string;
  end_date?: string;
  budget: number;
  actual_spend: number;
  target_audience?: string;
  leads_generated: number;
  conversions: number;
  conversion_rate: number;
  revenue_attributed: number;
  roi: number;
  created_by: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface MarketingCampaignCreate {
  name: string;
  description?: string;
  campaign_type: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  target_audience?: string;
  notes?: string;
}

export interface MarketingCampaignUpdate {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  end_date?: string;
  actual_spend?: number;
  leads_generated?: number;
  conversions?: number;
  revenue_attributed?: number;
  notes?: string;
}

export interface CustomerFeedback {
  id: string;
  ticket_id: string;
  customer_id?: string;
  customer_name?: string;
  feedback_type: FeedbackType;
  subject: string;
  description: string;
  complaint_category?: string;
  severity: number;
  status: string;
  escalation_level: number;
  assigned_to?: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  satisfaction_rating?: number;
  resolution_notes?: string;
  created_by: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface CustomerFeedbackCreate {
  customer_id?: string;
  customer_name?: string;
  feedback_type: FeedbackType;
  subject: string;
  description: string;
  complaint_category?: string;
  severity?: number;
}

export interface CustomerFeedbackUpdate {
  status?: string;
  escalation_level?: number;
  assigned_to?: string;
  satisfaction_rating?: number;
  resolution_notes?: string;
}

/* ── ASAL Types ──────────────────────────────────────────────── */

export interface DailyLog {
  id: string;
  user_id: string;
  user_name?: string;
  log_date: string;
  role: UserRole;
  status: LogStatus;
  activities: Record<string, unknown>;
  challenges?: string;
  next_day_plan?: string;
  submitted_at?: string;
  approved_by?: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface DailyLogCreate {
  log_date: string;
  activities: Record<string, unknown>;
  challenges?: string;
  next_day_plan?: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  user_name?: string;
  week_start_date: string;
  week_number: number;
  year: number;
  status: LogStatus;
  objectives: SmartObjective[];
  kpi_targets: Record<string, number>;
  is_late: boolean;
  submitted_at?: string;
  approved_by?: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface SmartObjective {
  title: string;
  description: string;
  measurable_target: string;
  deadline: string;
}

export interface WeeklyPlanCreate {
  week_start_date: string;
  objectives: SmartObjective[];
  kpi_targets: Record<string, number>;
  notes?: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  user_name?: string;
  week_start_date: string;
  week_number: number;
  year: number;
  status: LogStatus;
  objectives_achieved: ObjectiveResult[];
  financial_impact?: Record<string, number>;
  inventory_impact?: Record<string, number>;
  deviation_explanation?: string;
  is_late: boolean;
  submitted_at?: string;
  approved_by?: string;
  notes?: string;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface ObjectiveResult {
  title: string;
  target: string;
  actual: string;
  percentage_achieved: number;
  remarks?: string;
}

export interface WeeklyReportCreate {
  week_start_date: string;
  objectives_achieved: ObjectiveResult[];
  financial_impact?: Record<string, number>;
  inventory_impact?: Record<string, number>;
  deviation_explanation?: string;
  notes?: string;
}

export interface MissedLog {
  user_id: string;
  user_name: string;
  missed_date: string;
  consecutive_count: number;
}

/* ── Disciplinary Types ──────────────────────────────────────── */

export interface DisciplinaryRecord {
  id: string;
  record_id: string;
  user_id: string;
  user_name?: string;
  query_type: QueryType;
  description: string;
  date_issued: string;
  consecutive_count: number;
  payroll_deduction_percentage: number;
  privileges_locked: boolean;
  locked_privileges: string[];
  is_acknowledged: boolean;
  acknowledged_at?: string;
  appeal_text?: string;
  appeal_date?: string;
  appeal_digital_signature?: string;
  appeal_status?: string;
  management_decision?: string;
  management_confirmed_by?: string;
  management_confirmed_at?: string;
  is_termination_flagged: boolean;
  sync_status: SyncStatus;
  device_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface DisciplinaryAcknowledge {
  digital_signature: string;
}

export interface DisciplinaryAppeal {
  appeal_text: string;
  digital_signature: string;
}

export interface ManagementDecision {
  decision: string;
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  payroll_id: string;
  user_id: string;
  user_name?: string;
  month: number;
  year: number;
  salary_base: number;
  allowances: number;
  gross_pay: number;
  standard_deductions: number;
  compliance_deductions: number;
  total_deductions: number;
  net_pay: number;
  status: PayrollStatus;
  deduction_details: Record<string, number>;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at?: string;
}

export interface PayrollCreate {
  user_id: string;
  month: number;
  year: number;
  salary_base: number;
  allowances?: number;
  standard_deductions?: number;
  notes?: string;
}

/* ── KPI Types ───────────────────────────────────────────────── */

export interface KPIRecord {
  id: string;
  user_id: string;
  user_name?: string;
  month: number;
  year: number;
  revenue_score: number;
  compliance_score: number;
  operational_score: number;
  performance_score: number;
  accountability_index: number;
  targets_met: Record<string, boolean>;
  details: Record<string, unknown>;
  sync_status: SyncStatus;
  created_at: string;
  updated_at?: string;
}

export interface KPIRecordCreate {
  user_id: string;
  month: number;
  year: number;
  revenue_score: number;
  compliance_score: number;
  operational_score: number;
  details?: Record<string, unknown>;
}

export interface DepartmentTarget {
  id: string;
  department: string;
  month: number;
  year: number;
  revenue_target: number;
  compliance_target: number;
  operational_target: number;
  notes?: string;
  created_at: string;
}

export interface DepartmentTargetCreate {
  department: string;
  month: number;
  year: number;
  revenue_target: number;
  compliance_target?: number;
  operational_target?: number;
  notes?: string;
}

export interface MonthlyDashboard {
  month: number;
  year: number;
  individual_kpis: KPIRecord[];
  department_summaries: Record<string, {
    avg_performance: number;
    avg_compliance: number;
    total_revenue_score: number;
    headcount: number;
  }>;
  inventory_reconciliation: {
    total_raw_materials_value: number;
    total_finished_goods_value: number;
    wastage_percentage: number;
    pending_transfers: number;
  };
  revenue_analytics: {
    total_revenue: number;
    total_receivables: number;
    orders_count: number;
    avg_order_value: number;
  };
  risk_alerts: RiskAlert[];
}

export interface RiskAlert {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  related_entity_id?: string;
  related_entity_type?: string;
}

/* ── Sync Types ──────────────────────────────────────────────── */

export interface SyncEvent {
  id: string;
  device_id: string;
  user_id: string;
  direction: "push" | "pull";
  entity_type: string;
  entity_id: string;
  status: string;
  conflict_id?: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface SyncConflict {
  id: string;
  entity_type: string;
  entity_id: string;
  client_version: Record<string, unknown>;
  server_version: Record<string, unknown>;
  client_device_id: string;
  client_timestamp: string;
  server_timestamp: string;
  resolution: ConflictResolution;
  resolved_by?: string;
  resolved_at?: string;
  is_financial: boolean;
}

export interface SyncConflictResolve {
  resolution: ConflictResolution;
  merged_data?: Record<string, unknown>;
}

export interface DeviceRegistration {
  id: string;
  device_id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  os_version?: string;
  app_version?: string;
  is_active: boolean;
  last_sync_at?: string;
  registered_at: string;
}

export interface DeviceRegisterRequest {
  device_id: string;
  device_name: string;
  device_type: string;
  os_version?: string;
  app_version?: string;
}

export interface SyncPushRequest {
  device_id: string;
  changes: SyncChange[];
}

export interface SyncChange {
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  version: number;
  timestamp: string;
}

export interface SyncPullRequest {
  device_id: string;
  last_sync_at?: string;
  entity_types?: string[];
}

export interface SyncPullResponse {
  changes: SyncChange[];
  conflicts: SyncConflict[];
  server_timestamp: string;
}

/* ── Pagination & API Response Types ─────────────────────────── */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

/* ── Local/IndexedDB Types ───────────────────────────────────── */

export interface LocalRecord {
  local_id?: number;
  sync_status: SyncStatus;
  last_modified: string;
  device_id: string;
  version: number;
}

export interface PendingSync {
  id?: number;
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
}
