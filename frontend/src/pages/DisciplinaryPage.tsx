import { PageHeader, Card, Badge } from '@/components/ui';

const mockRecords = [
  { id: '1', employee: 'A. Wanjiku', query_type: 'missed_daily_log', consecutive_count: 3, status: 'pending_acknowledgement', deduction_pct: 0, created_at: '2026-02-20', privileges_locked: true },
  { id: '2', employee: 'P. Kimani', query_type: 'late_weekly_plan', consecutive_count: 1, status: 'acknowledged', deduction_pct: 5, created_at: '2026-02-15', privileges_locked: false },
  { id: '3', employee: 'M. Odhiambo', query_type: 'late_weekly_report', consecutive_count: 2, status: 'appealed', deduction_pct: 20, created_at: '2026-02-10', privileges_locked: false },
];

const mockPayroll = [
  { id: '1', employee: 'P. Kimani', month: 'February 2026', base: 85000, allowances: 15000, compliance_deduction: 5000, net: 95000, status: 'pending_approval' },
  { id: '2', employee: 'All Staff', month: 'January 2026', base: null, allowances: null, compliance_deduction: null, net: null, status: 'approved' },
];

export default function DisciplinaryPage() {
  const statusColor = (s: string) => {
    switch (s) {
      case 'pending_acknowledgement': return 'yellow';
      case 'acknowledged': return 'blue';
      case 'appealed': return 'blue';
      case 'resolved': return 'green';
      case 'termination_flagged': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div>
      <PageHeader
        title="Disciplinary Records"
        subtitle="Auto-generated compliance queries and payroll deduction tracking"
      />

      {/* Disciplinary Queries */}
      <Card title="Active Queries" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Count</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Deduction</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Locked</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockRecords.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{r.employee}</td>
                  <td className="py-3 px-4 text-gray-600">{r.query_type.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-4 text-center font-semibold">{r.consecutive_count}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(r.status)}>{r.status.replace(/_/g, ' ')}</Badge></td>
                  <td className="py-3 px-4 text-right">{r.deduction_pct}%</td>
                  <td className="py-3 px-4 text-center">
                    {r.privileges_locked ? <Badge color="red">Yes</Badge> : <Badge color="green">No</Badge>}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payroll Impact */}
      <Card title="Payroll (Compliance Deductions)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Month</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Base</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Allowances</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Deduction</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Net</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockPayroll.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{p.employee}</td>
                  <td className="py-3 px-4 text-gray-600">{p.month}</td>
                  <td className="py-3 px-4 text-right">{p.base ? `KES ${p.base.toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4 text-right">{p.allowances ? `KES ${p.allowances.toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4 text-right text-red-600">{p.compliance_deduction ? `KES ${p.compliance_deduction.toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4 text-right font-semibold">{p.net ? `KES ${p.net.toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4">
                    <Badge color={p.status === 'approved' ? 'green' : 'yellow'}>{p.status.replace('_', ' ')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
