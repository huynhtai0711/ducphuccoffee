import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import client from '../api/client'

export default function FinancePage() {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { expense_type: 'gas' } })
  const [expenses, setExpenses] = useState([])
  const [debts, setDebts] = useState([])
  const load = () => {
    client.get('/expenses').then((r) => setExpenses(r.data))
    client.get('/debts').then((r) => setDebts(r.data))
  }
  useEffect(() => { load() }, [])

  const submitExpense = async (data) => {
    await client.post('/expenses', { ...data, amount: Number(data.amount) })
    toast.success('Đã thêm chi phí')
    reset({ expense_type: 'gas' })
    load()
  }

  return <div className="space-y-3">
    <form onSubmit={handleSubmit(submitExpense)} className="card grid grid-cols-2 gap-2">
      <h2 className="font-semibold col-span-2">Chi phí</h2>
      <select className="input" {...register('expense_type')}><option value="gas">Gas</option><option value="electricity">Điện</option><option value="shipping">Vận chuyển</option><option value="salary">Lương</option><option value="other">Khác</option></select>
      <input className="input" type="number" placeholder="Số tiền" {...register('amount', { required: true })} />
      <input className="input col-span-2" placeholder="Ghi chú" {...register('note')} />
      <button className="btn col-span-2">THÊM CHI PHÍ MỚI</button>
    </form>
    <div className="card"><h3 className="font-semibold">Lịch sử chi phí</h3>{expenses.map((e) => <div key={e.id} className="text-sm border-t py-1">{e.expense_type}: {Number(e.amount).toLocaleString()}đ</div>)}</div>
    <div className="card"><h3 className="font-semibold">Công nợ theo khách</h3>{debts.map((d) => <div key={d.customer_id} className="text-sm border-t py-1">KH #{d.customer_id}: còn {Number(d.remaining).toLocaleString()}đ</div>)}</div>
  </div>
}
