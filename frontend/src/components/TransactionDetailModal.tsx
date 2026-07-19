import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  User, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  FileText, 
  CornerDownRight,
  ClipboardList
} from 'lucide-react';
import { Transaction, AuditLog } from '../types';

interface TransactionDetailModalProps {
  txId: string | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ 
  txId, 
  onClose, 
  onStatusUpdated 
}) => {
  const { user } = useAuth();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = async () => {
    if (!txId) return;
    setLoading(true);
    try {
      const [txRes, auditRes] = await Promise.all([
        axios.get(`/api/transactions/${txId}`),
        axios.get(`/api/transactions/${txId}/audit-logs`)
      ]);
      setTx(txRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error("Failed to load transaction details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [txId]);

  const handleUpdateStatus = async (status: 'APPROVED' | 'FRAUDULENT') => {
    if (!tx) return;
    setSubmitting(true);
    try {
      await axios.put(`/api/transactions/${tx.tx_id}/status`, {
        fraud_status: status,
        note: newNote ? `Status changed to ${status}: ${newNote}` : `Status changed to ${status}`
      });
      setNewNote('');
      await fetchDetails();
      onStatusUpdated();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Status update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tx || !newNote.trim()) return;
    setSubmitting(true);
    try {
      // We trigger status update but keep current status, which appends note & logs audit trail
      await axios.put(`/api/transactions/${tx.tx_id}/status`, {
        fraud_status: tx.fraud_status,
        note: newNote
      });
      setNewNote('');
      await fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add investigation note.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!txId) return null;

  // Parsing suspicious reasons list
  let reasons: string[] = [];
  if (tx && tx.suspicious_reasons) {
    try {
      reasons = JSON.parse(tx.suspicious_reasons);
    } catch {
      reasons = [tx.suspicious_reasons];
    }
  }

  // Authorization role checks
  const canModifyStatus = user && (user.role === 'Risk Analyst' || user.role === 'Compliance Officer');

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-100 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60';
    if (score >= 60) return 'text-amber-500 bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
    return 'text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end font-sans">
      {/* Background Dim Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Body Panel */}
      <div className="relative w-full max-w-2xl h-full flex flex-col bg-white dark:bg-gs-navy text-slate-800 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-gs-slate-darkborder animate-in slide-in-from-right duration-200">
        
        {/* Header Drawer */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gs-slate-darkborder">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Surveillance Audit File</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Transaction {tx?.tx_id || txId}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gs-gold" />
          </div>
        ) : !tx ? (
          <div className="flex-1 p-8 text-center text-slate-400">
            Failed to query case details.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Top Stats Highlight */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-xl bg-slate-50 dark:bg-gs-navy-light/40 border-slate-100 dark:border-gs-slate-darkborder">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amount</span>
                <span className="block text-lg font-bold text-slate-900 dark:text-white mt-1">
                  ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400">{tx.currency}</span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50 dark:bg-gs-navy-light/40 border-slate-100 dark:border-gs-slate-darkborder">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Risk Assessment</span>
                <span className={`inline-block px-2.5 py-0.5 rounded text-sm font-bold mt-1.5 border ${getRiskScoreColor(tx.risk_score)}`}>
                  {tx.risk_score} / 100
                </span>
              </div>
              <div className="p-4 border rounded-xl bg-slate-50 dark:bg-gs-navy-light/40 border-slate-100 dark:border-gs-slate-darkborder">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</span>
                <span className={`block text-sm font-bold mt-2 ${
                  tx.fraud_status === 'APPROVED' ? 'text-emerald-500' :
                  tx.fraud_status === 'FRAUDULENT' ? 'text-red-500' : 'text-amber-500'
                }`}>
                  {tx.fraud_status}
                </span>
              </div>
            </div>

            {/* Core Transaction Fields */}
            <div className="p-4 rounded-xl border border-slate-200/60 dark:border-gs-slate-darkborder space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" /> Transaction Metadata
              </h3>
              
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white">{tx.customer_name}</span>
                    <span className="text-[10px] text-slate-400">ID: {tx.customer_id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white">{tx.location}</span>
                    <span className="text-[10px] text-slate-400">Jurisdiction: {tx.country}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Execution Time</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="block font-semibold text-slate-900 dark:text-white">{tx.payment_method}</span>
                    <span className="text-[10px] text-slate-400">Merchant Category: {tx.merchant_category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Suspicious Risk Score Reasons */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Threat Indicators / Triggered Rules</h3>
              {reasons.length === 0 ? (
                <div className="p-3.5 rounded-lg text-xs font-medium border bg-emerald-50/50 border-emerald-200/50 text-emerald-600 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> No suspicious rule conditions triggered.
                </div>
              ) : (
                <div className="space-y-2">
                  {reasons.map((r, i) => (
                    <div 
                      key={i} 
                      className="p-3 rounded-lg text-xs border bg-red-50/50 border-red-200/50 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 flex items-start gap-2.5"
                    >
                      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed font-semibold">{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit log logs / History trail */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Surveillance Audit Log Trail</h3>
              
              {/* Internal updates notes display */}
              {tx.notes && (
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:bg-gs-navy-light/10 dark:border-gs-slate-darkborder">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Investigation Notes</h4>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                    {tx.notes.trim()}
                  </pre>
                </div>
              )}

              {/* Operations audit timeline */}
              <div className="space-y-3 border-l-2 border-slate-100 dark:border-gs-slate-darkborder pl-4 ml-2">
                {auditLogs.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No operational modifications logged.</span>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      {/* Circle anchor */}
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-gs-gold" />
                      
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{log.username}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-0.5 font-semibold text-slate-600 dark:text-slate-400">{log.action}</p>
                      {log.details && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                          {log.details}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Note Entry form */}
            <form onSubmit={handleAddNote} className="space-y-3 pt-4 border-t border-slate-100 dark:border-gs-slate-darkborder">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Add Case Note</label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:border-gs-gold"
                placeholder="Log details of call verification, customer history, or suspicious factors..."
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newNote.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-gs-slate-darkborder dark:bg-gs-navy dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Save Note Only
                </button>
              </div>
            </form>

          </div>
        )}

        {/* Footer Actions Drawer */}
        {tx && canModifyStatus && tx.fraud_status === 'PENDING' && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder flex items-center justify-end gap-3.5">
            <button
              onClick={() => handleUpdateStatus('APPROVED')}
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/10 transition-colors disabled:opacity-50"
            >
              Approve Transaction
            </button>
            <button
              onClick={() => handleUpdateStatus('FRAUDULENT')}
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold rounded-lg text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-500/10 transition-colors disabled:opacity-50"
            >
              Flag as Confirmed Fraud
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetailModal;
