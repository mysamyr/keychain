export const i18nConfig = {
  locales: ['en', 'uk'],
  fallbackLocale: 'en',
  languageTags: { en: 'en', uk: 'uk' },
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

export function normalizeLocale(value: string): Locale | undefined {
  const language = value.trim().toLowerCase().split(/[-_]/)[0];
  switch (language) {
    case 'en':
    case 'uk':
      return language;
    default:
      return undefined;
  }
}
