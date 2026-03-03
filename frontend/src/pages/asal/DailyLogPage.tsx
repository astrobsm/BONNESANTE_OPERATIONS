import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface Activity {
  task: string;
  duration: string;
  outcome: string;
}

interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  activities: Activity[];
  key_achievements: string | null;
  challenges: string | null;
  hours_worked: number;
  status: string;
  submitted_at: string;
}

export default function DailyLogPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [activities, setActivities] = useState<Activity[]>([{ task: '', duration: '', outcome: '' }]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<DailyLog[]>('/asal/daily-logs');
      setLogs(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load daily logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addActivity = () => setActivities([...activities, { task: '', duration: '', outcome: '' }]);
  const removeActivity = (i: number) => setActivities(activities.filter((_, idx) => idx !== i));
  const updateActivity = (i: number, field: keyof Activity, value: string) => {
    const updated = [...activities];
    updated[i][field] = value;
    setActivities(updated);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDate) { alert('Date is required'); return; }
    if (activities.some(a => !a.task)) { alert('All activities must have a task'); return; }
    try {
      setSubmitting(true);
      await apiPost('/asal/daily-logs', {
        log_date: logDate,
        activities,
        key_achievements: achievements || null,
        challenges: challenges || null,
        hours_worked: Number(hoursWorked),
      });
      setLogDate('');
      setActivities([{ task: '', duration: '', outcome: '' }]);
      setAchievements('');
      setChallenges('');
      setHoursWorked(8);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit daily log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="ASAL Daily Logs"
        subtitle="Record daily activities, achievements, and working hours"
        action={<Button onClick={() => setShowModal(true)}>+ New Log</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Hours</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Activities</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Achievements</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No daily logs yet. Click "+ New Log" to get started.</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{l.log_date}</td>
                  <td className="py-3 px-4 text-right">{l.hours_worked}h</td>
                  <td className="py-3 px-4 text-right">{Array.isArray(l.activities) ? l.activities.length : 0}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-[200px]">{l.key_achievements || ''}</td>
                  <td className="py-3 px-4"><Badge color={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : 'yellow'}>{l.status}</Badge></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(l.submitted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Daily Log">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
              <input type="number" value={hoursWorked} onChange={e => setHoursWorked(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activities</label>
            {activities.map((a, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input value={a.task} onChange={e => updateActivity(i, 'task', e.target.value)} className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Task description" />
                <input value={a.duration} onChange={e => updateActivity(i, 'duration', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Duration" />
                <div className="flex gap-1">
                  <input value={a.outcome} onChange={e => updateActivity(i, 'outcome', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Outcome" />
                  {activities.length > 1 && <button type="button" onClick={() => removeActivity(i)} className="text-red-500 text-xs px-1">X</button>}
                </div>
              </div>
            ))}
            <button type="button" onClick={addActivity} className="text-sm text-blue-600 hover:underline">+ Add Activity</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
            <textarea value={achievements} onChange={e => setAchievements(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenges</label>
            <textarea value={challenges} onChange={e => setChallenges(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Log'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
