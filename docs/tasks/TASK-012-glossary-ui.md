# TASK-012: Searchable Glossary UI

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-011

---

## Goal

Implement the Glossary UI where players can search for terms and filter by category or letter.

---

## Rules of Engagement

- **Search:** Instant filtering as the user types (matches term or description).
- **Filtering:** 
    - A-Z filtering (buttons for first letters).
    - Category filtering (dropdown or pills for categories like 'Combat', 'Map', etc.).
- **Navigation:** Add a "Rules" link to the main app navigation (or a drawer/sidebar).
- **Styling:** Clean, mobile-friendly list. Use the project's amber/zinc theme.

---

## Context

### Data Source
- `src/data/rules.json` - `rules.glossary` array.
- Each entry has `term`, `description`, and `category`.

---

## Files to Touch

```
NEW   src/features/rules/GlossaryPage.tsx
NEW   src/features/rules/index.ts
EDIT  src/app/routes.tsx
```

---

## Specifications

### 1. `src/features/rules/GlossaryPage.tsx`

**State:**
- `searchQuery: string`
- `selectedLetter: string | null`
- `selectedCategory: string | null`

**Logic:**
- `filteredGlossary`:
    1. Filter by `searchQuery`.
    2. Filter by `selectedLetter` (if set).
    3. Filter by `selectedCategory` (if set).
- Sort results alphabetically by `term`.

**UI:**
1.  **Search Bar:** Input field with clear button.
2.  **Filter Row:**
    -   Category dropdown (populated from unique categories in `rules.json`).
    -   A-Z horizontal scrollable row of buttons.
3.  **Entries List:**
    -   Render as cards or a styled list.
    -   Support Markdown rendering for `**bold**` text in descriptions (simple regex replace is fine).
    -   Show the category as a small badge.

### 2. `src/app/routes.tsx`

Add route:
```tsx
<Route path="/rules/glossary" element={<GlossaryPage />} />
```

---

## Constraints

- Use `@/data` to access the rules.
- Mobile first: Ensure the A-Z buttons don't break the layout (use overflow-x-auto).

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `pnpm build` passes. |
| 2 | `/rules/glossary` displays all terms. |
| 3 | Search works (term + description). |
| 4 | A-Z filtering works. |
| 5 | Category filtering works. |
| 6 | Descriptions render simple bolding (`**bold**`). |

---
