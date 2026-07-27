import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');
      return storedUser && storedToken ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Failed to parse stored user credentials:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Listen to session expiry events to trigger react-router redirection
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
    };
    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, [navigate]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // In a real enterprise system, this will call active AD endpoints.
      // Here, we hook into the backend versioned /auth/login route.
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user: userData } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('[AuthContext] Login request failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    navigate('/login');
  };

  // Simulated Login Helper for direct UI testing and review
  const loginSimulated = (role) => {
    const mockUsers = {
      Employee: { id: 'emp_123', name: 'John Employee', role: 'Employee', email: 'john.employee@airtel.com' },
      Manager: { id: 'mgr_456', name: 'Sarah Manager', role: 'Manager', email: 'sarah.manager@airtel.com' },
      Finance: { id: 'fin_789', name: 'David Finance', role: 'Finance', email: 'david.finance@airtel.com' }
    };

    const mockToken = `mock-${role.toLowerCase()}-token`;
    const selectedUser = mockUsers[role] || mockUsers.Employee;

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('auth_user', JSON.stringify(selectedUser));
    setUser(selectedUser);
    return selectedUser;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    loginSimulated,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed inside AuthProvider');
  }
  return context;
};
