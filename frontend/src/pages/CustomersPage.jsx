import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import client from '../api/client'

export default function CustomersPage() {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { status: 'active', pipeline_stage: 'Lead' } })
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const load = () => client.get('/customers').then((r) => setRows(r.data))
  useEffect(() => { load() }, [])

  const submit = async (data) => {
    await client.post('/customers', data)
    toast.success('Đã thêm khách hàng')
    reset({ status: 'active', pipeline_stage: 'Lead' })
    load()
  }

  const filtered = rows.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()))
  return <div className="space-y-3">
    <div className="card"><h2 className="font-semibold">Khách hàng</h2><input className="input mt-2" placeholder="Tìm kiếm" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <form onSubmit={handleSubmit(submit)} className="card grid grid-cols-2 gap-2">
      <input className="input col-span-2" placeholder="Tên khách hàng" {...register('name', { required: true })} />
      <input className="input" placeholder="SĐT" {...register('phone')} />
      <input className="input" placeholder="Địa chỉ" {...register('address')} />
      <select className="input" {...register('status')}><option value="active">Hoạt động</option><option value="inactive">Ngừng hoạt động</option></select>
      <select className="input" {...register('pipeline_stage')}><option>Lead</option><option>Contacted</option><option>Sample</option><option>Negotiation</option><option>Won</option><option>Lost</option></select>
      <button className="btn col-span-2">THÊM KHÁCH HÀNG MỚI</button>
    </form>
    <div className="space-y-2">{filtered.map((c) => <div key={c.id} className="card text-sm"><div className="font-semibold">{c.name}</div><div>{c.phone || '-'} • {c.pipeline_stage}</div><div>{c.status}</div></div>)}</div>
  </div>
}
