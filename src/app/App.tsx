import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppRoutes } from './routes.tsx'
import { MigrationGate } from './MigrationGate.tsx'
import { useCampaignStore } from '@/features/campaign'
import { readPendingMigration } from '@/shared/db'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

/** checking → gate (version-1 records found) or starting → ready. */
type Phase = 'checking' | 'gate' | 'starting'

export function App() {
  const initStore = useCampaignStore((s) => s.initStore)
  const isLoaded = useCampaignStore((s) => s.isLoaded)

  const [phase, setPhase] = useState<Phase>('checking')
  const [pendingRecords, setPendingRecords] = useState<unknown[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        // Peek before anything touches the `db` singleton: opening it runs
        // the upgrade at once, so the backup prompt must come first.
        const pending = await readPendingMigration()
        if (cancelled) return
        if (pending && pending.records.length > 0) {
          setPendingRecords(pending.records)
          setPhase('gate')
          return
        }
      } catch (error) {
        console.error('Failed to look for a pending migration:', error)
      }
      if (!cancelled) {
        setPhase('starting')
        void initStore()
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [initStore])

  if (phase === 'gate') {
    return (
      <MigrationGate
        records={pendingRecords}
        onUpdate={() => {
          setPhase('starting')
          void initStore()
        }}
      />
    )
  }

  if (phase !== 'starting' || !isLoaded) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-zinc-500">Initializing Campaign...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
        <Toaster richColors position="top-right" theme="dark" />
      </ErrorBoundary>
    </BrowserRouter>
  )
}
