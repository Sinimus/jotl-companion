# TASK-019: Item Management

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-006

---

## Goal

Implement the Item Management UI for characters. Players should be able to browse the item shop, equip items to specific slots, and see their inventory.

---

## Rules of Engagement

-   **Shop:** List all available items (filtered by "unlocked" if we were tracking that, but for now just list all 1-16 + starters).
-   **Slots:** Enforce slot logic (1 Head, 1 Body, 1 Feet, 2 Hands, N Small Items).
-   **Data:** Use `src/data/items.json`.

---

## Context

Character schema has `itemIds: number[]`. We need to interpret these IDs as items and check their slots.

---

## Files to Touch

```
NEW   src/features/characters/ItemManager.tsx
NEW   src/features/characters/ItemShop.tsx
EDIT  src/features/campaign/CharacterDetail.tsx
EDIT  src/features/campaign/store.ts (updateCharacter input)
```

---

## Specifications

### 1. `src/features/characters/ItemManager.tsx`

**Props:** `character: CharacterProgress`.

**UI:**
-   **Equipped Section:**
    -   Head: [Item Name] or "Empty"
    -   Body: [Item Name] or "Empty"
    -   Feet: [Item Name] or "Empty"
    -   Hands: [Item 1] [Item 2] (or 2-handed logic if needed, simplify to 2 slots for now).
    -   Small Items: List based on Level/2 limit.
-   **"Shop" Button:** Opens the `ItemShop` modal/drawer.

### 2. `src/features/characters/ItemShop.tsx`

**UI:**
-   List of items from `items.json`.
-   **Filter:** By Slot (Head, Body, etc.).
-   **Action:** "Equip" (if slot empty) or "Replace" (if slot full).
-   **Validation:**
    -   If user tries to add a Head item and already has one, confirm replacement.
    -   Check small item limit.

### 3. `src/features/campaign/store.ts`

-   Ensure `updateCharacter` can handle `itemIds` array updates (it should already, just double check).

---

## Constraints

-   Keep it simple. We aren't tracking "Gold cost" deduction automatically yet (let the player manually adjust gold if they buy it).
-   Just managing the *list* of owned items.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | Can view equipped items by slot. |
| 2 | Can add an item from the list. |
| 3 | Slot limits are respected (visual warning or replace prompt). |
| 4 | Items persist to character state. |

---
