import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes.tsx'
import { useCampaignStore } from '@/features/campaign'

export function App() {
  const initStore = useCampaignStore((s) => s.initStore)

  // Hydrate the campaign store from Dexie once on mount.
  // initStore is a stable reference — this effect runs exactly once.
  useEffect(() => {
    void initStore()
  }, [initStore])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
