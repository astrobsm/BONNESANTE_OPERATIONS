import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost, apiPut } from '@/services/api';

interface Transfer {
  id: string;
  transfer_id: string;
  finished_good_id: string;
  quantity: number;
  status: string;
  initiated_by: string;
  approved_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
}

interface TransferForm {
  finished_good_id: string;
  quantity: number;
  initiator_signature: string;
  notes: string;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferForm>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<Transfer[]>('/inventory/transfers');
      setTransfers(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: TransferForm) => {
    try {
      setSubmitting(true);
      await apiPost('/inventory/transfers', {
        finished_good_id: data.finished_good_id,
        quantity: data.quantity,
        initiator_signature: data.initiator_signature,
        notes: data.notes || null,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await apiPut('/inventory/transfers/' + id + '/approve', {
        approved,
        rejection_reason: approved ? null : prompt('Rejection reason:'),
      });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update transfer');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'completed' || s === 'approved') return 'green';
    if (s === 'rejected') return 'red';
    return 'yellow';
  };

  return (
    <div>
      <PageHeader
        title="Transfers"
        subtitle="Track product transfers from warehouse to market or between locations"
        action={<Button onClick={() => setShowModal(true)}>+ New Transfer</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Transfer ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Good ID</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Initiated By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : transfers.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No transfers yet. Click "+ New Transfer" to get started.</td></tr>
              ) : transfers.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{t.transfer_id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{t.finished_good_id}</td>
                  <td className="py-3 px-4 text-right">{t.quantity.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(t.status)}>{t.status}</Badge></td>
                  <td className="py-3 px-4">{t.initiated_by}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {t.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(t.id, true)} className="text-xs text-green-600 hover:underline">Approve</button>
                        <button onClick={() => handleApprove(t.id, false)} className="text-xs text-red-600 hover:underline">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Transfer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Finished Good ID</label>
            <input {...register('finished_good_id', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="UUID of finished good" />
            {errors.finished_good_id && <p className="text-xs text-red-600 mt-1">{errors.finished_good_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" {...register('quantity', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initiator Signature</label>
              <input {...register('initiator_signature', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {errors.initiator_signature && <p className="text-xs text-red-600 mt-1">{errors.initiator_signature.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Transfer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
