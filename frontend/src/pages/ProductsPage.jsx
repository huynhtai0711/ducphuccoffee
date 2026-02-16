import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import MobileSheet from '../components/MobileSheet'
import EmptyState from '../components/EmptyState'
import { apiErrorMessage } from '../lib/utils'

const recipeSchema = z.object({ bean_type_id: z.coerce.number().min(1), ratio_percent: z.coerce.number().gt(0) })
const schema = z.object({
  name: z.string().min(2, 'Nhập tên sản phẩm'),
  vat_type: z.enum(['VAT', 'NOVAT']),
  recipes: z.array(recipeSchema).min(1).max(4),
}).refine((value) => value.recipes.reduce((sum, item) => sum + item.ratio_percent, 0) === 100, { message: 'Tổng công thức phải = 100%', path: ['recipes'] })

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [beans, setBeans] = useState([])
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { vat_type: 'VAT', recipes: [{ bean_type_id: '', ratio_percent: '' }] } })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'recipes' })

  const load = async () => {
    setProducts((await client.get('/products')).data)
    setBeans((await client.get('/beans')).data)
  }
  useEffect(() => { load() }, [])

  const submit = async (values) => {
    try {
      await client.post('/products', values)
      toast.success('Đã tạo sản phẩm')
      setOpen(false)
      form.reset({ vat_type: 'VAT', recipes: [{ bean_type_id: '', ratio_percent: '' }] })
      load()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  const total = form.watch('recipes')?.reduce((sum, item) => sum + Number(item.ratio_percent || 0), 0) || 0

  return (
    <div className="space-y-4">
      <PageHeader title="Sản phẩm" description="Recipe tối đa 4 loại nhân, tổng bắt buộc = 100%" action={<button className="btn" onClick={() => setOpen(true)}>+ Thêm sản phẩm</button>} />
      <div className="space-y-2">
        {!products.length ? <EmptyState title="Chưa có sản phẩm" /> : products.map((product) => (
          <article key={product.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-stone-500">Nguồn VAT: {product.vat_type === 'VAT' ? 'VAT (8%)' : 'Không VAT (0%)'}</p>
            <p className="text-xs mt-2">Số thành phần: {product.recipes?.length || 0}</p>
          </article>
        ))}
      </div>

      <MobileSheet open={open} onClose={() => setOpen(false)} title="Tạo sản phẩm" footer={<button className="btn w-full" onClick={form.handleSubmit(submit)}>Lưu sản phẩm</button>}>
        <div className="space-y-3">
          <div><label className="label">Tên sản phẩm</label><input className="input" {...form.register('name')} /><p className="field-error">{form.formState.errors.name?.message}</p></div>
          <div><label className="label">Nguồn VAT thành phẩm</label><select className="input" {...form.register('vat_type')}><option value="VAT">VAT</option><option value="NOVAT">Không VAT</option></select></div>
          <div className="rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between"><p className="font-medium">Công thức</p><button type="button" className="chip-btn" onClick={() => append({ bean_type_id: '', ratio_percent: '' })} disabled={fields.length >= 4}>+ Thành phần</button></div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_100px_56px] gap-2">
                  <select className="input" {...form.register(`recipes.${index}.bean_type_id`)}>
                    <option value="">Nhân</option>
                    {beans.map((bean) => <option key={bean.id} value={bean.id}>{bean.name}</option>)}
                  </select>
                  <input className="input" type="number" placeholder="%" {...form.register(`recipes.${index}.ratio_percent`)} />
                  <button type="button" className="rounded-xl bg-red-50 text-red-600" onClick={() => remove(index)}>Xóa</button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm">Tổng: <b className={total === 100 ? 'text-green-600' : 'text-red-600'}>{total}%</b></p>
            <p className="field-error">{form.formState.errors.recipes?.message}</p>
          </div>
        </div>
      </MobileSheet>
    </div>
  )
}
