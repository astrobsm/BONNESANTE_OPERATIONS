import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface RawMaterialForm {
  item_name: string;
  batch_number: string;
  supplier: string;
  quantity_received: number;
  unit: string;
  cost_per_unit: number;
  expiry_date: string;
}

// Placeholder data — will be replaced by Dexie queries + API sync
const mockMaterials = [
  { id: '1', item_name: 'Paracetamol API', batch_number: 'B-2026-001', supplier: 'PharmaChem', quantity_received: 500, unit: 'kg', cost_per_unit: 120, total_cost: 60000, expiry_date: '2027-06-15', sync_status: 'synced' },
  { id: '2', item_name: 'Gelatin Capsules', batch_number: 'B-2026-002', supplier: 'CapWorks', quantity_received: 10000, unit: 'pcs', cost_per_unit: 0.5, total_cost: 5000, expiry_date: '2027-01-20', sync_status: 'pending' },
];

export default function RawMaterialsPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RawMaterialForm>();

  const onSubmit = (data: RawMaterialForm) => {
    console.log('New raw material:', data);
    // TODO: Save to Dexie → queue sync
    reset();
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Raw Materials"
        subtitle="Track incoming raw materials with batch and supplier info"
        action={<Button onClick={() => setShowModal(true)}>+ Add Material</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Item</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Batch</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Supplier</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Cost</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Expiry</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Sync</th>
              </tr>
            </thead>
            <tbody>
              {mockMaterials.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{m.item_name}</td>
                  <td className="py-3 px-4 text-gray-600">{m.batch_number}</td>
                  <td className="py-3 px-4 text-gray-600">{m.supplier}</td>
                  <td className="py-3 px-4 text-right">{m.quantity_received} {m.unit}</td>
                  <td className="py-3 px-4 text-right">KES {m.total_cost.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{m.expiry_date}</td>
                  <td className="py-3 px-4">
                    <Badge color={m.sync_status === 'synced' ? 'green' : 'yellow'}>
                      {m.sync_status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Raw Material">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input {...register('item_name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.item_name && <p className="text-xs text-red-600 mt-1">{errors.item_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input {...register('batch_number', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input {...register('supplier', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" {...register('quantity_received', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input {...register('unit', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="kg, pcs, L" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Unit</label>
              <input type="number" step="0.01" {...register('cost_per_unit', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input type="date" {...register('expiry_date', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save Material</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
