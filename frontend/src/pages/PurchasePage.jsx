import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import MobileSheet from '../components/MobileSheet'
import EmptyState from '../components/EmptyState'
import { apiErrorMessage, formatCurrency, formatDate, formatKg } from '../lib/utils'

const schema = z.object({
  bean_type_id: z.coerce.number().min(1, 'Chọn loại nhân'),
  quantity_kg: z.coerce.number().gt(0, 'Số kg phải lớn hơn 0'),
  price_per_kg: z.coerce.number().gt(0, 'Giá/kg phải lớn hơn 0'),
  vat_type: z.enum(['VAT', 'NOVAT']),
})

export default function PurchasePage() {
  const [beans, setBeans] = useState([])
  const [inventoryLedger, setInventoryLedger] = useState([])
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({ resolver: zodResolver(schema), defaultValues: { vat_type: 'VAT' } })

  const load = () => {
    client.get('/beans').then((r) => setBeans(r.data))
    client.get('/inventory').then((r) => setInventoryLedger(r.data.ledger || []))
  }
  useEffect(() => load(), [])

  const purchaseRows = useMemo(() => inventoryLedger.filter((row) => row.reference_type === 'purchase' && row.reason === 'PURCHASE' && row.segment === 'GREEN'), [inventoryLedger])

  const onSubmit = async (values) => {
    try {
      await client.post('/purchases', values)
      toast.success('Đã tạo phiếu nhập thành công')
      setOpen(false)
      reset({ vat_type: 'VAT' })
      load()
    } catch (error) {
      toast.error(apiErrorMessage(error))
      console.error('Create purchase error', error)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Nhập hàng" description="Quản lý phiếu nhập GREEN theo VAT/Không VAT" action={<button className="btn" onClick={() => setOpen(true)}>+ Nhập hàng</button>} />
      <div className="space-y-2">
        {!purchaseRows.length ? <EmptyState title="Chưa có phiếu nhập" action={<button className="btn" onClick={() => setOpen(true)}>Tạo phiếu nhập</button>} /> : purchaseRows.map((row) => (
          <article key={row.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-500">{formatDate(row.created_at)}</p>
            <h3 className="font-semibold">Nhân #{row.bean_type_id} • {row.vat_type}</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <p>{formatKg(row.quantity_kg)}</p>
              <p>{formatCurrency(row.unit_cost)}/kg</p>
              <p className="col-span-2 font-semibold">Tổng: {formatCurrency(row.quantity_kg * row.unit_cost)}</p>
            </div>
          </article>
        ))}
      </div>

      <MobileSheet
        open={open}
        title="Tạo phiếu nhập"
        onClose={() => setOpen(false)}
        footer={<button disabled={isSubmitting} onClick={handleSubmit(onSubmit)} className="btn w-full">{isSubmitting ? 'Đang lưu...' : 'Lưu phiếu nhập'}</button>}
      >
        <div className="space-y-3">
          <div>
            <label className="label">Loại nhân</label>
            <select className="input" {...register('bean_type_id')}>
              <option value="">-- Chọn loại nhân --</option>
              {beans.map((bean) => <option key={bean.id} value={bean.id}>{bean.name}</option>)}
            </select>
            <p className="field-error">{errors.bean_type_id?.message}</p>
          </div>
          <div>
            <label className="label">Nguồn</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="chip"><input type="radio" value="VAT" {...register('vat_type')} /> VAT</label>
              <label className="chip"><input type="radio" value="NOVAT" {...register('vat_type')} /> Không VAT</label>
            </div>
          </div>
          <div>
            <label className="label">Số kg</label>
            <input className="input" type="number" step="0.01" {...register('quantity_kg')} />
            <p className="field-error">{errors.quantity_kg?.message}</p>
          </div>
          <div>
            <label className="label">Giá nhập / kg</label>
            <input className="input" type="number" {...register('price_per_kg')} />
            <p className="field-error">{errors.price_per_kg?.message}</p>
          </div>
        </div>
      </MobileSheet>
    </div>
  )
}
