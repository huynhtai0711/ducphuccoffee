import { LogOut, Plus } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import BottomNav from './BottomNav'
import { mainNavItems } from './navigation'
import { useMemo, useState } from 'react'

export default function AppLayout({ user, onLogout }) {
  const navItems = useMemo(() => mainNavItems.filter((item) => item.roles.includes(user.role)), [user.role])
  const quickActions = navItems.filter((item) => ['/purchases', '/roast', '/sales', '/crm'].includes(item.to))
  const [fabOpen, setFabOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white p-5 md:block">
        <p className="text-xs font-medium uppercase text-amber-700">Coffee Roastery</p>
        <h2 className="mt-1 text-xl font-semibold">Manager</h2>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-100'}`}>
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="pb-24 md:ml-64 md:pb-8">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-stone-100/90 px-4 py-3 backdrop-blur md:px-8">
          <div>
            <p className="text-sm font-medium">Xin chào, {user.full_name || user.username}</p>
            <p className="text-xs text-stone-500">Vai trò: {user.role}</p>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-medium text-stone-600 shadow-sm">
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>

        <div className="p-4 md:p-8"><Outlet /></div>
      </main>

      <BottomNav role={user.role} />

      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        {fabOpen && (
          <div className="mb-2 w-44 space-y-2 rounded-2xl bg-white p-3 shadow-lg">
            {quickActions.map((item) => (
              <button
                key={item.to}
                className="block w-full rounded-lg bg-stone-100 px-3 py-2 text-left text-sm"
                onClick={() => {
                  navigate(item.to)
                  setFabOpen(false)
                }}
              >
                + {item.label}
              </button>
            ))}
          </div>
        )}
        <button className="rounded-full bg-amber-700 p-4 text-white shadow-xl" onClick={() => setFabOpen((v) => !v)}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}
