export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  defaultLocale: 'ar' | 'en';
  supportedLocales: readonly string[];
}
