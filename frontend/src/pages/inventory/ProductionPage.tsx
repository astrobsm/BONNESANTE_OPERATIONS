import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface ProductionForm {
  product_name: string;
  batch_number: string;
  quantity_produced: number;
  quantity_rejected: number;
  supervisor_signature: string;
  notes: string;
}

const mockProduction = [
  { id: '1', production_id: 'PRD-2026-001', product_name: 'Paracetamol 500mg', batch_number: 'PB-001', quantity_produced: 5000, quantity_rejected: 12, wastage_percent: 0.24, supervisor: 'J. Mwangi', created_at: '2026-02-20', sync_status: 'synced' },
  { id: '2', production_id: 'PRD-2026-002', product_name: 'Amoxicillin 250mg', batch_number: 'PB-002', quantity_produced: 3000, quantity_rejected: 45, wastage_percent: 1.5, supervisor: 'J. Mwangi', created_at: '2026-02-21', sync_status: 'pending' },
];

export default function ProductionPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductionForm>();

  const onSubmit = (data: ProductionForm) => {
    console.log('New production log:', data);
    reset();
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Production Logs"
        subtitle="Record production runs with output and wastage tracking"
        action={<Button onClick={() => setShowModal(true)}>+ Log Production</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Batch</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Output</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Rejected</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Wastage %</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Sync</th>
              </tr>
            </thead>
            <tbody>
              {mockProduction.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.production_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{p.product_name}</td>
                  <td className="py-3 px-4 text-gray-600">{p.batch_number}</td>
                  <td className="py-3 px-4 text-right">{p.quantity_produced.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-600">{p.quantity_rejected}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge color={p.wastage_percent > 1 ? 'red' : 'green'}>{p.wastage_percent}%</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.created_at}</td>
                  <td className="py-3 px-4">
                    <Badge color={p.sync_status === 'synced' ? 'green' : 'yellow'}>{p.sync_status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Production Run">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input {...register('product_name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.product_name && <p className="text-xs text-red-600 mt-1">{errors.product_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input {...register('batch_number', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Produced</label>
              <input type="number" {...register('quantity_produced', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Rejected</label>
              <input type="number" {...register('quantity_rejected', { valueAsNumber: true })} defaultValue={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Signature (initials)</label>
            <input {...register('supervisor_signature', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. JM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save Production Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
