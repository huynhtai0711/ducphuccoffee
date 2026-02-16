import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import client from '../api/client'
import { toast } from 'sonner'

const PAGE_SIZE = 8

export default function SalesPage() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [rows, setRows] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { packaging_cost_per_kg: 0, vat_percent_override: '', paid_amount: 0 },
  })
  const customerForm = useForm({ defaultValues: { status: 'active', pipeline_stage: 'Lead' } })

  const selectedProductId = Number(watch('product_id'))

  const load = async () => {
    const [pRes, cRes, sRes] = await Promise.all([
      client.get('/products'),
      client.get('/customers'),
      client.get('/sales'),
    ])
    setProducts(pRes.data)
    setCustomers(cRes.data)
    setRows(sRes.data.filter((item) => !item.deleted))
  }

  useEffect(() => { load().catch(() => toast.error('Không thể tải dữ liệu')) }, [])

  const filteredRows = useMemo(() => rows.filter((row) => {
    const customer = customers.find((c) => c.id === row.customer_id)
    const product = products.find((p) => p.id === row.product_id)
    const text = `${customer?.name || ''} ${product?.name || ''}`.toLowerCase()
    const soldDate = new Date(row.sold_at).toISOString().slice(0, 10)
    const inSearch = !search || text.includes(search.toLowerCase())
    const inStart = !startDate || soldDate >= startDate
    const inEnd = !endDate || soldDate <= endDate
    return inSearch && inStart && inEnd
  }), [rows, search, startDate, endDate, customers, products])

  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  const productVat = products.find((p) => p.id === selectedProductId)?.vat_type === 'VAT' ? 8 : 0

  const onSubmit = async (data) => {
    const vatPercent = data.vat_percent_override === '' ? productVat : Number(data.vat_percent_override)
    if (data.vat_percent_override !== '' && vatPercent !== productVat) {
      toast.warning('VAT khác cấu hình sản phẩm, hệ thống sẽ lưu theo giá trị bạn nhập.')
    }

    try {
      await client.post('/sales', {
        customer_id: Number(data.customer_id),
        product_id: Number(data.product_id),
        quantity_kg: Number(data.quantity_kg),
        price_per_kg: Number(data.price_per_kg),
        packaging_cost_per_kg: Number(data.packaging_cost_per_kg || 0),
        vat_percent_override: vatPercent,
        paid_amount: Number(data.paid_amount || 0),
      })
      toast.success('Tạo đơn hàng thành công')
      reset({ packaging_cost_per_kg: 0, vat_percent_override: '', paid_amount: 0 })
      setShowModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Lỗi tạo đơn')
    }
  }

  const createQuickCustomer = async (data) => {
    try {
      const res = await client.post('/customers', data)
      setCustomers((prev) => [res.data, ...prev])
      customerForm.reset({ status: 'active', pipeline_stage: 'Lead' })
      setShowCustomerModal(false)
      toast.success('Đã thêm khách hàng mới')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Không thể tạo khách hàng')
    }
  }

  return <div className="space-y-3">
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Lịch sử bán hàng</h2>
        <button className="btn" onClick={() => setShowModal(true)}>Tạo đơn hàng mới</button>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <input className="input" placeholder="Tìm theo khách/sản phẩm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <input className="input" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
        <input className="input" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
      </div>

      <div className="mt-3 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">Ngày</th><th className="p-2">Khách</th><th className="p-2">Sản phẩm</th><th className="p-2">Kg</th><th className="p-2">Giá/kg</th><th className="p-2">VAT</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => <tr className="border-b" key={row.id}>
              <td className="p-2">{new Date(row.sold_at).toLocaleDateString('vi-VN')}</td>
              <td className="p-2">{customers.find((c) => c.id === row.customer_id)?.name || `#${row.customer_id}`}</td>
              <td className="p-2">{products.find((p) => p.id === row.product_id)?.name || `#${row.product_id}`}</td>
              <td className="p-2">{row.quantity_kg}</td>
              <td className="p-2">{Number(row.price_per_kg).toLocaleString()}</td>
              <td className="p-2">{row.vat_percent}%</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button className="rounded border px-3 py-1 text-sm disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
        <span className="text-sm">Trang {page}/{totalPages}</span>
        <button className="rounded border px-3 py-1 text-sm disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</button>
      </div>
    </div>

    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl space-y-2 rounded-xl bg-white p-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Tạo đơn hàng mới</h3><button type="button" onClick={() => setShowModal(false)}>✕</button></div>

        <div className="flex items-center gap-2">
          <select className="input" {...register('customer_id', { required: 'Vui lòng chọn khách hàng' })}>
            <option value="">Chọn khách hàng</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setShowCustomerModal(true)}>+ Thêm khách hàng</button>
        </div>
        {errors.customer_id && <p className="text-xs text-red-600">{errors.customer_id.message}</p>}

        <select className="input" {...register('product_id', { required: 'Vui lòng chọn sản phẩm' })}>
          <option value="">Chọn sản phẩm</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {errors.product_id && <p className="text-xs text-red-600">{errors.product_id.message}</p>}

        <input className="input" placeholder="Số kg bán" type="number" step="0.01" {...register('quantity_kg', { required: 'Bắt buộc', min: { value: 0.01, message: 'Phải > 0' } })} />
        {errors.quantity_kg && <p className="text-xs text-red-600">{errors.quantity_kg.message}</p>}

        <input className="input" placeholder="Giá bán / kg" type="number" step="1000" {...register('price_per_kg', { required: 'Bắt buộc', min: { value: 1, message: 'Phải > 0' } })} />
        {errors.price_per_kg && <p className="text-xs text-red-600">{errors.price_per_kg.message}</p>}

        <input className="input" placeholder="Bao bì / kg" type="number" step="100" {...register('packaging_cost_per_kg', { min: { value: 0, message: 'Không âm' } })} />
        {errors.packaging_cost_per_kg && <p className="text-xs text-red-600">{errors.packaging_cost_per_kg.message}</p>}

        <input className="input" placeholder={`VAT gợi ý: ${productVat}%`} type="number" {...register('vat_percent_override')} />
        <input className="input" placeholder="Số tiền đã thu" type="number" step="1000" {...register('paid_amount', { min: { value: 0, message: 'Không âm' } })} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="rounded border px-3 py-2" onClick={() => setShowModal(false)}>Hủy</button>
          <button className="btn">Lưu đơn</button>
        </div>
      </form>
    </div>}

    {showCustomerModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <form className="w-full max-w-md space-y-2 rounded-xl bg-white p-4" onSubmit={customerForm.handleSubmit(createQuickCustomer)}>
        <div className="flex items-center justify-between"><h3 className="font-semibold">Thêm khách hàng nhanh</h3><button type="button" onClick={() => setShowCustomerModal(false)}>✕</button></div>
        <input className="input" placeholder="Tên khách hàng" {...customerForm.register('name', { required: true })} />
        <input className="input" placeholder="Số điện thoại" {...customerForm.register('phone')} />
        <input className="input" placeholder="Địa chỉ" {...customerForm.register('address')} />
        <button className="btn w-full">Lưu khách hàng</button>
      </form>
    </div>}
  </div>
}
