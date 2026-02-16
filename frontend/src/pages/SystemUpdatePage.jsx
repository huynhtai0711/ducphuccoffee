import { useEffect, useState } from 'react'
import client from '../api/client'
import { toast } from 'sonner'
import PageHeader from '../components/PageHeader'
import { apiErrorMessage } from '../lib/utils'

export default function SystemUpdatePage() {
  const [info, setInfo] = useState(null)
  const [restartCmd, setRestartCmd] = useState('docker compose restart')

  useEffect(() => {
    client.get('/system/update/info').then((r) => setInfo(r.data)).catch(() => setInfo(null))
  }, [])

  const backup = async () => {
    try {
      const res = await client.post('/system/update/backup')
      toast.success(`Đã backup: ${res.data.backup}`)
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  const upload = async (e) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      const fd = new FormData()
      fd.append('file', file)
      const res = await client.post('/system/update/upload', fd)
      setRestartCmd(res.data.restart_cmd)
      toast.success('Cập nhật thành công')
    } catch (error) {
      toast.error(apiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Hệ thống / Update" description="Chỉ dành cho Admin" />
      <section className="rounded-2xl bg-white p-4 shadow-sm text-sm">
        <p>App version: <b>{info?.app_version || '--'}</b></p>
        <p>Schema version: <b>{info?.schema_version || '--'}</b></p>
      </section>
      <button className="btn" onClick={backup}>Backup database</button>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="label">Upload update.zip</label>
        <input className="input" type="file" accept=".zip" onChange={upload} />
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-sm text-sm">
        <p className="mb-2">Lệnh restart:</p>
        <button className="rounded-lg bg-stone-100 px-3 py-2 text-left" onClick={() => navigator.clipboard.writeText(restartCmd)}>{restartCmd}</button>
      </section>
    </div>
  )
}
