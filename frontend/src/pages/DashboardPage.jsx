import { useEffect, useState } from 'react'
import client from '../api/client'

export default function DashboardPage() {
  const [data, setData] = useState(null)

  useEffect(() => { client.get('/dashboard').then((r) => setData(r.data)) }, [])
  if (!data) return <div className="p-4">Đang tải...</div>

  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="card"><p>Doanh thu</p><b>{data.revenue.toLocaleString()}đ</b></div>
        <div className="card"><p>Lợi nhuận gộp</p><b>{data.gross_profit.toLocaleString()}đ</b></div>
        <div className="card"><p>Chi phí bao bì</p><b>{data.packaging_cost.toLocaleString()}đ</b></div>
        <div className="card"><p>Công nợ</p><b>{data.receivables.toLocaleString()}đ</b></div>
      </div>
      <div className="card">
        <h3 className="font-semibold">Cảnh báo tồn kho thấp</h3>
        {data.alerts.length === 0 ? <p>Không có cảnh báo</p> : data.alerts.map((a) => (
          <div key={a.product_id} className="text-red-600">SP #{a.product_id}: {a.quantity_kg}kg</div>
        ))}
      </div>
    </div>
  )
}
