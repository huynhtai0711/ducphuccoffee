import { NavLink } from 'react-router-dom'
import { mobileTabs } from './navigation'

export default function BottomNav({ role }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-white px-2 py-1 md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileTabs.filter((item) => item.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex flex-col items-center rounded-xl px-1 py-2 text-[11px] ${isActive ? 'text-amber-700 bg-amber-50' : 'text-stone-500'}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
