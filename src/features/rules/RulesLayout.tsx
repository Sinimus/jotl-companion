import { Outlet, NavLink } from 'react-router-dom'

const RULES_TABS = [
  { to: '/rules/glossary', label: 'Glossary' },
  { to: '/rules/round', label: 'Round' },
  { to: '/rules/reference', label: 'Reference' },
  { to: '/rules/monster-turn', label: 'Monster Turn' },
]

export function RulesLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4">
          <nav aria-label="Rules sections" className="flex gap-4 overflow-x-auto sm:gap-6">
            {RULES_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex min-h-11 shrink-0 items-center border-b-2 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-amber-500 text-amber-500'
                      : 'border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <Outlet />
    </div>
  )
}
