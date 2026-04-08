import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// ── Resolve API base URL ─────────────────────────────────────────────────────
declare global {
  interface Window {
    __APP_CONFIG__?: { apiUrl?: string };
  }
}

const baseURL =
  window.__APP_CONFIG__?.apiUrl ??
  process.env.API_URL ??
  'http://localhost:3000/api';

// ── Base axios instance ──────────────────────────────────────────────────────
export const api = axios.create({ baseURL });

// ── Request interceptor: attach JWT from localStorage ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function drainQueue(error: unknown, token?: string) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token as string}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Dynamically import the store to avoid circular dep at module load time
      const { useAuthStore } = await import('src/stores/auth.store');
      const { getActivePinia } = await import('pinia');
      const pinia = getActivePinia();
      if (!pinia) throw new Error('Pinia not ready');
      const authStore = useAuthStore(pinia);

      const ok = await authStore.tryRefresh();
      if (!ok) throw new Error('Refresh failed');

      const newToken = localStorage.getItem('access_token')!;
      drainQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      drainQueue(refreshError);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('refresh_user_id');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});
