import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type User } from 'src/services/api';

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ── Getters ────────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isChecker = computed(() => user.value?.role === 'CHECKER');

  // ── Hydrate from localStorage on store creation ────────────────────────────
  function hydrateFromStorage() {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      token.value = storedToken;
      try {
        user.value = JSON.parse(storedUser) as User;
      } catch {
        clearStorage();
      }
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await authApi.login(email, password);
      token.value = data.accessToken;
      user.value = data.user;
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please check your credentials.';
      error.value = Array.isArray(msg) ? msg[0] : msg;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    clearStorage();
  }

  /** Re-fetch the current user profile (e.g. after role change). */
  async function refreshUser() {
    try {
      const { data } = await authApi.me();
      user.value = data;
      localStorage.setItem('user', JSON.stringify(data));
    } catch {
      logout();
    }
  }

  function clearStorage() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // Hydrate immediately when the store is first used
  hydrateFromStorage();

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isChecker,
    login,
    logout,
    refreshUser,
  };
});
