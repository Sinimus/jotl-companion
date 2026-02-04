# TASK-020: Character Sheet Polish

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `HIGH`
**Depends On:** TASK-019

---

## Goal

Redesign the `CharacterDetail` view to resemble a high-quality digital character mat. It should integrate Stats, Perks, and Items into a unified, responsive layout.

---

## Rules of Engagement

-   **Layout:**
    -   **Header:** Name, Class, Level, XP Bar.
    -   **Tabs/Sections:**
        -   **Main:** Stats (HP, Gold, Checkmarks) + Active Buffs/Conditions (future).
        -   **Perks:** The `PerkList` component.
        -   **Items:** The `ItemManager` component.
        -   **Notes:** (Optional) A text area for notes.
-   **Aesthetic:** Use the class icon/color if possible (or fallback to Amber).

---

## Files to Touch

```
EDIT  src/features/campaign/CharacterDetail.tsx
```

---

## Specifications

### 1. `src/features/campaign/CharacterDetail.tsx`

**Refactor:**
-   Switch to a Tabbed view (using a similar pattern to `RulesLayout` tabs or a local state tab switcher).
-   **Header:** Make the XP bar slim and elegant. Show "Next Level: X XP".
-   **Stats:** Big touch-friendly inputs for Gold and XP editing.
-   **Perks:** Embed the `PerkList` cleanly.
-   **Items:** Embed the `ItemManager`.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | Character sheet looks professional and organized. |
| 2 | Easy to switch between Perks/Items/Stats. |
| 3 | Responsive on mobile (no horizontal scrolling for main content). |

---
