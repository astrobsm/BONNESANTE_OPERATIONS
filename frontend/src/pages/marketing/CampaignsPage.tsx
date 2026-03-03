import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';
import { apiGet, apiPost } from '@/services/api';

interface Campaign {
  id: string;
  campaign_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  budget: number;
  actual_cost: number;
  leads_generated: number;
  conversions: number;
  channels: string[];
  status: string;
  created_at: string;
}

interface CampaignForm {
  campaign_id: string;
  name: string;
  start_date: string;
  end_date: string;
  budget: number;
  channels: string;
  target_audience: string;
  description: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CampaignForm>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<Campaign[]>('/marketing/campaigns');
      setCampaigns(data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: CampaignForm) => {
    try {
      setSubmitting(true);
      await apiPost('/marketing/campaigns', {
        campaign_id: data.campaign_id,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date || null,
        budget: Number(data.budget),
        channels: data.channels ? data.channels.split(',').map(c => c.trim()) : [],
        target_audience: data.target_audience || null,
        description: data.description || null,
      });
      reset();
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'completed') return 'green';
    if (s === 'active') return 'blue';
    if (s === 'cancelled') return 'red';
    return 'yellow';
  };

  return (
    <div>
      <PageHeader
        title="Marketing Campaigns"
        subtitle="Plan, track, and measure campaign performance and ROI"
        action={<Button onClick={() => setShowModal(true)}>+ New Campaign</Button>}
      />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Dates</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Budget</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Leads</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Conversions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No campaigns yet. Click "+ New Campaign" to get started.</td></tr>
              ) : campaigns.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{c.campaign_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{c.start_date}{c.end_date ? ` – ${c.end_date}` : ''}</td>
                  <td className="py-3 px-4 text-right">KES {c.budget.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{c.leads_generated}</td>
                  <td className="py-3 px-4 text-right">{c.conversions}</td>
                  <td className="py-3 px-4"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Campaign">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign ID</label>
              <input {...register('campaign_id', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. MKT-001" />
              {errors.campaign_id && <p className="text-xs text-red-600 mt-1">{errors.campaign_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" {...register('start_date', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" {...register('end_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (KES)</label>
              <input type="number" step="0.01" {...register('budget', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channels (comma-separated)</label>
              <input {...register('channels')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Facebook, Radio, SMS" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <input {...register('target_audience')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Campaign'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
