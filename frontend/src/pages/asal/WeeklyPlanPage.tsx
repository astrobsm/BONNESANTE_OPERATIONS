import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface Objective {
  title: string;
  description: string;
  measurable_target: string;
  timeline: string;
}

interface WeeklyPlan {
  id: string;
  week_start_date: string;
  objectives: Objective[];
  kpi_targets: any;
  status: string;
  submitted_at: string;
  deadline: string | null;
}

export default function WeeklyPlanPage() {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [kpiTargets, setKpiTargets] = useState('');
  const [objectives, setObjectives] = useState<Objective[]>([{ title: '', description: '', measurable_target: '', timeline: '' }]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<WeeklyPlan[]>('/asal/weekly-plans');
      setPlans(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load weekly plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addObj = () => setObjectives([...objectives, { title: '', description: '', measurable_target: '', timeline: '' }]);
  const removeObj = (i: number) => setObjectives(objectives.filter((_, idx) => idx !== i));
  const updateObj = (i: number, field: keyof Objective, value: string) => {
    const updated = [...objectives];
    updated[i][field] = value;
    setObjectives(updated);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStart) { alert('Week start date is required'); return; }
    if (objectives.some(o => !o.title)) { alert('All objectives must have a title'); return; }
    try {
      setSubmitting(true);
      let parsedKpi = {};
      try { parsedKpi = kpiTargets ? JSON.parse(kpiTargets) : {}; } catch { parsedKpi = { raw: kpiTargets }; }
      await apiPost('/asal/weekly-plans', {
        week_start_date: weekStart,
        objectives,
        kpi_targets: parsedKpi,
      });
      setWeekStart('');
      setObjectives([{ title: '', description: '', measurable_target: '', timeline: '' }]);
      setKpiTargets('');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit weekly plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="ASAL Weekly Plans"
        subtitle="Set weekly objectives, targets, and KPI goals"
        action={<Button onClick={() => setShowModal(true)}>+ New Plan</Button>}
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Deadline</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No weekly plans yet. Click "+ New Plan" to get started.</td></tr>
              ) : plans.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{p.week_start_date}</td>
                  <td className="py-3 px-4 text-right">{Array.isArray(p.objectives) ? p.objectives.length : 0}</td>
                  <td className="py-3 px-4"><Badge color={p.status === 'approved' ? 'green' : p.status === 'rejected' ? 'red' : 'yellow'}>{p.status}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{p.deadline || ''}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(p.submitted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Weekly Plan">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
            <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
            {objectives.map((o, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2 space-y-2">
                <div className="flex gap-2">
                  <input value={o.title} onChange={e => updateObj(i, 'title', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Title" />
                  <input value={o.timeline} onChange={e => updateObj(i, 'timeline', e.target.value)} className="w-28 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Timeline" />
                  {objectives.length > 1 && <button type="button" onClick={() => removeObj(i)} className="text-red-500 text-xs px-1">X</button>}
                </div>
                <input value={o.description} onChange={e => updateObj(i, 'description', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Description" />
                <input value={o.measurable_target} onChange={e => updateObj(i, 'measurable_target', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Measurable target" />
              </div>
            ))}
            <button type="button" onClick={addObj} className="text-sm text-blue-600 hover:underline">+ Add Objective</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KPI Targets (JSON or text)</label>
            <textarea value={kpiTargets} onChange={e => setKpiTargets(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder='e.g. {"revenue": 100000, "customers": 10}' />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Plan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
