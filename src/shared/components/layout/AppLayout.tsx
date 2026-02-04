import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <main className="flex-1 pb-24">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <p className="text-zinc-500">Loading…</p>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <BottomNav />
    </div>
  )
}
