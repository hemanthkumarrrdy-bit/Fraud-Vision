import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  User, 
  MapPin, 
  DollarSign, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  X,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { Transaction, AuditLog } from '../types';

interface CustomerProfile {
  customer_id: string;
  customer_name: string;
  kyc_status: 'VERIFIED' | 'HIGH_RISK' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  kyc_notes: string;
  last_reviewed: string;
}

interface CustomerDetail {
  profile: CustomerProfile;
  total_spent: number;
  transaction_count: number;
  max_risk_score: number;
  avg_risk_score: number;
  transactions: Transaction[];
}

interface CustomersPanelProps {
  onSelectTransaction: (txId: string) => void;
}

const CustomersPanel: React.FC<CustomersPanelProps> = ({ onSelectTransaction }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Selected Customer Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [kycLogs, setKycLogs] = useState<AuditLog[]>([]);
  
  // Update KYC Form States
  const [newKycStatus, setNewKycStatus] = useState<string>('VERIFIED');
  const [kycNote, setKycNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params: any = { skip, limit };
      if (search) params.search = search;
      if (kycStatus) params.kyc_status = kycStatus;

      const response = await axios.get('/api/customers/', { params });
      setCustomers(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error("Failed to fetch customers list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, kycStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setKycStatus('');
    setPage(1);
    setTimeout(fetchCustomers, 50);
  };

  const fetchCustomerDetails = async (customerId: string) => {
    setDetailLoading(true);
    setUpdateSuccess('');
    setUpdateError('');
    try {
      const [detailRes, logsRes] = await Promise.all([
        axios.get(`/api/customers/${customerId}`),
        axios.get(`/api/transactions/CUSTOMER_KYC_${customerId}/audit-logs`)
      ]);
      setDetail(detailRes.data);
      setKycLogs(logsRes.data);
      setNewKycStatus(detailRes.data.profile.kyc_status);
      setKycNote('');
    } catch (err) {
      console.error("Failed to load customer dossier details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetails(selectedCustomerId);
    } else {
      setDetail(null);
      setKycLogs([]);
    }
  }, [selectedCustomerId]);

  const handleKycUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || submitting) return;
    setSubmitting(true);
    setUpdateSuccess('');
    setUpdateError('');

    try {
      await axios.put(`/api/customers/${selectedCustomerId}/kyc`, {
        kyc_status: newKycStatus,
        kyc_notes: kycNote
      });
      setUpdateSuccess('KYC compliance profile updated successfully.');
      fetchCustomers();
      fetchCustomerDetails(selectedCustomerId);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update customer KYC status.';
      setUpdateError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const canModifyKyc = user && (user.role === 'Admin' || user.role === 'Compliance Officer');

  const getKycBadgeClass = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
      case 'HIGH_RISK':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60';
      case 'PENDING_VERIFICATION':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-100 border-red-200 dark:bg-red-950/40 dark:text-red-400';
    if (score >= 60) return 'text-amber-500 bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400';
    return 'text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400';
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customer KYC Surveillance Directory</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Audit customer compliance files, update KYC verification statuses, and review specific accounts.</p>
      </div>

      {/* Filter Section */}
      <div className="p-4 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Search Customer</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
                placeholder="ID, Name..."
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">KYC Status</label>
            <select
              value={kycStatus}
              onChange={(e) => { setKycStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
            >
              <option value="">All Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
              <option value="HIGH_RISK">HIGH RISK</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="border bg-white border-slate-200 rounded-xl dark:bg-gs-navy-light dark:border-gs-slate-darkborder overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-55/40 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:border-gs-slate-darkborder dark:bg-gs-navy-dark/40">
                <th className="px-6 py-4">Customer ID</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">KYC Compliance status</th>
                <th className="px-6 py-4 text-right">Last Reviewed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gs-slate-darkborder">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gs-gold mx-auto mb-2" />
                    <span>Loading customer registry...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <span>No customer profiles found matching filters</span>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.customer_id}
                    onClick={() => setSelectedCustomerId(c.customer_id)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 cursor-pointer transition-colors duration-150 text-slate-700 dark:text-slate-300 text-xs"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{c.customer_id}</td>
                    <td className="px-6 py-4 font-semibold">{c.customer_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getKycBadgeClass(c.kyc_status)}`}>
                        {c.kyc_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 dark:text-slate-500">
                      {new Date(c.last_reviewed).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-gs-slate-darkborder flex items-center justify-between text-xs text-slate-500">
          <span>
            Page <span className="font-semibold text-slate-800 dark:text-slate-300">{page}</span> of <span className="font-semibold text-slate-800 dark:text-slate-300">{totalPages}</span> | {total} profiles total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Customer Dossier Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end font-sans">
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setSelectedCustomerId(null)}
          />

          <div className="relative w-full max-w-2xl h-full flex flex-col bg-white dark:bg-gs-navy text-slate-800 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-gs-slate-darkborder animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gs-slate-darkborder">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">KYC Surveillance Dossier</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {detailLoading ? 'Loading dossier...' : detail?.profile.customer_name}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gs-gold" />
              </div>
            ) : !detail ? (
              <div className="flex-1 p-8 text-center text-slate-400">
                Failed to load profile dossier.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Stats Dashboard cards */}
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-gs-navy-light/40 border-slate-100 dark:border-gs-slate-darkborder text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Total spent</span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      ${detail.total_spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-gs-navy-light/40 border-slate-100 dark:border-gs-slate-darkborder text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Volume Count</span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {detail.transaction_count} txs
                    </span>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-gs-navy-light/40 border-slate-100 dark:border-gs-slate-darkborder text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Max Risk Score</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-xs mt-1.5 border ${getRiskScoreColor(detail.max_risk_score)}`}>
                      {detail.max_risk_score}
                    </span>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-gs-navy-light/40 border-slate-100 dark:border-gs-slate-darkborder text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Risk Score</span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {detail.avg_risk_score.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="p-4 rounded-xl border border-slate-200/60 dark:border-gs-slate-darkborder space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" /> KYC Verification Information
                  </h3>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer ID:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{detail.profile.customer_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compliance Status:</span>
                      <span className={`px-2 py-0.5 rounded font-bold border ${getKycBadgeClass(detail.profile.kyc_status)}`}>
                        {detail.profile.kyc_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Reviewed:</span>
                      <span className="text-slate-400 font-semibold">{new Date(detail.profile.last_reviewed).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-gs-slate-darkborder">
                      <span className="block text-slate-400 mb-1">Verification Case Notes:</span>
                      <p className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        {detail.profile.kyc_notes || "No verification notes provided."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change KYC Status panel */}
                {canModifyKyc && (
                  <form onSubmit={handleKycUpdateSubmit} className="p-4 rounded-xl border border-gs-gold/20 dark:border-gs-gold/15 bg-gs-gold/5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gs-gold flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> Compliance Operations Console
                    </h3>

                    {updateSuccess && (
                      <div className="p-2 text-xs rounded border border-emerald-800/30 bg-emerald-950/20 text-emerald-400">
                        {updateSuccess}
                      </div>
                    )}

                    {updateError && (
                      <div className="p-2 text-xs rounded border border-red-800/30 bg-red-950/20 text-red-400">
                        {updateError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">New KYC Status</label>
                        <select
                          value={newKycStatus}
                          onChange={(e) => setNewKycStatus(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                        >
                          <option value="VERIFIED">VERIFIED</option>
                          <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                          <option value="HIGH_RISK">HIGH RISK</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="py-1.5 font-bold rounded bg-gs-navy dark:bg-slate-100 text-white dark:text-gs-navy hover:opacity-90 transition-opacity text-xs"
                      >
                        {submitting ? 'Applying Change...' : 'Update KYC Profile'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Compliance Notes</label>
                      <textarea
                        value={kycNote}
                        onChange={(e) => setKycNote(e.target.value)}
                        rows={2}
                        className="w-full p-2 text-xs rounded border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                        placeholder="Detail the rationale for status modification (required for AML compliance audit trail)..."
                        required
                      />
                    </div>
                  </form>
                )}

                {/* Historical Transactions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4" /> Transaction History Ledger
                  </h3>
                  
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-gs-slate-darkborder border rounded-lg bg-white dark:bg-gs-navy pr-1">
                    {detail.transactions.length === 0 ? (
                      <span className="block p-4 text-xs text-slate-400 italic text-center">No transactions linked to this customer account.</span>
                    ) : (
                      detail.transactions.map((t) => (
                        <div 
                          key={t.tx_id}
                          onClick={() => {
                            // Select transaction which will open transaction detail modal
                            onSelectTransaction(t.tx_id);
                          }}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{t.tx_id}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{t.location} | {new Date(t.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRiskScoreColor(t.risk_score)}`}>
                              Score {t.risk_score}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit Trail Log */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> KYC Revision Audit Trail
                  </h3>

                  <div className="space-y-3.5 border-l-2 border-slate-100 dark:border-gs-slate-darkborder pl-4 ml-2">
                    {kycLogs.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No KYC adjustments logged.</span>
                    ) : (
                      kycLogs.map((log) => (
                        <div key={log.id} className="relative text-xs">
                          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-gs-gold" />
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{log.username}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-0.5 font-semibold text-slate-600 dark:text-slate-400">{log.action}</p>
                          {log.details && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-2 rounded">
                              {log.details}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPanel;
