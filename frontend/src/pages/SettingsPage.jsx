import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import client from '../api/client'

export default function SettingsPage() {
  const [settings, setSettings] = useState({ low_stock_threshold_kg: 60, warehouse_can_create_sales: true })
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ username: '', full_name: '', password: '', role: 'WAREHOUSE' })

  const load = async () => {
    const [s, u] = await Promise.all([client.get('/settings'), client.get('/users')])
    setSettings(s.data)
    setUsers(u.data)
  }
  useEffect(() => { load() }, [])

  const saveSettings = async () => {
    await client.put('/settings', settings)
    toast.success('Đã lưu cài đặt')
  }

  const createUser = async () => {
    await client.post('/users', newUser)
    toast.success('Đã tạo user')
    setNewUser({ username: '', full_name: '', password: '', role: 'WAREHOUSE' })
    load()
  }

  return <div className="space-y-3">
    <div className="card space-y-2">
      <h2 className="font-semibold">Cấu hình hệ thống</h2>
      <label>Ngưỡng cảnh báo tồn (kg)</label>
      <input className="input" type="number" value={settings.low_stock_threshold_kg || 60} onChange={(e) => setSettings({ ...settings, low_stock_threshold_kg: Number(e.target.value) })} />
      <label className="chip"><input type="checkbox" checked={!!settings.warehouse_can_create_sales} onChange={(e) => setSettings({ ...settings, warehouse_can_create_sales: e.target.checked })} /> Cho phép KHO tạo đơn bán</label>
      <button className="btn" onClick={saveSettings}>Lưu cài đặt</button>
    </div>
    <div className="card space-y-2">
      <h2 className="font-semibold">Quản lý user</h2>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
        <input className="input" placeholder="Họ tên" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
        <input className="input" placeholder="Mật khẩu" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
        <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}><option>WAREHOUSE</option><option>SALES</option><option>ADMIN</option></select>
      </div>
      <button className="btn" onClick={createUser}>Tạo user</button>
      {users.map((u) => <div key={u.id} className="text-sm border-t pt-1">{u.username} - {u.role} - {u.active ? 'Đang hoạt động' : 'Đã khóa'}</div>)}
    </div>
  </div>
}
