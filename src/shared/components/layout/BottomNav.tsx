import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { isInSection } from '@/shared/lib/nav'

/** Line icons drawn for this app; they take the colour of the text (`currentColor`). */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

const navItems: { label: string; path: string; sections: string[]; icon: ReactNode }[] = [
  {
    label: 'Campaigns',
    path: '/',
    sections: ['/campaign'],
    icon: (
      <Icon>
        <path d="M5 21V4" />
        <path d="M5 4h12l-2.5 4.5L17 13H5" />
      </Icon>
    ),
  },
  {
    label: 'Rules',
    path: '/rules',
    sections: ['/rules'],
    icon: (
      <Icon>
        <path d="M12 6.5C10.5 5.3 8.2 4.8 4 5v13c4.2-.2 6.5.3 8 1.5 1.5-1.2 3.8-1.7 8-1.5V5c-4.2-.2-6.5.3-8 1.5z" />
        <path d="M12 6.5v13" />
      </Icon>
    ),
  },
  {
    label: 'Settings',
    path: '/settings',
    sections: ['/settings'],
    icon: (
      <Icon>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <path d="M16 4.5v5M8 14.5v5" />
      </Icon>
    ),
  },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <div className="flex h-16 items-stretch justify-around px-4">
        {navItems.map((item) => {
          const isActive = isInSection(pathname, item)
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-20 flex-col items-center justify-center gap-0.5 rounded-md px-4 transition-colors ${
                isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {item.icon}
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
