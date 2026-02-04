# TASK-017: UI/UX Overhaul - Layout & Navigation

**Status:** `TODO`
**Priority:** `HIGH`
**Complexity:** `MEDIUM`
**Depends On:** TASK-016

---

## Goal

Establish a professional, cohesive UI framework for the application. This includes a global layout with proper navigation (Bottom Bar for mobile, Sidebar/Header for desktop) and moving utility features like "Export/Import" to a dedicated Settings area.

---

## Rules of Engagement

-   **Mobile-First:** Navigation must be bottom-bar based on small screens.
-   **Theme:** Stick to the `Zinc` (dark background) and `Amber` (accent) aesthetic.
-   **Consistency:** Use reusable layout components.
-   **Clean Up:** Remove ad-hoc "Back" buttons in favor of the global navigation where appropriate, or keep them as "Up" navigation within a stack.

---

## Context

Currently, the app relies on simple `Link` components scattered around. We need a `MainLayout` that persists across views to provide quick access to key sections: **Campaigns**, **Rules**, and **Settings**.

---

## Files to Touch

```
NEW   src/shared/components/layout/AppLayout.tsx
NEW   src/shared/components/layout/BottomNav.tsx
NEW   src/features/settings/SettingsPage.tsx
NEW   src/features/settings/index.ts
EDIT  src/app/routes.tsx
EDIT  src/features/campaign/CampaignList.tsx (Remove Export/Import buttons)
```

---

## Specifications

### 1. `src/features/settings/SettingsPage.tsx`

-   **Header:** "Settings".
-   **Data Management Section:**
    -   Move the **Export Data** and **Import Data** logic/UI here from `CampaignList`.
    -   Add a "Reset App" (Delete All) button (guarded by a confirmation).
-   **About Section:** Version number, link to GitHub (if applicable), or credits.

### 2. `src/shared/components/layout/BottomNav.tsx`

-   Fixed at the bottom of the screen.
-   Items:
    -   **Campaigns** (Icon: Map/Home) -> `/`
    -   **Rules** (Icon: Book) -> `/rules`
    -   **Settings** (Icon: Cog) -> `/settings`
-   Active state styling (Amber text/icon).

### 3. `src/shared/components/layout/AppLayout.tsx`

-   Wrapper for the main routes.
-   Renders `<Outlet />` inside a container with padding-bottom (to avoid overlap with BottomNav).
-   Renders `<BottomNav />` on mobile breakpoints.
-   (Optional) Renders a Sidebar on desktop breakpoints.

### 4. `src/app/routes.tsx`

-   Wrap existing routes with `AppLayout`.
-   Add `/settings` route.

---

## Constraints

-   Ensure the `z-index` of the bottom nav is high enough.
-   Keep the `CampaignList` clean (it will become the "Home" view in the next task).

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | Global navigation bar appears on all main pages. |
| 2 | "Settings" page exists and handles Import/Export correctly. |
| 3 | Navigation switches correctly between Campaigns, Rules, and Settings. |
| 4 | Active tab is visually distinct. |
| 5 | Mobile layout handles the bottom bar (content doesn't get cut off). |

---
