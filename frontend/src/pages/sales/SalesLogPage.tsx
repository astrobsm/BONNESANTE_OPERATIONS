import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface SalesLog {
  id: string;
  log_date: string;
  orders_received: number;
  orders_fulfilled: number;
  pending_deliveries: number;
  receivables_balance: number;
  notes: string | null;
  created_at: string;
}

interface SalesLogForm {
  log_date: string;
  orders_received: number;
  orders_fulfilled: number;
  pending_deliveries: number;
  receivables_balance: number;
  notes: string;
}

export default function SalesLogPage() {
  const [logs, setLogs] = useState<SalesLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SalesLogForm>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<SalesLog[]>('/sales/daily-logs');
      setLogs(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load sales logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: SalesLogForm) => {
    try {
      setSubmitting(true);
      await apiPost('/sales/daily-logs', {
        log_date: data.log_date,
        orders_received: Number(data.orders_received),
        orders_fulfilled: Number(data.orders_fulfilled),
        pending_deliveries: Number(data.pending_deliveries),
        receivables_balance: Number(data.receivables_balance),
        notes: data.notes || null,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save sales log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Daily Sales Log"
        subtitle="Record daily sales activity, fulfillment rates, and receivables"
        action={<Button onClick={() => setShowModal(true)}>+ New Log Entry</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Received</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Fulfilled</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Pending</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Receivables</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No logs yet. Click "+ New Log Entry" to get started.</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{l.log_date}</td>
                  <td className="py-3 px-4 text-right">{l.orders_received}</td>
                  <td className="py-3 px-4 text-right">{l.orders_fulfilled}</td>
                  <td className="py-3 px-4 text-right">{l.pending_deliveries}</td>
                  <td className="py-3 px-4 text-right font-semibold">KES {l.receivables_balance.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-500 truncate max-w-[200px]">{l.notes || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Sales Log">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" {...register('log_date', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.log_date && <p className="text-xs text-red-600 mt-1">{errors.log_date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orders Received</label>
              <input type="number" {...register('orders_received', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orders Fulfilled</label>
              <input type="number" {...register('orders_fulfilled', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pending Deliveries</label>
              <input type="number" {...register('pending_deliveries', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receivables Balance</label>
              <input type="number" step="0.01" {...register('receivables_balance', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Log'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
