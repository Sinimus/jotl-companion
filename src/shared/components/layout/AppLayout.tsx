import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
