import { useEffect, useState } from 'react'
import client from '../api/client'
import { toast } from 'sonner'

export default function SystemUpdatePage() {
  const [info, setInfo] = useState(null)
  const [restartCmd, setRestartCmd] = useState('docker compose restart')
  useEffect(() => { client.get('/system/update/info').then((r) => setInfo(r.data)).catch(() => {}) }, [])

  const backup = async () => {
    const res = await client.post('/system/update/backup')
    toast.success(`Đã backup: ${res.data.backup}`)
  }

  const upload = async (e) => {
    const fd = new FormData(); fd.append('file', e.target.files[0])
    const res = await client.post('/system/update/upload', fd)
    setRestartCmd(res.data.restart_cmd)
    toast.success('Cập nhật thành công')
  }

  return <div className="p-4 pb-24 space-y-2">
    <div className="card">Version: {info?.app_version} | Schema: {info?.schema_version}</div>
    <button className="btn" onClick={backup}>Backup DB</button>
    <input type="file" accept=".zip" onChange={upload} />
    <div className="card text-xs">Lệnh restart: <button className="underline" onClick={() => navigator.clipboard.writeText(restartCmd)}>{restartCmd}</button></div>
  </div>
}
