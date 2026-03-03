import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge } from '@/components/ui';
import { apiGet } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface KPIDashboard {
  individual_kpis: any[];
  department_summaries: any[];
  revenue_analytics: any;
  risk_alerts: any[];
}

interface KPIRecord {
  id: string;
  user_id: string;
  month: number;
  year: number;
  score: number;
  department: string;
  metrics: any;
  created_at: string;
}

export default function KPIDashboardPage() {
  const [dashboard, setDashboard] = useState<KPIDashboard | null>(null);
  const [records, setRecords] = useState<KPIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dash, recs] = await Promise.all([
        apiGet<KPIDashboard>('/kpi/dashboard/' + month + '/' + year).catch(() => null),
        apiGet<KPIRecord[]>('/kpi/records').catch(() => []),
      ]);
      setDashboard(dash);
      setRecords(recs);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deptScores = records.reduce((acc, r) => {
    const key = r.department || 'Unknown';
    if (!acc[key]) acc[key] = { department: key, totalScore: 0, count: 0 };
    acc[key].totalScore += r.score;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { department: string; totalScore: number; count: number }>);
  const chartData = Object.values(deptScores).map(d => ({ department: d.department, avgScore: Math.round(d.totalScore / d.count) }));

  return (
    <div>
      <PageHeader title="KPI Dashboard" subtitle="Performance metrics, department summaries, and risk alerts" />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2024, m-1).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {[2023,2024,2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading KPI data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <p className="text-xs text-gray-500 uppercase">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{records.length}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500 uppercase">Average Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{records.length > 0 ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0}%</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500 uppercase">Departments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{new Set(records.map(r => r.department)).size}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500 uppercase">Risk Alerts</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{dashboard?.risk_alerts?.length || 0}</p>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Score by Department</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Records table */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">KPI Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Period</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No KPI records for this period.</td></tr>
                  ) : records.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.user_id}</td>
                      <td className="py-3 px-4">{r.department}</td>
                      <td className="py-3 px-4">{r.month}/{r.year}</td>
                      <td className="py-3 px-4 text-right"><Badge color={r.score >= 80 ? 'green' : r.score >= 60 ? 'yellow' : 'red'}>{r.score}%</Badge></td>
                      <td className="py-3 px-4 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
