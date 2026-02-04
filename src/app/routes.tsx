import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CampaignList, CampaignDetail, CharacterDetail } from '@/features/campaign'
import { AppLayout } from '@/shared/components/layout/AppLayout'

// ---------------------------------------------------------------------------
// Lazy-loaded route modules — split from the critical campaign path so the
// initial paint only ships CampaignList + CampaignDetail + CharacterDetail.
// ---------------------------------------------------------------------------
const PostScenarioChecklist = lazy(() =>
  import('@/features/scenarios/PostScenarioChecklist').then((m) => ({ default: m.PostScenarioChecklist })),
)
const CalculatorPage = lazy(() =>
  import('@/features/calculators/CalculatorPage').then((m) => ({ default: m.CalculatorPage })),
)
const RulesLayout = lazy(() =>
  import('@/features/rules/RulesLayout').then((m) => ({ default: m.RulesLayout })),
)
const GlossaryPage = lazy(() =>
  import('@/features/rules/GlossaryPage').then((m) => ({ default: m.GlossaryPage })),
)
const ReferencePage = lazy(() =>
  import('@/features/rules/ReferencePage').then((m) => ({ default: m.ReferencePage })),
)
const FocusHelperPage = lazy(() =>
  import('@/features/rules/FocusHelperPage').then((m) => ({ default: m.FocusHelperPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const HandbookPage = lazy(() =>
  import('@/features/settings/HandbookPage').then((m) => ({ default: m.HandbookPage })),
)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CampaignList />} />
        <Route path="/campaign/:id" element={<CampaignDetail />} />
        <Route path="/campaign/:campaignId/character/:characterId" element={<CharacterDetail />} />
        <Route path="/campaign/:campaignId/checklist" element={<PostScenarioChecklist />} />
        <Route path="/campaign/:campaignId/calculators" element={<CalculatorPage />} />
        
        <Route path="/rules" element={<RulesLayout />}>
          <Route index element={<GlossaryPage />} />
          <Route path="glossary" element={<GlossaryPage />} />
          <Route path="reference" element={<ReferencePage />} />
          <Route path="focus-helper" element={<FocusHelperPage />} />
        </Route>

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/handbook" element={<HandbookPage />} />
      </Route>
    </Routes>
  )
}