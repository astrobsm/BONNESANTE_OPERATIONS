import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface OrderForm {
  customer_name: string;
  product: string;
  quantity: number;
  unit_price: number;
  payment_method: string;
}

const mockOrders = [
  { id: '1', tracking_id: 'ORD-2026-0001', customer: 'Nairobi Hospital Pharmacy', total: 175000, status: 'delivered', payment_status: 'paid', created_at: '2026-02-18' },
  { id: '2', tracking_id: 'ORD-2026-0002', customer: 'MedPlus Chemist', total: 48000, status: 'processing', payment_status: 'pending', created_at: '2026-02-21' },
  { id: '3', tracking_id: 'ORD-2026-0003', customer: 'County Health Depot', total: 320000, status: 'pending', payment_status: 'credit', created_at: '2026-02-22' },
];

export default function OrdersPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderForm>();

  const onSubmit = (data: OrderForm) => {
    console.log('New order:', data);
    reset();
    setShowModal(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'delivered': return 'green';
      case 'processing': return 'blue';
      case 'pending': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const payColor = (s: string) => {
    switch (s) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'credit': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Track customer orders, fulfillment status, and payments"
        action={<Button onClick={() => setShowModal(true)}>+ New Order</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Order ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Total (KES)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{o.tracking_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{o.customer}</td>
                  <td className="py-3 px-4 text-right font-semibold">{o.total.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(o.status)}>{o.status}</Badge></td>
                  <td className="py-3 px-4"><Badge color={payColor(o.payment_status)}>{o.payment_status}</Badge></td>
                  <td className="py-3 px-4 text-gray-600">{o.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Order">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <input {...register('customer_name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.customer_name && <p className="text-xs text-red-600 mt-1">{errors.customer_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <input {...register('product', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" {...register('quantity', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KES)</label>
              <input type="number" {...register('unit_price', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select {...register('payment_method')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
