import { PageHeader, Card, Badge } from '@/components/ui';

const mockGoods = [
  { id: '1', product_id: 'FG-001', product_name: 'Paracetamol 500mg x100', batch_number: 'PB-001', quantity_produced: 5000, available_balance: 4200, unit_price: 350, created_at: '2026-02-20', sync_status: 'synced' },
  { id: '2', product_id: 'FG-002', product_name: 'Amoxicillin 250mg x50', batch_number: 'PB-002', quantity_produced: 3000, available_balance: 3000, unit_price: 480, created_at: '2026-02-21', sync_status: 'synced' },
];

export default function FinishedGoodsPage() {
  return (
    <div>
      <PageHeader
        title="Finished Goods"
        subtitle="Inventory of finished products with available stock balances"
      />

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
              {mockGoods.map((g) => (
                <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{g.product_id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{g.product_name}</td>
                  <td className="py-3 px-4 text-gray-600">{g.batch_number}</td>
                  <td className="py-3 px-4 text-right">{g.quantity_produced.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    <Badge color={g.available_balance < 100 ? 'red' : 'green'}>
                      {g.available_balance.toLocaleString()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">KES {g.unit_price.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <Badge color={g.sync_status === 'synced' ? 'green' : 'yellow'}>{g.sync_status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
