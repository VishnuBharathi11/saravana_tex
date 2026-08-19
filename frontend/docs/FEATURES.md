# Features

## Dashboard
- Displays key KPI metrics (Today's Meetings, Orders, Customers, Total Leads).
- Lists Upcoming and Pending follow-ups.
- Contains a mobile responsive toggle for Upcoming/Pending sections.
- Workflow shortcuts drop-down filter for navigating between modules.

## Leads
- Comprehensive listing of prospective leads with filtering and search capabilities.
- Add Lead functionality without obsolete 'Assigned Employee' fields.
- Conversion to Customer workflow.
- Follow-up history dialogs.

## Customers
- Lists converted accounts.
- Detail view for viewing historical orders and specific follow-up history.
- Ability to generate a new Order tied to the customer ID.

## Orders
- Tracks generated textile/fabric orders.
- Create Order workflow dynamically searches and prepopulates known Lead/Customer data.
- Enforces Textile constraints like valid unit selection (Bags, Mtr, Bundle, Kgs) and type selection (Grey Fabric, Customised, etc).

## Calendar
- Primary interface for tracking Follow-Ups.
- Daily, Weekly, Monthly view toggles.
- Supports white surfaces for popups, overriding the global glassmorphic design for legibility.
- Allows immediate completion/closure of follow-up tasks.

## Employees
- Manages organizational members.
- Supports altering Roles (Admin, Manager, Rep) and Status (Active, Inactive).
- Employs a record-transfer interface to reassign leads/customers/orders upon employee deletion.
- **Access Management**: Granularly controls whether employees view "Own Records", "Shared Records", or possess "Full Access".

## Profile
- Basic employee details viewer.
- Accessible via the global app shell dropdown.

## Settings
- Reduced to bare minimum layout (Company Profile, Notifications) for streamlined administration.
- Explicitly fixed to prevent mobile horizontal overflow.

## Responsive Behavior
- Desktop layout is locked to a fixed top navbar and left sidebar.
- Mobile layout converts navigation to a hamburger menu using the `<Sheet>` primitive.
- All DataTables compress their data intuitively using native overflow or condensed rows.
