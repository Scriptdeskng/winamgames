Implement the admin Help Center exactly within the requested scope: one sidebar update and one new route file.

Files to change:
1. `src/routes/-admin/AdminSidebar.tsx`
   - Import `HelpCircle` from `lucide-react`.
   - Add `{ to: "/admin/help", label: "Help", icon: HelpCircle }` as the final item in the existing `NAV` array so it appears at the bottom of the nav list, above the logged-in/logout section.

2. `src/routes/admin.help.tsx`
   - Create a new TanStack route at `/admin/help`.
   - Hardcode the Help Center UI with no server functions, no database reads/writes, and no backend changes.
   - Build the layout using the existing admin dark theme classes:
     - Page title and subtitle.
     - Responsive two-column layout: article list on the left, article content on the right; single column on mobile.
     - One selectable article: “Weekly Draw Runbook”, highlighted when active.
     - Full runbook content with the requested sections: overview, schedule table, warning callouts, normal flow, verification checklist, manual override, winner management, incident response, and quick reference cards.
   - Use compact admin-style tables, amber warning callouts, bordered cards, muted helper text, and readable numbered step spacing.

Validation:
- Run the project build after changes to confirm the new route and sidebar link typecheck successfully.

No database changes, no server functions, no admin panel behavior changes beyond the new Help route/link, and no other files will be modified.