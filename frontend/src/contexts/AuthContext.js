import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api as supabaseApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('panacee_token'));
  const [selectedMarathon, setSelectedMarathon] = useState(() => {
    const saved = localStorage.getItem('panacee_marathon');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // We expose the supersonic shim under the same name `api`
  const axiosInstance = supabaseApi;

  const checkAuth = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await axiosInstance.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('panacee_token');
      localStorage.removeItem('panacee_user_id');
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, [token, axiosInstance]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (code) => {
    const { data } = await axiosInstance.post('/auth/login', { code });
    localStorage.setItem('panacee_token', data.token);
    localStorage.setItem('panacee_user_id', data.user.id);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('panacee_token');
    localStorage.removeItem('panacee_marathon');
    localStorage.removeItem('panacee_user_id');
    setToken(null);
    setUser(null);
    setSelectedMarathon(null);
  };

  const selectMarathon = (marathon) => {
    setSelectedMarathon(marathon);
    localStorage.setItem('panacee_marathon', JSON.stringify(marathon));
  };

  const isAdmin = user?.role === 'admin_principal' || user?.role === 'admin_secondary';
  const isAdminPrincipal = user?.role === 'admin_principal';

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout,
      selectedMarathon, selectMarathon,
      api: axiosInstance, isAdmin, isAdminPrincipal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
