import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import { formatCurrency, formatDate, formatKg } from '../lib/utils'

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [inventory, setInventory] = useState([])
  const [ledger, setLedger] = useState([])
  const [activeTab, setActiveTab] = useState('inventory')
  const [search, setSearch] = useState('')

  useEffect(() => {
    client.get('/dashboard').then((r) => setDashboard(r.data))
    client.get('/inventory').then((r) => {
      setInventory(r.data.current)
      setLedger(r.data.ledger.slice(0, 10))
    })
  }, [])

  const filtered = useMemo(() => inventory.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [inventory, search])

  return (
    <div className="space-y-4">
      <PageHeader title="Tổng quan" description="Theo dõi KPI, tồn kho và biến động gần đây" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Doanh thu" value={formatCurrency(dashboard?.revenue)} />
        <StatCard label="Lợi nhuận gộp" value={formatCurrency(dashboard?.gross_profit)} />
        <StatCard label="Bao bì" value={formatCurrency(dashboard?.packaging_cost)} />
        <StatCard label="Công nợ" value={formatCurrency(dashboard?.receivables)} />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Cảnh báo thành phẩm &lt; 60kg</h3>
        </div>
        {!dashboard?.alerts?.length ? (
          <p className="text-sm text-stone-500">Hiện không có cảnh báo tồn kho thấp.</p>
        ) : (
          <div className="space-y-2">
            {dashboard.alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm">
                <span>SP #{alert.product_id} • {alert.vat_type}</span>
                <b className="text-red-600">{formatKg(alert.quantity_kg)}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-2 text-sm">
          <button onClick={() => setActiveTab('inventory')} className={`rounded-full px-3 py-1 ${activeTab === 'inventory' ? 'bg-amber-700 text-white' : 'bg-stone-100'}`}>Tồn kho</button>
          <button onClick={() => setActiveTab('ledger')} className={`rounded-full px-3 py-1 ${activeTab === 'ledger' ? 'bg-amber-700 text-white' : 'bg-stone-100'}`}>Biến động gần đây</button>
        </div>

        {activeTab === 'inventory' ? (
          <>
            <input className="input" placeholder="Tìm theo mã/segment/VAT..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="mt-3 space-y-2">
              {!filtered.length ? <EmptyState title="Chưa có tồn kho" /> : filtered.map((row, index) => (
                <div key={index} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">{row.segment} • {row.vat_type}</p>
                  <p className="text-stone-500">Bean: {row.bean_type_id || '--'} | Product: {row.product_id || '--'}</p>
                  <b>{formatKg(row.quantity_kg)}</b>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {!ledger.length ? <EmptyState title="Chưa có biến động" /> : ledger.map((item) => (
              <div key={item.id} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">#{item.id} • {item.reason}</p>
                <p className="text-stone-500">{formatDate(item.created_at)} • {item.segment} • {item.vat_type}</p>
                <b>{item.quantity_kg > 0 ? '+' : ''}{formatKg(item.quantity_kg)}</b>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
