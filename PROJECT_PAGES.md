# FuelOps Project - User & Page Documentation

## 1. User Roles

The application defines four distinct user roles, each with specific access privileges and operational scopes.

| Role | Role Name | Description | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Encoder** | John Encoder | Fleet Dashboard User | Managing daily tanker operations, creating tanker days, and recording fuel trips. |
| **Validator** | Maria Validator | Review Queue User | Reviewing and approving submitted records. Cannot create new records. |
| **Supervisor** | Carlos Supervisor | Supervisor Dashboard User | Oversight, POD verification, and high-level review. Same view permissions as Validator. |
| **Admin** | System Admin | System Administrator | Full access to all modules, including Master Data management and system configuration. |

---

## 2. Page Visibility Matrix

| Page Route | Page Name | Encoder | Validator | Supervisor | Admin |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `/login` | Login | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | Dashboard | ✅ | ✅ | ✅ | ✅ |
| `/tanker-days/[id]` | Tanker Day Detail | ✅ | ✅ | ✅ | ✅ |
| `/fleet-status` | Fleet Status | ✅ | ✅ | ✅ | ✅ |
| `/trips` | Trips | ✅ | ✅ | ✅ | ✅ |
| `/reports/*` | All Reports | ❌ | ✅ | ✅ | ✅ |
| `/admin/*` | Admin Panel | ❌ | ❌ | ❌ | ✅ |

---

## 3. Detailed Page Guide

### 3.1 Core Operations (Accessible to All)

#### **1. Login Page**
*   **Route**: `/login`
*   **Description**: Entry point for authentication. Includes specific "Quick Login" buttons for demo purposes for each role type.
*   **Features**: User authentication, Role detection.

#### **2. Dashboard**
*   **Route**: `/dashboard`
*   **Role-Specific Variations**:
    *   **Encoder**: Titled "Fleet Dashboard". Shows "Open" operations. **Action**: Can "Create Tanker Day" (Bulk or Single).
    *   **Validator**: Titled "Review Queue". Shows "Submitted" operations pending review. **Action**: View/Review only.
    *   **Supervisor**: Titled "Supervisor Dashboard". Shows submitted/locked records.
    *   **Admin**: Titled "Admin Dashboard". Full access to create and review.
*   **Key Features**:
    *   Business Date picker.
    *   Stats Cards (Total Tankers, Open, Submitted, Locked).
    *   Operations Table (List of active tanker days).

#### **3. Tanker Day Detail**
*   **Route**: `/tanker-days/[id]`
*   **Description**: Detailed view of a specific tanker's daily activity.
*   **Features**:
    *   Compartment planning and allocation.
    *   Trip management (Add/Edit trips).
    *   Liquidated volume tracking.

#### **4. Fleet Status**
*   **Route**: `/fleet-status`
*   **Description**: Real-time or current status overview of the entire fleet.

#### **5. Trips**
*   **Route**: `/trips`
*   **Description**: Comprehensive list of all trips across all tankers.

---

### 3.2 Reports & Analytics (Restricted: No Encoders)

These pages are accessible only to **Validator**, **Supervisor**, and **Admin** roles.

*   **Main Hub**: `/reports` - Overview dashboard linking to specific reports.

#### **Report Types:**
1.  **Daily Program Summary** (`/reports/daily-program-summary`)
    *   View planned vs served liters, runs completed, and exception counts per program.
2.  **Station Delivery Ledger** (`/reports/station-ledger`)
    *   Track all deliveries per station with DR/POD references and completeness.
3.  **Dispatch Run Liquidation** (`/reports/run-liquidation`)
    *   Detailed uplift, drop, and heel totals per run with variance tracking.
4.  **Exceptions Register** (`/reports/exceptions`)
    *   Monitor all gain/loss variances and missing PODs with clearing status.
5.  **POD Completeness** (`/reports/pod-completeness`)
    *   Analyze POD attachment rates by date, station, porter, or tanker.
6.  **Productivity Summary** (`/reports/productivity`)
    *   Operational KPIs: runs, liters delivered, and efficiency metrics.

---

### 3.3 Administration (Restricted: Admin Only)

These pages are exclusively for the **Admin** role to manage master data.

*   **Main Hub**: `/admin` - Central administration panel.

#### **Management Modules:**
1.  **Tankers** (`/admin/tankers`)
    *   Manage fleet tankers, plate numbers, capacities, and compartment configurations.
2.  **Drivers** (`/admin/drivers`)
    *   Manage driver profiles and assignments.
3.  **Porters** (`/admin/porters`)
    *   Manage porter records.
4.  **Customers** (`/admin/customers`)
    *   Manage customer accounts and contracts.
5.  **Stations** (`/admin/stations`)
    *   Manage delivery sites/stations.
6.  **Fuel Types** (`/admin/fuel-types`)
    *   Manage available fuel products (Diesel, Gasoline, etc.).
