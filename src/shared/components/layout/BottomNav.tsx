import { NavLink } from 'react-router-dom'

export function BottomNav() {
  const navItems = [
    { label: 'Campaigns', path: '/', icon: '🏰' },
    { label: 'Rules', path: '/rules', icon: '📖' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 pb-safe">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-md px-4 py-1 transition-colors ${
                isActive
                  ? 'text-amber-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
