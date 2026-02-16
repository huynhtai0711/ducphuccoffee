import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    client.get('/dashboard').then((r) => setData(r.data))
    client.get('/sales').then((r) => setSales(r.data.filter((x) => !x.deleted)))
    client.get('/expenses').then((r) => setExpenses(r.data))
  }, [])

  const topProducts = useMemo(() => {
    const m = {}
    sales.forEach((s) => { m[`SP ${s.product_id}`] = (m[`SP ${s.product_id}`] || 0) + s.quantity_kg })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [sales])

  if (!data) return <div className="p-4">Đang tải...</div>

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="card"><p>Doanh thu</p><b>{data.revenue.toLocaleString()}đ</b></div>
        <div className="card"><p>Công nợ</p><b>{data.receivables.toLocaleString()}đ</b></div>
        <div className="card"><p>Tổng đơn bán</p><b>{sales.length}</b></div>
        <div className="card"><p>Tổng chi phí</p><b>{expenses.reduce((a, b) => a + b.amount, 0).toLocaleString()}đ</b></div>
      </div>
      <div className="card"><h3 className="font-semibold">Top sản phẩm (kg)</h3>{topProducts.map(([name, kg]) => <div className="text-sm border-t py-1" key={name}>{name}: {kg}</div>)}</div>
      <div className="card"><h3 className="font-semibold">Cảnh báo tồn thấp (&lt; 60kg)</h3>{data.alerts.map((a) => <div key={a.product_id} className="text-red-600">SP #{a.product_id}: {a.quantity_kg}kg</div>)}</div>
    </div>
  )
}
