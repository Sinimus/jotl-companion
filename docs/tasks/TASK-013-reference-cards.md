# TASK-013: Quick Reference Cards (Conditions, Elements, Guides)

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-012

---

## Goal

Create a "Quick Reference" page with visual cards for game mechanics that are frequently looked up during play: Conditions, Elements, and core Guide summaries.

---

## Rules of Engagement

- **Visual Appeal:** Use cards with distinct colors for different types of information.
- **Categorization:** Group by type (Conditions, Elements, Combat Guides).
- **Navigation:** Implement a tab-based layout in the Rules section to switch between "Glossary" and "Reference".
- **Responsive:** Cards should stack nicely on mobile.

---

## Context

### Data Sources
- `src/data/conditions.json` - Status effects.
- `src/data/elements.json` - Magic elements.
- `src/data/rules.json` (`rules.guides`) - Logic for Focus, Movement, LoS.

---

## Files to Touch

```
NEW   src/features/rules/RulesLayout.tsx        # Tabbed layout for Rules section
NEW   src/features/rules/ReferencePage.tsx      # Page with cards
EDIT  src/features/rules/index.ts
EDIT  src/app/routes.tsx
EDIT  src/features/campaign/CampaignDetail.tsx  # Update link to point to Rules root
```

---

## Specifications

### 1. `src/features/rules/RulesLayout.tsx`

A simple layout component that provides a tabbed navigation at the top:
- Tabs: **Glossary**, **Quick Reference**.
- Use `NavLink` from `react-router-dom` for active state styling (amber underline).

### 2. `src/features/rules/ReferencePage.tsx`

**Sections:**

1.  **Conditions (Grid):**
    -   Render cards for all 9 conditions.
    -   Color code: Negative (reddish border), Positive (greenish border).
    -   Content: Name, Removal rule (badge), and Description.

2.  **Elements (Row/Grid):**
    -   Render 6 elements.
    -   Use the `color` field from data for a small circle icon or border.
    -   Content: Name + short usage rule (e.g. "Infused at end of turn, consumed for bonus").

3.  **Core Guides (Accordions/Cards):**
    -   Render cards for `Monster Focus`, `Monster Movement`, `Line of Sight`.
    -   These are longer, so use a list of bullets (from `rules.guides[].content`).

### 3. `src/app/routes.tsx`

Reorganize rules routes:
```tsx
<Route path="/rules" element={<RulesLayout />}>
  <Route index element={<Navigate to="glossary" replace />} />
  <Route path="glossary" element={<GlossaryPage />} />
  <Route path="reference" element={<ReferencePage />} />
</Route>
```

---

## Constraints

- Maintain the "Zinc/Amber" theme.
- Ensure "Removal" badges for conditions are consistent (e.g., "End of Turn", "On Heal").

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `pnpm build` passes. |
| 2 | `/rules/reference` displays cards for Conditions and Elements. |
| 3 | Conditions are colored correctly (Pos/Neg). |
| 4 | Navigation tabs work to switch between Glossary and Reference. |
| 5 | Mobile layout is clean (1 column of cards). |

---
