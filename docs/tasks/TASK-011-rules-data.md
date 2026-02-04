# TASK-011: Rules Data & Glossary Content

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-010

---

## Goal

Create a structured JSON data file for the game rules, glossary, and appendices. This data will power the searchable glossary and reference cards in Phase 3.

---

## Rules of Engagement

- **Data Driven:** All content must be in `src/data/rules.json`.
- **Search Friendly:** Include keywords or categories if necessary for future filtering.
- **Reference Integrity:** Use the provided Markdown glossary as the source of truth.
- **Types:** Add corresponding interfaces to `src/data/types.ts`.

---

## Context

### Source Material
- `docs/game-docs/Glossary & Appendices.md` - Contains alphabetical terms and logic for Focus/Movement/LoS.

### Proposed Structure
We need to support:
1.  **Glossary Entries:** Simple term + description.
2.  **Guide Sections:** More complex rules like "Monster Focus" or "Line of Sight" which might have multiple paragraphs/points.
3.  **Treasure Index:** Mapping of IDs to rewards.

---

## Files to Touch

```
NEW   src/data/rules.json
EDIT  src/data/types.ts
EDIT  src/data/index.ts
```

---

## Specifications

### 1. `src/data/types.ts`

Add the following interfaces:

```typescript
export interface GlossaryEntry {
  term: string
  description: string
  category?: string
}

export interface RuleSection {
  id: string
  title: string
  content: string[] // Array of strings (paragraphs/bullets)
}

export interface TreasureReward {
  id: number
  reward: string
}

export interface RulesData {
  glossary: GlossaryEntry[]
  guides: RuleSection[]
  treasures: TreasureReward[]
}
```

### 2. `src/data/rules.json`

Populate with data extracted from the Markdown file.

- **Glossary:** At least 50+ terms from A to X.
- **Guides:** 
  - `monster_movement`
  - `monster_focus`
  - `line_of_sight`
  - `advantage_disadvantage`
- **Treasures:** IDs 1 to 16.

### 3. `src/data/index.ts`

Export the new rules data:

```typescript
import rulesData from './rules.json'
// ...
export const rules = rulesData as RulesData
```

---

## Constraints

- Use standard JSON (no comments).
- Ensure all IDs/Terms are correctly spelled according to the source.
- Maintain formatting (like bolding or italics if applicable) using simple Markdown inside the strings.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `src/data/rules.json` exists and is valid JSON. |
| 2 | `src/data/types.ts` has the new interfaces. |
| 3 | `src/data/index.ts` exports `rules`. |
| 4 | Glossary contains terms from the source MD. |
| 5 | Treasure index contains all 16 entries. |
| 6 | `pnpm build` passes (type check). |

---
