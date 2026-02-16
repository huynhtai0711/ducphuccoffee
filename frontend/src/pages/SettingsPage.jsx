import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import { apiErrorMessage } from '../lib/utils'

export default function SettingsPage() {
  const [beans, setBeans] = useState([])
  const [name, setName] = useState('')

  const load = () => client.get('/beans').then((r) => setBeans(r.data))
  useEffect(() => { load() }, [])

  const createBean = async () => {
    if (!name.trim()) return
    try {
      await client.post('/beans', { name, enabled: true })
      toast.success('Đã thêm loại nhân')
      setName('')
      load()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Thiết lập" description="Ngưỡng cảnh báo mặc định 60kg và quản lý loại nhân" />
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Ngưỡng cảnh báo tồn kho</h3>
        <p className="text-sm text-stone-500">Hiện đang áp dụng 60kg theo backend.</p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Loại nhân</h3>
        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="Tên loại nhân" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" onClick={createBean}>Thêm</button>
        </div>
        <div className="mt-3 space-y-2">
          {beans.map((bean) => <div key={bean.id} className="rounded-xl border p-2 text-sm">{bean.name}</div>)}
        </div>
      </section>
    </div>
  )
}
