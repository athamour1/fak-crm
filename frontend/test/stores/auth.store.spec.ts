import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from 'src/stores/auth.store';

const { authApiMock } = vi.hoisted(() => ({
  authApiMock: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

vi.mock('src/services/api', () => ({
  authApi: authApiMock,
}));

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    authApiMock.login.mockReset();
    authApiMock.refresh.mockReset();
  });

  it('saves session on successful login', async () => {
    authApiMock.login.mockResolvedValue({
      data: {
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
        user: {
          id: 'u1',
          email: 'user@example.com',
          fullName: 'Demo User',
          role: 'CHECKER',
          isActive: true,
          locale: 'en',
          createdAt: '',
          updatedAt: '',
        },
      },
    });

    const store = useAuthStore();
    const success = await store.login('user@example.com', 'password', true);

    expect(success).toBe(true);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('token-123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-123');
  });

  it('sets error on failed login', async () => {
    authApiMock.login.mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    const store = useAuthStore();
    const success = await store.login('user@example.com', 'bad-password', false);

    expect(success).toBe(false);
    expect(store.error).toBe('Invalid credentials');
  });

  it('returns false when no refresh tokens exist', async () => {
    const store = useAuthStore();
    const refreshed = await store.tryRefresh();

    expect(refreshed).toBe(false);
    expect(authApiMock.refresh).not.toHaveBeenCalled();
  });
});
