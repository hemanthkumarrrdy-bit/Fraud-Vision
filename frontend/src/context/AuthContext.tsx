import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';

// Set global Axios Base URL
axios.defaults.baseURL = 'http://localhost:8000';

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Set default token headers on initialization
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const fetchProfile = async (authToken: string) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      return true;
    } catch (err: any) {
      console.error("Failed to fetch user profile:", err);
      logout();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        await fetchProfile(token);
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // OAuth2 password flow expects x-www-form-urlencoded data
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post('/api/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, role, email } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      
      setToken(access_token);
      setUser({ username, role, email: email || '' });
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setLoading(false);
      return true;
    } catch (err: any) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || 'Authentication failed. Please check credentials.';
      setError(errMsg);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ token, user, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
