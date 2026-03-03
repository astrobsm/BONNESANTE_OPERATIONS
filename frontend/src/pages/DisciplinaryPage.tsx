import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge } from '@/components/ui';
import { apiGet } from '@/services/api';

interface DisciplinaryRecord {
  id: string;
  record_id: string;
  user_id: string;
  query_type: string;
  status: string;
  consecutive_count: number;
  payroll_deduction_percentage: number;
  privileges_locked: boolean;
  notes: string | null;
  created_at: string;
}

interface Payroll {
  id: string;
  payroll_id: string;
  user_id: string;
  month: number;
  year: number;
  salary_base: number;
  deductions: number;
  net_pay: number;
  status: string;
  created_at: string;
}

export default function DisciplinaryPage() {
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async () => {
    try {
      setLoadingRecords(true);
      const data = await apiGet<DisciplinaryRecord[]>('/disciplinary/records');
      setRecords(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load disciplinary records');
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  const fetchPayroll = useCallback(async () => {
    try {
      setLoadingPayroll(true);
      const data = await apiGet<Payroll[]>('/disciplinary/payroll');
      setPayroll(data);
    } catch (err: any) {
      setError(prev => prev || (err?.response?.data?.detail || 'Failed to load payroll'));
    } finally {
      setLoadingPayroll(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); fetchPayroll(); }, [fetchRecords, fetchPayroll]);

  return (
    <div>
      <PageHeader title="Disciplinary & Payroll" subtitle="Track queries, deductions, privilege locks, and payroll impact" />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Disciplinary Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Record ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Count</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Deduction %</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Locked</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingRecords ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">No disciplinary records.</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{r.record_id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.user_id}</td>
                  <td className="py-3 px-4">{r.query_type}</td>
                  <td className="py-3 px-4 text-right">{r.consecutive_count}</td>
                  <td className="py-3 px-4 text-right font-semibold text-red-600">{r.payroll_deduction_percentage}%</td>
                  <td className="py-3 px-4"><Badge color={r.privileges_locked ? 'red' : 'green'}>{r.privileges_locked ? 'Yes' : 'No'}</Badge></td>
                  <td className="py-3 px-4"><Badge color={r.status === 'resolved' ? 'green' : r.status === 'escalated' ? 'red' : 'yellow'}>{r.status}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Payroll ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Period</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Base Salary</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Deductions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Net Pay</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingPayroll ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : payroll.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No payroll records.</td></tr>
              ) : payroll.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{p.payroll_id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.user_id}</td>
                  <td className="py-3 px-4">{p.month}/{p.year}</td>
                  <td className="py-3 px-4 text-right">KES {p.salary_base.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-600">KES {p.deductions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-700">KES {p.net_pay.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge color={p.status === 'paid' ? 'green' : p.status === 'pending' ? 'yellow' : 'red'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
