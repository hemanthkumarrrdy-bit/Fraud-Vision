# Changelog

All notable changes to Fraud Vision will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] — 2026-07-19

### Added
- 🛡️ Real-time fraud detection rules engine with 6 configurable rules:
  - Amount Limit Anomaly
  - Customer Average Anomaly
  - Velocity & Location Anomaly (impossible travel detection)
  - Frequency Anomaly (transaction rate limiting)
  - Off-Hours Anomaly
  - Jurisdiction / High-Risk Country check
- 📊 Analytics dashboard with 30-day trend charts, KPI cards, and geographic hotspot map
- 🔴 Live WebSocket surveillance stream for real-time transaction feeds
- 🔔 Real-time toast alerts for high-risk transactions (score ≥ 60)
- 👤 KYC Customer Profiles with status management (VERIFIED, HIGH_RISK, SUSPENDED, PENDING_VERIFICATION)
- 📄 On-demand report exports: PDF (ReportLab), Excel (OpenPyXL), CSV (Pandas)
- 🗓️ Scheduled report system (Daily / Weekly) with SMTP delivery simulation
- 🧪 Transaction risk simulator — test payloads against the live rules engine
- ⚙️ Admin-only rule configuration panel (toggle, re-weight, edit JSON thresholds)
- 🔐 Role-based access control: Admin, Risk Analyst, Compliance Officer
- 🌙 Dark / Light theme toggle with persistence
- 🐳 Full Docker Compose stack (PostgreSQL + FastAPI + React/Nginx)
- 🔄 Automatic SQLite fallback if PostgreSQL is unreachable (development-friendly)
- 📝 Audit log trail for all status changes
- 🌱 Auto-seeded demo data on first startup
