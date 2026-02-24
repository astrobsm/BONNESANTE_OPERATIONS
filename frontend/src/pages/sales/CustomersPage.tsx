import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface CustomerForm {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  category: string;
  credit_limit: number;
}

const mockCustomers = [
  { id: '1', name: 'Nairobi Hospital Pharmacy', contact_person: 'Dr. Otieno', phone: '0712345678', category: 'A_Premier', total_revenue: 2500000, credit_exposure: 150000, risk_score: 'low' },
  { id: '2', name: 'MedPlus Chemist', contact_person: 'A. Wanjiku', phone: '0723456789', category: 'B_Regular', total_revenue: 850000, credit_exposure: 200000, risk_score: 'medium' },
  { id: '3', name: 'County Health Depot', contact_person: 'J. Kamau', phone: '0734567890', category: 'C_Occasional', total_revenue: 120000, credit_exposure: 80000, risk_score: 'high' },
];

export default function CustomersPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerForm>();

  const onSubmit = (data: CustomerForm) => {
    console.log('New customer:', data);
    reset();
    setShowModal(false);
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts with credit tracking and risk scoring"
        action={<Button onClick={() => setShowModal(true)}>+ Add Customer</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Revenue</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Credit Exposure</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Risk</th>
              </tr>
            </thead>
            <tbody>
              {mockCustomers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 text-gray-600">{c.contact_person}<br/><span className="text-xs">{c.phone}</span></td>
                  <td className="py-3 px-4"><Badge color="blue">{c.category.replace('_', ' ')}</Badge></td>
                  <td className="py-3 px-4 text-right">KES {c.total_revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">KES {c.credit_exposure.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge color={riskColor(c.risk_score)}>{c.risk_score}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Customer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input {...register('contact_person', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="A_Premier">A - Premier</option>
                <option value="B_Regular">B - Regular</option>
                <option value="C_Occasional">C - Occasional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (KES)</label>
              <input type="number" {...register('credit_limit', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" {...register('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
