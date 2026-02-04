# TASK-008: Scenario Tracker & Unlock Chain

**Status:** `TODO`
**Priority:** `HIGH`
**Complexity:** `MEDIUM`
**Depends On:** TASK-004

---

## Goal

Implement the scenario tracking system. Players can mark scenarios (1-17) as completed. Completing a scenario automatically unlocks the next scenario(s) in the chain according to `src/data/scenarios.json`.

---

## Rules of Engagement

- **Unlock Logic:** Marking a scenario as `completed` must set all scenarios in its `unlocks` array to `unlocked` (if they were `locked`).
- **Idempotency:** Re-marking a completed scenario as `completed` should do nothing. Unmarking (returning to `unlocked`) should NOT re-lock the chain (once unlocked, always unlocked in JotL).
- **Visuals:** Use a list or grid of scenarios. Color-code statuses: 
  - `locked`: Grayed out, non-interactive (or clearly marked).
  - `unlocked`: Interactive, clickable to complete.
  - `completed`: Green checkmark/highlight, clickable to undo.
- **Location:** Add a new "Scenarios" section to `CampaignDetail.tsx`.

---

## Context

### Domain Logic
- **Initial State:** Scenario 1 is `unlocked`, others are `locked`.
- **Completion:** Scenario X `completed` → `unlocked` for all Y in `scenarios[X].unlocks`.
- **Static Data:** `src/data/scenarios.json` contains `id`, `name`, `location`, and `unlocks`.

### Current State
- `Campaign` object has `scenarioStatus: Record<number, 'locked' | 'unlocked' | 'completed'>`.
- Store has `createCampaign` which initializes this record.

---

## Files to Touch

```
EDIT  src/features/campaign/store.ts             # Add setScenarioStatus action
EDIT  src/features/campaign/CampaignDetail.tsx    # Integrate ScenarioTracker
NEW   src/features/campaign/ScenarioTracker.tsx   # New component for scenario list
EDIT  src/features/campaign/index.ts             # Export ScenarioTracker
```

---

## Specifications

### 1. `src/features/campaign/store.ts`

Add an action to update scenario status:

```typescript
  /** Update status of a scenario. If 'completed', auto-unlocks child scenarios. */
  setScenarioStatus: (
    campaignId: string, 
    scenarioId: number, 
    status: 'unlocked' | 'completed'
  ) => Promise<void>
```

**Implementation:**
1. Find campaign in state.
2. Clone `scenarioStatus`.
3. Set `scenarioStatus[scenarioId] = status`.
4. If `status === 'completed'`:
   - Find scenario definition in `src/data/scenarios.json`.
   - For each `childId` in `scenario.unlocks`:
     - If `scenarioStatus[childId] === 'locked'`, set it to `unlocked`.
5. Update `updatedAt` on campaign.
6. `db.campaigns.put(updatedCampaign)`.
7. Update state.

### 2. `src/features/campaign/ScenarioTracker.tsx`

**Props:**
- `campaignId: string`
- `scenarioStatus: Record<number, ScenarioStatus>`

**Logic:**
- Map over all 17 scenarios from `src/data`.
- Render a list of scenarios.
- Each item shows: `ID`, `Name`, `Location`.
- Interaction:
  - If `locked`: Display as disabled/dimmed.
  - If `unlocked`: Show a checkbox/button to "Mark Completed".
  - If `completed`: Show a "Completed" badge or checked state. Clicking it toggles back to `unlocked`.

**UI Styling:**
- Use a vertical list or a compact grid.
- `unlocked` items should be the most prominent.
- `completed` items should be subtly distinct (e.g., strike-through text or green accent).

### 3. `src/features/campaign/CampaignDetail.tsx`

- Add a "Scenarios" heading below the characters section.
- Render `<ScenarioTracker campaignId={campaign.id} scenarioStatus={campaign.scenarioStatus} />`.

---

## Constraints

1. **Safety:** Use `CampaignSchema.parse()` before persisting to Dexie.
2. **Persistence:** Immediate save on toggle.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | Scenario 1 is initially Unlocked. |
| 2 | Marking Scenario 1 as Completed unlocks Scenario 2. |
| 3 | Toggling Scenario 1 back to Unlocked keeps Scenario 2 Unlocked. |
| 4 | Locked scenarios cannot be interacted with. |
| 5 | UI reflects status changes immediately. |
| 6 | Data persists after page refresh. |

---

## Verification

1. Fresh campaign → Scenarios: 1 (Unlocked), 2-17 (Locked).
2. Complete Scenario 1 → Scenarios: 1 (Completed), 2 (Unlocked), 3-17 (Locked).
3. Complete Scenario 2 → Scenarios: 1 (Completed), 2 (Completed), 3 (Unlocked).
4. Uncomplete Scenario 2 → Scenarios: 1 (Completed), 2 (Unlocked), 3 (Unlocked).

---
