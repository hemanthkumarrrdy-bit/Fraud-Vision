import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldCheck, 
  LogOut, 
  UserSquare2,
  Users,
  Sliders
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'Transactions', icon: Receipt, id: 'transactions' },
    { name: 'Customers & KYC', icon: Users, id: 'customers' },
    { name: 'Rules Engine', icon: Sliders, id: 'rules' },
    { name: 'Analytics', icon: BarChart3, id: 'analytics' },
    { name: 'Reports & Audit', icon: FileSpreadsheet, id: 'reports' },
  ];

  // Helper to color-code roles
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-blue-900/40 text-blue-400 border border-blue-800';
      case 'Compliance Officer':
        return 'bg-red-900/40 text-red-400 border border-red-800';
      case 'Risk Analyst':
        return 'bg-amber-900/40 text-amber-400 border border-amber-800';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex flex-col w-64 border-r bg-gs-navy text-slate-300 border-gs-navy-light dark:bg-gs-navy-dark dark:border-gs-slate-darkborder">
      {/* Brand Header */}
      <div className="flex items-center h-16 px-6 gap-2.5 border-b border-gs-navy-light dark:border-gs-slate-darkborder">
        <ShieldCheck className="w-8 h-8 text-gs-gold" />
        <div>
          <span className="text-lg font-bold tracking-tight text-white">FRAUD VISION</span>
          <span className="block text-[10px] uppercase font-semibold text-gs-gold tracking-widest">Enterprise Risk</span>
        </div>
      </div>

      {/* User Section */}
      {user && (
        <div className="p-4 mx-4 mt-6 rounded-lg bg-gs-navy-light/40 border border-gs-navy-light/80 dark:bg-gs-navy-light/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-gs-navy-light/75 text-gs-gold">
              <UserSquare2 className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{user.username}</h4>
              <span className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded-full ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-gs-gold text-gs-navy font-semibold shadow-md shadow-gs-gold/15'
                  : 'text-slate-400 hover:text-white hover:bg-gs-navy-light/50'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-gs-navy' : 'text-slate-400 group-hover:text-white'}`} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Log out Footer */}
      <div className="p-4 border-t border-gs-navy-light dark:border-gs-slate-darkborder">
        <button
          onClick={logout}
          className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-900/30 hover:border-red-800/50 rounded-lg transition-all duration-150"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
