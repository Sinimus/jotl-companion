import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppRoutes } from './routes.tsx'
import { useCampaignStore } from '@/features/campaign'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

export function App() {
  const initStore = useCampaignStore((s) => s.initStore)
  const isLoaded = useCampaignStore((s) => s.isLoaded)

  useEffect(() => {
    void initStore()
  }, [initStore])

  if (!isLoaded) {
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
