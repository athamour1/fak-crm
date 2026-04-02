import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// ── Resolve API base URL ─────────────────────────────────────────────────────
// Priority:
//   1. window.__APP_CONFIG__.apiUrl  — runtime injection via container entrypoint
//   2. process.env.API_URL           — Quasar build-time env (local dev .env)
//   3. hard-coded fallback           — bare `npm run dev` without any config
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

// ── Response interceptor: handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Let the router guard handle the redirect; store will be empty
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});
