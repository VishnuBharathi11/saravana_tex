# Saravana Traders CRM Frontend

## Overview
This is the complete frontend for the Saravana Traders CRM application. It is a React-based single-page application tailored for the textile, fabric, and garment business domain. It handles CRM operations including Leads, Customers, Orders, Calendar follow-ups, and Employee access management.

## Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui & Radix UI primitives
- **Language**: TypeScript

## Project Structure
- src/components/: Reusable UI components and complex functional sections (e.g. data-table, ollowup-timeline).
- src/routes/: Route definitions matching the TanStack Router structure (__root.tsx, dashboard.tsx, leads.*.tsx, etc.).
- src/lib/: Shared utilities, mock state (store.ts), and constants (constants.ts).
- src/data/: Seeding data for the mock store (mock.ts).
- public/: Static assets and icons.
- docs/: In-depth architectural documentation, migration paths, and feature breakdowns.

## Installation
`ash
npm install
`

## Development
`ash
npm run dev
`

## Production Build
`ash
npm run build
`
This generates the dist/ directory, which is ignored by Git by default.

## Environment Variables
Copy .env.example to .env and fill in any required variables.

## Current Frontend Features
- **Dashboard**: High-level KPIs and pending follow-ups.
- **Leads**: Pipeline tracking, converting leads to customers.
- **Customers**: Managing established client profiles.
- **Orders**: Creating and tracking textile orders (e.g. Grey Fabric, Customised fabric) with units (Bags, Mtr, Bundle, Kgs).
- **Calendar**: Managing follow-up timelines and popup interactions.
- **Employees**: Role-based access (Own Records, Shared Records, Full Access) and account transfers.

## Mock Data Status
**The current frontend relies entirely on a local mock state.** src/lib/store.ts utilizes a React context (MockDataContext) to persist state in memory. No network requests are made.

## Backend Integration Status
**Backend is NOT implemented in this frontend repository.** See BACKEND_ROADMAP.md at the repository root for the proposed backend architecture and API endpoints.

## Deployment to Netlify
The frontend is standalone and deployable to Netlify.
`ash
npm install
npm run build
`
Set the publish directory to dist/.

