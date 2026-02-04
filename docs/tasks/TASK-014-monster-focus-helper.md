# TASK-014: Monster Focus Algorithm Helper

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-013

---

## Goal

Create an interactive "Monster Focus Helper" wizard to guide players through the complex logic of determining which character a monster focuses on. This is one of the most common points of confusion in Gloomhaven.

---

## Rules of Engagement

- **Interactive Logic:** Use a step-by-step questionnaire or a "decision tree" UI.
- **Data Integration:** Pull character names/initiatives from the active campaign if possible, but allow manual entry for "Monster vs Monster" or guest scenarios.
- **Clarity:** Use diagrams or clear "If/Then" statements at each step.
- **Route:** `/rules/focus-helper`. Add a new tab to `RulesLayout`.

---

## Context

### Monster Focus Logic (Appendix G)
1.  **Least Movement:** The enemy it can get in range to attack using the least movement. (Distance through traps is higher cost).
2.  **Shortest Proximity:** If tied on movement, the closest enemy in straight-line distance.
3.  **Initiative:** If still tied, the enemy with the earliest initiative in the round.

---

## Files to Touch

```
NEW   src/features/rules/FocusHelperPage.tsx
EDIT  src/features/rules/RulesLayout.tsx        # Add new tab
EDIT  src/features/rules/index.ts
EDIT  src/app/routes.tsx
```

---

## Specifications

### 1. `src/features/rules/FocusHelperPage.tsx`

**State:**
- `characters`: Array of `{ name: string, initiative: number, movementToReach: number, proximity: number }`.
- `activeStep`: current question index.

**Wizard Steps:**

1.  **Step 1: Setup Targets**
    -   Pre-populate with characters from the active campaign.
    -   Allow user to enter `Movement required to reach` for each target (from monster's position).
    -   Allow user to enter `Proximity` (hex count, straight line) for each target.
    -   Allow user to enter `Initiative` for each target.

2.  **Step 2: Movement Check**
    -   Filter targets to those with the **lowest** `movementToReach`.
    -   If only 1 target remains → **Result Found**.
    -   If multiple → Move to Step 3.

3.  **Step 3: Proximity Check**
    -   Filter remaining targets to those with the **lowest** `proximity`.
    -   If only 1 target remains → **Result Found**.
    -   If multiple → Move to Step 4.

4.  **Step 4: Initiative Check**
    -   Target with the **lowest** `initiative` is the focus.

**Result Display:**
-   "The monster focuses on: **[Name]**"
-   Explain the tie-breaker used (e.g. "Focus found by proximity").

### 2. `src/features/rules/RulesLayout.tsx`

Add a third NavLink:
-   `Focus Helper` -> `/rules/focus-helper`.

---

## Constraints

- Handle cases where no targets are reachable (no focus).
- Ensure the UI works well on mobile.
- Make it easy to reset and start over.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `pnpm build` passes. |
| 2 | `/rules/focus-helper` is accessible via the tabs. |
| 3 | Helper correctly identifies focus based on the 3 rules (Movement, Proximity, Initiative). |
| 4 | UI allows entering data for current characters easily. |
| 5 | Clear explanation of *why* a specific target was chosen. |

---
