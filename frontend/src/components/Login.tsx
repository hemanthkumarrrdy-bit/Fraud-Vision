import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Briefcase, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

const Login: React.FC = () => {
  const { login, error, clearError } = useAuth();
  
  // View states
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [localError, setLocalError] = useState('');

  // Sign In States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up States
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Risk Analyst');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setLocalError('');
    const success = await login(username, password);
    setLoading(false);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSignupSuccess(false);

    if (!signupUsername || !signupEmail || !signupPassword || !signupRole) {
      setLocalError('Please populate all registration details.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/signup', {
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
        role: signupRole
      });
      
      setSignupSuccess(true);
      setLocalError('');
      
      // Auto logging in the user for a smooth onboarding experience
      const loginSuccess = await login(signupUsername, signupPassword);
      if (!loginSuccess) {
        // Fallback: send them to sign in view if auto login fails
        setIsSignUp(false);
        setUsername(signupUsername);
        setPassword('');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Registration failed. Choose a unique username.';
      setLocalError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleUser: string, rolePass: string) => {
    clearError();
    setLocalError('');
    setIsSignUp(false);
    setUsername(roleUser);
    setPassword(rolePass);
    setLoading(true);
    await login(roleUser, rolePass);
    setLoading(false);
  };

  const toggleView = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setLocalError('');
    setSignupSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gs-navy-dark relative overflow-hidden font-sans">
      {/* Background Graphic Patterns */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gs-navy-light/40 via-gs-navy-dark to-gs-navy-dark" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gs-gold/5 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-red-500/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md p-8 border rounded-2xl shadow-2xl bg-gs-navy/60 border-gs-navy-light/60 backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-gs-gold/30 to-gs-gold/5 border border-gs-gold rounded-xl mb-4 shadow-lg shadow-gs-gold/10">
            <ShieldCheck className="w-10 h-10 text-gs-gold" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">FRAUD VISION</h1>
          <p className="text-xs font-semibold text-gs-gold tracking-widest uppercase mt-1">Banking Risk & Compliance</p>
        </div>

        {/* Global Errors Banner */}
        {(error || localError) && (
          <div className="flex items-center gap-2.5 p-3.5 mb-6 text-sm rounded-lg border bg-red-950/20 border-red-800/40 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="leading-relaxed font-medium">{localError || error}</p>
          </div>
        )}

        {/* Signup Success Banner */}
        {signupSuccess && (
          <div className="flex items-center gap-2.5 p-3.5 mb-6 text-sm rounded-lg border bg-emerald-950/20 border-emerald-800/40 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p className="leading-relaxed font-medium">Registration successful. Accessing console...</p>
          </div>
        )}

        {!isSignUp ? (
          /* --- SIGN IN FORM --- */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { clearError(); setUsername(e.target.value); }}
                  className="w-full pl-11 pr-4 py-2.5 text-xs rounded-lg text-white border bg-gs-navy-dark border-gs-navy-light/80 placeholder-slate-600 focus:outline-none focus:border-gs-gold focus:ring-1 focus:ring-gs-gold transition-all"
                  placeholder="Enter account username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { clearError(); setPassword(e.target.value); }}
                  className="w-full pl-11 pr-4 py-2.5 text-xs rounded-lg text-white border bg-gs-navy-dark border-gs-navy-light/80 placeholder-slate-600 focus:outline-none focus:border-gs-gold focus:ring-1 focus:ring-gs-gold transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-2.5 mt-2 text-xs font-semibold rounded-lg bg-gs-gold hover:bg-gs-gold-hover text-gs-navy shadow-lg shadow-gs-gold/15 focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                'Verify Credentials'
              )}
            </button>
          </form>
        ) : (
          /* --- SIGN UP FORM --- */
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => { setLocalError(''); setSignupUsername(e.target.value); }}
                  className="w-full pl-11 pr-4 py-2.5 text-xs rounded-lg text-white border bg-gs-navy-dark border-gs-navy-light/80 placeholder-slate-600 focus:outline-none focus:border-gs-gold focus:ring-1 focus:ring-gs-gold transition-all"
                  placeholder="Choose username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => { setLocalError(''); setSignupEmail(e.target.value); }}
                  className="w-full pl-11 pr-4 py-2.5 text-xs rounded-lg text-white border bg-gs-navy-dark border-gs-navy-light/80 placeholder-slate-600 focus:outline-none focus:border-gs-gold focus:ring-1 focus:ring-gs-gold transition-all"
                  placeholder="name@institution.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => { setLocalError(''); setSignupPassword(e.target.value); }}
                  className="w-full pl-11 pr-4 py-2.5 text-xs rounded-lg text-white border bg-gs-navy-dark border-gs-navy-light/80 placeholder-slate-600 focus:outline-none focus:border-gs-gold focus:ring-1 focus:ring-gs-gold transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Risk & Compliance Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-xs rounded-lg text-slate-300 border bg-gs-navy-dark border-gs-navy-light/80 focus:outline-none focus:border-gs-gold focus:ring-1 focus:ring-gs-gold transition-all appearance-none"
                >
                  <option value="Risk Analyst" className="text-slate-800">Risk Analyst</option>
                  <option value="Compliance Officer" className="text-slate-800">Compliance Officer</option>
                  <option value="Admin" className="text-slate-800">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-2.5 mt-4 text-xs font-semibold rounded-lg bg-gs-gold hover:bg-gs-gold-hover text-gs-navy shadow-lg shadow-gs-gold/15 focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                'Create & Access Account'
              )}
            </button>
          </form>
        )}

        {/* View Switcher Toggle Link */}
        <div className="mt-5 text-center">
          <button
            onClick={toggleView}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            {isSignUp ? 'Already registered? Sign In' : "New analyst? Register account"}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Demo Fast Login presets */}
        {!isSignUp && (
          <div className="mt-8 pt-6 border-t border-gs-navy-light/40">
            <p className="text-center text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-4">
              Demostration Presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="px-2 py-2 text-[10px] font-bold uppercase rounded border border-gs-navy-light/80 hover:border-gs-gold text-slate-300 hover:text-white bg-gs-navy-dark/40 hover:bg-gs-navy-dark/90 transition-all truncate"
                title="Full system management role"
              >
                Admin
              </button>
              <button
                onClick={() => handleQuickLogin('analyst', 'analyst123')}
                className="px-2 py-2 text-[10px] font-bold uppercase rounded border border-gs-navy-light/80 hover:border-gs-gold text-slate-300 hover:text-white bg-gs-navy-dark/40 hover:bg-gs-navy-dark/90 transition-all truncate"
                title="Risk Analyst role (Status updates & notes)"
              >
                Analyst
              </button>
              <button
                onClick={() => handleQuickLogin('compliance', 'compliance123')}
                className="px-2 py-2 text-[10px] font-bold uppercase rounded border border-gs-navy-light/80 hover:border-gs-gold text-slate-300 hover:text-white bg-gs-navy-dark/40 hover:bg-gs-navy-dark/90 transition-all truncate"
                title="Compliance role (Schedules & PDF generation)"
              >
                Compliance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
