import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import MobileSheet from '../components/MobileSheet'
import EmptyState from '../components/EmptyState'
import { apiErrorMessage, formatDate } from '../lib/utils'

export default function CrmPage() {
  const [customers, setCustomers] = useState([])
  const [dash, setDash] = useState({ today_tasks: [], overdue: [] })
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [followOpen, setFollowOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const customerForm = useForm({ defaultValues: { status: 'potential' } })
  const followForm = useForm()

  const load = async () => {
    const customerRes = await client.get('/customers', { params: status === 'all' ? {} : { status } })
    setCustomers(customerRes.data)
    const dashRes = await client.get('/crm/dashboard')
    setDash(dashRes.data)
  }

  useEffect(() => { load() }, [status])

  const createCustomer = async (values) => {
    try {
      await client.post('/customers', values)
      toast.success('Đã thêm khách hàng/lead')
      customerForm.reset({ status: 'potential' })
      setOpen(false)
      load()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  const createFollow = async (values) => {
    try {
      await client.post('/crm/followups', { ...values, customer_id: selectedCustomer.id })
      toast.success('Đã lưu lịch sử chăm sóc')
      followForm.reset()
      setFollowOpen(false)
      load()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="CRM" description="Sales chỉ xem khách được phân công, Admin xem toàn bộ" action={<button className="btn" onClick={() => setOpen(true)}>+ Thêm lead</button>} />
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex gap-2 text-sm">
          {[
            ['all', 'Tất cả'],
            ['active', 'Đang mua'],
            ['potential', 'Tiềm năng'],
            ['inactive', 'Ngưng'],
          ].map(([value, label]) => <button key={value} className={`rounded-full px-3 py-1 ${status === value ? 'bg-amber-700 text-white' : 'bg-stone-100'}`} onClick={() => setStatus(value)}>{label}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-stone-500">Việc hôm nay</p><p className="text-xl font-semibold">{dash.today_tasks.length}</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-stone-500">Quá hạn</p><p className="text-xl font-semibold text-red-600">{dash.overdue.length}</p></div>
      </div>

      <div className="space-y-2">
        {!customers.length ? <EmptyState title="Chưa có khách hàng" /> : customers.map((customer) => (
          <article key={customer.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{customer.name}</h3>
            <p className="text-sm text-stone-500">Trạng thái: {customer.status} • Khu vực: {customer.region || '--'}</p>
            <p className="text-sm">{customer.notes || 'Chưa có ghi chú'}</p>
            <button className="mt-3 rounded-xl bg-stone-100 px-3 py-2 text-sm" onClick={() => { setSelectedCustomer(customer); setFollowOpen(true) }}>+ Ghi chú chăm sóc</button>
          </article>
        ))}
      </div>

      <MobileSheet open={open} onClose={() => setOpen(false)} title="Thêm khách hàng / lead" footer={<button className="btn w-full" onClick={customerForm.handleSubmit(createCustomer)}>Lưu</button>}>
        <div className="space-y-3">
          <div><label className="label">Tên khách</label><input className="input" {...customerForm.register('name', { required: 'Nhập tên khách' })} /><p className="field-error">{customerForm.formState.errors.name?.message}</p></div>
          <div><label className="label">Trạng thái</label><select className="input" {...customerForm.register('status')}><option value="active">Đang mua</option><option value="potential">Tiềm năng</option><option value="inactive">Ngưng</option></select></div>
          <div><label className="label">Ghi chú</label><textarea className="input min-h-24" {...customerForm.register('notes')} /></div>
        </div>
      </MobileSheet>

      <MobileSheet open={followOpen} onClose={() => setFollowOpen(false)} title={`Chăm sóc: ${selectedCustomer?.name || ''}`} footer={<button className="btn w-full" onClick={followForm.handleSubmit(createFollow)}>Lưu lịch sử</button>}>
        <div className="space-y-3">
          <div><label className="label">Nội dung</label><textarea className="input min-h-24" {...followForm.register('note', { required: 'Nhập nội dung chăm sóc' })} /><p className="field-error">{followForm.formState.errors.note?.message}</p></div>
          <div><label className="label">Ngày follow-up tiếp theo</label><input className="input" type="date" {...followForm.register('next_follow_up_date')} /></div>
          <div className="rounded-xl bg-stone-100 p-3 text-xs">Việc hôm nay: {dash.today_tasks.map((item) => `#${item.customer_id} ${formatDate(item.next_follow_up_date)}`).join(', ') || 'Không có'}</div>
        </div>
      </MobileSheet>
    </div>
  )
}
