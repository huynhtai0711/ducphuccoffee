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
  product_id: z.coerce.number().min(1, 'Chọn sản phẩm'),
  input_green_kg: z.coerce.number().gt(0, 'Kg nhân phải > 0'),
  output_finished_kg: z.coerce.number().gt(0, 'Kg thành phẩm phải > 0'),
})

export default function RoastPage() {
  const [products, setProducts] = useState([])
  const [ledger, setLedger] = useState([])
  const [open, setOpen] = useState(false)
  const { register, watch, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({ resolver: zodResolver(schema) })

  const load = () => {
    client.get('/products').then((r) => setProducts(r.data))
    client.get('/inventory').then((r) => setLedger(r.data.ledger || []))
  }
  useEffect(() => load(), [])

  const roastRows = useMemo(() => ledger.filter((item) => item.reason === 'ROAST_OUTPUT').map((item) => {
    const consume = ledger.filter((l) => l.reference_type === 'roast' && l.reference_id === item.reference_id && l.reason === 'ROAST_CONSUME')
    const input = consume.reduce((sum, c) => sum + Math.abs(c.quantity_kg), 0)
    const loss = input ? ((input - item.quantity_kg) / input) * 100 : 0
    return { ...item, input }
  }), [ledger])

  const input = Number(watch('input_green_kg') || 0)
  const output = Number(watch('output_finished_kg') || 0)
  const lossPercent = input > 0 ? ((input - output) / input) * 100 : 0

  const onSubmit = async (values) => {
    try {
      await client.post('/roasts', values)
      toast.success('Đã tạo phiếu rang')
      setOpen(false)
      reset()
      load()
    } catch (error) {
      toast.error(apiErrorMessage(error))
      console.error('Create roast error', error)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Sản xuất / Rang" description="Trừ GREEN và cộng FINISHED theo ledger" action={<button className="btn" onClick={() => setOpen(true)}>+ Tạo phiếu rang</button>} />
      <div className="space-y-2">
        {!roastRows.length ? <EmptyState title="Chưa có mẻ rang" /> : roastRows.map((row) => (
          <article key={row.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-500">{formatDate(row.created_at)}</p>
            <h3 className="font-semibold">Sản phẩm #{row.product_id} • {row.vat_type}</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <p>Đầu vào: {formatKg(row.input)}</p>
              <p>Đầu ra: {formatKg(row.quantity_kg)}</p>
              <p>Giá vốn: {formatCurrency(row.unit_cost)}/kg</p>
            </div>
          </article>
        ))}
      </div>

      <MobileSheet open={open} title="Tạo phiếu rang" onClose={() => setOpen(false)} footer={<button className="btn w-full" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu phiếu rang'}</button>}>
        <div className="space-y-3">
          <div>
            <label className="label">Sản phẩm đầu ra</label>
            <select className="input" {...register('product_id')}>
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <p className="field-error">{errors.product_id?.message}</p>
          </div>
          <div>
            <label className="label">Kg nhân vào</label>
            <input className="input" type="number" step="0.01" {...register('input_green_kg')} />
            <p className="field-error">{errors.input_green_kg?.message}</p>
          </div>
          <div>
            <label className="label">Kg thành phẩm ra</label>
            <input className="input" type="number" step="0.01" {...register('output_finished_kg')} />
            <p className="field-error">{errors.output_finished_kg?.message}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-sm">Hao hụt ước tính: <b>{lossPercent > 0 ? lossPercent.toFixed(2) : '0.00'}%</b></div>
        </div>
      </MobileSheet>
    </div>
  )
}
