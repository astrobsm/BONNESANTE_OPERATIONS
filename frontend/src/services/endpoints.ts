import { apiGet, apiPost, apiPut, apiPatch } from "./api";
import type {
  LoginRequest,
  LoginResponse,
  User,
  UserCreate,
  UserUpdate,
  ConsentSubmission,
  PasswordChange,
  AuditLog,
  RawMaterial,
  RawMaterialCreate,
  ProductionLog,
  ProductionLogCreate,
  FinishedGood,
  FinishedGoodCreate,
  InventoryTransfer,
  InventoryTransferCreate,
  TransferApproval,
  Customer,
  Order,
  DailyLog,
  WeeklyPlan,
  WeeklyReport,
  MarketingCampaign,
  CustomerFeedback,
} from "../types";

/* ═══════════════ AUTH ═══════════════ */

export const authService = {
  login: (data: LoginRequest) =>
    apiPost<LoginResponse>("/auth/login", data),

  refreshToken: (refreshToken: string) =>
    apiPost<{ access_token: string; refresh_token: string }>("/auth/refresh", {
      refresh_token: refreshToken,
    }),

  getMe: () => apiGet<User>("/auth/me"),

  getUsers: (params?: { role?: string; skip?: number; limit?: number }) =>
    apiGet<User[]>("/auth/users", { params }),

  createUser: (data: UserCreate) => apiPost<User>("/auth/users", data),

  updateUser: (id: string, data: UserUpdate) =>
    apiPut<User>(`/auth/users/${id}`, data),

  submitConsent: (data: ConsentSubmission) =>
    apiPost<User>("/auth/consent", data),

  changePassword: (data: PasswordChange) =>
    apiPost<{ message: string }>("/auth/change-password", data),

  getAuditLogs: (params?: {
    user_id?: string;
    action?: string;
    skip?: number;
    limit?: number;
  }) => apiGet<AuditLog[]>("/auth/audit-logs", { params }),
};

/* ═══════════════ INVENTORY ═══════════════ */

export const inventoryService = {
  // Raw Materials
  getRawMaterials: (params?: { skip?: number; limit?: number }) =>
    apiGet<RawMaterial[]>("/inventory/raw-materials", { params }),

  getRawMaterial: (id: string) =>
    apiGet<RawMaterial>(`/inventory/raw-materials/${id}`),

  createRawMaterial: (data: RawMaterialCreate) =>
    apiPost<RawMaterial>("/inventory/raw-materials", data),

  updateRawMaterial: (id: string, data: Partial<RawMaterialCreate>) =>
    apiPut<RawMaterial>(`/inventory/raw-materials/${id}`, data),

  // Production Logs
  getProductionLogs: (params?: { skip?: number; limit?: number }) =>
    apiGet<ProductionLog[]>("/inventory/production-logs", { params }),

  createProductionLog: (data: ProductionLogCreate) =>
    apiPost<ProductionLog>("/inventory/production-logs", data),

  // Finished Goods
  getFinishedGoods: (params?: { skip?: number; limit?: number }) =>
    apiGet<FinishedGood[]>("/inventory/finished-goods", { params }),

  getFinishedGood: (id: string) =>
    apiGet<FinishedGood>(`/inventory/finished-goods/${id}`),

  createFinishedGood: (data: FinishedGoodCreate) =>
    apiPost<FinishedGood>("/inventory/finished-goods", data),

  // Transfers
  getTransfers: (params?: { status?: string; skip?: number; limit?: number }) =>
    apiGet<InventoryTransfer[]>("/inventory/transfers", { params }),

  createTransfer: (data: InventoryTransferCreate) =>
    apiPost<InventoryTransfer>("/inventory/transfers", data),

  approveTransfer: (id: string, data: TransferApproval) =>
    apiPatch<InventoryTransfer>(`/inventory/transfers/${id}/approve`, data),
};

/* ═══════════════ SALES ═══════════════ */

export const salesService = {
  getCustomers: (params?: { skip?: number; limit?: number }) =>
    apiGet<Customer[]>("/sales/customers", { params }),

  getCustomer: (id: string) => apiGet<Customer>(`/sales/customers/${id}`),

  createCustomer: (data: Partial<Customer>) =>
    apiPost<Customer>("/sales/customers", data),

  updateCustomer: (id: string, data: Partial<Customer>) =>
    apiPut<Customer>(`/sales/customers/${id}`, data),

  getOrders: (params?: {
    status?: string;
    customer_id?: string;
    skip?: number;
    limit?: number;
  }) => apiGet<Order[]>("/sales/orders", { params }),

  getOrder: (id: string) => apiGet<Order>(`/sales/orders/${id}`),

  createOrder: (data: Partial<Order>) =>
    apiPost<Order>("/sales/orders", data),

  updateOrderStatus: (id: string, status: string) =>
    apiPatch<Order>(`/sales/orders/${id}/status`, { status }),

  updatePaymentStatus: (id: string, status: string, amountPaid?: number) =>
    apiPatch<Order>(`/sales/orders/${id}/payment`, {
      payment_status: status,
      amount_paid: amountPaid,
    }),
};

/* ═══════════════ MARKETING ═══════════════ */

export const marketingService = {
  getCampaigns: (params?: { status?: string; skip?: number; limit?: number }) =>
    apiGet<MarketingCampaign[]>("/marketing/campaigns", { params }),

  getCampaign: (id: string) =>
    apiGet<MarketingCampaign>(`/marketing/campaigns/${id}`),

  createCampaign: (data: Partial<MarketingCampaign>) =>
    apiPost<MarketingCampaign>("/marketing/campaigns", data),

  updateCampaign: (id: string, data: Partial<MarketingCampaign>) =>
    apiPut<MarketingCampaign>(`/marketing/campaigns/${id}`, data),

  getFeedbacks: (params?: {
    type?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }) => apiGet<CustomerFeedback[]>("/marketing/feedbacks", { params }),

  createFeedback: (data: Partial<CustomerFeedback>) =>
    apiPost<CustomerFeedback>("/marketing/feedbacks", data),

  updateFeedback: (id: string, data: Partial<CustomerFeedback>) =>
    apiPut<CustomerFeedback>(`/marketing/feedbacks/${id}`, data),
};

/* ═══════════════ ASAL (Daily/Weekly Logs) ═══════════════ */

export const asalService = {
  getDailyLogs: (params?: {
    user_id?: string;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }) => apiGet<DailyLog[]>("/asal/daily-logs", { params }),

  createDailyLog: (data: Partial<DailyLog>) =>
    apiPost<DailyLog>("/asal/daily-logs", data),

  getMissedLogs: (userId: string) =>
    apiGet<{ missed_dates: string[]; consecutive_count: number }>(
      `/asal/daily-logs/missed/${userId}`
    ),

  getWeeklyPlans: (params?: {
    user_id?: string;
    skip?: number;
    limit?: number;
  }) => apiGet<WeeklyPlan[]>("/asal/weekly-plans", { params }),

  createWeeklyPlan: (data: Partial<WeeklyPlan>) =>
    apiPost<WeeklyPlan>("/asal/weekly-plans", data),

  getWeeklyReports: (params?: {
    user_id?: string;
    skip?: number;
    limit?: number;
  }) => apiGet<WeeklyReport[]>("/asal/weekly-reports", { params }),

  createWeeklyReport: (data: Partial<WeeklyReport>) =>
    apiPost<WeeklyReport>("/asal/weekly-reports", data),
};

/* ═══════════════ DISCIPLINARY ═══════════════ */

export const disciplinaryService = {
  autoCheckDailyLogs: () =>
    apiPost<{ message: string }>("/disciplinary/auto-check-daily-logs"),

  autoCheckWeeklyCompliance: () =>
    apiPost<{ message: string }>("/disciplinary/auto-check-weekly-compliance"),

  getRecords: (params?: {
    user_id?: string;
    query_type?: string;
    skip?: number;
    limit?: number;
  }) =>
    apiGet<unknown[]>("/disciplinary/records", { params }),

  acknowledgeRecord: (id: string, signature: string) =>
    apiPatch<unknown>(`/disciplinary/records/${id}/acknowledge`, {
      digital_signature: signature,
    }),

  appealRecord: (id: string, text: string, signature: string) =>
    apiPatch<unknown>(`/disciplinary/records/${id}/appeal`, {
      appeal_text: text,
      digital_signature: signature,
    }),

  confirmTermination: (id: string, confirmed: boolean, signature: string) =>
    apiPatch<unknown>(`/disciplinary/records/${id}/management-confirm`, {
      confirmed,
      digital_signature: signature,
    }),

  getPayroll: (params?: {
    user_id?: string;
    month?: number;
    year?: number;
    skip?: number;
    limit?: number;
  }) => apiGet<unknown[]>("/disciplinary/payroll", { params }),

  calculatePayroll: (data: {
    user_id: string;
    month: number;
    year: number;
    salary_base: number;
    allowances: number;
    other_deductions: number;
  }) => apiPost<unknown>("/disciplinary/payroll/calculate", data),
};

/* ═══════════════ KPI ═══════════════ */

export const kpiService = {
  getRecords: (params?: {
    user_id?: string;
    month?: number;
    year?: number;
    skip?: number;
    limit?: number;
  }) => apiGet<unknown[]>("/kpi/records", { params }),

  createRecord: (data: unknown) =>
    apiPost<unknown>("/kpi/records", data),

  getDepartmentTargets: (params?: { department?: string }) =>
    apiGet<unknown[]>("/kpi/department-targets", { params }),

  createDepartmentTarget: (data: unknown) =>
    apiPost<unknown>("/kpi/department-targets", data),

  getDashboard: (params: { month: number; year: number }) =>
    apiGet<unknown>("/kpi/dashboard", { params }),
};

/* ═══════════════ SYNC ═══════════════ */

export const syncService = {
  push: (data: {
    table_name: string;
    records: unknown[];
    device_id: string;
  }) => apiPost<unknown>("/sync/push", data),

  pull: (params: {
    table_name: string;
    last_sync?: string;
    device_id: string;
  }) => apiGet<unknown>("/sync/pull", { params }),

  resolveConflict: (
    conflictId: string,
    resolution: string,
    mergedData?: unknown
  ) =>
    apiPatch<unknown>(`/sync/conflicts/${conflictId}`, {
      resolution,
      merged_data: mergedData,
    }),

  registerDevice: (data: { device_id: string; device_name: string }) =>
    apiPost<unknown>("/sync/devices", data),

  getDevices: () => apiGet<unknown[]>("/sync/devices"),
};
