import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Upload, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  onSelectTransaction: (txId: string) => void;
  // Trigger update when transactions are modified/imported
  refreshData: () => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ onSelectTransaction, refreshData }) => {
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [minRisk, setMinRisk] = useState('');
  const [country, setCountry] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 15;

  // Import State
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params: any = { skip, limit };
      
      if (search) params.search = search;
      if (status) params.status = status;
      if (minRisk) params.min_risk = parseInt(minRisk);
      if (country) params.country = country;

      const response = await axios.get('/api/transactions/', { params });
      setItems(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error("Failed to load transactions list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, status, minRisk, country]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setMinRisk('');
    setCountry('');
    setPage(1);
    // Timeout to let state changes apply or just call fetch manually
    setTimeout(fetchTransactions, 50);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    setImportResult(null);

    try {
      const response = await axios.post('/api/transactions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImportResult(response.data);
      fetchTransactions();
      refreshData();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "CSV importing failed. Check columns syntax.";
      setImportResult({ error: detail });
    } finally {
      setImporting(false);
      // Clear input so user can import same file or another file
      e.target.value = '';
    }
  };

  // Generates a mock CSV file for testing velocity/country/amount anomalies
  const downloadSampleCSV = () => {
    const headers = "tx_id,customer_id,customer_name,amount,currency,timestamp,location,country,payment_method,merchant_category\n";
    const nowIso = new Date().toISOString();
    
    // Generate NY time 12 mins ago, and London time now (velocity travel speed anomaly)
    const nyTime = new Date(Date.now() - 12 * 60 * 1000).toISOString();
    const ldnTime = nowIso;
    
    const rows = [
      `TX_IMPORT_01,C_IMP_001,John Sterling,250.00,USD,${nowIso},"Chicago, US",US,Credit Card,Retail`,
      `TX_IMPORT_02,C_IMP_002,Arthur Dent,150.00,GBP,${nyTime},"New York, US",US,Credit Card,Restaurant`,
      `TX_IMPORT_03,C_IMP_002,Arthur Dent,950.00,GBP,${ldnTime},"London, UK",UK,Credit Card,E-Commerce`, // Speed velocity anomaly!
      `TX_IMPORT_04,C_IMP_003,Blackwood Holding,18500.00,USD,${nowIso},"George Town, Cayman Islands",Cayman Islands,Wire Transfer,Financial`, // Amount & Geo flags!
      `TX_IMPORT_05,C_IMP_004,Clarissa Harlowe,35.50,USD,${nowIso},"Los Angeles, US",US,Credit Card,Gas Station`
    ].join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Sample_Transaction_Import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Import Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Audit and filter payment streams, import CSV reports, and update compliance logs.</p>
        </div>

        {/* CSV buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-gs-slate-darkborder dark:bg-gs-navy dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-2" /> Sample Import CSV
          </button>
          
          <label className="flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-gs-gold hover:bg-gs-gold-hover text-gs-navy cursor-pointer transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5 mr-2" />
            {importing ? 'Processing CSV...' : 'Import Transaction CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* CSV Import Results Banner */}
      {importResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          importResult.error 
            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
        }`}>
          {importResult.error ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {importResult.error ? 'CSV Import Failed' : 'CSV Import Completed'}
            </h4>
            {importResult.error ? (
              <p className="text-xs mt-1 leading-relaxed">{importResult.error}</p>
            ) : (
              <p className="text-xs mt-1 leading-relaxed font-medium">
                Successfully processed. Imported: <span className="font-bold">{importResult.imported}</span> | 
                Duplicates Skipped: <span className="font-bold">{importResult.duplicates_skipped}</span> | 
                Threat Alerts Triggered: <span className="font-bold text-red-500">{importResult.high_risk_flagged}</span>
              </p>
            )}
          </div>
          <button 
            onClick={() => setImportResult(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Form */}
      <div className="p-4 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          {/* Search bar */}
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Search Text</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
                placeholder="ID, Customer name..."
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Compliance Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="FRAUDULENT">FRAUDULENT</option>
            </select>
          </div>

          {/* Country filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Jurisdiction / Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
              placeholder="e.g. US, UK, Cayman"
            />
          </div>

          {/* Min Risk Score filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Min Risk Score</label>
            <select
              value={minRisk}
              onChange={(e) => { setMinRisk(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
            >
              <option value="">Any Risk</option>
              <option value="30">Low (&gt;30)</option>
              <option value="60">Medium (&gt;60)</option>
              <option value="80">High (&gt;80)</option>
            </select>
          </div>

          {/* Filter submission button options */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Datatable */}
      <div className="border bg-white border-slate-200 rounded-xl dark:bg-gs-navy-light dark:border-gs-slate-darkborder overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-55/40 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:border-gs-slate-darkborder dark:bg-gs-navy-dark/40">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Surveillance Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gs-slate-darkborder">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gs-gold" />
                    <span>Querying risk registers...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <span>No transactions match the filter criteria</span>
                  </td>
                </tr>
              ) : (
                items.map((tx) => {
                  const scoreBg = tx.risk_score >= 80 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                                  tx.risk_score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
                  
                  const statusColor = tx.fraud_status === 'APPROVED' ? 'text-emerald-500' :
                                      tx.fraud_status === 'FRAUDULENT' ? 'text-red-500' : 'text-amber-500';

                  return (
                    <tr 
                      key={tx.tx_id}
                      onClick={() => onSelectTransaction(tx.tx_id)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 cursor-pointer transition-colors duration-150 text-slate-700 dark:text-slate-300 text-xs"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{tx.tx_id}</td>
                      <td className="px-6 py-4 font-semibold">{tx.customer_name}</td>
                      <td className="px-6 py-4 font-bold">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${scoreBg}`}>
                          {tx.risk_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">{tx.country}</td>
                      <td className="px-6 py-4">{tx.payment_method}</td>
                      <td className={`px-6 py-4 font-bold ${statusColor}`}>{tx.fraud_status}</td>
                      <td className="px-6 py-4 text-right text-slate-400 dark:text-slate-500">
                        {new Date(tx.timestamp).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-gs-slate-darkborder flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page <span className="font-semibold text-slate-800 dark:text-slate-300">{page}</span> of <span className="font-semibold text-slate-800 dark:text-slate-300">{totalPages}</span> | Total {total} transactions
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
