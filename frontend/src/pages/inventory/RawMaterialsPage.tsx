import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface RawMaterial {
  id: string;
  item_id: string;
  name: string;
  batch_number: string;
  supplier: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  expiry_date: string | null;
  date_received: string;
  warehouse_location: string | null;
  sync_status: string;
}

interface RawMaterialForm {
  item_id: string;
  name: string;
  batch_number: string;
  supplier: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  expiry_date: string;
  date_received: string;
  warehouse_location: string;
  notes: string;
}

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RawMaterialForm>();

  const quantity = watch('quantity');
  const costPerUnit = watch('cost_per_unit');

  useEffect(() => {
    if (quantity && costPerUnit) {
      setValue('total_cost', Math.round(quantity * costPerUnit * 100) / 100);
    }
  }, [quantity, costPerUnit, setValue]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<RawMaterial[]>('/inventory/raw-materials');
      setMaterials(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: RawMaterialForm) => {
    try {
      setSubmitting(true);
      await apiPost('/inventory/raw-materials', {
        item_id: data.item_id,
        name: data.name,
        batch_number: data.batch_number,
        supplier: data.supplier,
        quantity: data.quantity,
        unit: data.unit || 'kg',
        cost_per_unit: data.cost_per_unit,
        total_cost: data.total_cost,
        expiry_date: data.expiry_date || null,
        date_received: data.date_received,
        warehouse_location: data.warehouse_location || null,
        notes: data.notes || null,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save material');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Raw Materials"
        subtitle="Track incoming raw materials with batch and supplier info"
        action={<Button onClick={() => setShowModal(true)}>+ Add Material</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
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
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No raw materials yet. Click "+ Add Material" to get started.</td></tr>
              ) : materials.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{m.name}</td>
                  <td className="py-3 px-4 text-gray-600">{m.batch_number}</td>
                  <td className="py-3 px-4 text-gray-600">{m.supplier}</td>
                  <td className="py-3 px-4 text-right">{m.quantity} {m.unit}</td>
                  <td className="py-3 px-4 text-right">KES {m.total_cost.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{m.expiry_date ?? ''}</td>
                  <td className="py-3 px-4"><Badge color={m.sync_status === 'synced' ? 'green' : 'yellow'}>{m.sync_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Raw Material">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
              <input {...register('item_id', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. RM-001" />
              {errors.item_id && <p className="text-xs text-red-600 mt-1">{errors.item_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
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
              <input type="number" step="0.01" {...register('quantity', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input {...register('unit')} defaultValue="kg" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="kg, pcs, L" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Unit</label>
              <input type="number" step="0.01" {...register('cost_per_unit', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (auto)</label>
              <input type="number" step="0.01" {...register('total_cost', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
              <input type="date" {...register('date_received', { required: 'Required' })} defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" {...register('expiry_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Location</label>
              <input {...register('warehouse_location')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Material'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
