# Backend Integration & Database Roadmap

## Overview
This document outlines the proposed backend architecture, database schema, and migration phases required to move the Saravana Traders CRM from its current frontend-only mock state to a full-stack production application.

## 1. Backend Architecture
The frontend is built with React + Vite + TanStack Router. We propose the following backend stack:
- **Server**: Node.js with Express/NestJS (or Python FastAPI).
- **Database**: PostgreSQL (relational structure is optimal for CRM entities).
- **ORM**: Prisma or TypeORM (to maintain TypeScript type safety across the stack).
- **Authentication**: JWT based (or session-based), implementing RBAC (Role-Based Access Control).

## 2. Proposed Backend API Contracts
*These are PROPOSED contracts matching the existing frontend models.*

### Authentication
- `POST /api/auth/login` (Returns JWT token)
- `POST /api/auth/logout`
- `GET /api/auth/me` (Returns current employee profile and access scope)

### Employees & Access Management
- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PATCH /api/employees/:id`
- `DELETE /api/employees/:id`
- `GET /api/employees/:id/access`
- `PATCH /api/employees/:id/access`

### Leads
- `GET /api/leads`
- `GET /api/leads/:id`
- `POST /api/leads`
- `PATCH /api/leads/:id`
- `DELETE /api/leads/:id`
- `POST /api/leads/:id/convert` (Converts Lead to Customer)

### Customers
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id`

### Orders
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id`
- `DELETE /api/orders/:id`

### Follow-ups
- `GET /api/follow-ups`
- `GET /api/follow-ups/:id`
- `POST /api/follow-ups`
- `PATCH /api/follow-ups/:id`
- `DELETE /api/follow-ups/:id`
- `POST /api/follow-ups/:id/complete`

### Dashboard
- `GET /api/dashboard/summary` (KPI metrics)
- `GET /api/dashboard/follow-ups`

## 3. Database Schema Roadmap (PostgreSQL)

### `users` / `employees`
- `id` (UUID, PK)
- `name` (String)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: ADMIN, MANAGER, REP)
- `status` (Enum: ACTIVE, INACTIVE)
- `avatar_url` (String, nullable)
- `created_at`, `updated_at`

### `employee_access`
- `employee_id` (UUID, FK, PK)
- `access_type` (Enum: OWN_RECORDS, SHARED_RECORDS, FULL_ACCESS)

### `leads`
- `id` (UUID, PK)
- `company_name` (String)
- `contact_person` (String)
- `email` (String)
- `phone` (String)
- `status` (Enum: NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST)
- `source` (String)
- `notes` (Text)
- `assigned_to` (UUID, FK to employees)
- `created_at`, `updated_at`

### `customers`
- `id` (UUID, PK)
- `company_name` (String)
- `contact_person` (String)
- `email` (String)
- `phone` (String)
- `address` (Text)
- `assigned_to` (UUID, FK to employees)
- `created_at`, `updated_at`

### `orders`
- `id` (UUID, PK)
- `order_number` (String, Unique)
- `customer_id` (UUID, FK to customers)
- `amount` (Decimal)
- `status` (Enum: PENDING, PROCESSING, COMPLETED, CANCELLED)
- `payment_status` (Enum: PENDING, PARTIAL, PAID)
- `fabric_type` (Enum: Recycle, Cotton cone, Cotton hank, Grey Fabric, Customised fabric)
- `quantity` (Integer)
- `unit` (Enum: Bags, Mtr, Bundle, Kgs)
- `assigned_to` (UUID, FK to employees)
- `created_at`, `updated_at`

### `follow_ups`
- `id` (UUID, PK)
- `title` (String)
- `description` (Text)
- `date` (Timestamp)
- `status` (Enum: PENDING, COMPLETED)
- `type` (Enum: CALL, MEETING, EMAIL, OTHER)
- `entity_type` (Enum: LEAD, CUSTOMER, ORDER)
- `entity_id` (UUID, generic FK)
- `assigned_to` (UUID, FK to employees)
- `created_at`, `updated_at`

## 4. Phased Implementation Roadmap

**Phase 1: Backend Project Setup**
- Initialize Node.js/Python project. Setup ORM and database migrations.

**Phase 2: PostgreSQL Database**
- Deploy initial schema matching the above tables.

**Phase 3: Authentication & RBAC**
- Implement login, session management, and role-based middleware guarding routes based on `employee_access` scopes.

**Phase 4: Employee Management**
- Build CRUD for employees. Frontend refactors `Employees` tab to use API.

**Phase 5: Leads & Customers**
- Build CRUD APIs. Implement Lead Conversion logic on the backend to guarantee transactional safety.

**Phase 6: Orders**
- Implement Order generation tied to Customers.

**Phase 7: Follow-ups & Calendar**
- Implement polymorphic follow-ups. Ensure calendar queries correctly fetch by date ranges.

**Phase 8: Dashboard Analytics**
- Create optimized SQL views or aggregate endpoints for dashboard KPIs to prevent massive data transfer.

**Phase 9: Production Deployment**
- Deploy backend (e.g. AWS, Render, Heroku) and connect the Netlify frontend to the production API URL.
