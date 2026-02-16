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
  sold_at: z.string().min(1, 'Chọn ngày bán'),
  customer_id: z.coerce.number().min(1, 'Chọn khách hàng'),
  product_id: z.coerce.number().min(1, 'Chọn sản phẩm'),
  quantity_kg: z.coerce.number().gt(0, 'Số kg phải > 0'),
  price_per_kg: z.coerce.number().gt(0, 'Giá bán/kg phải > 0'),
  packaging_cost_per_kg: z.coerce.number().min(0),
  paid_amount: z.coerce.number().min(0),
})

const customerSchema = z.object({ name: z.string().min(2, 'Nhập tên khách hàng') })

export default function SalesPage() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [inventory, setInventory] = useState([])
  const [ledger, setLedger] = useState([])
  const [open, setOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { sold_at: new Date().toISOString().slice(0, 10), packaging_cost_per_kg: 3000, paid_amount: 0 } })
  const customerForm = useForm({ resolver: zodResolver(customerSchema) })
  const { register, watch, handleSubmit, formState: { errors, isSubmitting }, reset } = form

  const load = () => {
    client.get('/products').then((r) => setProducts(r.data))
    client.get('/customers').then((r) => setCustomers(r.data))
    client.get('/inventory').then((r) => {
      setInventory(r.data.current)
      setLedger(r.data.ledger)
    })
  }
  useEffect(() => load(), [])

  const salesRows = useMemo(() => ledger.filter((item) => item.reason === 'SALE'), [ledger])
  const selectedProduct = Number(watch('product_id'))
  const qty = Number(watch('quantity_kg') || 0)
  const price = Number(watch('price_per_kg') || 0)
  const packaging = Number(watch('packaging_cost_per_kg') || 0)
  const selectedProductData = products.find((p) => p.id === selectedProduct)
  const vatPercent = selectedProductData?.vat_type === 'VAT' ? 8 : 0
  const revenue = qty * price
  const vatValue = (revenue * vatPercent) / 100

  const productStock = inventory
    .filter((item) => item.segment === 'FINISHED' && item.product_id === selectedProduct)
    .reduce((sum, row) => sum + row.quantity_kg, 0)

  const onSubmit = async (values) => {
    try {
      const payload = {
        customer_id: values.customer_id,
        product_id: values.product_id,
        quantity_kg: values.quantity_kg,
        price_per_kg: values.price_per_kg,
        packaging_cost_per_kg: values.packaging_cost_per_kg,
        sold_at: `${values.sold_at}T00:00:00`,
        payments: values.paid_amount > 0 ? [{ amount: values.paid_amount, method: 'cash' }] : [],
      }
      await client.post('/sales', payload)
      toast.success('Tạo đơn bán thành công')
      setOpen(false)
      reset({ sold_at: new Date().toISOString().slice(0, 10), packaging_cost_per_kg: 3000, paid_amount: 0 })
      load()
    } catch (error) {
      console.error('Create sale error', error)
      toast.error(apiErrorMessage(error))
    }
  }

  const createCustomer = async (values) => {
    try {
      await client.post('/customers', { ...values, status: 'potential' })
      toast.success('Đã tạo khách hàng nhanh')
      customerForm.reset()
      setCustomerOpen(false)
      load()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Bán hàng" description="Bán trừ kho FINISHED, VAT khóa theo nguồn sản phẩm" action={<button className="btn" onClick={() => setOpen(true)}>+ Tạo đơn</button>} />

      <div className="space-y-2">
        {!salesRows.length ? <EmptyState title="Chưa có đơn bán" /> : salesRows.map((row) => (
          <article key={row.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-500">{formatDate(row.created_at)}</p>
            <h3 className="font-semibold">Đơn #{row.reference_id} • SP #{row.product_id}</h3>
            <p className="text-sm">{formatKg(Math.abs(row.quantity_kg))} • VAT {row.vat_type === 'VAT' ? '8%' : '0%'}</p>
            <p className="text-xs text-stone-500">(Chi tiết khách/doanh thu xem trong báo cáo tổng)</p>
          </article>
        ))}
      </div>

      <MobileSheet open={open} onClose={() => setOpen(false)} title="Tạo đơn bán" footer={<button className="btn w-full" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>{isSubmitting ? 'Đang lưu...' : 'Lưu đơn bán'}</button>}>
        <div className="space-y-3">
          <div>
            <label className="label">Ngày bán</label>
            <input className="input" type="date" {...register('sold_at')} />
            <p className="field-error">{errors.sold_at?.message}</p>
          </div>
          <div>
            <label className="label">Khách hàng</label>
            <div className="flex gap-2">
              <select className="input" {...register('customer_id')}>
                <option value="">-- Chọn khách --</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
              <button type="button" className="btn" onClick={() => setCustomerOpen(true)}>+</button>
            </div>
            <p className="field-error">{errors.customer_id?.message}</p>
          </div>
          <div>
            <label className="label">Sản phẩm</label>
            <select className="input" {...register('product_id')}>
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <p className="text-xs text-stone-500 mt-1">Tồn hiện có: {formatKg(productStock)}</p>
            <p className="field-error">{errors.product_id?.message}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Kg bán</label><input className="input" type="number" step="0.01" {...register('quantity_kg')} /><p className="field-error">{errors.quantity_kg?.message}</p></div>
            <div><label className="label">Giá bán/kg</label><input className="input" type="number" {...register('price_per_kg')} /><p className="field-error">{errors.price_per_kg?.message}</p></div>
          </div>
          <div>
            <label className="label">Bao bì / kg</label>
            <div className="mb-2 grid grid-cols-4 gap-2 text-xs">
              {[0, 3000, 5000, 7000].map((value) => <button key={value} type="button" className="chip-btn" onClick={() => form.setValue('packaging_cost_per_kg', value)}>{value.toLocaleString('vi-VN')}</button>)}
            </div>
            <input className="input" type="number" {...register('packaging_cost_per_kg')} />
          </div>
          <div>
            <label className="label">Thanh toán đã thu</label>
            <input className="input" type="number" {...register('paid_amount')} />
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-sm">
            <p>Doanh thu: <b>{formatCurrency(revenue)}</b></p>
            <p>VAT ({vatPercent}%): <b>{formatCurrency(vatValue)}</b> (tự khóa)</p>
            <p>Bao bì: <b>{formatCurrency(qty * packaging)}</b></p>
          </div>
        </div>
      </MobileSheet>

      <MobileSheet open={customerOpen} onClose={() => setCustomerOpen(false)} title="Thêm khách hàng nhanh" footer={<button className="btn w-full" onClick={customerForm.handleSubmit(createCustomer)}>Lưu khách hàng</button>}>
        <div className="space-y-3">
          <div>
            <label className="label">Tên khách hàng</label>
            <input className="input" {...customerForm.register('name')} />
            <p className="field-error">{customerForm.formState.errors.name?.message}</p>
          </div>
        </div>
      </MobileSheet>
    </div>
  )
}
