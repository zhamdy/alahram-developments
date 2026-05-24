import { Environment } from '../app/core/models';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:4200/api',
  siteUrl: 'https://www.alahram-developments-sadat.com',
  appName: 'Al-Ahram Developments',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'] as const,
};
