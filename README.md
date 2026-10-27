# SAFECASE — Anti-Scam Complaint & Investigation Management System

SAFECASE is an enterprise-grade, civic anti-scam complaint intake, triage, and investigation management web application. Designed to conform strictly to official public-safety portal standards, it reproduces the visual design system of the provided reference designs:

1. **Reference 1:** A split-screen sign-in and registration portal featuring a dark navy (`#0C2038`) left panel with the red square shield brand (`#C93636`), institutional serif typography, and a clean white right panel with full-width action controls.
2. **Reference 2:** A dedicated investigation workspace featuring a navy sidebar with active left red border accents, a white header with live locale date and unread notification alerts, and a light-gray (`#F4F6F8`) casework desk with 4 key metrics cards, database-driven loss figures, and an interactive investigation records table.

---

## 1. Key Features & Capabilities

### Public Citizen Portal
- **Registration & Authentication:** Secure citizen sign-up with Argon2id password hashing and JWT sessions.
- **10-Field Scam Intake Form:**
  1. *Scam Type:* Dynamic taxonomy loaded from PostgreSQL/SQLite.
  2. *Amount Lost:* INR loss input with database numeric precision.
  3. *Incident Date & Time:* Validated chronological timestamp.
  4. *Scammer Identifier Type:* Phone number, UPI ID, URL, Email, Social media.
  5. *Scammer Identifier Value:* Normalized offender handle or account.
  6. *Transaction Reference:* UTR/IMPS with anti-credential theft warnings.
  7. *Narrative Statement:* Minimum 20-character factual description.
  8. *Evidence Attachments:* Drag-and-drop support for PNG, JPG, JPEG, and PDF documents.
  9. *Incident Location:* City and jurisdiction.
  10. *Consent & Legal Declaration:* Mandatory verification checkbox.
- **Unique Case Reference:** Automatically generates non-guessable IDs such as `ASC-2026-XXXXXXXX`.
- **Casework Stepper:** Visual tracking through workflow stages: `Submitted` → `Under Review` → `Investigation Started` → `Resolved` → `Closed`.
- **Supplementary Evidence:** Citizens can upload additional documents while cases are open.
- **Public Remarks Feed:** Complainants receive real-time updates and investigator remarks while internal notes remain restricted.
- **Account Deactivation:** Data-retention compliant account deactivation request.

### Investigator Casework Desk (Reference 2)
- **Live Institutional Metric Cards:**
  1. *Total Complaints*
  2. *Active Cases*
  3. *Resolved Cases*
  4. *Evidence Files*
  *(All aggregated directly from the database; never mock data).*
- **Reported Losses Metric:** Clearly labeled as reported citizen losses, avoiding false claims of recovered money.
- **Comprehensive Casework Table:** Search by ID, filter by category/status, filter by assigned officer, and sort by date.
- **Authorized Workflow Transitions:** State machine enforcing valid progression with recorded actor audit logs.
- **Segregated Remarks:** Public notices (pushed to complainant) vs. internal investigative notes (accessible only to authorized staff).
- **Evidence Vault:** Cryptographically hashed (SHA-256) file storage outside public web roots with authorized streaming downloads.
- **Scammer Blacklist Registry:** Direct listing of verified fraudulent VPAs, phone numbers, and URLs.
- **CSV Data Export:** Export authorized case registers with clean audit logging.
- **Analytics & Trends:** Recharts visualizations of crime patterns, status breakdowns, and temporal volume.

### Super Administrator Console
- **System Governance:** Oversight of system-wide metrics and user directories.
- **Officer Provisioning:** Create, edit, and deactivate investigator and administrator accounts.
- **Taxonomy Management:** Add, edit, and order scam categories dynamically reflected in submission forms.
- **Blacklist Moderation:** Final authority to verify or delete blacklisted identifiers.
- **Security Audit Logs:** Comprehensive inspection of authentication attempts, role elevations, and casework modifications.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Alembic.
- **Security:** Argon2id password hashing, PyJWT, HttpOnly SameSite cookie support, role-based dependencies.
- **Database:** PostgreSQL (with SQLite async fallback for effortless local development).
- **Storage:** Local isolated storage outside public web directories with SHA-256 integrity verification.
- **Email:** Development email logger + configurable SMTP notifications.

---

## 3. Architecture & Directory Structure

```
safecase/
├── backend/
│   ├── alembic/                # Alembic database migrations
│   ├── app/
│   │   ├── api/v1/             # REST endpoints (auth, complaints, evidence, blacklist, etc.)
│   │   ├── core/               # Configuration and Argon2/JWT security
│   │   ├── db/                 # Async SQLAlchemy engine & session factory
│   │   ├── models/             # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/            # Pydantic v2 validation models
│   │   └── services/           # Storage, Email, and Audit logging services
│   ├── scripts/
│   │   └── seed.py             # Development seed script with sample data
│   ├── tests/                  # Automated pytest suite (6 test modules)
│   ├── uploads/                # Evidence vault (outside public static path)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # Centralized typed API client
│   │   ├── components/         # Common UI components (Header, Sidebar, StatCard, StatusBadge)
│   │   ├── context/            # AuthContext & NotificationContext
│   │   ├── pages/              # Reference 1 (Login), Reference 2 (Investigator), Admin, Citizen
│   │   └── types/              # TypeScript interface definitions
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml          # Multi-container orchestration (DB, API, Web)
├── .env.example                # Template environment variables
└── README.md
```

---

## 4. Getting Started & Installation

### Prerequisites
- Python 3.10+ (Python 3.13 tested)
- Node.js v18+ (Node.js v24 tested) & npm
- Docker & Docker Compose *(optional for containerized deployment)*

### Step 1: Clone and Navigate
```bash
cd safecase
```

### Step 2: Configure Environment
Copy `.env.example` to `.env` in the project root and `backend/.env`:
```bash
cp .env.example backend/.env
```

### Step 3: Setup Backend Environment
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 4: Run Migrations and Seed Database
Initialize the database schema and populate realistic demo casework and accounts:
```bash
# Run Alembic migrations:
alembic upgrade head

# Seed initial categories, demo accounts, and sample complaints:
python scripts/seed.py
```

### Step 5: Setup Frontend
In a separate terminal:
```bash
cd ../frontend
npm install --legacy-peer-deps
```

---

## 5. Running the Application

### Option A: Local Development Server

**1. Start Backend (Port 8000):**
```bash
cd backend
.\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**2. Start Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

### Option B: Docker Compose Deployment
```bash
docker-compose up --build -d
```
The application will be accessible at:
- **Web Portal:** `http://localhost:5173`
- **FastAPI Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/health`

---

## 6. Deploying to Vercel

Deploy the frontend and backend as **two Vercel projects** from this repository:

1. Import the repository in Vercel and set the project **Root Directory** to `frontend`.
   Vercel uses `frontend/vercel.json`; the build command is `npm run build` and the
   output directory is `dist`.
2. Create a second Vercel project for the same repository with **Root Directory**
   set to `backend`. Vercel uses the FastAPI entry point at `backend/api/index.py`
   and `backend/requirements.txt`.
3. Configure the backend project's environment variables:
   - `DATABASE_URL`: a persistent PostgreSQL connection string using the
     `postgresql+asyncpg://` SQLAlchemy driver.
   - `SECRET_KEY`: a unique, randomly generated secret (for example,
     `python -c "import secrets; print(secrets.token_urlsafe(48))"`).
   - `CORS_ORIGINS`: a JSON array containing the deployed frontend origin, such as
     `["https://your-frontend.vercel.app"]`.
   - `UPLOAD_DIR`: `/tmp/safecase-uploads` (the default on Vercel).
4. Set `VITE_API_URL` in the frontend project's environment variables to the
   backend project's origin, for example `https://your-backend.vercel.app`.
   Redeploy the frontend after setting it.
5. Deploy the backend first, then the frontend. Verify
   `https://your-backend.vercel.app/api/health` and open the frontend deployment.

Use the PostgreSQL URL from your database provider, but ensure its scheme is
`postgresql+asyncpg://` rather than `postgres://` or `postgresql://`.

**Important storage limitation:** Vercel's function filesystem is temporary.
`/tmp/safecase-uploads` lets the API start and accept evidence, but those files
are not durable and may disappear between invocations. Do not use this setup for
real evidence until `backend/app/services/storage.py` is connected to persistent
object storage. Vercel also limits request body size, so the app's default 15 MB
evidence upload limit may exceed the function request limit.

---

## 7. Pre-configured Demo Accounts

The database seed command (`python scripts/seed.py`) configures 3 distinct accounts:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@safecase.gov` | `AdminSafecase#2026` | Full administrative console, user governance, audit logs, category taxonomy |
| **Investigator** | `officer.sharma@safecase.gov` | `Investigator#2026` | Reference 2 dashboard, casework reviews, evidence viewer, blacklist registry, analytics |
| **Public Citizen** | `citizen.varun@example.com` | `CitizenPass#2026` | Complaint intake form, case tracking, supplementary uploads, public remarks |

> *Quick-fill buttons are integrated directly into the login screen for instant role testing.*

---

## 8. Running Automated Tests

Run the full test suite verifying authentication, role boundaries, status transitions, evidence upload validation, and analytics calculations:

```bash
cd backend
.\venv\Scripts\pytest -v
```

All 6 test suites execute with in-memory SQLite isolation:
- `test_auth_flows`: Citizen registration, valid login, rejection of invalid passwords.
- `test_complaint_and_ownership`: Automatic `ASC-2026-XXXXXXXX` ID generation and cross-user ownership barriers.
- `test_investigator_status_transitions`: Role enforcement and status history persistence.
- `test_evidence_upload_and_download`: MIME type/magic-byte checks and authorized download streaming.
- `test_blacklist_and_admin`: Scammer blacklist addition and audit log creation.
- `test_analytics_endpoint`: Database loss calculations and category aggregation.

---

## 9. API Documentation

Interactive OpenAPI / Swagger documentation is available out of the box:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

Core API endpoints:
- `POST /api/v1/auth/register` — Citizen registration
- `POST /api/v1/auth/login` — Token & cookie issuance
- `GET /api/v1/complaints/` — Filtered casework listing (role-restricted)
- `POST /api/v1/complaints/` — 10-field complaint filing
- `GET /api/v1/complaints/{id}` — Detail view with status history and notes
- `POST /api/v1/complaints/{id}/status` — Authorized status transition
- `POST /api/v1/complaints/{id}/evidence` — File upload with SHA-256 hashing
- `GET /api/v1/complaints/{id}/evidence/{ev_id}/download` — Authorized evidence streaming
- `GET /api/v1/blacklist/` — Scammer registry search
- `GET /api/v1/analytics/` — Real-time database aggregations
- `GET /api/v1/audit/` — Administrative security audit logs
