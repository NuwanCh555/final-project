import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || localStorage.getItem('mock_token') || null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeoutAlert, setSessionTimeoutAlert] = useState(false);

  const inactivityTimerRef = useRef(null);

  // Core profile loader on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (token) {
        try {
          const res = await api.getProfile();
          setUser(res.user);
        } catch (error) {
          console.error('Session restore failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [token]);

  // R-SEC-8: 30-minute user session inactivity timeout implementation
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (user) {
      // 30 minutes = 30 * 60 * 1000 = 1,800,000 milliseconds
      inactivityTimerRef.current = setTimeout(() => {
        handleSessionTimeout();
      }, 30 * 60 * 1000);
    }
  };

  const handleSessionTimeout = () => {
    logout();
    setSessionTimeoutAlert(true);
    // Dismiss timeout popup alert after 10 seconds automatically
    setTimeout(() => setSessionTimeoutAlert(false), 10000);
  };

  // Bind browser activity events for session reset
  useEffect(() => {
    if (user) {
      const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
      
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetInactivityTimer);
      });

      // Start initial timer
      resetInactivityTimer();

      return () => {
        activityEvents.forEach((event) => {
          window.removeEventListener(event, resetInactivityTimer);
        });
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('token', res.token);
      setSessionTimeoutAlert(false);
      return res.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.register(name, email, password);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('token', res.token);
      setSessionTimeoutAlert(false);
      return res.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_currentUser');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const updateProfile = async (name, email, password) => {
    try {
      const res = await api.updateProfile(name, email, password);
      setUser(res.user);
      return res.user;
    } catch (error) {
      throw error;
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      const res = await api.uploadProfilePicture(file);
      setUser(res.user);
      return res.user;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    sessionTimeoutAlert,
    setSessionTimeoutAlert,
    login,
    register,
    logout,
    updateProfile,
    uploadProfilePicture,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider context layer');
  }
  return context;
};
