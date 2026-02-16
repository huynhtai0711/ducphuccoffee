import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AppLayout from './components/AppLayout'
import PurchasePage from './pages/PurchasePage'
import RoastPage from './pages/RoastPage'
import ProductsPage from './pages/ProductsPage'
import CrmPage from './pages/CrmPage'
import SalesPage from './pages/SalesPage'
import CustomersPage from './pages/CustomersPage'
import FinancePage from './pages/FinancePage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import client from './api/client'

function PrivateApp({ user, onLogout }) {
  return <Routes>
    <Route element={<AppLayout user={user} onLogout={onLogout} />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/purchases" element={<PurchasePage />} />
      <Route path="/roast" element={<RoastPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/crm" element={<CrmPage />} />
      <Route path="/sales" element={<SalesPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/finance" element={<FinancePage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return
    client.get('/auth/me').then((r) => setUser(r.data)).catch(() => {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    })
  }, [token])

  return <BrowserRouter>
    <Toaster richColors position="top-center" />
    {!token || !user ? <LoginPage onLogin={async () => {
      const t = localStorage.getItem('token')
      setToken(t)
      const r = await client.get('/auth/me')
      setUser(r.data)
    }} /> : <PrivateApp user={user} onLogout={() => {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }} />}
  </BrowserRouter>
}
