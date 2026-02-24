import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface TransferForm {
  product_name: string;
  quantity: number;
  from_location: string;
  to_location: string;
  initiator_signature: string;
  reason: string;
}

const mockTransfers = [
  { id: '1', transfer_id: 'TRF-001', product: 'Paracetamol 500mg x100', quantity: 200, from: 'Factory', to: 'Sales Depot', initiated_by: 'K. Ochieng', approved_by: 'J. Mwangi', status: 'approved', created_at: '2026-02-20' },
  { id: '2', transfer_id: 'TRF-002', product: 'Amoxicillin 250mg x50', quantity: 100, from: 'Factory', to: 'Sales Depot', initiated_by: 'K. Ochieng', approved_by: null, status: 'pending_approval', created_at: '2026-02-22' },
];

export default function TransfersPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferForm>();

  const onSubmit = (data: TransferForm) => {
    console.log('New transfer:', data);
    reset();
    setShowModal(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending_approval': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory Transfers"
        subtitle="Dual-authorization transfers between factory and sales"
        action={<Button onClick={() => setShowModal(true)}>+ Initiate Transfer</Button>}
      />

      <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
        Transfers require dual authorization: initiated by Sales Manager, approved by Factory Supervisor.
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Transfer ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Route</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Initiated By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Approved By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockTransfers.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{t.transfer_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{t.product}</td>
                  <td className="py-3 px-4 text-right">{t.quantity}</td>
                  <td className="py-3 px-4 text-gray-600">{t.from} → {t.to}</td>
                  <td className="py-3 px-4 text-gray-600">{t.initiated_by}</td>
                  <td className="py-3 px-4 text-gray-600">{t.approved_by ?? '—'}</td>
                  <td className="py-3 px-4">
                    <Badge color={statusColor(t.status)}>{t.status.replace('_', ' ')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Initiate Transfer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <input {...register('product_name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.product_name && <p className="text-xs text-red-600 mt-1">{errors.product_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" {...register('quantity', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Signature</label>
              <input {...register('initiator_signature', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Initials" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select {...register('from_location')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="Factory">Factory</option>
                <option value="Sales Depot">Sales Depot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select {...register('to_location')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="Sales Depot">Sales Depot</option>
                <option value="Factory">Factory</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea {...register('reason')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Submit for Approval</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
