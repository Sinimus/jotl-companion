import { Link, useSearchParams } from 'react-router-dom'
import { tabSearch } from '@/shared/lib/tabs'

export interface TabItem<T extends string> {
  id: T
  label: string
}

interface TabNavProps<T extends string> {
  tabs: readonly TabItem<T>[]
  active: T
  /** The tab whose address carries no `?tab=` parameter. */
  fallback: T
  label: string
}

/**
 * Tabs as links: every tab has an address of its own, so the browser's Back button
 * and a reload keep the place, and a link to a tab can be shared.
 */
export function TabNav<T extends string>({ tabs, active, fallback, label }: TabNavProps<T>) {
  const [params] = useSearchParams()

  return (
    <nav aria-label={label} className="flex border-t border-zinc-800">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={{ search: tabSearch(params, tab.id, fallback) }}
          aria-current={active === tab.id ? 'page' : undefined}
          className={`flex min-h-11 flex-1 items-center justify-center py-3 text-sm font-medium transition-colors ${
            active === tab.id
              ? 'border-b-2 border-amber-500 text-amber-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
