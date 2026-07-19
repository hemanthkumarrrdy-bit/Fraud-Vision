import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  ShieldAlert, 
  Users, 
  Clock, 
  DollarSign,
  MapPin,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { DashboardKPIs, DailyTrendItem, Transaction } from '../types';

interface DashboardProps {
  onSelectTransaction: (txId: string) => void;
  transactions: Transaction[]; // Live transactions feed
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectTransaction, transactions }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [trends, setTrends] = useState<DailyTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, trendRes] = await Promise.all([
        axios.get('/api/analytics/kpis'),
        axios.get('/api/analytics/trends')
      ]);
      setKpis(kpiRes.data);
      setTrends(trendRes.data);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh aggregates every 25 seconds
    const interval = setInterval(fetchDashboardData, 25000);
    return () => clearInterval(interval);
  }, []);

  // Filter out recent transactions that are high-risk (score >= 60) for a dedicated attention panel
  const highRiskFeed = transactions
    .filter(t => t.risk_score >= 60 && t.fraud_status === 'PENDING')
    .slice(0, 5);

  // SVG Geographic Hub Map Data representing global finance centers
  const mapHubs = [
    { name: "New York", x: 100, y: 70, color: "text-emerald-500", risk: "Low" },
    { name: "London", x: 230, y: 55, color: "text-amber-500", risk: "Medium" },
    { name: "Frankfurt", x: 250, y: 58, color: "text-emerald-500", risk: "Low" },
    { name: "Tokyo", x: 420, y: 75, color: "text-amber-500", risk: "Medium" },
    { name: "Singapore", x: 380, y: 135, color: "text-emerald-500", risk: "Low" },
    { name: "Cayman Islands", x: 110, y: 95, color: "text-red-500", risk: "High" },
    { name: "Zurich", x: 247, y: 64, color: "text-emerald-500", risk: "Low" },
    { name: "Tehran", x: 295, y: 80, color: "text-red-500", risk: "High" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gs-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fraud Control Room</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time banking transactions surveillance and risk engine metrics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex items-center gap-5">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Volume</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${kpis?.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">{kpis?.total_transactions} processed</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex items-center gap-5">
          <div className="p-3 bg-red-100 dark:bg-red-950/40 rounded-lg text-red-500 dark:text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed Fraud</span>
            <span className="text-2xl font-bold text-red-500 mt-1">
              ${kpis?.fraudulent_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="block text-[10px] text-red-500 mt-0.5">{kpis?.fraudulent_transactions} items flagged</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex items-center gap-5">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-lg text-amber-500 dark:text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Accounts</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {kpis?.high_risk_customers}
            </span>
            <span className="block text-[10px] text-amber-500 mt-0.5">Alert score threshold &gt;70</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex items-center gap-5">
          <div className="p-3 bg-gs-gold/10 rounded-lg text-gs-gold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Reviews</span>
            <span className="text-2xl font-bold text-gs-gold mt-1">
              {kpis?.pending_investigations}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Pending risk analyst review</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">30-Day Fraud vs. Operations Volume</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daily breakdown of total processing volume and fraudulent volumes.</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: 8, color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total_amount" name="Total Volume" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="fraud_amount" name="Fraud Volume" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Security Hot-spots Map (SVG Command Center) */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">Geographic Fraud Surveillance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time status updates of regional banking networks.</p>
          </div>
          
          <div className="flex-1 relative bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-2">
            {/* World Grid Lines Mock background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
            
            {/* Command SVG world visualizer */}
            <svg viewBox="0 0 500 200" className="w-full h-full relative z-10 select-none">
              {/* Connection curves representing travel path lines between NY, London, Iran, Cayman */}
              <path d="M 100 70 Q 165 50 230 55" fill="none" stroke="#D4AF37" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.6} />
              <path d="M 230 55 Q 262 70 295 80" fill="none" stroke="#EF4444" strokeWidth={0.7} strokeDasharray="2 2" opacity={0.7} className="animate-pulse" />
              <path d="M 100 70 Q 105 82 110 95" fill="none" stroke="#EF4444" strokeWidth={0.7} opacity={0.5} />
              <path d="M 380 135 Q 400 105 420 75" fill="none" stroke="#D4AF37" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.6} />
              
              {/* Draw Hub points */}
              {mapHubs.map((hub) => (
                <g key={hub.name} className="group cursor-pointer">
                  {/* Flashing risk circle */}
                  {hub.risk === "High" ? (
                    <circle cx={hub.x} cy={hub.y} r={7} className="fill-red-500/25 animate-ping" />
                  ) : hub.risk === "Medium" ? (
                    <circle cx={hub.x} cy={hub.y} r={5} className="fill-amber-500/20" />
                  ) : null}
                  
                  {/* Anchor Dot */}
                  <circle 
                    cx={hub.x} 
                    cy={hub.y} 
                    r={3.5} 
                    className={
                      hub.risk === "High" ? "fill-red-500" :
                      hub.risk === "Medium" ? "fill-amber-500" : "fill-emerald-500"
                    }
                  />
                  
                  {/* Label */}
                  <text 
                    x={hub.x} 
                    y={hub.y - 8} 
                    className="fill-slate-400 font-semibold text-[8px] text-center" 
                    textAnchor="middle"
                  >
                    {hub.name}
                  </text>
                </g>
              ))}
            </svg>

            {/* Micro map overlay description legent */}
            <div className="absolute bottom-3 left-3 bg-slate-950/70 border border-slate-800 rounded px-2.5 py-1.5 flex gap-3 text-[9px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Normal Hubs
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> High Risk Alert
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live SURVEILLANCE FEED & ANALYTICS PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time transaction feed */}
        <div className="lg:col-span-2 p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[380px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Surveillance Stream</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time pipeline transaction surveillance feeds.</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Connection Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-gs-slate-darkborder pr-1">
            {transactions.slice(0, 10).map((tx) => {
              const scoreColor = tx.risk_score >= 70 ? 'text-red-500 bg-red-50 dark:bg-red-950/20' : 
                                 tx.risk_score >= 35 ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' : 
                                 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
              return (
                <div 
                  key={tx.tx_id} 
                  onClick={() => onSelectTransaction(tx.tx_id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer rounded-lg px-2 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 font-bold text-xs rounded-lg ${scoreColor}`}>
                      {tx.risk_score}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{tx.customer_name}</h4>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{tx.tx_id} | {tx.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`block text-[9px] font-bold mt-0.5 ${
                      tx.fraud_status === 'APPROVED' ? 'text-emerald-500' :
                      tx.fraud_status === 'FRAUDULENT' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {tx.fraud_status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High Risk Attention Panel */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[380px]">
          <div className="mb-4">
            <h3 className="font-semibold text-red-500 dark:text-red-400 text-base flex items-center gap-1.5">
              <Flame className="w-5 h-5" /> Threat Analyst Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pending reviews of transactions with risk score &gt;60.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {highRiskFeed.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs font-medium">All high threat vectors resolved</p>
              </div>
            ) : (
              highRiskFeed.map((tx) => (
                <div 
                  key={tx.tx_id}
                  onClick={() => onSelectTransaction(tx.tx_id)}
                  className="p-3 border.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 dark:border-red-950/40 hover:border-red-500/30 cursor-pointer transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-red-500">{tx.tx_id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                      Score {tx.risk_score}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1.5 truncate">{tx.customer_name}</h4>
                  <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {tx.location}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">${tx.amount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
