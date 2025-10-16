import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const DEFAULT_TIMEOUT_MS = 10000;

export function useApi() {
  const { logout } = useAuth();

  const request = useCallback(async (path, options = {}) => {
    const { timeoutMs, ...rest } = options;

    const headers = new Headers(rest.headers || {});
    if (!headers.has('Content-Type') && !(rest.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const controller = new AbortController();
    const ms = Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), ms);

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers,
        signal: controller.signal,
        credentials: 'include',
      });
    } catch (e) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        try { window.alert('Tempo de resposta excedido. Tente novamente.'); } catch { }
        throw new Error('timeout');
      }
      try { window.alert('Falha de conexão. Verifique sua rede e tente novamente.'); } catch { }
      throw new Error('network');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401) {
      try { window.alert('Sua sessão expirou. Faça login novamente.'); } catch { }
      await logout();
      window.location.replace('/login');
      throw new Error('Sessão expirada');
    }

    if (res.status === 403) {
      try { window.alert('Ação não autorizada para seu perfil.'); } catch { }
    }

    if (res.status >= 500) {
      try { window.alert('Erro no servidor. Tente novamente mais tarde.'); } catch { }
    }

    return res;
  }, [logout]);

  return { request };
}
