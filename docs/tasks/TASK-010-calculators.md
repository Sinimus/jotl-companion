# TASK-010: Game Calculators (Scenario Level & Stats)

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `EASY`
**Depends On:** TASK-004

---

## Goal

Implement a "Calculators" page to help players during the scenario setup. The primary calculator is for **Scenario Level**, which determines monster levels, trap damage, and rewards.

---

## Rules of Engagement

- **Formula:** `Scenario Level = ceil(Average Party Level / 2)`.
- **Difficulty:**
  - Easy: Scenario Level - 1
  - Normal: Scenario Level
  - Hard: Scenario Level + 1
  - Very Hard: Scenario Level + 2
- **Stats:** Once the final Scenario Level is determined, display the corresponding stats from `tables.json`.
- **Route:** `/campaign/:campaignId/calculators`.

---

## Context

### Domain Logic
1.  **Average Level:** Sum of levels of all characters in the party / number of characters.
2.  **Base Scenario Level:** `Math.ceil(average / 2)`.
3.  **Final Level:** Adjusted by difficulty. Minimum 0, Maximum 7.
4.  **Lookup:** Use `tables.scenarioLevelTable` for:
    - Trap Damage
    - Gold per Token
    - Bonus XP

---

## Files to Touch

```
NEW   src/features/calculators/CalculatorPage.tsx
EDIT  src/features/calculators/index.ts
EDIT  src/app/routes.tsx
EDIT  src/features/campaign/CampaignDetail.tsx
```

---

## Specifications

### 1. `src/features/calculators/CalculatorPage.tsx`

**Logic:**
-   Get campaign from store.
-   Calculate `avgLevel` of the party.
-   State for `difficultyModifier` (-1, 0, 1, 2). Default 0 (Normal).
-   `baseLevel = Math.ceil(avgLevel / 2)`
-   `finalLevel = Math.max(0, Math.min(7, baseLevel + difficultyModifier))`
-   Lookup `levelData` from `tables.scenarioLevelTable` using `finalLevel`.

**UI:**
1.  **Header:** "Game Calculators"
2.  **Scenario Level Calculator:**
    -   Display current party and their levels.
    -   Display computed `Average Level` and `Recommended Base Level`.
    -   Difficulty Selector (Buttons or Select):
        -   Easy (-1)
        -   Normal (+0)
        -   Hard (+1)
        -   Very Hard (+2)
    -   **Big Result:** "Scenario Level: X" (where X is `finalLevel`).
3.  **Scenario Stats:**
    -   Display a card with:
        -   Monster Level: X
        -   Trap Damage: Y
        -   Gold Conversion: Z
        -   Bonus XP: W

### 2. `src/features/campaign/CampaignDetail.tsx`

Add a link/button near the "Party" header or "Scenarios" header:
-   "Calculators" -> navigates to `/campaign/:id/calculators`.

### 3. `src/app/routes.tsx`

Add route:
```tsx
<Route path="/campaign/:campaignId/calculators" element={<CalculatorPage />} />
```

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `pnpm build` passes. |
| 2 | Calculators page shows correct average level for the party. |
| 3 | Base Scenario Level is correctly calculated (ceil(avg/2)). |
| 4 | Difficulty modifier correctly adjusts the level (capped 0-7). |
| 5 | Stats (Trap/Gold/XP) update in real-time as difficulty changes. |
| 6 | Navigation to/from Campaign Detail works. |

---
