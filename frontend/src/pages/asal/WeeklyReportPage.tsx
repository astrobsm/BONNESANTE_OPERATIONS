import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface ObjectiveResult {
  objective_title: string;
  achieved: boolean;
  evidence: string;
  percentage_complete: number;
}

interface WeeklyReport {
  id: string;
  week_start_date: string;
  objectives_achieved: ObjectiveResult[];
  status: string;
  submitted_at: string;
  overall_score: number | null;
}

export default function WeeklyReportPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [results, setResults] = useState<ObjectiveResult[]>([{ objective_title: '', achieved: false, evidence: '', percentage_complete: 0 }]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<WeeklyReport[]>('/asal/weekly-reports');
      setReports(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load weekly reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addResult = () => setResults([...results, { objective_title: '', achieved: false, evidence: '', percentage_complete: 0 }]);
  const removeResult = (i: number) => setResults(results.filter((_, idx) => idx !== i));
  const updateResult = (i: number, field: string, value: any) => {
    const updated = [...results];
    (updated[i] as any)[field] = value;
    setResults(updated);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStart) { alert('Week start date is required'); return; }
    if (results.some(r => !r.objective_title)) { alert('All results must have an objective title'); return; }
    try {
      setSubmitting(true);
      await apiPost('/asal/weekly-reports', {
        week_start_date: weekStart,
        objectives_achieved: results.map(r => ({
          ...r,
          percentage_complete: Number(r.percentage_complete),
        })),
      });
      setWeekStart('');
      setResults([{ objective_title: '', achieved: false, evidence: '', percentage_complete: 0 }]);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit weekly report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="ASAL Weekly Reports"
        subtitle="Report on objective achievements and performance for the week"
        action={<Button onClick={() => setShowModal(true)}>+ New Report</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Week Start</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Objectives</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">No weekly reports yet. Click "+ New Report" to get started.</td></tr>
              ) : reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{r.week_start_date}</td>
                  <td className="py-3 px-4 text-right">{Array.isArray(r.objectives_achieved) ? r.objectives_achieved.length : 0}</td>
                  <td className="py-3 px-4"><Badge color={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'yellow'}>{r.status}</Badge></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(r.submitted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Weekly Report">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
            <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objectives Achieved</label>
            {results.map((r, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2 space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={r.objective_title} onChange={e => updateResult(i, 'objective_title', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Objective title" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={r.achieved} onChange={e => updateResult(i, 'achieved', e.target.checked)} />
                    Achieved
                  </label>
                  {results.length > 1 && <button type="button" onClick={() => removeResult(i)} className="text-red-500 text-xs px-1">X</button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={r.evidence} onChange={e => updateResult(i, 'evidence', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Evidence / notes" />
                  <input type="number" min={0} max={100} value={r.percentage_complete} onChange={e => updateResult(i, 'percentage_complete', Number(e.target.value))} className="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="% complete" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addResult} className="text-sm text-blue-600 hover:underline">+ Add Objective</button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
