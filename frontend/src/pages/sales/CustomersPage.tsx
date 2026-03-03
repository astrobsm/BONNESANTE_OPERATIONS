import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  category_id: string | null;
  credit_exposure: number;
  total_revenue: number;
  risk_score: number;
  is_active: boolean;
  created_at: string;
}

interface CustomerForm {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category_id: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerForm>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<Customer[]>('/sales/customers');
      setCustomers(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: CustomerForm) => {
    try {
      setSubmitting(true);
      await apiPost('/sales/customers', {
        customer_id: data.customer_id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        category_id: data.category_id || null,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles, credit exposure, and risk scoring"
        action={<Button onClick={() => setShowModal(true)}>+ Add Customer</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Revenue</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Credit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Risk</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">No customers yet. Click "+ Add Customer" to get started.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{c.customer_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 text-gray-600">{c.email || ''}</td>
                  <td className="py-3 px-4 text-gray-600">{c.phone || ''}</td>
                  <td className="py-3 px-4 text-right">KES {c.total_revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">KES {c.credit_exposure.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge color={c.risk_score > 70 ? 'red' : c.risk_score > 40 ? 'yellow' : 'green'}>{c.risk_score}%</Badge></td>
                  <td className="py-3 px-4"><Badge color={c.is_active ? 'green' : 'red'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Customer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
              <input {...register('customer_id', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. CUST-001" />
              {errors.customer_id && <p className="text-xs text-red-600 mt-1">{errors.customer_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" {...register('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea {...register('address')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
            <input {...register('category_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Customer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
