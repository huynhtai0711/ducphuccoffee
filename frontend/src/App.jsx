import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import RoastPage from './pages/RoastPage'
import SalesPage from './pages/SalesPage'
import CrmPage from './pages/CrmPage'
import SystemUpdatePage from './pages/SystemUpdatePage'
import BottomNav from './components/BottomNav'
import client from './api/client'

function PrivateLayout() {
  return (
    <div>
      <header className="p-3 bg-stone-900 text-white flex justify-between"><span>Coffee Roastery Manager</span><Link to="/system-update" className="text-xs">System</Link></header>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/roast" element={<RoastPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/system-update" element={<SystemUpdatePage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    if (loggedIn) {
      client.get('/auth/me').catch(() => {
        localStorage.removeItem('token')
        setLoggedIn(false)
      })
    }
  }, [loggedIn])

  return <BrowserRouter>
    <Toaster richColors position="top-center" />
    {loggedIn ? <PrivateLayout /> : <LoginPage onLogin={() => setLoggedIn(true)} />}
    {!loggedIn && <Navigate to="/" />}
  </BrowserRouter>
}
