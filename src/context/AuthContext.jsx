import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { API_BASE } from '../config/api';

const STORAGE_KEY = 'hms_auth';

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

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error || data.message || 'Invalid credentials';
        throw new Error(message);
      }

      const role = data.role;
      if (role !== 'admin' && role !== 'student') {
        throw new Error('Unknown account role. Contact administration.');
      }

      const session = {
        role,
        student_id: data.student_id ?? '',
        username: username.trim(),
        status: data.status,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setAuth(session);
      return session;
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
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
