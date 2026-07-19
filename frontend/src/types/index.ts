export interface User {
  username: string;
  email: string;
  role: 'Admin' | 'Risk Analyst' | 'Compliance Officer';
}

export interface Transaction {
  id: number;
  tx_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  timestamp: string;
  location: string;
  country: string;
  payment_method: string;
  merchant_category: string;
  risk_score: number;
  fraud_status: 'PENDING' | 'APPROVED' | 'FRAUDULENT';
  suspicious_reasons?: string; // JSON string encoded array of rules triggered
  notes?: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  tx_id: string;
  username: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  tx_id?: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  is_read: boolean;
  timestamp: string;
}

export interface ScheduledReport {
  id: number;
  name: string;
  frequency: 'DAILY' | 'WEEKLY';
  format: 'PDF' | 'CSV' | 'EXCEL';
  next_run: string;
  active: boolean;
  email_recipient: string;
  created_at: string;
}

export interface DashboardKPIs {
  total_transactions: number;
  total_volume: number;
  fraudulent_transactions: number;
  fraudulent_volume: number;
  high_risk_customers: number;
  pending_investigations: number;
}

export interface DailyTrendItem {
  date: string;
  total_count: number;
  fraud_count: number;
  total_amount: number;
  fraud_amount: number;
}

export interface CountryFraudItem {
  country: string;
  count: number;
  amount: number;
  fraud_count: number;
  fraud_amount: number;
}

export interface PaymentMethodFraudItem {
  payment_method: string;
  count: number;
  amount: number;
  fraud_count: number;
  fraud_amount: number;
}

export interface RiskyCustomerItem {
  customer_id: string;
  customer_name: string;
  risk_score_max: number;
  risk_score_avg: number;
  transaction_count: number;
  total_spent: number;
}
