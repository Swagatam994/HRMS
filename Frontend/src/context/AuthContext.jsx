import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';
import { storageKeys } from '../utils/constants.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(storageKeys.token));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(storageKeys.user);
    return saved ? JSON.parse(saved) : null;
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const persistSession = (payload) => {
    localStorage.setItem(storageKeys.token, payload.token);
    localStorage.setItem(storageKeys.user, JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  };

  const refreshProfile = async () => {
    const payload = await userApi.getProfile();
    setUser(payload.user);
    setStats(payload.stats);
    localStorage.setItem(storageKeys.user, JSON.stringify(payload.user));
    return payload;
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    refreshProfile()
      .catch(() => {
        localStorage.removeItem(storageKeys.token);
        localStorage.removeItem(storageKeys.user);
        disconnectSocket();
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      stats,
      loading,
      isAuthenticated: Boolean(token),
      login: async (payload) => {
        const response = await authApi.login(payload);
        persistSession(response);
        return response;
      },
      register: async (payload) => {
        const response = await authApi.register(payload);
        persistSession(response);
        return response;
      },
      logout: () => {
        localStorage.removeItem(storageKeys.token);
        localStorage.removeItem(storageKeys.user);
        setToken(null);
        setUser(null);
        setStats(null);
      },
      refreshProfile,
      updateProfile: async (payload) => {
        const response = await userApi.updateProfile(payload);
        setUser(response.user);
        setStats(response.stats);
        localStorage.setItem(storageKeys.user, JSON.stringify(response.user));
        return response;
      }
    }),
    [token, user, stats, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
