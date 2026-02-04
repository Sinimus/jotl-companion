# TASK-018: Dashboard Redesign

**Status:** `TODO`
**Priority:** `HIGH`
**Complexity:** `MEDIUM`
**Depends On:** TASK-017

---

## Goal

Transform the "Campaign List" into a proper **Dashboard**. It should prioritize the active campaign and provide a visual summary of progress.

---

## Rules of Engagement

-   **Visual Hierarchy:** The active campaign (last played) should be big and bold.
-   **Glanceable Stats:** Show "Scenarios Unlocked/Completed", "Party Level", etc., without needing to click in.
-   **Empty State:** A beautiful empty state if no campaigns exist.

---

## Context

Currently, `CampaignList.tsx` is just a list of buttons + the create form.

---

## Files to Touch

```
EDIT  src/features/campaign/CampaignList.tsx
NEW   src/features/campaign/ActiveCampaignCard.tsx
NEW   src/features/campaign/CreateCampaignModal.tsx (Optional, or inline expand)
```

---

## Specifications

### 1. `src/features/campaign/CampaignList.tsx`

**Layout:**
1.  **Header:** "Welcome Back".
2.  **Active Campaign Section:**
    -   If `activeCampaignId` exists, show the `ActiveCampaignCard`.
    -   If not, show the most recently updated campaign.
3.  **Recent History / Other Campaigns:**
    -   List other campaigns as smaller cards/rows.
4.  **Floating Action Button (FAB) / Main Button:**
    -   "New Campaign" button (distinct from the list).

### 2. `src/features/campaign/ActiveCampaignCard.tsx`

**Visuals:**
-   Large card, maybe with a thematic background gradient (Amber/Zinc).
-   **Title:** Campaign Name.
-   **Subtitle:** "Last played [Date]".
-   **Stats Grid:**
    -   Party Size (e.g. "4 Heroes").
    -   Progress (e.g. "Scenario 5/17").
-   **Primary Action:** "Continue" button (navigates to `/campaign/:id`).

---

## Constraints

-   Keep the "Delete" functionality accessible but maybe hidden behind a menu (three dots) on the cards to avoid accidental clicks.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | Dashboard clearly emphasizes the active/latest campaign. |
| 2 | "Continue" button works. |
| 3 | Creating a new campaign is still easy/accessible. |
| 4 | Layout looks good on mobile (stacked) and desktop (grid). |

---
