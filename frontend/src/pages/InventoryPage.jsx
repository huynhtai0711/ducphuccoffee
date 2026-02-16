import { useEffect, useState } from 'react'
import client from '../api/client'

export default function InventoryPage() {
  const [rows, setRows] = useState([])
  useEffect(() => { client.get('/inventory').then((r) => setRows(r.data.current)) }, [])

  return (
    <div className="p-4 pb-24 space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="card text-sm">
          <div>{r.segment} | VAT: {r.vat_type}</div>
          <div>Bean: {r.bean_type_id || '-'} | Product: {r.product_id || '-'}</div>
          <b>{r.quantity_kg} kg</b>
        </div>
      ))}
    </div>
  )
}
