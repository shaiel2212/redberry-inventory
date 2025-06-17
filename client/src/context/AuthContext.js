import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true); // הוספנו מצב טעינה

  useEffect(() => {
    // This effect runs once on mount to ensure the token is set in axios headers
    // if it exists in localStorage (e.g., after a page refresh)
    const currentToken = authService.getToken();
    if (currentToken) {
      authService.setAuthToken(currentToken); // חשוב לוודא שההדרים של אקסיוס מעודכנים
      // כאן אפשר להוסיף בדיקה אם הטוקן עדיין תקף מול השרת
    }
    setLoading(false); // סימון שהטעינה הראשונית הסתיימה
  }, []);


  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (error) {
      console.error("Login failed in AuthContext:", error);
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
        console.error("Registration failed in AuthContext:", error);
        throw error;
    }
  }

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  // אם במצב טעינה, אפשר להציג משהו אחר או כלום
  if (loading) {
    return <p>Loading application...</p>; // או null אם לא רוצים להציג כלום
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);