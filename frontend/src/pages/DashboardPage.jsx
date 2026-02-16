import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [sales, setSales] = useState([])

  useEffect(() => {
    client.get('/dashboard').then((r) => setData(r.data))
    client.get('/sales').then((r) => setSales(r.data.filter((x) => !x.deleted)))
  }, [])

  const pieData = useMemo(() => {
    const map = {}
    sales.forEach((s) => {
      const key = `SP #${s.product_id}`
      map[key] = (map[key] || 0) + (s.quantity_kg * s.price_per_kg)
    })
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1
    return Object.entries(map).map(([name, value], idx) => ({ name, value, percent: Math.round((value / total) * 100), color: ['#a16207', '#d97706', '#f59e0b', '#fbbf24'][idx % 4] }))
  }, [sales])

  const sixMonthsLine = useMemo(() => {
    const points = []
    const now = new Date()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      points.push({ month: key, revenue: 0, profit: 0 })
    }
    sales.forEach((s) => {
      const key = new Date(s.sold_at)
      const m = `${key.getFullYear()}-${String(key.getMonth() + 1).padStart(2, '0')}`
      const target = points.find((p) => p.month === m)
      if (target) {
        target.revenue += s.quantity_kg * s.price_per_kg
        target.profit += s.net_profit
      }
    })
    const max = Math.max(...points.map((p) => Math.max(p.revenue, p.profit)), 1)
    return points.map((p) => ({ ...p, revY: 140 - (p.revenue / max) * 120, proY: 140 - (p.profit / max) * 120 }))
  }, [sales])

  if (!data) return <div className="p-4">Đang tải...</div>

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="card"><p>Doanh thu tháng</p><b>{data.revenue.toLocaleString()}đ</b></div>
        <div className="card"><p>Lợi nhuận gộp tháng</p><b>{data.gross_profit.toLocaleString()}đ</b></div>
        <div className="card"><p>Chi phí bao bì tháng</p><b>{data.packaging_cost.toLocaleString()}đ</b></div>
        <div className="card"><p>Công nợ tháng</p><b>{data.receivables.toLocaleString()}đ</b></div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 font-semibold">Cơ cấu doanh thu theo sản phẩm</h3>
          <div className="space-y-2">
            {pieData.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-xs"><span>{item.name}</span><span>{item.percent}%</span></div>
                <div className="h-2 rounded bg-stone-200"><div className="h-2 rounded" style={{ width: `${item.percent}%`, background: item.color }} /></div>
              </div>
            ))}
            {pieData.length === 0 && <p className="text-sm text-stone-500">Chưa có dữ liệu bán hàng.</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2 font-semibold">Doanh thu / lợi nhuận 6 tháng gần nhất</h3>
          <svg viewBox="0 0 320 170" className="w-full">
            {sixMonthsLine.map((p, idx) => {
              const x = 30 + idx * 50
              return <g key={p.month}><text x={x - 15} y="162" fontSize="9">{p.month.slice(5)}</text><circle cx={x} cy={p.revY} r="3" fill="#d97706" /><circle cx={x} cy={p.proY} r="3" fill="#92400e" /></g>
            })}
            <polyline fill="none" stroke="#d97706" strokeWidth="2" points={sixMonthsLine.map((p, idx) => `${30 + idx * 50},${p.revY}`).join(' ')} />
            <polyline fill="none" stroke="#92400e" strokeWidth="2" points={sixMonthsLine.map((p, idx) => `${30 + idx * 50},${p.proY}`).join(' ')} />
          </svg>
          <div className="mt-1 flex gap-4 text-xs"><span className="text-amber-700">● Doanh thu</span><span className="text-amber-900">● Lợi nhuận</span></div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold">Cảnh báo tồn thấp (&lt; 60kg)</h3>
        {data.alerts.length === 0 && <p className="text-sm text-stone-500">Không có cảnh báo.</p>}
        {data.alerts.map((a) => <div key={`${a.product_id}-${a.vat_type}`} className="text-sm text-red-600">SP #{a.product_id} ({a.vat_type}): {a.quantity_kg}kg</div>)}
      </div>
    </div>
  )
}
