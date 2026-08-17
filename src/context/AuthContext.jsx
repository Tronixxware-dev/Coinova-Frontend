import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api, ApiError } from '../lib/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'coinova_auth';

const REFRESH_BUFFER_MS = 60 * 1000;
const REFRESH_RETRY_DELAY_MS = 30 * 1000;

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistAuth(auth) {
  if (auth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getTokenExpiryMs(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).exp * 1000;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const authRef = useRef(auth);
  authRef.current = auth;

  useEffect(() => {
    persistAuth(auth);
  }, [auth]);

  const performRefresh = useCallback(async (refreshToken) => {
    try {
      const data = await api.refresh(refreshToken);
      setAuth((prev) => (prev ? { ...prev, accessToken: data.accessToken } : prev));
    } catch (err) {
      const refreshTokenIsDead = err instanceof ApiError && (err.status === 403 || err.status === 404);
      if (refreshTokenIsDead) {
        setAuth(null);
      } else {
        timerRef.current = setTimeout(() => performRefresh(refreshToken), REFRESH_RETRY_DELAY_MS);
      }
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!auth?.accessToken || !auth?.refreshToken) return;

    const expiryMs = getTokenExpiryMs(auth.accessToken);
    const refreshToken = auth.refreshToken;
    const delay = expiryMs ? Math.max(expiryMs - Date.now() - REFRESH_BUFFER_MS, 0) : 0;

    timerRef.current = setTimeout(() => performRefresh(refreshToken), delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [auth?.accessToken, auth?.refreshToken, performRefresh]);

  const signup = useCallback(async ({ email, username, password }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.signup({ email, username, password });
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login({ email, password });
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (authRef.current?.refreshToken) {
      try {
        await api.logout(authRef.current.refreshToken);
      } catch {
        // ignore
      }
    }
    setAuth(null);
  }, []);

  // Merges fields (e.g. a new email) into the current user object,
  // both in state and in localStorage, without waiting for the next
  // silent token refresh to pick up the change.
  const updateUser = useCallback((partialUser) => {
    setAuth((prev) => (prev ? { ...prev, user: { ...prev.user, ...partialUser } } : prev));
  }, []);

  const value = {
    user: auth?.user ?? null,
    accessToken: auth?.accessToken ?? null,
    isAuthenticated: !!auth?.accessToken,
    loading,
    error,
    signup,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}