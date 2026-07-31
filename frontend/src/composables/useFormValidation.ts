import type { ComposerTranslation } from 'vue-i18n';

export function useFormValidation(t: ComposerTranslation) {
  const required = (key: string) => (v: unknown) =>
    (typeof v === 'string' ? v.trim().length > 0 : v !== null && v !== undefined) || t(key);

  const email = (
    requiredKey: string,
    invalidKey: string,
  ): [(v: string) => true | string, (v: string) => true | string] => [
    required(requiredKey) as (v: string) => true | string,
    (v: string) => /.+@.+\..+/.test(v) || t(invalidKey),
  ];

  const minLength = (min: number, key = 'validation.minLength') =>
    (v: string) => (v?.length ?? 0) >= min || t(key, { min });

  const nonNegative = (key = 'validation.nonNegative') =>
    (v: number) => Number(v) >= 0 || t(key);

  return {
    required,
    email,
    minLength,
    nonNegative,
  };
}
