import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'

export default function ReportsPage() {
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])
  useEffect(() => {
    client.get('/sales').then((r) => setSales(r.data.filter((x) => !x.deleted)))
    client.get('/expenses').then((r) => setExpenses(r.data))
  }, [])

  const topProducts = useMemo(() => {
    const map = {}
    sales.forEach((s) => { map[s.product_id] = (map[s.product_id] || 0) + s.quantity_kg })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [sales])

  const expenseByType = useMemo(() => {
    const map = {}
    expenses.forEach((e) => { map[e.expense_type] = (map[e.expense_type] || 0) + e.amount })
    return Object.entries(map)
  }, [expenses])

  return <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2">
      <div className="card"><p>Doanh thu</p><b>{sales.reduce((a, b) => a + b.quantity_kg * b.price_per_kg, 0).toLocaleString()}đ</b></div>
      <div className="card"><p>Chi phí</p><b>{expenses.reduce((a, b) => a + b.amount, 0).toLocaleString()}đ</b></div>
      <div className="card"><p>Lợi nhuận tạm tính</p><b>{(sales.reduce((a, b) => a + b.net_profit, 0) - expenses.reduce((a, b) => a + b.amount, 0)).toLocaleString()}đ</b></div>
    </div>
    <div className="card"><h3 className="font-semibold">Top sản phẩm bán chạy</h3>{topProducts.map(([id, kg]) => <div className="text-sm border-t py-1" key={id}>SP {id}: {kg} kg</div>)}</div>
    <div className="card"><h3 className="font-semibold">Cơ cấu chi phí</h3>{expenseByType.map(([type, amount]) => <div className="text-sm border-t py-1" key={type}>{type}: {Number(amount).toLocaleString()}đ</div>)}</div>
  </div>
}
