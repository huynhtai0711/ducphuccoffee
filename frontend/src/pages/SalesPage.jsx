import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import client from '../api/client'
import { toast } from 'sonner'

export default function SalesPage() {
  const { register, handleSubmit } = useForm()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  useEffect(() => {
    client.get('/products').then((r) => setProducts(r.data))
    client.get('/customers').then((r) => setCustomers(r.data)).catch(() => {})
  }, [])

  const submit = async (data) => {
    try {
      await client.post('/sales', {
        ...data,
        customer_id: Number(data.customer_id),
        product_id: Number(data.product_id),
        quantity_kg: Number(data.quantity_kg),
        price_per_kg: Number(data.price_per_kg),
        packaging_cost_per_kg: Number(data.packaging_cost_per_kg || 0),
      })
      toast.success('Tạo đơn hàng thành công')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Lỗi tạo đơn')
    }
  }

  return <form onSubmit={handleSubmit(submit)} className="p-4 pb-24 space-y-2">
    <select className="input" {...register('customer_id')}>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <select className="input" {...register('product_id')}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <input className="input" placeholder="Số kg" {...register('quantity_kg')} />
    <input className="input" placeholder="Giá/kg" {...register('price_per_kg')} />
    <input className="input" placeholder="Bao bì/kg" {...register('packaging_cost_per_kg')} />
    <button className="btn">Lưu đơn bán</button>
  </form>
}
