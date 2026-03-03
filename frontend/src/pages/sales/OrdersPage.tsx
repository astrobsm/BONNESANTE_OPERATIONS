import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface Order {
  id: string;
  tracking_id: string;
  customer_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items: any[];
  created_at: string;
}

interface OrderItemForm {
  finished_good_id: string;
  quantity: number;
  unit_price: number;
}

interface OrderForm {
  customer_id: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<OrderItemForm[]>([{ finished_good_id: '', quantity: 1, unit_price: 0 }]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<Order[]>('/sales/orders');
      setOrders(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addItem = () => setItems([...items, { finished_good_id: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof OrderItemForm, value: string | number) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    setItems(updated);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { alert('Customer ID is required'); return; }
    if (items.some(it => !it.finished_good_id)) { alert('All items must have a product ID'); return; }
    try {
      setSubmitting(true);
      await apiPost('/sales/orders', {
        customer_id: customerId,
        items: items.map(it => ({
          finished_good_id: it.finished_good_id,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });
      setCustomerId('');
      setItems([{ finished_good_id: '', quantity: 1, unit_price: 0 }]);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'delivered' || s === 'completed') return 'green';
    if (s === 'cancelled') return 'red';
    if (s === 'processing' || s === 'shipped') return 'blue';
    return 'yellow';
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Track customer orders, payment status, and fulfillment"
        action={<Button onClick={() => setShowModal(true)}>+ New Order</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Tracking ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No orders yet. Click "+ New Order" to get started.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{o.tracking_id}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{o.customer_id}</td>
                  <td className="py-3 px-4 text-right font-semibold">KES {o.total_amount.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(o.status)}>{o.status}</Badge></td>
                  <td className="py-3 px-4"><Badge color={o.payment_status === 'paid' ? 'green' : 'yellow'}>{o.payment_status}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Order">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID (UUID)</label>
            <input value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Customer UUID" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input value={item.finished_good_id} onChange={e => updateItem(i, 'finished_good_id', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Product UUID" />
                <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Qty" />
                <input type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} className="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Price" />
                {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-500 text-xs hover:underline">Remove</button>}
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Add Item</button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Order'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
