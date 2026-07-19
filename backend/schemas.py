from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- AUTH SCHEMAS ---

class UserBase(BaseModel):
    username: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# --- TRANSACTION SCHEMAS ---

class TransactionBase(BaseModel):
    tx_id: str
    customer_id: str
    customer_name: str
    amount: float
    currency: str = "USD"
    timestamp: datetime
    location: str
    country: str
    payment_method: str
    merchant_category: str

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdateStatus(BaseModel):
    fraud_status: str = Field(..., description="Must be one of PENDING, APPROVED, FRAUDULENT")
    note: Optional[str] = None

class TransactionAddNote(BaseModel):
    note: str

class TransactionResponse(TransactionBase):
    id: int
    risk_score: int
    fraud_status: str
    suspicious_reasons: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    total: int
    items: List[TransactionResponse]
    skip: int
    limit: int


# --- AUDIT LOG SCHEMAS ---

class AuditLogResponse(BaseModel):
    id: int
    tx_id: str
    username: str
    action: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# --- NOTIFICATION SCHEMAS ---

class NotificationResponse(BaseModel):
    id: int
    tx_id: Optional[str] = None
    message: str
    level: str
    is_read: bool
    timestamp: datetime

    class Config:
        from_attributes = True


# --- REPORT SCHEMAS ---

class ScheduledReportCreate(BaseModel):
    name: str
    frequency: str  # 'DAILY', 'WEEKLY'
    format: str  # 'PDF', 'CSV', 'EXCEL'
    email_recipient: EmailStr

class ScheduledReportResponse(BaseModel):
    id: int
    name: str
    frequency: str
    format: str
    next_run: datetime
    active: bool
    email_recipient: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- ANALYTICS SCHEMAS ---

class DashboardKPIs(BaseModel):
    total_transactions: int
    total_volume: float
    fraudulent_transactions: int
    fraudulent_volume: float
    high_risk_customers: int
    pending_investigations: int

class DailyTrendItem(BaseModel):
    date: str
    total_count: int
    fraud_count: int
    total_amount: float
    fraud_amount: float

class CountryFraudItem(BaseModel):
    country: str
    count: int
    amount: float
    fraud_count: int
    fraud_amount: float

class PaymentMethodFraudItem(BaseModel):
    payment_method: str
    count: int
    amount: float
    fraud_count: int
    fraud_amount: float
    
class RiskyCustomerItem(BaseModel):
    customer_id: str
    customer_name: str
    risk_score_max: int
    risk_score_avg: float
    transaction_count: int
    total_spent: float

# --- RULE SCHEMAS ---

class RuleResponse(BaseModel):
    id: int
    code: str
    name: str
    description: str
    is_active: bool
    weight: int
    condition_value: Optional[str] = None

    class Config:
        from_attributes = True

class RuleUpdate(BaseModel):
    is_active: Optional[bool] = None
    weight: Optional[int] = None
    condition_value: Optional[str] = None

class RuleExecutionDetail(BaseModel):
    code: str
    name: str
    triggered: bool
    score_added: int
    reason: Optional[str] = None

class TransactionSimulateInput(BaseModel):
    customer_id: str = "C_TEST_SIM"
    customer_name: str = "Simulated Customer"
    amount: float
    currency: str = "USD"
    location: str
    country: str
    payment_method: str = "Credit Card"
    merchant_category: str = "Retail"

class TransactionSimulateResponse(BaseModel):
    risk_score: int
    triggered_rules: List[RuleExecutionDetail]
    reasons: List[str]

# --- CUSTOMER PROFILE SCHEMAS ---

class CustomerProfileResponse(BaseModel):
    customer_id: str
    customer_name: str
    kyc_status: str
    kyc_notes: Optional[str] = None
    last_reviewed: datetime

    class Config:
        from_attributes = True

class CustomerListResponse(BaseModel):
    total: int
    items: List[CustomerProfileResponse]
    skip: int
    limit: int

class CustomerProfileUpdate(BaseModel):
    kyc_status: str
    kyc_notes: Optional[str] = None

class CustomerDetailResponse(BaseModel):
    profile: CustomerProfileResponse
    total_spent: float
    transaction_count: int
    max_risk_score: int
    avg_risk_score: float
    transactions: List[TransactionResponse]

