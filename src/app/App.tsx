import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes.tsx'
import { useCampaignStore } from '@/features/campaign'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

export function App() {
  const initStore = useCampaignStore((s) => s.initStore)

  useEffect(() => {
    void initStore()
  }, [initStore])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  )
}
