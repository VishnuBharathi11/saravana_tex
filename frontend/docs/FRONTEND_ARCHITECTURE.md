# Frontend Architecture

## 1. Overview
The Saravana Traders CRM frontend is built as a single-page React application.

## 2. Technology Stack
- **Framework**: React 18, Vite
- **Routing**: TanStack Router (@tanstack/react-router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui, Radix UI

## 3. Application Entry Point
- src/main.tsx initializes the React tree and mounts the RouterProvider.
- src/routes/__root.tsx serves as the global layout wrapping all authenticated/unauthenticated routes.

## 4. Routing Architecture
File-based routing using TanStack Router:
- src/routes/index.tsx (Login redirect)
- src/routes/dashboard.tsx
- src/routes/leads.index.tsx, src/routes/leads..tsx
- src/routes/customers.index.tsx, src/routes/customers..tsx
- src/routes/orders.index.tsx, src/routes/orders.new.tsx, src/routes/orders..tsx
- src/routes/calendar.tsx
- src/routes/employees.index.tsx, src/routes/settings.tsx, src/routes/profile.tsx

## 5. Layout Architecture
src/components/layout/app-shell.tsx governs the authenticated view. It includes:
- A fixed Navbar (src/components/layout/navbar.tsx).
- A persistent Sidebar (src/components/layout/sidebar.tsx) handling desktop navigation.
- A responsive Sheet based drawer for mobile navigation.

## 6. Component Architecture
Shared UI primitives exist in src/components/ui/ (e.g. utton.tsx, dialog.tsx, input.tsx).
Domain-specific shared components exist in src/components/common/ (e.g. ollowup-timeline.tsx, ollowup-form-dialog.tsx, data-table.tsx).

## 7. State Management
Currently handled entirely in-memory using src/lib/store.ts via React Context (MockDataContext).

## 8. Domain Constants
src/lib/constants.ts holds domain data arrays:
- OrderUnits: Bags, Mtr, Bundle, Kgs
- OrderFabricTypes: Recycle, Cotton cone, Cotton hank, Grey Fabric, Customised fabric

## 9. Form Handling & Validation
eact-hook-form is integrated with zod schema validation for forms like Order creation (src/routes/orders.new.tsx) and Follow-ups (src/components/common/followup-form-dialog.tsx).

## 10. Responsive Design
Mobile views (e.g., max-w-[425px]) depend on Tailwind utility classes (w-full, min-w-0) rather than global overflow hacks. Modals scale gracefully down to w-[calc(100vw-32px)].
