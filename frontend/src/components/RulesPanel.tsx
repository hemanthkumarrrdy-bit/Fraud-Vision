import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Sliders, 
  Play, 
  Settings, 
  Activity, 
  HelpCircle, 
  Save, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  FileCode,
  Flame,
  Check
} from 'lucide-react';

interface Rule {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  weight: number;
  condition_value: string;
}

interface RuleExecutionDetail {
  code: string;
  name: string;
  triggered: boolean;
  score_added: number;
  reason?: string;
}

interface SimulationResponse {
  risk_score: number;
  triggered_rules: RuleExecutionDetail[];
  reasons: string[];
}

const RulesPanel: React.FC = () => {
  const { user } = useAuth();
  const [rulesList, setRulesList] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Success / Error states for saving rules
  const [savingRuleCode, setSavingRuleCode] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Selected Rule for editing JSON conditions
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [editingConditionJson, setEditingConditionJson] = useState('');

  // Transaction Simulator States
  const [customerId, setCustomerId] = useState('C_SIM_001');
  const [customerName, setCustomerName] = useState('Simulated Client');
  const [amount, setAmount] = useState('120.00');
  const [currency, setCurrency] = useState('USD');
  const [location, setLocation] = useState('New York, US');
  const [country, setCountry] = useState('US');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [merchantCategory, setMerchantCategory] = useState('Retail');
  
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [simError, setSimError] = useState('');

  const fetchRules = async () => {
    try {
      const response = await axios.get('/api/rules/');
      setRulesList(response.data);
    } catch (err) {
      console.error("Failed to load detection rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleUpdateRule = async (code: string, updates: { is_active?: boolean; weight?: number; condition_value?: string }) => {
    setSavingRuleCode(code);
    setSaveSuccess('');
    setSaveError('');
    try {
      await axios.put(`/api/rules/${code}`, updates);
      setSaveSuccess(`Rule ${code} config updated successfully.`);
      fetchRules();
      setEditingRule(null);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Rule configuration update failed.";
      setSaveError(detail);
    } finally {
      setSavingRuleCode(null);
    }
  };

  const handleOpenConditionEditor = (rule: Rule) => {
    setEditingRule(rule);
    setEditingConditionJson(JSON.stringify(JSON.parse(rule.condition_value || '{}'), null, 2));
  };

  const handleSaveConditionJson = () => {
    if (!editingRule) return;
    try {
      // Validate JSON structure
      const parsed = JSON.parse(editingConditionJson);
      // Minified for SQL storage
      const minified = JSON.stringify(parsed);
      handleUpdateRule(editingRule.code, { condition_value: minified });
    } catch (err) {
      alert("Invalid JSON format. Check parameters bracket hierarchy.");
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    setSimError('');

    try {
      const response = await axios.post('/api/rules/simulate', {
        customer_id: customerId,
        customer_name: customerName,
        amount: parseFloat(amount) || 0.0,
        currency,
        location,
        country,
        payment_method: paymentMethod,
        merchant_category: merchantCategory
      });
      setSimResult(response.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Surveillance pipeline simulation failed.";
      setSimError(detail);
    } finally {
      setSimulating(false);
    }
  };

  const canModifyRules = user && user.role === 'Admin';

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-100 border-red-200 dark:bg-red-950/40 dark:text-red-400';
    if (score >= 60) return 'text-amber-500 bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400';
    return 'text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fraud Risk Rules Engine</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure compliance rules weights, adjust check conditions parameters, and simulate transaction scores.</p>
      </div>

      {(saveSuccess || saveError) && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 ${
          saveError 
            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
        }`}>
          {saveError ? (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-xs font-semibold leading-relaxed">{saveError || saveSuccess}</p>
        </div>
      )}

      {/* Grid: Rules Table & Simulation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rules settings lists */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-1.5">
              <Sliders className="w-5 h-5 text-gs-gold" /> Pipeline Verification Rules
            </h3>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gs-gold mx-auto mb-2" />
                <span>Loading engine configurations...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {rulesList.map((rule) => {
                  const condObj = JSON.parse(rule.condition_value || '{}');
                  return (
                    <div key={rule.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50/40 dark:bg-gs-navy-dark/30 dark:border-gs-slate-darkborder/60 text-xs space-y-3.5">
                      {/* Name and Toggle */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rule.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">{rule.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <button
                            disabled={!canModifyRules || savingRuleCode === rule.code}
                            onClick={() => handleUpdateRule(rule.code, { is_active: !rule.is_active })}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${rule.is_active ? 'bg-gs-gold' : 'bg-slate-300 dark:bg-slate-700'} ${!canModifyRules ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${rule.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Weight Slider */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between font-bold text-[10px] uppercase text-slate-400 mb-1">
                            <span>Score Weight Factor</span>
                            <span>{rule.weight} / 100</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={rule.weight}
                            disabled={!canModifyRules || savingRuleCode === rule.code}
                            onChange={(e) => {
                              // Optimistic local state update before network save to avoid stuttering
                              setRulesList(prev => prev.map(r => r.code === rule.code ? { ...r, weight: parseInt(e.target.value) } : r));
                            }}
                            onMouseUp={(e) => {
                              const val = parseInt((e.target as HTMLInputElement).value);
                              handleUpdateRule(rule.code, { weight: val });
                            }}
                            onTouchEnd={(e) => {
                              const val = parseInt((e.target as HTMLInputElement).value);
                              handleUpdateRule(rule.code, { weight: val });
                            }}
                            className={`w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-gs-gold ${!canModifyRules ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        {/* Edit parameters JSON */}
                        <button
                          onClick={() => handleOpenConditionEditor(rule)}
                          className="flex items-center self-end py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-gs-slate-darkborder dark:bg-gs-navy dark:text-slate-300 dark:hover:bg-slate-800 text-[10px] font-bold uppercase transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 mr-1" /> Config Variables
                        </button>
                      </div>

                      {/* Current Config parameters read out */}
                      <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-850 p-2 rounded flex flex-wrap gap-x-4 gap-y-1">
                        <span className="font-bold text-slate-500 uppercase">Parameters:</span>
                        {Object.entries(condObj).map(([k, v]) => (
                          <span key={k}>
                            <b className="text-slate-500 dark:text-slate-300">{k}:</b> {Array.isArray(v) ? v.join(', ') : String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Simulator Column */}
        <div className="space-y-6">
          
          {/* JSON Variables Editor Overlay/Block if open */}
          {editingRule && (
            <div className="p-6 rounded-xl border border-gs-gold bg-white dark:bg-gs-navy-light text-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <FileCode className="w-5 h-5 text-gs-gold" /> Config Editor: {editingRule.code}
                </h3>
                <button 
                  onClick={() => setEditingRule(null)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Modify threshold conditions for execution logic. Must be valid JSON format.</p>
              
              <textarea
                value={editingConditionJson}
                onChange={(e) => setEditingConditionJson(e.target.value)}
                rows={6}
                disabled={!canModifyRules}
                className="w-full font-mono p-3 text-xs bg-slate-900 text-emerald-400 rounded-lg border border-slate-750 focus:outline-none"
              />

              {canModifyRules ? (
                <button
                  onClick={handleSaveConditionJson}
                  className="w-full flex items-center justify-center py-2.5 font-bold rounded-lg bg-gs-gold hover:bg-gs-gold-hover text-gs-navy transition-all"
                >
                  <Save className="w-4 h-4 mr-1.5" /> Save JSON Configuration
                </button>
              ) : (
                <div className="p-3 bg-red-950/20 text-red-400 rounded border border-red-900/30 text-center font-medium">
                  Rule parameters customization restricted to Admin accounts.
                </div>
              )}
            </div>
          )}

          {/* Simulator Form */}
          <div className="p-6 rounded-xl border bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1 flex items-center gap-1.5">
              <Play className="w-5 h-5 text-gs-gold" /> Surveillance Simulator
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal mb-5">Submit transient data payloads to check anomaly scores without seeding transactions database.</p>

            <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Customer ID</label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. C1001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. David Vance"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. 1500.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. USD, EUR, GBP"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Location City</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. London, UK"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Country Code</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. UK"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="ACH">ACH</option>
                    <option value="Crypto">Crypto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Merchant Category</label>
                  <select
                    value={merchantCategory}
                    onChange={(e) => setMerchantCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="Retail">Retail</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="High-End Jewelry">High-End Jewelry</option>
                    <option value="Crypto Exchange">Crypto Exchange</option>
                    <option value="Online Casino">Online Casino</option>
                    <option value="Gas Station">Gas Station</option>
                    <option value="Restaurant">Restaurant</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full mt-2 flex items-center justify-center py-2.5 font-bold rounded-lg bg-gs-navy dark:bg-slate-100 text-white dark:text-gs-navy hover:opacity-90 transition-opacity"
              >
                <Activity className="w-4 h-4 mr-1.5" />
                {simulating ? 'Processing Risk Simulation...' : 'Execute Risk Assessment'}
              </button>
            </form>

            {simError && (
              <div className="p-3 mt-4 text-xs rounded border border-red-800/30 bg-red-950/20 text-red-400">
                {simError}
              </div>
            )}

            {/* Simulation Results Display */}
            {simResult && (
              <div className="mt-6 border-t border-slate-100 dark:border-gs-slate-darkborder pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">Assessment Result</h4>
                  <span className={`px-2.5 py-0.5 rounded font-bold text-xs border ${getRiskScoreColor(simResult.risk_score)}`}>
                    Score: {simResult.risk_score} / 100
                  </span>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      simResult.risk_score >= 80 ? 'bg-red-500' :
                      simResult.risk_score >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${simResult.risk_score}%` }}
                  />
                </div>

                {/* Checklist of rules triggered */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Triggered Vector Details</h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {simResult.triggered_rules.map((exec) => (
                      <div key={exec.code} className="p-2 border.5 rounded border border-slate-100 dark:border-gs-slate-darkborder text-[11px] flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-white">{exec.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            exec.triggered 
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' 
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}>
                            {exec.triggered ? `TRIGGERED (+${exec.score_added})` : 'PASSED'}
                          </span>
                        </div>
                        {exec.reason && (
                          <p className="text-[10px] text-slate-400 italic font-semibold">{exec.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text summary of warning reasons */}
                {simResult.reasons.length > 0 && (
                  <div className="p-3.5 rounded bg-red-500/5 border border-red-500/10 text-[11px] text-red-500 dark:text-red-400 space-y-1">
                    <span className="font-bold flex items-center gap-1 uppercase tracking-wider"><Flame className="w-3.5 h-3.5" /> Threat Indicators Detected:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      {simResult.reasons.map((r, i) => (
                        <li key={i} className="leading-relaxed font-semibold">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RulesPanel;
