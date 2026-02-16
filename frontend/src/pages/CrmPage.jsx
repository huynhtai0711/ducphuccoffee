import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import client from '../api/client'
import { toast } from 'sonner'

export default function CrmPage() {
  const { register, handleSubmit, reset } = useForm()
  const [customers, setCustomers] = useState([])
  const [dash, setDash] = useState({ today_tasks: [], overdue: [] })

  const load = () => {
    client.get('/customers').then((r) => setCustomers(r.data))
    client.get('/crm/dashboard').then((r) => setDash(r.data))
  }

  useEffect(() => load(), [])

  const submit = async (data) => {
    await client.post('/customers', data)
    toast.success('Tạo khách hàng thành công')
    reset()
    load()
  }

  return <div className="p-4 pb-24 space-y-3">
    <form onSubmit={handleSubmit(submit)} className="card space-y-2">
      <h3 className="font-semibold">Tạo nhanh khách hàng</h3>
      <input className="input" placeholder="Tên khách hàng" {...register('name')} />
      <select className="input" {...register('status')}>
        <option value="active">active</option><option value="potential">potential</option><option value="inactive">inactive</option>
      </select>
      <button className="btn">Lưu</button>
    </form>
    <div className="card"><h3 className="font-semibold">Việc hôm nay</h3>{dash.today_tasks.length}</div>
    <div className="card"><h3 className="font-semibold">Quá hạn</h3>{dash.overdue.length}</div>
    {customers.map((c) => <div key={c.id} className="card text-sm">{c.name} - {c.status}</div>)}
  </div>
}
