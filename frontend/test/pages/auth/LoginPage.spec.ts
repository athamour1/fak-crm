import { describe, expect, it, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import LoginPage from 'src/pages/auth/LoginPage.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      app: { name: 'OuchTracker', subtitle: 'Sub' },
      theme: { lightMode: 'Light', darkMode: 'Dark' },
      auth: {
        emailAddress: 'Email',
        password: 'Password',
        signIn: 'Sign In',
        stayLoggedIn: 'Stay Logged In',
        emailRequired: 'Email required',
        emailInvalid: 'Invalid email',
        passwordRequired: 'Password required',
        loginFailed: 'Login failed',
      },
      offline: { banner: 'Offline' },
    },
  },
});

const push = vi.fn();
const login = vi.fn();

vi.mock('quasar', () => ({
  useQuasar: () => ({
    dark: {
      isActive: false,
      toggle: vi.fn(),
    },
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query: { redirect: '/my-kits' } }),
}));

vi.mock('stores/auth.store', () => ({
  useAuthStore: () => ({
    loading: false,
    error: 'Invalid credentials',
    login,
  }),
}));

vi.mock('src/composables/useOnline', () => ({
  useOnline: () => ({
    isOnline: { value: true },
  }),
}));

function mountPage() {
  return shallowMount(LoginPage, {
    global: {
      plugins: [i18n],
      stubs: {
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-form': { template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>' },
        'q-input': { template: '<div><slot name="prepend" /><slot name="append" /></div>' },
        'q-btn': { template: '<button><slot /></button>' },
        'q-icon': { template: '<i />' },
        'q-toggle': { template: '<div />' },
        'q-banner': { template: '<div><slot /></div>' },
        'q-tooltip': { template: '<div><slot /></div>' },
      },
    },
  });
}

describe('LoginPage', () => {
  beforeEach(() => {
    login.mockReset();
    push.mockReset();
  });

  it('redirects to route query after successful login', async () => {
    login.mockResolvedValue(true);
    const wrapper = mountPage();

    await wrapper.find('form').trigger('submit');

    expect(login).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/my-kits');
  });

  it('shows login error when authentication fails', async () => {
    login.mockResolvedValue(false);
    const wrapper = mountPage();

    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Invalid credentials');
  });
});
