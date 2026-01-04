import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

function normalizeUser(u) {
  if (!u) return null;
  const role = String(u.perfil ?? u.role ?? '').toLowerCase();
  const isAdmin = u.isAdmin === true || role === 'admin';
  return { ...u, isAdmin };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      return normalizeUser(parsed);
    } catch {
      return null;
    }
  });
  const [expiresAt, setExpiresAt] = useState(() => localStorage.getItem('expiresAt') || null);

  const [isBooting, setIsBooting] = useState(true);

  const isLoggedIn = !!user;

  const expiryTimerRef = useRef(null);

  function clearExpiryTimer() {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }

  function scheduleExpiry(dateStr) {
    clearExpiryTimer();
    if (!dateStr) return;
    const ms = new Date(dateStr).getTime() - Date.now();
    if (ms > 0) {
      expiryTimerRef.current = setTimeout(() => {
        try { window.alert('Sessão expirada. Faça login novamente.'); } catch {}
        logout().finally(() => window.location.replace('/login'));
      }, ms);
    }
  }

  const login = async (username, password) => {
    const res = await fetch(`/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', 
      body: JSON.stringify({ login: username, senha: password }),
    });

    if (!res.ok) {
      const msg = (await res.text()) || 'Falha no login';
      throw new Error(msg);
    }

    const data = await res.json();

    const u = normalizeUser(data.usuario || null);
    setUser(u);
    setExpiresAt(data.expiresAt || null);

    localStorage.setItem('user', JSON.stringify(u));
    if (data.expiresAt) localStorage.setItem('expiresAt', data.expiresAt);

    localStorage.removeItem('token');

    scheduleExpiry(data.expiresAt);
    return data.usuario;
  };

  const logout = async () => {
    try {
      await fetch(`/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
    } finally {
      setUser(null);
      setExpiresAt(null);
      clearExpiryTimer();
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      localStorage.removeItem('token');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedExp = localStorage.getItem('expiresAt');

        if (savedUser && !user) {
          try { setUser(normalizeUser(JSON.parse(savedUser))); } catch { setUser(null); }
        }
        if (savedExp && !expiresAt) setExpiresAt(savedExp);

        const exp = savedExp || expiresAt;
        if (exp) {
          if (Date.now() >= new Date(exp).getTime()) {
            await logout();
          } else {
            scheduleExpiry(exp);
          }
        }

        const me = await fetch(`/me`, { credentials: 'include' });
        if (me.status === 401) {
          await logout();
        } else if (me.ok && !user) {
          try {
            const maybeJson = await me.json();
           if (maybeJson && (maybeJson.usuario || maybeJson.user)) {
              const raw = maybeJson.usuario || maybeJson.user;
              const norm = normalizeUser(raw);
              setUser(norm);
              localStorage.setItem('user', JSON.stringify(norm));
            }
          } catch {
          }
        }
      } catch {
      } finally {
        setIsBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'user' && e.newValue === null) {
        logout().finally(() => {
          try { window.location.replace('/login'); } catch {}
        });
      }
      if (e.key === 'expiresAt' && e.newValue) {
        scheduleExpiry(e.newValue);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        logout,
        expiresAt,
        isBooting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
