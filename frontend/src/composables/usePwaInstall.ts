import { ref, readonly } from 'vue';

// Holds the deferred prompt across the app lifetime
const deferredPrompt = ref<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> } | null>(null);
const isInstallable = ref(false);
const isInstalled = ref(false);

// Listen once at module level — fires before Vue mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e as typeof deferredPrompt.value;
    isInstallable.value = true;
  });

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true;
    isInstallable.value = false;
    deferredPrompt.value = null;
  });

  // Already running as standalone PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true;
  }
}

export function usePwaInstall() {
  async function install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferredPrompt.value) return 'unavailable';
    await deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;
    isInstallable.value = false;
    return outcome;
  }

  return {
    isInstallable: readonly(isInstallable),
    isInstalled: readonly(isInstalled),
    install,
  };
}
