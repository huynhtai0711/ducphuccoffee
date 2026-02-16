import { BarChart3, Bean, Flame, Home, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Tổng quan', icon: Home },
  { to: '/inventory', label: 'Kho', icon: Bean },
  { to: '/roast', label: 'Rang', icon: Flame },
  { to: '/sales', label: 'Bán hàng', icon: BarChart3 },
  { to: '/crm', label: 'CRM', icon: Users },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 grid grid-cols-5 gap-1">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className="flex flex-col items-center text-xs">
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
