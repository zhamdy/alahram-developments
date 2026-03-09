export interface Environment {
  production: boolean;
  apiUrl: string;
  siteUrl: string;
  appName: string;
  defaultLocale: 'ar' | 'en';
  supportedLocales: readonly string[];
}
