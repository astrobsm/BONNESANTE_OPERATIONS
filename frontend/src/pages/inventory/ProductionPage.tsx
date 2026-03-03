import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface ProductionLog {
  id: string;
  production_id: string;
  product_name: string;
  output_quantity: number;
  output_unit: string;
  wastage_quantity: number;
  wastage_percentage: number;
  production_date: string;
  sync_status: string;
  created_at: string;
}

interface ProductionForm {
  production_id: string;
  product_name: string;
  output_quantity: number;
  output_unit: string;
  wastage_quantity: number;
  production_date: string;
  machine_used: string;
  supervisor_signature: string;
  shift: string;
  notes: string;
}

export default function ProductionPage() {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductionForm>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<ProductionLog[]>('/inventory/production-logs');
      setLogs(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load production logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: ProductionForm) => {
    try {
      setSubmitting(true);
      await apiPost('/inventory/production-logs', {
        production_id: data.production_id,
        product_name: data.product_name,
        output_quantity: data.output_quantity,
        output_unit: data.output_unit || 'units',
        wastage_quantity: data.wastage_quantity || 0,
        production_date: data.production_date,
        machine_used: data.machine_used || null,
        supervisor_signature: data.supervisor_signature || null,
        shift: data.shift || null,
        notes: data.notes || null,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save production log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Production Logs"
        subtitle="Record production runs with output and wastage tracking"
        action={<Button onClick={() => setShowModal(true)}>+ Log Production</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Output</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Wastage</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Wastage %</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Sync</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No production logs yet. Click "+ Log Production" to get started.</td></tr>
              ) : logs.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.production_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{p.product_name}</td>
                  <td className="py-3 px-4 text-right">{p.output_quantity.toLocaleString()} {p.output_unit}</td>
                  <td className="py-3 px-4 text-right text-red-600">{p.wastage_quantity}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge color={p.wastage_percentage > 1 ? 'red' : 'green'}>{p.wastage_percentage.toFixed(1)}%</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.production_date}</td>
                  <td className="py-3 px-4"><Badge color={p.sync_status === 'synced' ? 'green' : 'yellow'}>{p.sync_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Production Run">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production ID</label>
              <input {...register('production_id', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. PRD-2026-001" />
              {errors.production_id && <p className="text-xs text-red-600 mt-1">{errors.production_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input {...register('product_name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {errors.product_name && <p className="text-xs text-red-600 mt-1">{errors.product_name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Produced</label>
              <input type="number" {...register('output_quantity', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input {...register('output_unit')} defaultValue="units" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Rejected</label>
              <input type="number" {...register('wastage_quantity', { valueAsNumber: true })} defaultValue={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production Date</label>
              <input type="date" {...register('production_date', { required: 'Required' })} defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Machine Used</label>
              <input {...register('machine_used')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Signature</label>
              <input {...register('supervisor_signature')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Initials" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select {...register('shift')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select shift</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Production Log'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
