import { PageHeader, Card, StatCard } from '@/components/ui';
import { BarChart3, TrendingUp, Users, ShieldCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

const monthlyData = [
  { month: 'Sep', revenue: 4200000, compliance: 88, operational: 82 },
  { month: 'Oct', revenue: 4800000, compliance: 91, operational: 85 },
  { month: 'Nov', revenue: 5100000, compliance: 87, operational: 88 },
  { month: 'Dec', revenue: 5500000, compliance: 93, operational: 90 },
  { month: 'Jan', revenue: 5900000, compliance: 95, operational: 91 },
  { month: 'Feb', revenue: 4100000, compliance: 92, operational: 89 },
];

const staffKPIs = [
  { name: 'J. Mwangi', role: 'Factory Supervisor', performance: 92, revenue: 0, compliance: 95, operational: 89 },
  { name: 'K. Ochieng', role: 'Sales Manager', performance: 87, revenue: 5900000, compliance: 88, operational: 85 },
  { name: 'S. Njeri', role: 'Marketer', performance: 78, revenue: 1200000, compliance: 72, operational: 83 },
  { name: 'A. Wanjiku', role: 'Customer Care', performance: 65, revenue: 0, compliance: 55, operational: 75 },
];

export default function KPIDashboardPage() {
  const avgPerformance = Math.round(staffKPIs.reduce((a, s) => a + s.performance, 0) / staffKPIs.length);

  return (
    <div>
      <PageHeader
        title="KPI Dashboard"
        subtitle="Performance Score = Revenue(40%) + Compliance(30%) + Operational(30%)"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Avg Performance" value={`${avgPerformance}%`} icon={<BarChart3 size={20} />} changeType={avgPerformance >= 80 ? 'positive' : 'negative'} change={avgPerformance >= 80 ? 'On target' : 'Below target'} />
        <StatCard label="Total Revenue (Feb)" value="KES 4.1M" icon={<TrendingUp size={20} />} change="-30% from Jan" changeType="negative" />
        <StatCard label="Compliance Rate" value="92%" icon={<ShieldCheck size={20} />} change="+4% from last month" changeType="positive" />
        <StatCard label="Active Staff" value={staffKPIs.length} icon={<Users size={20} />} />
      </div>

      {/* Revenue Chart */}
      <Card title="Monthly Revenue Trend" className="mb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Compliance & Operational Trend */}
      <Card title="Compliance & Operational Scores" className="mb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="compliance" stroke="#16a34a" strokeWidth={2} name="Compliance %" />
              <Line type="monotone" dataKey="operational" stroke="#2563eb" strokeWidth={2} name="Operational %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Staff KPI Table */}
      <Card title="Individual Performance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Staff</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Performance</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Revenue</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Compliance</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Operational</th>
              </tr>
            </thead>
            <tbody>
              {staffKPIs.map((s) => (
                <tr key={s.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 px-4 text-gray-600">{s.role}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-semibold ${s.performance >= 80 ? 'text-green-600' : s.performance >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {s.performance}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{s.revenue > 0 ? `KES ${(s.revenue / 1000000).toFixed(1)}M` : '—'}</td>
                  <td className="py-3 px-4 text-right">{s.compliance}%</td>
                  <td className="py-3 px-4 text-right">{s.operational}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
