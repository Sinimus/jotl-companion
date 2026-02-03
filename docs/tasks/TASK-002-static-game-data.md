# TASK-002: Static Game Data

**Status:** `DONE`
**Priority:** `HIGH`
**Estimated Complexity:** `MEDIUM`
**Depends On:** TASK-001 (complete)

---

## Goal

Create static JSON data files for all game entities: characters, perks, items, scenarios, conditions, elements, and lookup tables. These files serve as the single source of truth for game rules and will be imported throughout the app.

---

## Context

The app needs static reference data extracted from the official Gloomhaven: Jaws of the Lion rulebooks. This data is **immutable** — it represents the game rules, not player state. All data comes from the docs in `docs/game-docs/`.

### Data Categories

1. **Characters** — 4 playable characters with stats per level
2. **Perks** — Attack modifier deck upgrades (15+ per character)
3. **Items** — Shop items with slots, costs, usage types
4. **Scenarios** — 17 campaign scenarios with unlock chains
5. **Conditions** — 11 status effects (poison, stun, etc.)
6. **Elements** — 6 elemental infusions
7. **Lookup Tables** — XP thresholds, scenario level conversions

---

## Files to Create

```
src/data/
├── characters.json       # Character definitions + stats per level
├── perks.json            # Perk definitions per character
├── items.json            # Item catalog (starter items only for now)
├── scenarios.json        # 17 scenarios with unlock graph
├── conditions.json       # Condition definitions
├── elements.json         # Element definitions
├── tables.json           # XP thresholds, scenario level table
└── index.ts              # Barrel export with TypeScript types
```

---

## Data Specifications

### 1. characters.json

```typescript
interface Character {
  id: string;                    // "demolitionist" | "hatchet" | "voidwarden" | "red_guard"
  name: string;                  // Display name
  race: string;                  // "Quatryl" | "Inox" | "Human" | "Valrath"
  role: string;                  // Brief role description
  handLimit: number;             // Starting hand size (9-11)
  hitPoints: Record<number, number>;  // Level -> max HP
  perkIds: string[];             // References to perks.json
}
```

**Character Data:**

| ID | Name | Race | Role | Hand Limit |
|----|------|------|------|------------|
| demolitionist | Demolitionist | Quatryl | Melee Damage, Obstacle Destruction | 9 |
| red_guard | Red Guard | Valrath | Protection, Monster Manipulation | 10 |
| hatchet | Hatchet | Inox | Ranged Damage, Looting | 11 |
| voidwarden | Voidwarden | Human | Healing, Support | 11 |

**Hit Points by Level (from character mats):**

| Level | Demolitionist | Red Guard | Hatchet | Voidwarden |
|-------|---------------|-----------|---------|------------|
| 1 | 8 | 10 | 8 | 6 |
| 2 | 9 | 12 | 9 | 7 |
| 3 | 11 | 14 | 11 | 8 |
| 4 | 12 | 16 | 12 | 9 |
| 5 | 14 | 18 | 14 | 10 |
| 6 | 15 | 20 | 15 | 11 |
| 7 | 17 | 22 | 17 | 12 |
| 8 | 18 | 24 | 18 | 13 |
| 9 | 20 | 26 | 20 | 14 |

---

### 2. perks.json

```typescript
interface Perk {
  id: string;                    // Unique ID: "{characterId}_{index}"
  characterId: string;           // Owner character
  description: string;           // Human-readable description
  count: number;                 // How many times this perk can be taken (1-3)
}
```

**Demolitionist Perks:**
1. Remove four +0 cards (x1)
2. Remove two -1 cards (x1)
3. Remove one -1 card and one +0 card (x1)
4. Replace one +0 card with one +2 MUDDLE card (x2)
5. Replace one -1 card with one +0 POISON card (x1)
6. Add one +2 card (x2)
7. Replace one -2 card with one +0 card (x1)
8. Replace one +1 card with one +2 card (x2)
9. Add one +1 "All adjacent enemies suffer 1 damage" card (x2)

**Red Guard Perks:**
1. Remove four +0 cards (x1)
2. Remove two -1 cards (x1)
3. Remove one -1 card and one +0 card (x1)
4. Replace one -1 card with one +1 card (x2)
5. Replace one +0 card with one +2 card (x1)
6. Replace one +1 card with one +2 card (x1)
7. Add one +1 Shield 1 card (x2)
8. Add one +2 card (x1)
9. Replace one +0 card with one +1 IMMOBILIZE card (x1)
10. Replace one +0 card with one +1 WOUND card (x1)

**Hatchet Perks:**
1. Remove two -1 cards (x1)
2. Replace one +0 card with one +2 MUDDLE card (x1)
3. Replace one +0 card with one +1 POISON card (x1)
4. Replace one +0 card with one +1 WOUND card (x1)
5. Replace one +0 card with one +1 IMMOBILIZE card (x1)
6. Replace one +0 card with one +0 PUSH 2 card (x1)
7. Replace one +0 card with one +0 STUN card (x2)
8. Add one +2 +2 card (x1)
9. Replace one +1 card with one +1 STUN card (x1)

**Voidwarden Perks:**
1. Remove two -1 cards (x1)
2. Remove one -2 card (x1)
3. Replace one +0 card with one +1 Dark card (x2)
4. Replace one +0 card with one +1 Ice card (x2)
5. Replace one -1 card with one +0 Heal 1 (Ally) card (x1)
6. Add one +1 Heal 1 (Ally) card (x1)
7. Add one +1 POISON card (x1)
8. Add one +3 card (x1)
9. Add one +1 CURSE card (x2)

---

### 3. conditions.json

```typescript
interface Condition {
  id: string;
  name: string;
  type: "positive" | "negative";
  description: string;
  removal: "end_of_turn" | "on_heal" | "on_reveal";  // When condition is removed
}
```

**Conditions Data:**

| ID | Name | Type | Removal | Description |
|----|------|------|---------|-------------|
| poison | Poison | negative | on_heal | +1 Attack against this figure. Heal removes poison instead of restoring HP. |
| wound | Wound | negative | on_heal | Suffer 1 damage at start of turn. Heal removes wound instead of restoring HP. |
| stun | Stun | negative | end_of_turn | Cannot perform any abilities on turn. |
| disarm | Disarm | negative | end_of_turn | Cannot perform Attack abilities. |
| immobilize | Immobilize | negative | end_of_turn | Cannot perform Move abilities. |
| muddle | Muddle | negative | end_of_turn | Disadvantage on all attacks. |
| curse | Curse | negative | on_reveal | Shuffle Curse card (null) into attack modifier deck. |
| strengthen | Strengthen | positive | end_of_turn | Advantage on all attacks. |
| bless | Bless | positive | on_reveal | Shuffle Bless card (2x) into attack modifier deck. |

---

### 4. elements.json

```typescript
interface Element {
  id: string;
  name: string;
  color: string;  // Hex color for UI
}
```

| ID | Name | Color |
|----|------|-------|
| fire | Fire | #EF4444 |
| ice | Ice | #3B82F6 |
| air | Air | #A3A3A3 |
| earth | Earth | #84CC16 |
| light | Light | #FCD34D |
| dark | Dark | #6366F1 |

---

### 5. scenarios.json

```typescript
interface Scenario {
  id: number;                    // 1-17
  name: string;
  location: string;              // Map grid reference (e.g., "B1")
  goal: string;                  // Victory condition
  unlockedBy: number | null;     // Scenario ID that unlocks this, null for starting
  unlocks: number[];             // Scenario IDs this unlocks on completion
}
```

**Scenario Chain (from scenario book):**

| ID | Name | Location | Goal | Unlocked By |
|----|------|----------|------|-------------|
| 1 | Roadside Ambush | B1 | Kill all enemies | null (start) |
| 2 | A Hole in the Wall | B1 | Kill all enemies | 1 |
| 3 | The Black Ship | C2 | Kill all enemies | 2 |
| 4 | A Verification | C3 | Kill all enemies | 3 |
| 5 | Seeking Answers | D2 | Kill boss | 4 |
| 6 | Corrupted Research | D3 | Kill all enemies | 5 |
| 7 | Completion of a Contract | D1 | Kill all enemies | 6 |
| 8 | Hidden Tumor | D2 | Destroy objective | 7 |
| 9 | The Sewers | E1 | Kill all enemies | 8 |
| 10 | Beguiling Sewers | E2 | Kill boss | 9 |
| 11 | Defiled Sanctuary | F1 | Kill all enemies | 10 |
| 12 | Stirring the Nest | F2 | Kill boss | 11 |
| 13 | Completion of the Trial | F3 | Survive | 12 |
| 14 | Alchemy Outpost | G1 | Kill all enemies | 13 |
| 15 | Prepped for the Worst | G2 | Kill boss | 14 |
| 16 | Pointed Threat | G3 | Destroy objectives | 15 |
| 17 | Safe Crossing | H1 | Kill boss | 16 |

---

### 6. tables.json

```typescript
interface Tables {
  levelThresholds: Record<number, number>;  // Level -> XP required
  scenarioLevelTable: {
    level: number;
    trapDamage: number;
    goldConversion: number;
    bonusXp: number;
  }[];
  itemSlotLimits: Record<string, number | "half_level">;
}
```

**Level Thresholds (XP to reach level):**
```json
{
  "1": 0,
  "2": 45,
  "3": 95,
  "4": 150,
  "5": 210,
  "6": 275,
  "7": 345,
  "8": 420,
  "9": 500
}
```

**Scenario Level Table:**
| Level | Trap Damage | Gold/Token | Bonus XP |
|-------|-------------|------------|----------|
| 0 | 2 | 2 | 4 |
| 1 | 3 | 2 | 6 |
| 2 | 4 | 3 | 8 |
| 3 | 5 | 3 | 10 |
| 4 | 6 | 4 | 12 |
| 5 | 7 | 4 | 14 |
| 6 | 8 | 5 | 16 |
| 7 | 9 | 6 | 18 |

**Item Slot Limits:**
```json
{
  "head": 1,
  "body": 1,
  "feet": 1,
  "hand": 2,
  "small": "half_level"
}
```

---

### 7. items.json (Starter Items Only)

For now, include only the 7 starter shop items (available from scenario 1). More items unlock via scenarios/events — they'll be added incrementally.

```typescript
interface Item {
  id: number;
  name: string;
  slot: "head" | "body" | "feet" | "hand" | "small";
  cost: number;
  usageType: "consumed" | "spent" | "passive";
  effect: string;
  copies: number;  // How many copies exist in the game
}
```

**Starter Items (IDs 1-7):**

| ID | Name | Slot | Cost | Usage | Effect |
|----|------|------|------|-------|--------|
| 1 | Boots of Striding | feet | 20 | spent | +2 Move during move action |
| 2 | Winged Shoes | feet | 20 | spent | Add Jump to move action |
| 3 | Hide Armor | body | 20 | spent | Negate next 2 damage from single source |
| 4 | Leather Armor | body | 10 | spent | Negate next 1 damage from single source |
| 5 | Eagle-Eye Goggles | head | 30 | spent | Advantage on entire attack action |
| 6 | Iron Helmet | head | 10 | spent | Negate next 1 damage from single source |
| 7 | Minor Healing Potion | small | 10 | consumed | Heal 3, Self |

---

### 8. src/data/index.ts

Barrel export with runtime type assertions (no Zod validation yet — that's Task 3).

```typescript
import characters from './characters.json';
import perks from './perks.json';
import conditions from './conditions.json';
import elements from './elements.json';
import scenarios from './scenarios.json';
import tables from './tables.json';
import items from './items.json';

export {
  characters,
  perks,
  conditions,
  elements,
  scenarios,
  tables,
  items,
};

// Re-export types for convenience
export type { Character, Perk, Condition, Element, Scenario, Item } from './types';
```

Also create `src/data/types.ts` with TypeScript interfaces matching the JSON structure.

---

## Constraints

1. **DO NOT** invent data — all values must come from game documentation
2. **DO NOT** add Zod validation (that's Task 3)
3. **DO NOT** add items beyond the 7 starter items
4. **DO NOT** add monster data (out of scope for companion app)
5. **JSON only** — no runtime logic in data files
6. **Use kebab-case** for IDs (e.g., `"red_guard"`, `"minor_healing_potion"`)

---

## Acceptance Criteria

1. All 7 JSON files exist and are valid JSON (parseable)
2. `src/data/index.ts` exports all data with no TS errors
3. `pnpm build` passes with no errors
4. Character HP tables match exactly (verify against spec above)
5. All 17 scenarios have correct unlock chains
6. All 9 conditions are defined
7. All 6 elements are defined
8. XP thresholds and scenario level table match spec

---

## Verification Commands

```bash
# Validate JSON files
node -e "require('./src/data/characters.json')"
node -e "require('./src/data/scenarios.json')"

# Build should pass
pnpm build
```

---

## Reference Files

- `docs/game-docs/CG_GJoTL_LearntoPlayGuide_Web_8-28.pdf` — Character mats, HP tables
- `docs/game-docs/CG_GJotL_Glossary_Web.pdf` — Conditions, elements, rules
- `docs/game-docs/JotL_Character_Sheets.pdf` — Perk lists
- `BLUEPRINT.md` — Section 7 (Lookup Tables)

---

*Task created: 2026-02-03*
*Architect: Claude Opus 4.5*
