import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import TransactionDetailModal from './components/TransactionDetailModal';
import Analytics from './components/Analytics';
import ReportsPanel from './components/ReportsPanel';
import CustomersPanel from './components/CustomersPanel';
import RulesPanel from './components/RulesPanel';
import { Transaction, Notification } from './types';
import axios from 'axios';
import { AlertTriangle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { token, user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  
  // Real-time states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Floating alert toast state
  const [toastAlert, setToastAlert] = useState<Notification | null>(null);

  // Fetch initial histories
  const fetchFeedData = async () => {
    if (!token) return;
    try {
      const [txRes, notifRes] = await Promise.all([
        axios.get('/api/transactions/?limit=50'),
        axios.get('/api/notifications/')
      ]);
      setTransactions(txRes.data.items);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard feed data:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFeedData();
    }
  }, [token]);

  // Establish WebSockets pipeline
  useEffect(() => {
    if (!token) return;

    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      // Connect to FastAPI ws endpoint
      const wsUrl = `ws://localhost:8000/api/notifications/ws/live`;
      console.log(`Connecting to Surveillance WebSocket stream: ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'NEW_TRANSACTION') {
          // Prepend new transaction to feed
          setTransactions(prev => {
            const exists = prev.some(t => t.tx_id === msg.data.tx_id);
            if (exists) return prev;
            return [msg.data, ...prev];
          });
        }
        
        else if (msg.type === 'NEW_ALERT') {
          // Prepend notification
          setNotifications(prev => [msg.data, ...prev]);
          // Fire visual Toast alert
          setToastAlert(msg.data);
        }
        
        else if (msg.type === 'STATUS_UPDATE') {
          // Update transaction in feed
          setTransactions(prev => 
            prev.map(t => t.tx_id === msg.data.tx_id ? msg.data : t)
          );
        }
      };

      ws.onclose = () => {
        console.log("Surveillance WebSocket disconnected. Attempting retry in 4s...");
        reconnectTimeout = setTimeout(connectWS, 4000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection failure:", err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [token]);

  const handleSelectTransaction = (txId: string) => {
    setSelectedTxId(txId);
  };

  const handleStatusUpdated = () => {
    fetchFeedData(); // Reload stats and items list
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to clear alerts dropdown:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gs-navy-dark">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gs-gold" />
      </div>
    );
  }

  if (!token) {
    return <Login />;
  }

  return (
    <div className="min-h-screen pl-64 pt-16 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Top Navbar */}
      <Navbar 
        notifications={notifications} 
        markAsRead={handleMarkAsRead} 
        markAllRead={handleMarkAllRead}
        onSelectTransaction={handleSelectTransaction}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
        {currentTab === 'dashboard' && (
          <Dashboard onSelectTransaction={handleSelectTransaction} transactions={transactions} />
        )}
        {currentTab === 'transactions' && (
          <TransactionTable onSelectTransaction={handleSelectTransaction} refreshData={fetchFeedData} />
        )}
        {currentTab === 'analytics' && (
          <Analytics />
        )}
        {currentTab === 'reports' && (
          <ReportsPanel />
        )}
        {currentTab === 'customers' && (
          <CustomersPanel onSelectTransaction={handleSelectTransaction} />
        )}
        {currentTab === 'rules' && (
          <RulesPanel />
        )}
      </main>

      {/* Pop-out Case Detail drawer */}
      {selectedTxId && (
        <TransactionDetailModal 
          txId={selectedTxId} 
          onClose={() => setSelectedTxId(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

      {/* High-Risk Toast Alert Notification */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 w-96 p-4 rounded-xl border shadow-2xl bg-red-600 border-red-500 text-white animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider">High Risk Alert Flagged</h4>
              <p className="text-xs mt-1 leading-relaxed opacity-95">
                {toastAlert.message}
              </p>
              <div className="mt-3 flex gap-4">
                <button
                  onClick={() => {
                    if (toastAlert.tx_id) handleSelectTransaction(toastAlert.tx_id);
                    setToastAlert(null);
                  }}
                  className="text-xs font-bold hover:underline"
                >
                  Review Case File
                </button>
                <button
                  onClick={() => handleMarkAsRead(toastAlert.id).then(() => setToastAlert(null))}
                  className="text-xs font-medium opacity-75 hover:opacity-100 hover:underline"
                >
                  Acknowledge
                </button>
              </div>
            </div>
            <button 
              onClick={() => setToastAlert(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Global Context Wrapper
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
