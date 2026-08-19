# Mock to API Migration Strategy

## Overview
Currently, the Saravana Traders CRM frontend relies on an in-memory mock data store (`MockDataContext` in `src/lib/store.ts`). This document outlines the roadmap for migrating this frontend to communicate with a production REST API.

## Step 1: Implement an API Client
1. Introduce a robust HTTP client (e.g. `axios` or native `fetch` wrappers).
2. Create `src/services/apiClient.ts` to manage base URLs (`VITE_API_BASE_URL`), interceptors, and default headers.
3. Handle global Authentication token injection (e.g., Bearer tokens from localStorage/sessionStorage) directly in the client interceptors.

## Step 2: Introduce Data Fetching/Caching Layer
1. Add **TanStack Query (React Query)**: `@tanstack/react-query`.
2. Wrap the application in a `QueryClientProvider` within `src/routes/__root.tsx`.
3. This eliminates the need for manual `useEffect` loading/error handling.

## Step 3: Replace `useCrm()` Hook incrementally
Instead of ripping out the `useCrm()` mock context all at once, refactor module by module:
1. **Define API Services**:
   Create `src/services/leads.service.ts` with methods like `getLeads()`, `createLead()`.
2. **Replace Hook implementations**:
   In `src/routes/leads.index.tsx`, swap the `useCrm()` call for `useQuery({ queryKey: ['leads'], queryFn: getLeads })`.
3. **Mutations**:
   Replace local array modifications in `useCrm()` with `useMutation()`, adding `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })`.

## Step 4: Handle Pagination & Filtering
- The current TanStack Tables filter data client-side.
- With an API, you must update the table configuration to use `manualPagination: true` and `manualFiltering: true`.
- Pass sorting, search, and page parameters as query string parameters in your API services.

## Step 5: Deprecate the Mock Store
Once all modules (Dashboard, Leads, Customers, Orders, Employees, Calendar) use React Query, completely remove:
- `src/lib/store.ts`
- `src/data/mock.ts`
- Remove the `MockDataProvider` from `__root.tsx`.
