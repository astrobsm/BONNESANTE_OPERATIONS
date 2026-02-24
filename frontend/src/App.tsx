import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import RawMaterialsPage from '@/pages/inventory/RawMaterialsPage';
import ProductionPage from '@/pages/inventory/ProductionPage';
import FinishedGoodsPage from '@/pages/inventory/FinishedGoodsPage';
import TransfersPage from '@/pages/inventory/TransfersPage';
import CustomersPage from '@/pages/sales/CustomersPage';
import OrdersPage from '@/pages/sales/OrdersPage';
import SalesLogPage from '@/pages/sales/SalesLogPage';
import CampaignsPage from '@/pages/marketing/CampaignsPage';
import FeedbackPage from '@/pages/marketing/FeedbackPage';
import DailyLogPage from '@/pages/asal/DailyLogPage';
import WeeklyPlanPage from '@/pages/asal/WeeklyPlanPage';
import WeeklyReportPage from '@/pages/asal/WeeklyReportPage';
import DisciplinaryPage from '@/pages/DisciplinaryPage';
import KPIDashboardPage from '@/pages/KPIDashboardPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="inventory/raw-materials" element={<RawMaterialsPage />} />
          <Route path="inventory/production" element={<ProductionPage />} />
          <Route path="inventory/finished-goods" element={<FinishedGoodsPage />} />
          <Route path="inventory/transfers" element={<TransfersPage />} />
          <Route path="sales/customers" element={<CustomersPage />} />
          <Route path="sales/orders" element={<OrdersPage />} />
          <Route path="sales/daily-log" element={<SalesLogPage />} />
          <Route path="marketing/campaigns" element={<CampaignsPage />} />
          <Route path="marketing/feedback" element={<FeedbackPage />} />
          <Route path="asal/daily-log" element={<DailyLogPage />} />
          <Route path="asal/weekly-plan" element={<WeeklyPlanPage />} />
          <Route path="asal/weekly-report" element={<WeeklyReportPage />} />
          <Route path="disciplinary" element={<DisciplinaryPage />} />
          <Route path="kpi" element={<KPIDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
