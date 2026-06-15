import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../config/api';

const STORAGE_KEY = 'hms_auth';
const TOKEN_KEY = 'token'; // Matches the key used by our Axios interceptor

const AuthContext = createContext(null);

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const data = res.data || {};

      // Map backend 'user_role' to frontend 'role'
      const role = data.user_role;
      if (role !== 'admin' && role !== 'student') {
        throw new Error('Unknown account role. Contact administration.');
      }

      // Save standalone JWT token for the Axios interceptor
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }

      const session = {
        role,
        student_id: data.student_id ?? '',
        username: email.trim(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setAuth(session);
      return session;
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setAuth(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      auth,
      role: auth?.role ?? null,
      studentId: auth?.student_id ?? null,
      username: auth?.username ?? null,
      isAuthenticated: Boolean(auth?.role),
      loading,
      error,
      login,
      logout,
      setError,
    }),
    [auth, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}