<div align="center">

# 🛡️ Fraud Vision

### Real-Time Banking Fraud Detection & Surveillance Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![SQLite](https://img.shields.io/badge/SQLite-Fallback-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

*A financial-grade fraud detection system featuring a real-time rules engine, live WebSocket transaction feeds, KYC customer profiling, and executive reporting — built for risk analysts, compliance officers, and fraud operations teams.*

</div>

---

## 📸 Overview

Fraud Vision is a full-stack fraud detection and case management platform designed to simulate the kind of internal tooling used by financial institutions and fintech companies. It features a configurable rules engine that evaluates incoming transactions in real time, surfacing risk scores, anomalies, and automatic notifications to operators.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔴 **Live Surveillance Feed** | Real-time WebSocket stream of incoming transactions with automatic risk scoring |
| ⚙️ **Configurable Rules Engine** | 6 detection rules (amount, velocity, frequency, time anomaly, jurisdiction risk, customer avg) — all tunable from the UI |
| 🧪 **Transaction Simulator** | Submit hypothetical transaction payloads and get an instant risk breakdown |
| 📊 **Analytics Dashboard** | 30-day fraud vs. volume trend charts, KPI summary cards, and geographic hotspot map |
| 👤 **KYC Customer Profiles** | Customer risk profiles with KYC status (`VERIFIED`, `HIGH_RISK`, `SUSPENDED`, `PENDING_VERIFICATION`) |
| 📄 **Report Generation** | On-demand PDF and Excel/CSV export of all transactions and high-risk flags |
| 🗓️ **Scheduled Reports** | Create daily/weekly automated report schedules sent to recipient emails |
| 🔔 **Real-time Alerts** | Toast notifications for high-risk transactions (score ≥ 60), with a full notification centre |
| 🔐 **Role-based Access** | Three roles: `Admin`, `Risk Analyst`, `Compliance Officer` with protected routes |
| 🌙 **Dark / Light Mode** | Full theme toggle with persistence |
| 🐳 **Docker Ready** | One-command `docker-compose up` deployment with PostgreSQL + backend + frontend |

---

## 🏗️ Architecture

```
fraud-vision/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point, CORS, router registration
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── auth.py                 # JWT authentication & role guard
│   ├── rules.py                # Core fraud rules engine
│   ├── seed.py                 # Database seeding (users, transactions, rules)
│   ├── database.py             # DB engine (PostgreSQL → SQLite fallback)
│   ├── config.py               # Settings (env vars)
│   ├── websocket_manager.py    # WebSocket broadcast manager
│   └── routes/
│       ├── auth.py             # /api/auth/*
│       ├── transactions.py     # /api/transactions/*
│       ├── analytics.py        # /api/analytics/*
│       ├── customers.py        # /api/customers/*
│       ├── rules.py            # /api/rules/*
│       ├── notifications.py    # /api/notifications/*
│       └── reports.py          # /api/reports/*
│
├── frontend/                   # React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx             # Root component, WebSocket pipeline, routing
│       ├── components/
│       │   ├── Dashboard.tsx   # KPI cards, trend charts, surveillance feed
│       │   ├── TransactionTable.tsx
│       │   ├── TransactionDetailModal.tsx
│       │   ├── Analytics.tsx   # Advanced charts & breakdowns
│       │   ├── CustomersPanel.tsx
│       │   ├── RulesPanel.tsx  # Rules engine config + simulator
│       │   ├── ReportsPanel.tsx
│       │   ├── Navbar.tsx
│       │   ├── Sidebar.tsx
│       │   └── Login.tsx
│       ├── context/
│       │   ├── AuthContext.tsx  # JWT auth, axios defaults
│       │   └── ThemeContext.tsx
│       └── types/index.ts
│
├── docker-compose.yml          # Full stack orchestration
└── .gitignore
```

---

## 🚀 Quick Start

### Option 1 — Docker Compose (Recommended)

> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# Clone the repository
git clone https://github.com/hemanthkumarrrdy-bit/Fraud-Vision.git
cd Fraud-Vision

# Build and start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

### Option 2 — Local Development

#### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

#### 1. Backend Setup

```bash
# Navigate to project root
cd Fraud-Vision

# (Optional) Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install Python dependencies
pip install -r backend/requirements.txt

# Start the backend server
python -m backend.main
```

The backend will start at **http://localhost:8000**.

> **Note:** If PostgreSQL is not running, it automatically falls back to a local SQLite database (`fraud_vision.db`). The database is seeded with demo data on first startup.

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The frontend will start at **http://localhost:5173**.

---

## 🔐 Default Login Credentials

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Risk Analyst** | `analyst` | `analyst123` |
| **Compliance Officer** | `compliance` | `compliance123` |

> ⚠️ Change these credentials before any production deployment.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/fraud_vision` | PostgreSQL connection string. Falls back to SQLite if unreachable. |
| `SECRET_KEY` | `goldman_sachs_secret_key_...` | JWT signing secret. **Change in production.** |
| `SMTP_SERVER` | `smtp.mailtrap.io` | SMTP server for scheduled report emails |
| `SMTP_PORT` | `2525` | SMTP port |
| `SMTP_USER` | *(empty)* | SMTP username |
| `SMTP_PASSWORD` | *(empty)* | SMTP password |
| `SENDER_EMAIL` | `alerts@fraudvision.com` | From address for alert emails |

---

## 🧠 Fraud Rules Engine

The engine evaluates each incoming transaction against 6 configurable rules. All rules can be toggled, re-weighted, and have their threshold parameters edited live from the **Rules Engine** panel (Admin only).

| Rule Code | Name | Default Weight | Default Condition |
|---|---|---|---|
| `AMOUNT_LIMIT` | Amount Limit Anomaly | 30 | `threshold: $10,000` |
| `CUSTOMER_AVG_LIMIT` | Customer Average Anomaly | 20 | `5x customer average` |
| `VELOCITY_LIMIT` | Velocity & Location Anomaly | 40 | `max speed: 700 km/h` |
| `FREQUENCY_LIMIT` | Frequency Anomaly | 30 | `>3 transactions / 15 min` |
| `OFF_HOURS_LIMIT` | Off-Hours Anomaly | 15 | `1 AM–5 AM + amount > $500` |
| `HIGH_RISK_COUNTRY` | Jurisdiction Risk | 25 | `Iran, North Korea, Syria, ...` |

**Risk Score Thresholds:**

| Score | Verdict |
|---|---|
| 0–34 | 🟢 Low Risk |
| 35–59 | 🟡 Medium Risk |
| 60–79 | 🟠 High Risk — Alert generated |
| 80–100 | 🔴 Critical — Immediate review required |

---

## 📡 API Reference

Full interactive documentation is available at **http://localhost:8000/docs** (Swagger UI).

### Authentication
```
POST /api/auth/login       — OAuth2 password grant (returns JWT)
GET  /api/auth/me          — Get current user profile
```

### Transactions
```
GET  /api/transactions/           — List transactions (paginated, filterable)
GET  /api/transactions/{tx_id}    — Get transaction detail
PUT  /api/transactions/{tx_id}/status  — Update fraud status
GET  /api/transactions/ingest     — Ingest a new transaction through the rules engine
```

### Analytics
```
GET /api/analytics/kpis       — Dashboard KPI summary
GET /api/analytics/trends     — 30-day daily volume & fraud trend
GET /api/analytics/breakdown  — Breakdown by payment method, country, merchant
```

### Rules Engine
```
GET  /api/rules/          — List all rules and their config
PUT  /api/rules/{code}    — Update rule weight, status, or conditions (Admin only)
POST /api/rules/simulate  — Simulate a transaction through the rules engine
```

### Reports
```
GET /api/reports/pdf      — Download PDF executive report
GET /api/reports/csv      — Download CSV of all transactions
GET /api/reports/excel    — Download Excel of all transactions
GET /api/reports/schedules        — List scheduled reports
POST /api/reports/schedules       — Create a new schedule
DELETE /api/reports/schedules/{id} — Delete a schedule
```

### Customers
```
GET  /api/customers/           — List all KYC customer profiles
GET  /api/customers/{id}       — Get customer profile + transaction history
PUT  /api/customers/{id}/kyc   — Update KYC status (Compliance Officer / Admin)
```

### Notifications & WebSocket
```
GET /api/notifications/         — List all alerts
PUT /api/notifications/{id}/read        — Mark alert as read
PUT /api/notifications/mark-all-read   — Mark all as read
WS  /api/notifications/ws/live         — Live WebSocket stream
```

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance async Python API framework
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM with PostgreSQL + SQLite support
- [PyJWT](https://pyjwt.readthedocs.io/) + [Passlib](https://passlib.readthedocs.io/) — JWT auth & bcrypt hashing
- [ReportLab](https://www.reportlab.com/) — PDF report generation
- [Pandas](https://pandas.pydata.org/) + [OpenPyXL](https://openpyxl.readthedocs.io/) — Excel/CSV exports
- [Uvicorn](https://www.uvicorn.org/) — ASGI server

**Frontend**
- [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- [Vite 8](https://vitejs.dev/) — Build tool & dev server
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first styling
- [Recharts](https://recharts.org/) — Data visualization charts
- [Lucide React](https://lucide.dev/) — Icon library
- [Axios](https://axios-http.com/) — HTTP client

**Infrastructure**
- [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL 15](https://www.postgresql.org/)

---

## 🧪 Running Tests

```bash
# From the project root
python -m backend.test_rules
```

Tests cover:
- Standard transaction (score = 0)
- High-amount threshold trigger (>$10k)
- Off-hours time anomaly (1 AM–5 AM)
- Velocity/location anomaly (impossible travel speed)
- Rules API endpoints (`list_rules`, `update_rule`, `simulate_transaction`)

---

## 📄 License

This project is for educational and demonstration purposes.

---

<div align="center">
  Built with ❤️ for financial risk operations teams
</div>
