import { describe, expect, it } from 'vitest';
import { useFormValidation } from 'src/composables/useFormValidation';

const t = (key: string, params?: Record<string, unknown>) => {
  if (key === 'validation.minLength') return `min:${String(params?.min)}`;
  return key;
};

describe('useFormValidation', () => {
  it('returns translated required and email validation messages', () => {
    const validation = useFormValidation(t as never);

    const requiredRule = validation.required('validation.required');
    const [emailRequiredRule, emailInvalidRule] = validation.email(
      'auth.emailRequired',
      'auth.emailInvalid',
    );

    expect(requiredRule('')).toBe('validation.required');
    expect(emailRequiredRule('')).toBe('auth.emailRequired');
    expect(emailInvalidRule('abc')).toBe('auth.emailInvalid');
    expect(emailInvalidRule('user@example.com')).toBe(true);
  });

  it('validates min length and non-negative values', () => {
    const validation = useFormValidation(t as never);

    expect(validation.minLength(6)('123')).toBe('min:6');
    expect(validation.minLength(6)('123456')).toBe(true);

    const nonNegativeRule = validation.nonNegative();
    expect(nonNegativeRule(-1)).toBe('validation.nonNegative');
    expect(nonNegativeRule(0)).toBe(true);
  });
});
