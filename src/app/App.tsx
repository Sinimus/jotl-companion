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
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        Loading...
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
