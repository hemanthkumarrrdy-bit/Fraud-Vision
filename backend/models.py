import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # 'Admin', 'Risk Analyst', 'Compliance Officer'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(String(50), index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    location = Column(String(100), nullable=False)
    country = Column(String(50), nullable=False)
    payment_method = Column(String(50), nullable=False)  # 'Credit Card', 'Wire Transfer', 'ACH', 'Crypto'
    merchant_category = Column(String(50), nullable=False)  # 'Retail', 'Online', 'Gambling', 'Financial', etc.
    risk_score = Column(Integer, default=0)  # 0 to 100
    fraud_status = Column(String(30), default="PENDING")  # 'PENDING', 'APPROVED', 'FRAUDULENT'
    suspicious_reasons = Column(Text, nullable=True)  # JSON-encoded list or comma-separated string
    notes = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String(50), index=True, nullable=False)
    username = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., "Updated status to FRAUDULENT"
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String(50), index=True, nullable=True)
    message = Column(Text, nullable=False)
    level = Column(String(30), default="INFO")  # 'INFO', 'WARNING', 'CRITICAL'
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    frequency = Column(String(30), nullable=False)  # 'DAILY', 'WEEKLY'
    format = Column(String(20), nullable=False)  # 'PDF', 'CSV', 'EXCEL'
    next_run = Column(DateTime, nullable=False)
    active = Column(Boolean, default=True)
    email_recipient = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    weight = Column(Integer, default=10)
    condition_value = Column(Text, nullable=True)  # JSON-encoded parameters

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    customer_id = Column(String(50), primary_key=True, index=True)
    customer_name = Column(String(100), nullable=False)
    kyc_status = Column(String(50), default="PENDING_VERIFICATION")  # "VERIFIED", "HIGH_RISK", "SUSPENDED"
    kyc_notes = Column(Text, default="")
    last_reviewed = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

