import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Mail, 
  Play, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ScheduledReport } from '../types';

const ReportsPanel: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);

  // New Schedule Form States
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('DAILY');
  const [format, setFormat] = useState('PDF');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Downloads tracking
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('/api/reports/schedules');
      setSchedules(response.data);
    } catch (err) {
      console.error("Failed to fetch report schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDownloadReport = async (type: 'pdf' | 'csv' | 'excel') => {
    if (type === 'pdf') setDownloadingPdf(true);
    if (type === 'csv') setDownloadingCsv(true);
    if (type === 'excel') setDownloadingExcel(true);

    try {
      const response = await axios.get(`/api/reports/${type}`, {
        responseType: 'blob'
      });
      
      const fileExt = type === 'pdf' ? 'pdf' : type === 'excel' ? 'xlsx' : 'csv';
      const fileMime = type === 'pdf' ? 'application/pdf' : 
                       type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                       'text/csv';

      const blob = new Blob([response.data], { type: fileMime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `FraudVision_ComplianceReport_${Date.now()}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(`Failed to export ${type} report:`, err);
      alert(`Export failed for ${type} report.`);
    } finally {
      if (type === 'pdf') setDownloadingPdf(false);
      if (type === 'csv') setDownloadingCsv(false);
      if (type === 'excel') setDownloadingExcel(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!name || !emailRecipient) {
      setFormError('Please fill in all scheduling inputs.');
      return;
    }

    try {
      await axios.post('/api/reports/schedules', {
        name,
        frequency,
        format,
        email_recipient: emailRecipient
      });
      setName('');
      setEmailRecipient('');
      setSuccessMsg('Report schedule established successfully.');
      fetchSchedules();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to schedule report. Confirm email format.";
      setFormError(detail);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("Are you sure you want to terminate this automated schedule?")) return;
    try {
      await axios.delete(`/api/reports/schedules/${id}`);
      fetchSchedules();
      setSuccessMsg('Report schedule deleted.');
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  const handleTriggerMock = async (id: number) => {
    try {
      const response = await axios.post(`/api/reports/schedules/${id}/trigger`);
      setSuccessMsg(response.data.message);
      fetchSchedules();
      // Auto clear alert message
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err) {
      console.error("Trigger mock run failed:", err);
    }
  };

  const canModifySchedules = user && (user.role === 'Compliance Officer' || user.role === 'Admin');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Compliance Reporting Center</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Compile executive PDF dossiers, export transactional ledgers, and establish periodic automation schedules.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* Grid: Manual Compilation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Card */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col justify-between h-52">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-red-100 dark:bg-red-950/40 rounded-lg text-red-500 dark:text-red-400">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Executive Brief</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">PDF Executive Dossier</h3>
            <p className="text-xs text-slate-400 mt-1">Audit-ready compiled summary detailing threats, summaries, and action status.</p>
          </div>
          <button
            onClick={() => handleDownloadReport('pdf')}
            disabled={downloadingPdf}
            className="w-full mt-4 flex items-center justify-center py-2 text-xs font-semibold rounded-lg bg-gs-gold hover:bg-gs-gold-hover text-gs-navy transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            {downloadingPdf ? 'Compiling PDF...' : 'Download PDF Dossier'}
          </button>
        </div>

        {/* Excel Card */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col justify-between h-52">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg text-emerald-500 dark:text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Spreadsheet</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Excel Risk Registry</h3>
            <p className="text-xs text-slate-400 mt-1">Complete datasets workbook mapping risk factors and notes across cells.</p>
          </div>
          <button
            onClick={() => handleDownloadReport('excel')}
            disabled={downloadingExcel}
            className="w-full mt-4 flex items-center justify-center py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            {downloadingExcel ? 'Compiling Excel...' : 'Export Excel Spreadsheet'}
          </button>
        </div>

        {/* CSV Card */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col justify-between h-52">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-lg text-blue-500 dark:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Dump</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">CSV Ledger Export</h3>
            <p className="text-xs text-slate-400 mt-1">Lightweight comma-separated row registers suited for database import pipelines.</p>
          </div>
          <button
            onClick={() => handleDownloadReport('csv')}
            disabled={downloadingCsv}
            className="w-full mt-4 flex items-center justify-center py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            {downloadingCsv ? 'Compiling CSV...' : 'Export CSV Ledger'}
          </button>
        </div>
      </div>

      {/* Grid: Scheduled Automation section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Schedules List Table */}
        <div className="lg:col-span-2 p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-gs-gold" /> Active Surveillance Schedules
          </h3>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 dark:border-gs-slate-darkborder">
                  <th className="py-3">Report Name</th>
                  <th className="py-3">Frequency</th>
                  <th className="py-3">Format</th>
                  <th className="py-3">Recipient Email</th>
                  <th className="py-3">Next Dispatch</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gs-slate-darkborder">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Loading schedules...</td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No scheduled reports active.</td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-4 font-bold text-slate-950 dark:text-white">{s.name}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {s.frequency}
                        </span>
                      </td>
                      <td className="py-4 font-bold">{s.format}</td>
                      <td className="py-4 flex items-center gap-1 mt-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email_recipient}</td>
                      <td className="py-4 text-slate-400">
                        {new Date(s.next_run).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' })}
                      </td>
                      <td className="py-4 text-right flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleTriggerMock(s.id)}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-gs-gold"
                          title="Trigger Immediate Run & Email"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        {canModifySchedules && (
                          <button
                            onClick={() => handleDeleteSchedule(s.id)}
                            className="p-1 rounded-lg border border-red-900/10 hover:bg-red-500/10 text-red-500 hover:text-red-400"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule Creator Form */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-gs-gold" /> Schedule Automation
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal mb-5">Configure daily or weekly threat summaries to compile and email dynamically.</p>
            
            {formError && (
              <div className="p-2.5 mb-4 text-xs rounded border border-red-800/30 bg-red-950/20 text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {canModifySchedules ? (
              <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Report Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
                    placeholder="e.g. Weekly Operations Summary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
                    >
                      <option value="DAILY">DAILY</option>
                      <option value="WEEKLY">WEEKLY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
                    >
                      <option value="PDF">PDF</option>
                      <option value="EXCEL">EXCEL</option>
                      <option value="CSV">CSV</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Recipient Email</label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none focus:border-gs-gold"
                    placeholder="compliance@fraudvision.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center py-2.5 font-bold rounded-lg bg-gs-navy dark:bg-slate-100 text-white dark:text-gs-navy hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Establishe Schedule
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/25 border text-center text-slate-400 dark:text-slate-500 text-xs">
                Your role restricts access to add compliance dispatches. Available to Admin and Compliance Officer only.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPanel;
