import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ניסיון לשחזר משתמש וטוקן מקומי בטעינה הראשונית
    const storedUser = authService.getCurrentUser();
    const storedToken = authService.getToken();

    if (storedToken) {
      authService.setAuthToken(storedToken); // עדכון אקסיוס
      setToken(storedToken);
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.login({ username, password });
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (error) {
      console.error("🔐 Login failed in AuthContext:", error);
      throw error;
    }
  };

  const register = async (username, email, password, role) => {
    try {
      const data = await authService.register(username, email, password, role);
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (error) {
      console.error("🧾 Registration failed in AuthContext:", error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    register
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">🔄 טוען את המערכת...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
