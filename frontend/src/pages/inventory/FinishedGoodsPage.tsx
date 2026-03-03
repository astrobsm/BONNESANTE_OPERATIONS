import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface FinishedGood {
  id: string;
  product_id: string;
  name: string;
  batch_number: string;
  quantity: number;
  unit: string;
  available_balance: number;
  unit_cost: number;
  unit_price: number;
  sync_status: string;
  created_at: string;
}

interface FinishedGoodForm {
  product_id: string;
  name: string;
  batch_number: string;
  quantity: number;
  unit: string;
  warehouse_location: string;
  unit_cost: number;
  unit_price: number;
}

export default function FinishedGoodsPage() {
  const [goods, setGoods] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FinishedGoodForm>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<FinishedGood[]>('/inventory/finished-goods');
      setGoods(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load finished goods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: FinishedGoodForm) => {
    try {
      setSubmitting(true);
      await apiPost('/inventory/finished-goods', {
        product_id: data.product_id,
        name: data.name,
        batch_number: data.batch_number,
        quantity: data.quantity,
        unit: data.unit || 'units',
        warehouse_location: data.warehouse_location || null,
        unit_cost: data.unit_cost || 0,
        unit_price: data.unit_price || 0,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save finished good');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Finished Goods"
        subtitle="Inventory of finished products with available stock balances"
        action={<Button onClick={() => setShowModal(true)}>+ Add Product</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Product ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Batch</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Produced</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Available</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Unit Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Sync</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : goods.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No finished goods yet. Click "+ Add Product" to get started.</td></tr>
              ) : goods.map((g) => (
                <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{g.product_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{g.name}</td>
                  <td className="py-3 px-4 text-gray-600">{g.batch_number}</td>
                  <td className="py-3 px-4 text-right">{g.quantity.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    <Badge color={g.available_balance < 100 ? 'red' : 'green'}>{g.available_balance.toLocaleString()}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">KES {g.unit_price.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge color={g.sync_status === 'synced' ? 'green' : 'yellow'}>{g.sync_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Finished Good">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input {...register('product_id', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. FG-001" />
              {errors.product_id && <p className="text-xs text-red-600 mt-1">{errors.product_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input {...register('batch_number', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" {...register('quantity', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input {...register('unit')} defaultValue="units" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
              <input type="number" step="0.01" {...register('unit_cost', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
              <input type="number" step="0.01" {...register('unit_price', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <input {...register('warehouse_location')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
