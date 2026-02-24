import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface FeedbackForm {
  customer_name: string;
  complaint_type: string;
  description: string;
  priority: string;
}

const mockFeedback = [
  { id: '1', ticket_id: 'TKT-001', customer: 'MedPlus Chemist', type: 'delivery_delay', description: 'Order delayed by 3 days', priority: 'high', status: 'open', response_time_hrs: null, created_at: '2026-02-22' },
  { id: '2', ticket_id: 'TKT-002', customer: 'Nairobi Hospital', type: 'quality_issue', description: 'Packaging damaged on arrival', priority: 'medium', status: 'resolved', response_time_hrs: 2.5, resolution_time_hrs: 18, satisfaction: 4, created_at: '2026-02-20' },
];

export default function FeedbackPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FeedbackForm>();

  const onSubmit = (data: FeedbackForm) => {
    console.log('New feedback:', data);
    reset();
    setShowModal(false);
  };

  const priorityColor = (p: string) => {
    switch (p) { case 'high': return 'red'; case 'medium': return 'yellow'; default: return 'gray'; }
  };

  return (
    <div>
      <PageHeader
        title="Customer Feedback"
        subtitle="Track complaints, response times, and resolution"
        action={<Button onClick={() => setShowModal(true)}>+ Log Feedback</Button>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ticket</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Response (hrs)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockFeedback.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{f.ticket_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{f.customer}</td>
                  <td className="py-3 px-4 text-gray-600">{f.type.replace('_', ' ')}</td>
                  <td className="py-3 px-4"><Badge color={priorityColor(f.priority)}>{f.priority}</Badge></td>
                  <td className="py-3 px-4"><Badge color={f.status === 'resolved' ? 'green' : 'yellow'}>{f.status}</Badge></td>
                  <td className="py-3 px-4 text-right">{f.response_time_hrs ?? '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{f.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Customer Feedback">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input {...register('customer_name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.customer_name && <p className="text-xs text-red-600 mt-1">{errors.customer_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select {...register('complaint_type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="delivery_delay">Delivery Delay</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="pricing_dispute">Pricing Dispute</option>
                <option value="service_complaint">Service Complaint</option>
                <option value="general_inquiry">General Inquiry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select {...register('priority')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description', { required: 'Required' })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Submit Feedback</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
