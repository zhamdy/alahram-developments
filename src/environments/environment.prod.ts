import { Environment } from '../app/core/models';

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  siteUrl: 'https://alahram-developments.com',
  appName: 'Al-Ahram Developments',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'] as const,
};
