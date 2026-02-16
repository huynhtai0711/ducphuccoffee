import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RoastPage from './pages/RoastPage'
import SalesPage from './pages/SalesPage'
import CrmPage from './pages/CrmPage'
import SystemUpdatePage from './pages/SystemUpdatePage'
import client from './api/client'
import AppLayout from './components/AppLayout'
import PurchasePage from './pages/PurchasePage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'

function PrivateRoutes({ user, onLogout }) {
  return (
    <Routes>
      <Route element={<AppLayout user={user} onLogout={onLogout} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/purchases" element={<PurchasePage />} />
        <Route path="/roast" element={<RoastPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/system-update" element={<SystemUpdatePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return
    client.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        toast.error('Phiên đăng nhập đã hết hạn')
      })
  }, [token])

  const onLogin = (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const onLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      {!token ? <LoginPage onLogin={onLogin} /> : user ? <PrivateRoutes user={user} onLogout={onLogout} /> : <div className="p-6">Đang tải phiên...</div>}
    </BrowserRouter>
  )
}
