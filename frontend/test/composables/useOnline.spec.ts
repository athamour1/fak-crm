import { describe, expect, it } from 'vitest';
import { useOnline } from 'src/composables/useOnline';

describe('useOnline', () => {
  it('tracks browser online/offline events', () => {
    const { isOnline } = useOnline();

    window.dispatchEvent(new Event('offline'));
    expect(isOnline.value).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(isOnline.value).toBe(true);
  });
});
