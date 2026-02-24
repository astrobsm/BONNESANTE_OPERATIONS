import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface WeeklyPlanForm {
  week_start: string;
  objectives: string;
  kpi_targets: string;
  resources_needed: string;
}

const mockPlans = [
  { id: '1', week: '2026-02-17', status: 'submitted', submitted_at: '2026-02-16 18:30', is_late: false, objectives: '1. Complete production batch PB-004\n2. Conduct quality audit\n3. Train new staff on SOPs' },
  { id: '2', week: '2026-02-10', status: 'submitted', submitted_at: '2026-02-10 09:15', is_late: true, objectives: '1. Process pending orders\n2. Inventory reconciliation' },
];

export default function WeeklyPlanPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WeeklyPlanForm>();

  const onSubmit = (data: WeeklyPlanForm) => {
    console.log('Weekly plan:', data);
    reset();
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Weekly Plan"
        subtitle="Submit SMART objectives by Sunday 7:00 PM each week"
        action={<Button onClick={() => setShowModal(true)}>+ Submit Plan</Button>}
      />

      <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
        Deadline: Sunday 7:00 PM. Late submissions are flagged and affect compliance score.
      </div>

      <div className="space-y-4">
        {mockPlans.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Week of {p.week}</span>
                <Badge color={p.is_late ? 'red' : 'green'}>{p.is_late ? 'Late' : 'On time'}</Badge>
              </div>
              <span className="text-xs text-gray-500">Submitted: {p.submitted_at}</span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{p.objectives}</div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit Weekly Plan">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Starting (Monday)</label>
            <input type="date" {...register('week_start', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMART Objectives</label>
            <textarea {...register('objectives', { required: 'Please list your objectives' })} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="1. Specific, Measurable, Achievable, Relevant, Time-bound objectives..." />
            {errors.objectives && <p className="text-xs text-red-600 mt-1">{errors.objectives.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KPI Targets</label>
            <textarea {...register('kpi_targets')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Revenue target, compliance goals, etc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resources Needed</label>
            <textarea {...register('resources_needed')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Submit Plan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
