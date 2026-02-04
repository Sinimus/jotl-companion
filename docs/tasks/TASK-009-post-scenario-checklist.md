# TASK-009: Post-Scenario Checklist (Interactive)

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-008

---

## Goal

Create an interactive "Post-Scenario Checklist" helper to guide players through the end-of-game rewards and cleanup process. This ensures players don't forget steps like adding bonus XP, converting money tokens to gold, or marking battle goals.

---

## Rules of Engagement

- **Helper Only:** This tool calculates values and shows reminders. It does **not** automatically update the campaign state (yet). Users must manually update their characters/scenarios based on the checklist (or we can add "Apply" buttons in a future polish task).
- **Route:** `/campaign/:campaignId/checklist`.
- **Data Source:** Use `src/data/tables.json` for Scenario Level lookup (Gold/XP).

---

## Context

### Domain Logic (Jaws of the Lion)
1.  **Outcome:** Success (Won) or Failure (Lost).
2.  **Scenario Level:** Determines Gold conversion and Bonus XP.
    -   `L1`: 6 Bonus XP, 2 Gold per token.
    -   `L2`: 8 Bonus XP, 3 Gold per token.
3.  **Rewards:**
    -   **Success:** Bonus XP, Keep looted Gold/XP, Mark Battle Goals (Checkmarks), Scenario Rewards (Item/Unlock), City Event.
    -   **Failure:** Keep looted Gold/XP only.

---

## Files to Touch

```
NEW   src/features/scenarios/PostScenarioChecklist.tsx
EDIT  src/features/scenarios/index.ts             # Export it
EDIT  src/app/routes.tsx                          # Add route
EDIT  src/features/campaign/CampaignDetail.tsx    # Add link to checklist
```

---

## Specifications

### 1. `src/features/scenarios/PostScenarioChecklist.tsx`

**State:**
- `outcome`: 'success' | 'failure' (default 'success')
- `scenarioLevel`: number (1-7, default 1)
- `moneyTokens`: number (input, default 0) - *optional calculator helper*

**UI Layout:**
1.  **Header:** "Post-Scenario Checklist"
2.  **Configuration:**
    -   Toggle: Success / Failure
    -   Select: Scenario Level (1-7). Show computed stats next to it:
        -   "Bonus XP: +X"
        -   "Gold per Token: Y"
        -   "Trap Damage: Z"
3.  **Steps (Checklist):**
    -   Render a list of steps. Each step has a checkbox (local state only, resets on unmount).
    -   **If Success:**
        1.  "Read the conclusion text in the Scenario Book."
        2.  "Add **[Bonus XP]** bonus experience to each character."
        3.  "Tally money tokens. Convert at **[Gold Rate]** gold each."
        4.  "Check Battle Goals. Add checkmarks (✓) if criteria met."
        5.  "Update Scenario Tracker (mark completed)."
        6.  "Draw a City Event card (if instructed)."
    -   **If Failure:**
        1.  "Record XP earned from abilities."
        2.  "Tally money tokens. Convert at **[Gold Rate]** gold each."
        3.  "No Battle Goals, no Bonus XP, no Scenario Completion."

**Calculators:**
- Show a mini-calculator: `Money Tokens [Input] × [Rate] = [Total Gold]`

### 2. `src/features/campaign/CampaignDetail.tsx`

Add a link/button near the "Scenarios" header:
-   "Open Post-Scenario Checklist" -> navigates to `/campaign/:id/checklist`.

### 3. `src/app/routes.tsx`

Add route:
```tsx
<Route path="/campaign/:campaignId/checklist" element={<PostScenarioChecklist />} />
```

---

## Constraints

- Use `tables.json` for the lookup.
- Keep it stateless (don't save the checklist progress to DB).
- Styling: Clean, readable list.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `pnpm build` passes. |
| 2 | Checklist page loads at `/campaign/:id/checklist`. |
| 3 | Changing Scenario Level updates Bonus XP and Gold Rate displayed. |
| 4 | Toggling Success/Failure changes the list of steps. |
| 5 | Money token calculator works correctly. |
| 6 | Steps are clickable/checkable (visual only). |

---
