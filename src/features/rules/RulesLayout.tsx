import { Outlet, NavLink } from 'react-router-dom'

export function RulesLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="flex gap-4 sm:gap-6">
            <NavLink
              to="/rules/glossary"
              className={({ isActive }) =>
                `border-b-2 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`
              }
            >
              Glossary
            </NavLink>
            <NavLink
              to="/rules/reference"
              className={({ isActive }) =>
                `border-b-2 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`
              }
            >
              Quick Reference
            </NavLink>
            <NavLink
              to="/rules/focus-helper"
              className={({ isActive }) =>
                `border-b-2 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`
              }
            >
              Focus Helper
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <Outlet />
    </div>
  )
}
