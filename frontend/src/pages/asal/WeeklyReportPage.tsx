import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface WeeklyReportForm {
  week_start: string;
  objectives_achieved: string;
  financial_impact: string;
  inventory_impact: string;
  deviations: string;
}

const mockReports = [
  { id: '1', week: '2026-02-10', submitted_at: '2026-02-14 16:45', is_late: false, objectives_achieved: '1. Completed PB-003 production\n2. Quality audit passed\n3. Staff training 80% done', financial_impact: 'KES 1.2M revenue from batch sales', deviations: 'Training delayed 1 day due to equipment maintenance' },
];

export default function WeeklyReportPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WeeklyReportForm>();

  const onSubmit = (data: WeeklyReportForm) => {
    console.log('Weekly report:', data);
    reset();
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Weekly Report"
        subtitle="Submit your weekly performance report by Friday 7:00 PM"
        action={<Button onClick={() => setShowModal(true)}>+ Submit Report</Button>}
      />

      <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
        Deadline: Friday 7:00 PM. Reports should reference your weekly plan objectives.
      </div>

      <div className="space-y-4">
        {mockReports.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Week of {r.week}</span>
                <Badge color={r.is_late ? 'red' : 'green'}>{r.is_late ? 'Late' : 'On time'}</Badge>
              </div>
              <span className="text-xs text-gray-500">Submitted: {r.submitted_at}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Objectives Achieved:</p>
                <p className="text-gray-600 whitespace-pre-line">{r.objectives_achieved}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Financial Impact:</p>
                <p className="text-gray-600">{r.financial_impact}</p>
              </div>
              {r.deviations && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Deviations:</p>
                  <p className="text-gray-600">{r.deviations}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit Weekly Report">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Starting (Monday)</label>
            <input type="date" {...register('week_start', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objectives Achieved</label>
            <textarea {...register('objectives_achieved', { required: 'Required' })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Map back to your weekly plan objectives..." />
            {errors.objectives_achieved && <p className="text-xs text-red-600 mt-1">{errors.objectives_achieved.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Financial Impact</label>
            <textarea {...register('financial_impact')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Revenue, cost savings, etc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Impact</label>
            <textarea {...register('inventory_impact')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deviations & Explanations</label>
            <textarea {...register('deviations')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Any deviations from plan and reasons..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Submit Report</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
