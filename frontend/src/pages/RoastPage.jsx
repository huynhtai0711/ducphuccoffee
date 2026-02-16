import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import client from '../api/client'
import { toast } from 'sonner'

export default function RoastPage() {
  const { register, handleSubmit } = useForm()
  const [products, setProducts] = useState([])
  useEffect(() => { client.get('/products').then((r) => setProducts(r.data)) }, [])

  const submit = async (data) => {
    try {
      await client.post('/roasts', { ...data, product_id: Number(data.product_id), input_green_kg: Number(data.input_green_kg), output_finished_kg: Number(data.output_finished_kg) })
      toast.success('Tạo mẻ rang thành công')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Lỗi tạo mẻ rang')
    }
  }

  return <form onSubmit={handleSubmit(submit)} className="p-4 pb-24 space-y-2">
    <select className="input" {...register('product_id')}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <input className="input" placeholder="Đầu vào xanh (kg)" {...register('input_green_kg')} />
    <input className="input" placeholder="Đầu ra thành phẩm (kg)" {...register('output_finished_kg')} />
    <button className="btn">+ Roast</button>
  </form>
}
