import Dexie, { type Table } from "dexie";

/* ── Local-first IndexedDB schema for offline operations ─── */

export interface LocalUser {
  id?: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  is_active: boolean;
  device_id?: string;
  permissions?: Record<string, boolean>;
  sync_status: string;
  last_modified: number;
  version: number;
}

export interface LocalRawMaterial {
  id?: string;
  local_id?: string;
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
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalProductionLog {
  id?: string;
  local_id?: string;
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
  raw_materials_used: Array<{
    raw_material_id: string;
    quantity_used: number;
  }>;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalFinishedGood {
  id?: string;
  local_id?: string;
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
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalInventoryTransfer {
  id?: string;
  local_id?: string;
  transfer_id: string;
  finished_good_id: string;
  product_name?: string;
  quantity: number;
  from_location: string;
  to_location: string;
  status: string;
  initiated_by: string;
  initiator_signature: string;
  approved_by?: string;
  approver_signature?: string;
  rejection_reason?: string;
  transfer_date: string;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalCustomer {
  id?: string;
  local_id?: string;
  name: string;
  business_name?: string;
  email?: string;
  phone: string;
  address?: string;
  category_id?: string;
  total_revenue: number;
  credit_exposure: number;
  risk_score: number;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalOrder {
  id?: string;
  local_id?: string;
  tracking_id: string;
  customer_id: string;
  customer_name?: string;
  status: string;
  payment_status: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  items: Array<{
    finished_good_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  order_date: string;
  delivery_date?: string;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalDailyLog {
  id?: string;
  local_id?: string;
  user_id: string;
  log_date: string;
  role: string;
  status: string;
  activities: Record<string, unknown>;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalWeeklyPlan {
  id?: string;
  local_id?: string;
  user_id: string;
  week_start: string;
  week_end: string;
  status: string;
  is_late: boolean;
  objectives: Array<{
    title: string;
    description: string;
    target_metric: string;
    target_value: number;
  }>;
  kpi_targets?: Record<string, unknown>;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalWeeklyReport {
  id?: string;
  local_id?: string;
  user_id: string;
  week_start: string;
  week_end: string;
  status: string;
  is_late: boolean;
  objectives_achieved: Array<{
    title: string;
    achieved: boolean;
    actual_value: number;
    deviation_explanation?: string;
  }>;
  financial_impact?: Record<string, unknown>;
  inventory_impact?: Record<string, unknown>;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalDisciplinaryRecord {
  id?: string;
  local_id?: string;
  user_id: string;
  query_type: string;
  description: string;
  date_issued: string;
  consecutive_count: number;
  payroll_deduction_percentage: number;
  is_privilege_locked: boolean;
  acknowledged: boolean;
  appeal_text?: string;
  appeal_status?: string;
  management_confirmation?: boolean;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalPayrollRecord {
  id?: string;
  local_id?: string;
  user_id: string;
  month: number;
  year: number;
  salary_base: number;
  allowances: number;
  compliance_deduction: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalCampaign {
  id?: string;
  local_id?: string;
  name: string;
  description?: string;
  status: string;
  start_date: string;
  end_date?: string;
  budget: number;
  actual_spend: number;
  leads_generated: number;
  conversions: number;
  conversion_rate: number;
  roi: number;
  created_by: string;
  notes?: string;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalFeedback {
  id?: string;
  local_id?: string;
  ticket_id: string;
  customer_id?: string;
  customer_name?: string;
  type: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assigned_to?: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  satisfaction_rating?: number;
  escalation_level: number;
  sync_status: string;
  device_id?: string;
  last_modified: number;
  version: number;
}

export interface LocalSyncQueue {
  id?: number;
  table_name: string;
  record_id: string;
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  timestamp: number;
  attempts: number;
  last_error?: string;
}

/* ── Dexie Database Class ─────────────────────────────── */

class BonneSanteDB extends Dexie {
  users!: Table<LocalUser>;
  rawMaterials!: Table<LocalRawMaterial>;
  productionLogs!: Table<LocalProductionLog>;
  finishedGoods!: Table<LocalFinishedGood>;
  inventoryTransfers!: Table<LocalInventoryTransfer>;
  customers!: Table<LocalCustomer>;
  orders!: Table<LocalOrder>;
  dailyLogs!: Table<LocalDailyLog>;
  weeklyPlans!: Table<LocalWeeklyPlan>;
  weeklyReports!: Table<LocalWeeklyReport>;
  disciplinaryRecords!: Table<LocalDisciplinaryRecord>;
  payrollRecords!: Table<LocalPayrollRecord>;
  campaigns!: Table<LocalCampaign>;
  feedbacks!: Table<LocalFeedback>;
  syncQueue!: Table<LocalSyncQueue>;

  constructor() {
    super("BonneSanteDB");

    this.version(1).stores({
      users: "id, employee_id, email, role, sync_status, last_modified",
      rawMaterials:
        "id, local_id, item_id, batch_number, supplier, sync_status, last_modified",
      productionLogs:
        "id, local_id, production_id, batch_number, production_date, sync_status, last_modified",
      finishedGoods:
        "id, local_id, product_id, batch_number, name, sync_status, last_modified",
      inventoryTransfers:
        "id, local_id, transfer_id, status, initiated_by, sync_status, last_modified",
      customers:
        "id, local_id, name, phone, category_id, sync_status, last_modified",
      orders:
        "id, local_id, tracking_id, customer_id, status, payment_status, order_date, sync_status, last_modified",
      dailyLogs:
        "id, local_id, user_id, log_date, [user_id+log_date], sync_status, last_modified",
      weeklyPlans:
        "id, local_id, user_id, week_start, [user_id+week_start], sync_status, last_modified",
      weeklyReports:
        "id, local_id, user_id, week_start, [user_id+week_start], sync_status, last_modified",
      disciplinaryRecords:
        "id, local_id, user_id, query_type, date_issued, sync_status, last_modified",
      payrollRecords:
        "id, local_id, user_id, [user_id+month+year], sync_status, last_modified",
      campaigns:
        "id, local_id, name, status, start_date, sync_status, last_modified",
      feedbacks:
        "id, local_id, ticket_id, customer_id, type, status, sync_status, last_modified",
      syncQueue: "++id, table_name, record_id, action, timestamp",
    });
  }
}

export const db = new BonneSanteDB();

/* ── Helper: queue an offline mutation for later sync ─── */
export async function queueOfflineMutation(
  tableName: string,
  recordId: string,
  action: "create" | "update" | "delete",
  data: Record<string, unknown>
) {
  await db.syncQueue.add({
    table_name: tableName,
    record_id: recordId,
    action,
    data,
    timestamp: Date.now(),
    attempts: 0,
  });
}

/* ── Helper: get all pending sync items ───────────────── */
export async function getPendingSyncItems() {
  return db.syncQueue.orderBy("timestamp").toArray();
}

/* ── Helper: clear synced items ───────────────────────── */
export async function clearSyncedItem(id: number) {
  await db.syncQueue.delete(id);
}
