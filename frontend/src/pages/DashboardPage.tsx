import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { PageHeader, StatCard, Card } from '@/components/ui';
import {
  Package,
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { isOnline, pendingCount, lastSyncTime } = useSyncStore();

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Pending Sync"
          value={pendingCount}
          icon={<Package size={20} />}
          changeType={pendingCount > 0 ? 'negative' : 'positive'}
          change={pendingCount === 0 ? 'All synced' : 'Needs sync'}
        />
        <StatCard
          label="Daily Log Status"
          value="—"
          icon={<ClipboardList size={20} />}
          change="Submit your daily log"
        />
        <StatCard
          label="Open Orders"
          value="—"
          icon={<ShoppingCart size={20} />}
          change="View all orders"
        />
        <StatCard
          label="Alerts"
          value="—"
          icon={<AlertTriangle size={20} />}
          change="No active alerts"
          changeType="positive"
        />
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Submit Daily Log', href: '/asal/daily-log' },
            { label: 'New Order', href: '/sales/orders' },
            { label: 'Record Production', href: '/inventory/production' },
            { label: 'View KPIs', href: '/kpi' },
          ].map((a) => (
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
