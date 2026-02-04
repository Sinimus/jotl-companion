# TASK-016: Export/Import Campaigns

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-004, TASK-015

---

## Goal

Provide a way for players to backup their data or transfer it to another device by exporting and importing campaign data as a JSON file.

---

## Rules of Engagement

- **Security:** Validate all imported data using `CampaignSchema` before saving to IndexedDB.
- **UX:** Provide clear feedback (e.g. "Import successful" or "Invalid file format").
- **Bulk Action:** Export and Import should handle *all* campaigns in the database at once.
- **Download:** Use the browser's `Blob` and `URL.createObjectURL` for the export functionality.

---

## Context

### Why?
IndexedDB is local to the browser/device. Players want to move their data from a PC to a tablet or simply backup their progress.

### Structure
The export file should be a JSON array of `Campaign` objects.

---

## Files to Touch

```
EDIT  src/features/campaign/store.ts
EDIT  src/features/campaign/CampaignList.tsx
```

---

## Specifications

### 1. `src/features/campaign/store.ts`

Add a new action:
```typescript
/** Import an array of campaigns. Validates each one. */
importData: (json: string) => Promise<{ success: boolean; count: number; error?: string }>
```

**Implementation:**
1.  `JSON.parse(json)`.
2.  Check if it's an array.
3.  For each item, `CampaignSchema.parse(item)`.
4.  If all valid, `db.campaigns.bulkPut(validatedCampaigns)`.
5.  `initStore()` to refresh state.

### 2. `src/features/campaign/CampaignList.tsx`

**Export Button:**
-   Gather all campaigns from the store.
-   Create a `Blob` from `JSON.stringify(campaigns, null, 2)`.
-   Create an `<a>` element, set `href` to object URL, set `download="jotl-backup.json"`, and trigger click.

**Import Button:**
-   Hidden `<input type="file" accept=".json" />`.
-   Button that triggers the input click.
-   `onChange` handler reads the file using `FileReader`.
-   Calls `importData(content)`.
-   Shows an `alert()` or toast with the result.

---

## Constraints

- Use `z.array(CampaignSchema)` for the top-level validation of the imported file.
- Ensure `updatedAt` and `createdAt` are handled correctly (Zod schema already coerces strings to Dates).

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | "Export Data" downloads a JSON file containing current campaigns. |
| 2 | "Import Data" correctly parses a valid JSON backup and updates the list. |
| 3 | Invalid JSON or mismatched schema shows an error message. |
| 4 | Imported campaigns overwrite existing ones with the same ID (bulkPut). |
| 5 | UI reflects changes immediately after import. |

---
