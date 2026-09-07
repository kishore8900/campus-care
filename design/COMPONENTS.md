# Campus Care interface architecture

The production interface uses one central design system in `src/app.css` and reusable React components.

- `src/components/layout/AppShell.tsx` — student/admin shell, responsive navigation, page headers
- `src/components/ui/` — buttons, labelled fields, status states, modal and chat primitives
- `src/components/student/StudentPages.tsx` — resources, breathing, help and history
- `src/components/admin/AdminApp.tsx` — real-data admin views and CRUD workflows
- `src/components/admin/DataTable.tsx` — shared accessible table with responsive rows
- `src/App.tsx` — session state and API orchestration

All product surfaces use Lucide icons, flat semantic colors, an 8px-oriented spacing scale, visible focus states and reduced-motion support.
