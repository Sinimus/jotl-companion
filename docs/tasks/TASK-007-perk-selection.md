# TASK-007: Character Progression (Perks)

**Status:** `TODO`
**Priority:** `HIGH`
**Complexity:** `MEDIUM`
**Depends On:** TASK-006

---

## Goal

Implement the Perk selection UI in the Character Detail view. Players can spend their earned perk points (derived from Level and Checkmarks) to select perks from their character's specific list.

---

## Rules of Engagement

- **Respect the Cap:** Users cannot select more perks than they have earned.
- **Earned Formula:** `(Level - 1) + floor(Checkmarks / 3)`.
- **Atomic Updates:** Toggling a perk saves immediately to Dexie via `updateCharacter`.
- **Zero-Config:** Filter perks from `src/data/perks.json` based on character type.
- **Visuals:** Use checkbox-style UI. Group similar perks if possible, or just list them. (Flat list 1:1 with JSON is acceptable for MVP).

---

## Context

### Domain Model
- **Perk Points:** A derived currency.
  - Level 1 = 0 perks from level. Level 5 = 4 perks from level.
  - 0-2 checkmarks = 0 perks. 3-5 = 1 perk. 18 = 6 perks.
- **Perk Data:** `src/data/perks.json` contains a flat list of all perks.
  - `characterId` matches the character's `type` (e.g., "hatchet").
  - `id` is unique (e.g., "hatchet_7a", "hatchet_7b").
  - Physical character sheets often have two boxes for the same perk text. In our JSON, these are distinct entries (suffix 'a'/'b').
- **State:** `character.perkIds` stores the list of *selected* perk IDs.

### Current State
- `CharacterDetail.tsx` has a read-only placeholder for perks.
- `updateCharacter` store action only accepts XP/gold/checkmarks.

---

## Files to Touch

```
EDIT  src/features/campaign/store.ts             # Extend UpdateCharacterInput
EDIT  src/features/campaign/CharacterDetail.tsx  # Add PerkList integration
NEW   src/features/campaign/PerkList.tsx         # New component for the list UI
```

---

## Specifications

### 1. `src/features/campaign/store.ts`

**Update the input interface:**

```typescript
export interface UpdateCharacterInput {
  experience?: number
  gold?: number
  checkmarks?: number
  perkIds?: string[] // NEW
}
```

**Update the `updateCharacter` action implementation:**
You must manually check for `perkIds` and apply it to the merged object, similar to how experience/gold are handled.

```typescript
    // Apply only the defined fields
    const merged = { ...character }
    if (updates.experience !== undefined) merged.experience = updates.experience
    if (updates.gold !== undefined) merged.gold = updates.gold
    if (updates.checkmarks !== undefined) merged.checkmarks = updates.checkmarks
    if (updates.perkIds !== undefined) merged.perkIds = updates.perkIds // ADD THIS
```

This ensures the new field is actually persisted. The `CharacterProgressSchema.parse(merged)` call will validate it.

### 2. `src/features/campaign/PerkList.tsx`

Create a new component to keep `CharacterDetail` clean.

**Props:**
```typescript
interface PerkListProps {
  character: CharacterProgress
  onToggle: (perkId: string, isSelected: boolean) => void
}
```

**Logic:**
1. **Filter Perks:** Load all perks from `@/data` and filter where `p.characterId === character.type`.
2. **Calculate Points:**
   - `levelPerks = character.level - 1`
   - `checkmarkPerks = Math.floor(character.checkmarks / 3)`
   - `totalEarned = levelPerks + checkmarkPerks`
   - `spent = character.perkIds.length`
   - `available = totalEarned - spent`
3. **Render:**
   - Header: "Perks (Available: X / Total: Y)"
   - List of checkboxes.
   - **State:**
     - `checked`: `character.perkIds.includes(perk.id)`
     - `disabled`: `!checked && available <= 0` (Can always uncheck, but can't check if out of points).

**UI Styling:**
- Use a clean list layout.
- If a perk is checked, maybe highlight the text.
- Text: `perk.description`.

### 3. `src/features/campaign/CharacterDetail.tsx`

- Import `PerkList`.
- Add handler:
  ```typescript
  const handleTogglePerk = (perkId: string, isSelected: boolean) => {
    const currentIds = new Set(character.perkIds)
    if (isSelected) currentIds.add(perkId)
    else currentIds.delete(perkId)
    
    updateCharacter(campaignId, character.id, { 
      perkIds: Array.from(currentIds) 
    })
  }
  ```
- Replace the "Perks: X selected" placeholder with `<PerkList />`.

---

## Constraints

1. **No manual override:** Users cannot "force" add a perk if they don't have the points (UI should prevent it).
2. **Persistence:** Changes must persist immediately (no "Save" button).
3. **Optimistic UI:** Ideally feels instant.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `pnpm build` passes. |
| 2 | "Perks" section displays correct "Available" count. |
| 3 | Changing XP (triggering level up) increases Available count. |
| 4 | Changing Checkmarks (crossing multiple of 3) increases Available count. |
| 5 | Can check a perk → persists to DB → decrements Available count. |
| 6 | Can uncheck a perk → persists → increments Available count. |
| 7 | Cannot check a perk when Available count is 0. |
| 8 | All perks for the specific character class are listed. |

---

## Verification

1. Set Level 1, Checkmarks 0 → Available: 0.
2. Set Level 2 → Available: 1.
3. Check one perk → Available: 0. Try to check another → Disabled.
4. Set Checkmarks 3 → Available: 1.
5. Check another perk → Available: 0.

---
