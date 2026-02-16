import { NavLink } from 'react-router-dom'
import { mobileTabs } from './navigation'

export default function BottomNav({ role }) {
  const items = mobileTabs.filter((item) => item.roles.includes(role))
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${items.length || 1}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className="flex flex-col items-center text-xs">
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
