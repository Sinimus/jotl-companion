import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { scenarios } from '@/data'
import { CampaignSchema, type Campaign, type ScenarioStatus } from '@/shared/schemas'
import { LearningGuide } from './LearningGuidePage'
import { FinishScenario } from './PostScenarioChecklist'
import { ScenarioBriefing } from '@/features/calculators/ScenarioBriefing'

// First render of the S5 campaign pages for a loaded campaign, as a reader or
// a view-source would see it.

const CAMPAIGN_ID = '6f1c2f3e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'

function campaignAt(completed: number[], unlocked: number[]): Campaign {
  const status: Record<number, ScenarioStatus> = {}
  for (const s of scenarios) status[s.id] = 'locked'
  for (const id of completed) status[id] = 'completed'
  for (const id of unlocked) status[id] = 'unlocked'
  return CampaignSchema.parse({
    id: CAMPAIGN_ID,
    name: 'Friday group',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    characters: [
      {
        id: '11111111-2222-4333-8444-555555555555',
        type: 'hatchet',
        name: 'Axe',
        experience: 0,
        gold: 0,
        checkmarks: 0,
        perkIds: [],
        itemIds: [],
        selectedAbilityIds: [],
      },
    ],
    scenarioStatus: status,
    cityEventsDrawn: [],
    lootedTreasureIds: [],
  })
}

const html = (node: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>)

describe('LearningGuidePage', () => {
  it('marks the next learning scenario and names the party cards that change', () => {
    const markup = html(<LearningGuide campaign={campaignAt([1], [2])} />)
    expect(markup).toContain('Your party has completed 1 of 5')
    expect(markup).toContain('6 cards')
    expect(markup).toContain('Up next')
    // After Scenario 2 the Hatchet adds The Favorite and Retrieval (LtP p.19).
    expect(markup).toContain('The Favorite (1)')
    expect(markup).toContain('Retrieval (1)')
    expect(markup).toContain('Learn to Play p.14-18')
  })

  it('keeps the names of locked learning scenarios out of the page (r193)', () => {
    const markup = html(<LearningGuide campaign={campaignAt([1], [2])} />)
    for (const id of [3, 4, 5]) {
      const name = scenarios.find((s) => s.id === id)?.name ?? ''
      expect(markup).not.toContain(name)
    }
    expect(markup).toContain(scenarios[1].name)
  })

  it('says when the learning scenarios are behind the party', () => {
    const markup = html(<LearningGuide campaign={campaignAt([1, 2, 3, 4, 5], [6])} />)
    expect(markup).toContain('finished the learning scenarios')
    expect(markup).not.toContain('Up next')
  })
})

describe('FinishScenario', () => {
  it('offers only unlocked scenarios and keeps the names of what it unlocks out of the page', () => {
    const markup = html(<FinishScenario campaign={campaignAt([1, 2, 3, 4, 5, 6], [7, 8])} />)
    expect(markup).toContain('1. Scenario and outcome')
    expect(markup).toContain('2. What each character collected')
    expect(markup).toContain('Experience from the dial')
    expect(markup).toContain('Battle goal met')
    expect(markup).toContain('Unlocks scenario 9')
    expect(markup).toContain('Closes scenario 8')
    const scenarioNine = scenarios.find((s) => s.id === 9)?.name ?? ''
    expect(markup).not.toContain(scenarioNine)
    expect(markup).not.toContain('>1 Roadside Ambush<')
  })

  it('asks for no experience before Scenario 3 and no battle goal before Scenario 4', () => {
    const markup = html(<FinishScenario campaign={campaignAt([1], [2])} />)
    expect(markup).toContain('Money tokens')
    expect(markup).not.toContain('Experience from the dial')
    expect(markup).not.toContain('Battle goal met')
    expect(markup).toContain('25 gold each')
  })
})

describe('ScenarioBriefing', () => {
  it('shows level, traps and hands but keeps monsters and rewards out of the page until revealed (r193)', () => {
    const markup = html(<ScenarioBriefing campaign={campaignAt([1, 2, 3, 4, 5, 6], [7, 8])} partyScenarioLevel={3} />)
    const seven = scenarios.find((s) => s.id === 7)
    expect(markup).toContain('Sunken Tumor')
    expect(markup).toContain('Trap damage')
    expect(markup).toContain('>5<') // trap damage at level 3 (LtP p.29)
    expect(markup).toContain('hand 0 / 10')
    expect(markup).toContain('Deal two battle goals')
    expect(markup).toContain('Reveal monsters and rewards')
    // The goal is shown openly (as in the scenario list) and may name a boss.
    const hidden = [...(seven?.monsters ?? []), ...(seven?.rewards ?? [])].filter((text) => !seven?.goal.includes(text))
    expect(hidden.length).toBeGreaterThan(1)
    for (const text of hidden) {
      expect(markup).not.toContain(text)
    }
    expect(markup).not.toContain('Explosive Evolution') // what 7 unlocks
  })

  it('uses level 1 for the learning scenarios whatever the party level', () => {
    const markup = html(<ScenarioBriefing campaign={campaignAt([1, 2], [3])} partyScenarioLevel={4} />)
    expect(markup).toContain('Scenarios 1–5 are played at level 1')
    expect(markup).toContain('hand 0 / 8')
  })
})
