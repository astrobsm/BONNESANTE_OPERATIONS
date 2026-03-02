import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { PageHeader, StatCard, Card } from '@/components/ui';
import api from '@/services/api';
import {
  Package,
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  Wifi,
  WifiOff,
  Users,
  UserCheck,
  UserX,
  Activity,
} from 'lucide-react';

interface DashboardStats {
  role: string;
  total_users?: number;
  active_users?: number;
  inactive_users?: number;
  users_by_role?: Record<string, number>;
  recent_logins_7d?: number;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isOnline, pendingCount, lastSyncTime } = useSyncStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get('/auth/dashboard-stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'hr_management';

  // Role-specific quick actions
  const quickActions = (() => {
    const base = [{ label: 'Submit Daily Log', href: '/asal/daily-log' }];
    switch (user?.role) {
      case 'admin':
      case 'hr_management':
        return [...base,
          { label: 'Manage Users', href: '/users' },
          { label: 'KPI Dashboard', href: '/kpi' },
          { label: 'Disciplinary', href: '/disciplinary' },
        ];
      case 'sales_manager':
        return [...base,
          { label: 'New Order', href: '/sales/orders' },
          { label: 'Customers', href: '/sales/customers' },
          { label: 'View KPIs', href: '/kpi' },
        ];
      case 'factory_supervisor':
        return [...base,
          { label: 'Record Production', href: '/inventory/production' },
          { label: 'Raw Materials', href: '/inventory/raw-materials' },
          { label: 'Transfers', href: '/inventory/transfers' },
        ];
      case 'marketer':
        return [...base,
          { label: 'Campaigns', href: '/marketing/campaigns' },
          { label: 'Feedback', href: '/marketing/feedback' },
          { label: 'Weekly Plan', href: '/asal/weekly-plan' },
        ];
      case 'customer_care':
        return [...base,
          { label: 'Feedback', href: '/marketing/feedback' },
          { label: 'Weekly Report', href: '/asal/weekly-report' },
          { label: 'Weekly Plan', href: '/asal/weekly-plan' },
        ];
      default:
        return [...base,
          { label: 'Weekly Plan', href: '/asal/weekly-plan' },
          { label: 'Weekly Report', href: '/asal/weekly-report' },
        ];
    }
  })();

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.full_name ?? 'User'}`}
        subtitle={`Role: ${user?.role?.replace('_', ' ') ?? 'N/A'} | ${
          isOnline ? 'Online' : 'Offline Mode'
        }`}
      />

      {/* Sync Status */}
      <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
        isOnline ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
      }`}>
        {isOnline ? <Wifi className="text-green-600" size={20} /> : <WifiOff className="text-amber-600" size={20} />}
        <div>
          <p className={`text-sm font-medium ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>
            {isOnline ? 'Connected — data syncing' : 'Offline — changes saved locally'}
          </p>
          <p className="text-xs text-gray-500">
            {pendingCount > 0 && `${pendingCount} pending changes. `}
            {lastSyncTime && `Last sync: ${new Date(lastSyncTime).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Admin / HR Stats */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Users" value={stats.total_users ?? 0} icon={<Users size={20} />} change="All registered users" />
          <StatCard label="Active Users" value={stats.active_users ?? 0} icon={<UserCheck size={20} />} changeType="positive" change="Currently active" />
          <StatCard label="Inactive Users" value={stats.inactive_users ?? 0} icon={<UserX size={20} />} changeType={stats.inactive_users ? 'negative' : 'positive'} change="Deactivated accounts" />
          <StatCard label="Logins (7 days)" value={stats.recent_logins_7d ?? 0} icon={<Activity size={20} />} change="Last 7 days" />
        </div>
      )}

      {/* Admin Role Breakdown */}
      {isAdmin && stats?.users_by_role && (
        <Card title="Users by Role" className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.users_by_role).map(([role, count]) => (
              <div key={role} className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-2xl font-bold text-brand-600">{count}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{role.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* General Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Pending Sync"
          value={pendingCount}
          icon={<Package size={20} />}
          changeType={pendingCount > 0 ? 'negative' : 'positive'}
          change={pendingCount === 0 ? 'All synced' : 'Needs sync'}
        />
        <StatCard label="Daily Log Status" value="—" icon={<ClipboardList size={20} />} change="Submit your daily log" />
        <StatCard label="Open Orders" value="—" icon={<ShoppingCart size={20} />} change="View all orders" />
        <StatCard label="Alerts" value="—" icon={<AlertTriangle size={20} />} change="No active alerts" changeType="positive" />
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="block p-4 text-center rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-sm font-medium text-gray-700"
            >
              {a.label}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
