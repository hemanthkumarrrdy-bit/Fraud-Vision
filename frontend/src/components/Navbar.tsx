import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Notification } from '../types';
import { 
  Bell, 
  Sun, 
  Moon, 
  ShieldAlert, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface NavbarProps {
  notifications: Notification[];
  markAsRead: (id: number) => void;
  markAllRead: () => void;
  onSelectTransaction: (txId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  notifications, 
  markAsRead, 
  markAllRead,
  onSelectTransaction 
}) => {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.tx_id) {
      onSelectTransaction(n.tx_id);
    }
    setDropdownOpen(false);
  };

  const getAlertStyle = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-500 bg-red-100 dark:bg-red-950/40 dark:text-red-400';
      case 'WARNING':
        return 'text-amber-500 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400';
      default:
        return 'text-blue-500 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400';
    }
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-10 flex items-center justify-between h-16 px-8 border-b bg-white border-slate-200 dark:bg-gs-navy-dark dark:border-gs-slate-darkborder transition-colors duration-200">
      {/* Title block */}
      <div>
        <h2 className="text-sm font-semibold tracking-wider uppercase text-gs-navy/55 dark:text-slate-400">
          Risk Analytics Console
        </h2>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-6">
        {/* Theme switch */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-gs-gold" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Alert Center */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay background to close */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              />
              
              <div className="absolute right-0 mt-2.5 w-96 max-h-[500px] flex flex-col z-20 border rounded-xl shadow-xl bg-white border-slate-200 dark:bg-gs-navy-light dark:border-gs-slate-darkborder overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
                {/* Dropdown Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-gs-slate-darkborder">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-gs-gold" />
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">Security Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-gs-gold hover:text-gs-gold-hover font-semibold transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Clear All
                    </button>
                  )}
                </div>

                {/* Dropdown Content */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-gs-slate-darkborder max-h-[350px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-medium">No alerts flagged today</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex items-start gap-3.5 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          !n.is_read ? 'bg-slate-50/70 dark:bg-slate-800/10' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${getAlertStyle(n.level)}`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="block mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        {!n.is_read && (
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
