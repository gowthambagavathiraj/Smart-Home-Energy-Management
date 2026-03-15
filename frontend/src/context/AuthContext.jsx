import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ starts true — blocks ProtectedRoute redirect

  useEffect(() => {
    // ✅ Step 1: Check if Google OAuth2 redirected with token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlFirstName = urlParams.get('firstName');
    const urlLastName = urlParams.get('lastName');
    const urlEmail = urlParams.get('email');
    const urlRole = urlParams.get('role');
    const urlProvider = urlParams.get('provider');

    if (urlToken) {
      // Google login success — save token and user from URL params
      const userData = {
        firstName: urlFirstName || '',
        lastName: urlLastName || '',
        email: urlEmail || '',
        role: urlRole || 'HOMEOWNER',
        provider: urlProvider || 'GOOGLE',
      };
      localStorage.setItem('jwt_token', urlToken);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setToken(urlToken);
      setUser(userData);

      // Clean the token out of the URL bar
      window.history.replaceState({}, document.title, window.location.pathname);

      // ✅ Done loading — ProtectedRoute will now allow access
      setLoading(false);
      return;
    }

    // ✅ Step 2: Normal login — load from localStorage
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user_data');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Corrupted storage — clear it
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
      }
    }

    // ✅ Done loading
    setLoading(false);
  }, []);

  const login = (jwtToken, userData) => {
    localStorage.setItem('jwt_token', jwtToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(updates || {}) };
      localStorage.setItem('user_data', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, updateUser, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
