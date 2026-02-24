import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface DailyLogForm {
  date: string;
  activities: string;
  challenges: string;
  outcomes: string;
}

const mockLogs = [
  { id: '1', date: '2026-02-21', status: 'submitted', activities: 'Supervised production of Paracetamol batch PB-003. Conducted quality checks.', submitted_at: '2026-02-21 17:30', sync_status: 'synced' },
  { id: '2', date: '2026-02-20', status: 'submitted', activities: 'Received raw materials from PharmaChem. Updated inventory records.', submitted_at: '2026-02-20 18:00', sync_status: 'synced' },
  { id: '3', date: '2026-02-19', status: 'missed', activities: null, submitted_at: null, sync_status: 'synced' },
];

export default function DailyLogPage() {
  const user = useAuthStore((s) => s.user);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DailyLogForm>();

  const today = new Date().toISOString().split('T')[0];
  const todayLog = mockLogs.find((l) => l.date === today);

  const onSubmit = (data: DailyLogForm) => {
    console.log('Daily log submitted:', { ...data, user_id: user?.id });
    reset();
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="ASAL Daily Log"
        subtitle="Submit your daily activity log — required every weekday"
        action={
          !todayLog ? (
            <Button onClick={() => setShowModal(true)}>+ Submit Today's Log</Button>
          ) : (
            <Badge color="green">Today's log submitted</Badge>
          )
        }
      />

      {!todayLog && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          You haven't submitted today's daily log yet. Missing 2+ consecutive logs triggers a disciplinary query.
        </div>
      )}

      <Card title="Recent Daily Logs">
        <div className="space-y-3">
          {mockLogs.map((l) => (
            <div key={l.id} className={`p-4 rounded-lg border ${
              l.status === 'missed' ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{l.date}</span>
                  <Badge color={l.status === 'submitted' ? 'green' : 'red'}>{l.status}</Badge>
                </div>
                {l.submitted_at && (
                  <span className="text-xs text-gray-500">Submitted: {l.submitted_at}</span>
                )}
              </div>
              {l.activities ? (
                <p className="text-sm text-gray-600">{l.activities}</p>
              ) : (
                <p className="text-sm text-red-600 italic">No log submitted — marked as missed</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit Daily Log">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" {...register('date', { required: true })} defaultValue={today} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activities Performed</label>
            <textarea {...register('activities', { required: 'Please describe your activities' })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Describe all tasks and activities completed today..." />
            {errors.activities && <p className="text-xs text-red-600 mt-1">{errors.activities.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenges / Blockers</label>
            <textarea {...register('challenges')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Any issues encountered..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Outcomes</label>
            <textarea {...register('outcomes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Results achieved..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Submit Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
