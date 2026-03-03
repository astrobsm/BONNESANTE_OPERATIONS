import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface Feedback {
  id: string;
  ticket_id: string;
  complaint_type: string;
  description: string;
  status: string;
  escalation_level: number;
  customer_id: string | null;
  resolution: string | null;
  created_at: string;
}

interface FeedbackForm {
  complaint_type: string;
  description: string;
  escalation_level: number;
  customer_id: string;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FeedbackForm>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<Feedback[]>('/marketing/feedback');
      setFeedbacks(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: FeedbackForm) => {
    try {
      setSubmitting(true);
      await apiPost('/marketing/feedback', {
        complaint_type: data.complaint_type,
        description: data.description,
        escalation_level: Number(data.escalation_level) || 1,
        customer_id: data.customer_id || null,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'resolved') return 'green';
    if (s === 'escalated') return 'red';
    if (s === 'in_progress') return 'blue';
    return 'yellow';
  };

  return (
    <div>
      <PageHeader
        title="Customer Feedback"
        subtitle="Track complaints, feedback tickets, and resolution status"
        action={<Button onClick={() => setShowModal(true)}>+ New Ticket</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ticket</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Level</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : feedbacks.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No feedback tickets yet. Click "+ New Ticket" to get started.</td></tr>
              ) : feedbacks.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{f.ticket_id}</td>
                  <td className="py-3 px-4 text-gray-900">{f.complaint_type}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-[250px]">{f.description}</td>
                  <td className="py-3 px-4"><Badge color={f.escalation_level >= 3 ? 'red' : f.escalation_level >= 2 ? 'yellow' : 'green'}>L{f.escalation_level}</Badge></td>
                  <td className="py-3 px-4"><Badge color={statusColor(f.status)}>{f.status}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{new Date(f.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Feedback Ticket">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
              <select {...register('complaint_type', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select type...</option>
                <option value="product_quality">Product Quality</option>
                <option value="delivery">Delivery</option>
                <option value="service">Service</option>
                <option value="pricing">Pricing</option>
                <option value="other">Other</option>
              </select>
              {errors.complaint_type && <p className="text-xs text-red-600 mt-1">{errors.complaint_type.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Level</label>
              <select {...register('escalation_level', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value={1}>Level 1 - Low</option>
                <option value={2}>Level 2 - Medium</option>
                <option value={3}>Level 3 - High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description', { required: 'Required' })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID (optional)</label>
            <input {...register('customer_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="UUID of customer" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
