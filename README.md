# University Vehicle Gate Pass Verification System

A complete, production-ready full-stack digital solution for managing, approving, issuing, and verifying vehicle gate passes across university campuses. Replaces manual clipboards and paper logs with contactless QR verification, real-time perimeter tracking, role-based access control (RBAC), and automated administrative auditing.

---

## 🏛️ System Architecture & Workflow

```
                ┌──────────────────────────────────────────────────┐
                │          USER WEB APPLICATION (React)           │
                │  • Student, Staff & Visitor Registration         │
                │  • Vehicle Profile Submission (License Plate)    │
                │  • Digital QR Pass Display & PDF Badge Print     │
                │  • Gate Movement History (Inbound & Outbound)    │
                └─────────────────────────┬────────────────────────┘
                                          │ HTTPS / REST API
                                          ▼
                ┌──────────────────────────────────────────────────┐
                │         BACKEND REST API (Node.js/Express)       │
                │  • JWT Authentication & Strict RBAC              │
                │  • Cryptographic QR Token Generation             │
                │  • Gate Officer Authorization Engine             │
                │  • Scan Verification & Cooldown Guard            │
                │  • Automated Database Seed & Migration Layer     │
                └─────────────────────────┬────────────────────────┘
                                          │
                                          ▼
                ┌──────────────────────────────────────────────────┐
                │          DATABASE (MongoDB / Embedded Store)     │
                │  • Users (Students, Staff, Visitors, Officers)   │
                │  • Vehicles & Cryptographic Digital Passes       │
                │  • Campus Gates & Officer Deployments            │
                │  • Scan Transaction Logs & Security Audit Trail  │
                └───────────────▲──────────────────────────▲───────┘
                                │                          │
                                │ HTTPS / REST API         │ HTTPS / REST API
                                │                          │
                ┌───────────────┴──────────┐   ┌───────────┴──────────┐
                │   GATE OFFICER SCANNER   │   │  ADMIN WEB DASHBOARD │
                │  • HTML5 Camera Scanner  │   │  • Approvals Queue   │
                │  • ENTRY / EXIT Toggle   │   │  • Vehicle Registry  │
                │  • Instant Valid/Invalid │   │  • Gates & Officers  │
                │  • Audio Feedback & Logs │   │  • Real-time Logs    │
                └──────────────────────────┘   └──────────────────────┘
```

---

## 👥 User Roles & Capabilities

| Role | Access Scope | Key Capabilities |
| :--- | :--- | :--- |
| **STUDENT** | `/`, `/dashboard`, `/vehicles/register`, `/activity` | Account registration, register multiple student commuter/resident vehicles, track approval status, view/print digital QR pass cards, view personal entry/exit logs. |
| **STAFF / FACULTY** | `/`, `/dashboard`, `/vehicles/register`, `/activity` | Register faculty/staff vehicles with academic department linkage, view permanent faculty passes, print windshield pass badges. |
| **VISITOR** | `/`, `/dashboard`, `/vehicles/register`, `/activity` | Register guest vehicles with visit purpose and host faculty details, obtain temporary (1-7 day) access passes upon review. |
| **GATE_OFFICER** | `/scanner`, `/scanner/scan`, `/scanner/history`, `/scanner/profile` | Mobile-optimized interface, automatic assigned gate binding, live camera optical QR code scanner, manual token input fallback, direction selector (`ENTRY` / `EXIT`), instant pass validation, duplicate scan throttling, shift activity logs. |
| **ADMINISTRATOR** | `/admin/*` (Full Console) | Review pending vehicle registrations (Approve & issue QR token or Reject with reason), suspend/reactivate passes, manage university gates, register & deploy gate officers, view real-time scan telemetry, export filtered CSV audit reports, inspect administrative audit trails. |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v26)
- **npm**: v9+

### 1. Installation

```bash
# Navigate to backend and install dependencies
cd backend
npm install

# Navigate to frontend and install dependencies
cd ../frontend
npm install
```

### 2. Running the System

You can run the backend and frontend in two modes:

#### Mode A: Unified Production Server (Single Port 5000)
```bash
# In frontend directory: build production assets
cd frontend
npm run build

# In backend directory: start server
cd ../backend
npm start
```
Open **`http://localhost:5000`** in your browser. Both the web application and the REST API are served together seamlessly.

#### Mode B: Development Mode with Hot Reloading
```bash
# Terminal 1 (Backend API on port 5000):
cd backend
npm run dev

# Terminal 2 (Frontend Dev Server on port 3000):
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Test Personas)

The application includes an **Interactive Demo Quick-Switcher** banner at the top of every page. You can also log in directly using the default password: **`Password123!`**.

| Persona | Email | Role | Default Landing Page |
| :--- | :--- | :--- | :--- |
| **Dr. Eleanor Vance** (Director of Security) | `admin@university.edu` | `ADMIN` | `/admin` |
| **Officer Marcus Brody** (Main Gate) | `officer1@university.edu` | `GATE_OFFICER` | `/scanner` |
| **Officer Sarah Jenkins** (North Gate) | `officer2@university.edu` | `GATE_OFFICER` | `/scanner` |
| **Alexander Hayes** (Computer Science Student) | `student@university.edu` | `STUDENT` | `/dashboard` |
| **Prof. David Miller** (Physics Faculty) | `staff@university.edu` | `STAFF` | `/dashboard` |
| **Dr. Robert Sterling** (Invited Guest Speaker) | `visitor@university.edu` | `VISITOR` | `/dashboard` |

---

## 📡 REST API Endpoints Reference

### Authentication & Profiles (`/api/auth`)
- `POST /api/auth/register` — Register student, staff, or visitor account.
- `POST /api/auth/login` — Authenticate and receive JWT token + role profile.
- `GET /api/auth/me` — Retrieve current authenticated user and assigned gate if officer.
- `PUT /api/auth/profile` — Update contact information and affiliation.
- `POST /api/auth/forgot-password` — Password recovery instructions.

### Vehicles & Approvals (`/api/vehicles`)
- `POST /api/vehicles/register` — Submit vehicle for admin security review (Sets status `PENDING`).
- `GET /api/vehicles/my-vehicles` — Get logged-in user's vehicles with pass details.
- `GET /api/vehicles/all` — [Admin] Filterable directory of all university vehicles.
- `GET /api/vehicles/pending` — [Admin] Pending vehicle approval queue.
- `POST /api/vehicles/:id/approve` — [Admin] Approve vehicle and generate cryptographic QR pass.
- `POST /api/vehicles/:id/reject` — [Admin] Reject vehicle registration with mandatory rationale.
- `POST /api/vehicles/:id/suspend` — [Admin] Suspend pass and block gate clearance.
- `POST /api/vehicles/:id/reactivate` — [Admin] Lift suspension and restore active pass status.

### Passes & QR Verification (`/api/passes`, `/api/scan`)
- `GET /api/passes/token/:token` — Lookup pass status by scanned QR token.
- `GET /api/passes/:id` — Get full pass details and high-resolution printable QR code.
- `POST /api/scan/verify` — [Officer/Admin] Verify scanned token, enforce gate authorization, prevent rapid duplicates, record `ENTRY` or `EXIT` in `ScanLog`.
- `GET /api/scan/shift-logs` — [Officer] Retrieve shift scan history.
- `GET /api/scan/user-activity` — [User] Retrieve personal gate movement history.
- `GET /api/scan/all` — [Admin] Master audit log with date, gate, and direction filters.

### Gates & Officer Deployment (`/api/gates`)
- `GET /api/gates` — List all campus gates with active officer count and today's scan totals.
- `POST /api/gates` — [Admin] Create new university gate checkpoint.
- `PUT /api/gates/:id` — [Admin] Update gate details and status (`ACTIVE`, `INACTIVE`, `MAINTENANCE`).
- `GET /api/gates/officers` — [Admin] List all security officers and deployments.
- `POST /api/gates/officers` — [Admin] Register new gate officer.
- `PUT /api/gates/officers/:officerId/assign` — [Admin] Assign officer to gate terminal and shift.
- `GET /api/gates/my-assignment` — [Officer] Get assigned gate information.

### Reports & System Auditing (`/api/reports`, `/api/audit`)
- `GET /api/reports/stats` — [Admin] Real-time KPI telemetry and recent scan stream.
- `GET /api/reports/analytics` — [Admin] Traffic distribution by gate, vehicle type, and user role.
- `GET /api/reports/export-csv` — [Admin] Download filtered gate scan records as CSV.
- `GET /api/audit` — [Admin] Comprehensive security audit trail of administrative actions.

---

## 🧪 Automated Testing

The backend includes a comprehensive automated test suite testing auth, vehicle lifecycle, QR issuance, and gate verification:

```bash
cd backend
npm test
```

**Results:**
- `✔ Authentication & Role-Based Access Control` (Admin, Student, Staff, Visitor, Officer)
- `✔ Vehicle Registration & Admin Approval Workflow` (`PENDING` -> `APPROVED` + QR Pass Generation, Rejection with reason)
- `✔ QR Code Pass Scanning & Gate Verification` (Valid pass, Suspended pass, Non-existent token)
- `✔ Entry & Exit Gate Recording` (`ENTRY` and `EXIT` logs)
- `✔ Gate Officer Assignment` (Gate binding validation)
- **11 / 11 tests passed with 100% success.**

---

## 🛡️ Security Features
1. **Zero Sensitive Data in QR Codes**: The QR code encodes only a high-entropy, tamper-resistant token (`UGP-...`). Personal information is never stored inside the QR code.
2. **Server-Side Authorization**: The backend performs all checks (pass active, not expired, not suspended, vehicle approved, officer assigned to gate).
3. **Anti-Duplicate Frame Guard**: 4-second intelligent cooldown prevents duplicate scans caused by camera optical stutter.
4. **Strict Role-Based Middleware**: Access to admin and scanner endpoints is enforced by JWT signature and role checks.
5. **Auditing**: All approvals, rejections, suspensions, and officer assignments are logged to `AuditLog`.

---

© 2026 Apex University. Department of Campus Safety & Transportation Authority.
