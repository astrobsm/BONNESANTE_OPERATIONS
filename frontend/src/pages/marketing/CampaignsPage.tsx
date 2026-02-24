import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui';

interface CampaignForm {
  campaign_name: string;
  type: string;
  budget: number;
  start_date: string;
  end_date: string;
  target_audience: string;
}

const mockCampaigns = [
  { id: '1', name: 'Q1 Hospital Outreach', type: 'direct_sales', budget: 500000, spent: 320000, leads: 45, conversions: 12, roi: 2.8, status: 'active', start: '2026-01-01', end: '2026-03-31' },
  { id: '2', name: 'Digital Health Expo', type: 'event', budget: 200000, spent: 200000, leads: 78, conversions: 22, roi: 4.1, status: 'completed', start: '2026-02-10', end: '2026-02-12' },
];

export default function CampaignsPage() {
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CampaignForm>();

  const onSubmit = (data: CampaignForm) => {
    console.log('New campaign:', data);
    reset();
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Marketing Campaigns"
        subtitle="Track campaign performance, ROI, and lead conversion"
        action={<Button onClick={() => setShowModal(true)}>+ New Campaign</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {mockCampaigns.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.start} — {c.end}</p>
              </div>
              <Badge color={c.status === 'active' ? 'green' : 'gray'}>{c.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Budget</p>
                <p className="font-semibold">KES {c.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Spent</p>
                <p className="font-semibold">KES {c.spent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Leads → Conversions</p>
                <p className="font-semibold">{c.leads} → {c.conversions}</p>
              </div>
              <div>
                <p className="text-gray-500">ROI</p>
                <p className="font-semibold text-green-600">{c.roi}x</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round((c.spent / c.budget) * 100)}% budget used</p>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Campaign">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input {...register('campaign_name', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            {errors.campaign_name && <p className="text-xs text-red-600 mt-1">{errors.campaign_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select {...register('type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="direct_sales">Direct Sales</option>
                <option value="event">Event</option>
                <option value="digital">Digital</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (KES)</label>
              <input type="number" {...register('budget', { required: 'Required', valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" {...register('start_date', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" {...register('end_date', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <input {...register('target_audience')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Hospital pharmacies in Nairobi" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Campaign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
