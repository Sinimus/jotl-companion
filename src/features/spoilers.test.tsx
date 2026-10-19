import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { items, scenarios, treasures } from '@/data'
import { itemAvailability } from '@/features/campaign/rules'
import { ItemShop } from '@/features/characters/ItemShop'
import { ScenarioTracker } from '@/features/campaign/ScenarioTracker'
import { TreasureTracker } from '@/features/campaign/TreasureTracker'
import type { CharacterProgress, ScenarioStatus } from '@/shared/schemas'

// What the player has not unlocked or revealed must not be in the page at all, not even
// hidden by CSS (ruling r193). The markup of the first render is what a reader or a
// view-source would see.

const status: Record<number, ScenarioStatus> = {}
for (const scenario of scenarios) status[scenario.id] = 'locked'
status[1] = 'completed'
status[2] = 'unlocked'

const lockedScenarios = scenarios.filter((scenario) => status[scenario.id] === 'locked')

const hero: CharacterProgress = {
  id: '11111111-2222-4333-8444-555555555555',
  type: 'hatchet',
  name: 'Hatchet',
  experience: 0,
  gold: 100,
  checkmarks: 0,
  perkIds: [],
  itemIds: [],
  equippedItemIds: [],
  selectedAbilityIds: [],
  unlockedAbilityIds: [],
  bonusPerks: 0,
}

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>)

describe('spoilers stay out of the DOM', () => {
  it('the scenario list shows no name or place of a locked scenario', () => {
    const markup = html(<ScenarioTracker campaignId="c1" scenarioStatus={status} />)
    expect(lockedScenarios.length).toBeGreaterThan(10)
    for (const scenario of lockedScenarios) {
      expect(markup).not.toContain(scenario.name)
    }
    const names = new Set(lockedScenarios.map((scenario) => scenario.name))
    // a scenario that shares its name with an open one would make the check above pointless
    for (const scenario of scenarios.filter((s) => status[s.id] !== 'locked')) {
      expect(names.has(scenario.name)).toBe(false)
    }
  })

  it('a locked scenario 20-25 names the city event that unlocks it and nothing more', () => {
    const markup = html(<ScenarioTracker campaignId="c1" scenarioStatus={status} />)
    for (const event of [17, 18, 19, 20, 21, 22]) {
      expect(markup).toContain(`City event ${event} unlocks it`)
    }
    expect(markup.match(/City event \d+ unlocks it/g)).toHaveLength(6)
    const unlocked = html(<ScenarioTracker campaignId="c1" scenarioStatus={{ ...status, 20: 'unlocked' }} />)
    expect(unlocked).not.toContain('City event 17 unlocks it')
  })

  it('an open scenario keeps its goal, monsters and rewards behind the buttons', () => {
    const markup = html(<ScenarioTracker campaignId="c1" scenarioStatus={status} />)
    const open = scenarios.find((scenario) => status[scenario.id] === 'unlocked')
    expect(markup).toContain(open?.name)
    expect(markup).not.toContain('Reveal spoilers')
    expect(markup).not.toContain('Goal:')
    for (const scenario of scenarios) {
      for (const monster of scenario.monsters) {
        if (monster.length > 4) expect(markup).not.toContain(monster)
      }
    }
  })

  it('the treasure list shows no reward and no locked scenario name', () => {
    const markup = html(
      <TreasureTracker campaignId="c1" lootedTreasureIds={[]} scenarioStatus={status} />,
    )
    for (const treasure of treasures) {
      expect(markup).not.toContain(treasure.reward)
    }
    for (const scenario of lockedScenarios) {
      expect(markup).not.toContain(scenario.name)
    }
  })

  it('the shop shows no name or effect of a locked item', () => {
    const markup = html(
      <ItemShop
        character={hero}
        party={[hero]}
        scenarioStatus={status}
        lootedTreasureIds={[]}
        soldItemIds={[]}
        onBuy={() => undefined}
        onGain={() => undefined}
        onClose={() => undefined}
      />,
    )
    const campaign = { scenarioStatus: status, lootedTreasureIds: [], soldItemIds: [] }
    const locked = items.filter((item) => itemAvailability(item, campaign) === 'locked')
    expect(locked.length).toBeGreaterThan(0)
    for (const item of locked) {
      expect(markup).not.toContain(item.name)
      expect(markup).not.toContain(item.effect)
    }
  })
})
