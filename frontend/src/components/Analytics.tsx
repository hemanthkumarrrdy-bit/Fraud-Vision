import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  AlertOctagon, 
  Globe2, 
  CreditCard 
} from 'lucide-react';
import { 
  CountryFraudItem, 
  PaymentMethodFraudItem, 
  RiskyCustomerItem,
  DailyTrendItem
} from '../types';

const COLORS = ['#0B132B', '#D4AF37', '#1C2541', '#EF4444', '#10B981', '#F59E0B', '#3B82F6'];

const Analytics: React.FC = () => {
  const [countries, setCountries] = useState<CountryFraudItem[]>([]);
  const [payments, setPayments] = useState<PaymentMethodFraudItem[]>([]);
  const [riskyCusts, setRiskyCusts] = useState<RiskyCustomerItem[]>([]);
  const [trends, setTrends] = useState<DailyTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [countryRes, paymentRes, customerRes, trendRes] = await Promise.all([
        axios.get('/api/analytics/country'),
        axios.get('/api/analytics/payment-method'),
        axios.get('/api/analytics/risky-customers'),
        axios.get('/api/analytics/trends')
      ]);
      setCountries(countryRes.data);
      setPayments(paymentRes.data);
      setRiskyCusts(customerRes.data);
      setTrends(trendRes.data);
    } catch (err) {
      console.error("Failed to load analytics dashboard datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gs-gold" />
      </div>
    );
  }

  // Filter country data to only show countries with actual transactions to keep it tidy
  const activeCountries = countries.filter(c => c.count > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Risk Intelligence Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Surveillance aggregations by jurisdiction, payment channel vectors, and counter-party risk profiles.</p>
      </div>

      {/* Row 1: Country Spread & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Bar Chart */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[380px]">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
            <Globe2 className="w-5 h-5 text-gs-gold" /> Regional Vulnerability Index
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeCountries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="country" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: 8, color: '#fff' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="amount" name="Processed Volume ($)" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fraud_amount" name="Fraud Volume ($)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Pie Chart */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[380px]">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gs-gold" /> Payment Channel Risk Share
          </h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full h-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="fraud_amount"
                    nameKey="payment_method"
                  >
                    {payments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: 8, color: '#fff' }}
                    formatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} layout="horizontal" align="center" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Risky Customers and Monthly Trend line */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Trends Line chart */}
        <div className="lg:col-span-2 p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[380px]">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gs-gold" /> Risk Pipeline Surveillance Timeline
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: 8, color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="total_count" name="Total Count" stroke="#D4AF37" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="fraud_count" name="Fraud Count" stroke="#EF4444" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risky Customers table */}
        <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder flex flex-col h-[380px]">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
            <AlertOctagon className="w-5 h-5 text-red-500" /> High-Risk counter-parties
          </h3>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-gs-slate-darkborder pr-1">
            {riskyCusts.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No counter-parties flagged.</span>
            ) : (
              riskyCusts.map((cust) => {
                const scoreColor = cust.risk_score_max >= 80 ? 'text-red-500' :
                                   cust.risk_score_max >= 60 ? 'text-amber-500' : 'text-emerald-500';
                return (
                  <div key={cust.customer_id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{cust.customer_name}</h4>
                      <span className="block text-[10px] text-slate-400 mt-0.5">ID: {cust.customer_id} | {cust.transaction_count} txs</span>
                    </div>
                    <div className="text-right">
                      <span className={`block font-bold ${scoreColor}`}>Max score: {cust.risk_score_max}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">Spent: ${cust.total_spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
