import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal } from '@/components/ui';

interface SalesLogForm {
  date: string;
  orders_received: number;
  orders_fulfilled: number;
  total_revenue: number;
  receivables_collected: number;
  new_receivables: number;
  notes: string;
}

const mockLogs = [
  { id: '1', date: '2026-02-20', orders_received: 12, orders_fulfilled: 10, revenue: 850000, receivables_collected: 320000, new_receivables: 175000 },
  { id: '2', date: '2026-02-21', orders_received: 8, orders_fulfilled: 8, revenue: 620000, receivables_collected: 180000, new_receivables: 48000 },
];

export default function SalesLogPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm<SalesLogForm>();

  const onSubmit = (data: SalesLogForm) => {
    console.log('Daily sales log:', data);
    reset();
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Sales Daily Log"
        subtitle="Daily sales activity and receivables tracking"
        action={<Button onClick={() => setShowModal(true)}>+ Log Today</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Orders In</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Fulfilled</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Revenue (KES)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Collected (KES)</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">New Receivables</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{l.date}</td>
                  <td className="py-3 px-4 text-right">{l.orders_received}</td>
                  <td className="py-3 px-4 text-right">{l.orders_fulfilled}</td>
                  <td className="py-3 px-4 text-right font-semibold">{l.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-green-600">{l.receivables_collected.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-600">{l.new_receivables.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Daily Sales Log">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" {...register('date', { required: true })} defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orders Received</label>
              <input type="number" {...register('orders_received', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orders Fulfilled</label>
              <input type="number" {...register('orders_fulfilled', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue</label>
              <input type="number" {...register('total_revenue', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collected</label>
              <input type="number" {...register('receivables_collected', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Receivables</label>
              <input type="number" {...register('new_receivables', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
