import { Environment } from '../app/core/models';

export const environment: Environment = {
  production: false,
  apiUrl: 'https://staging-api.alahram-developments.com/api',
  siteUrl: 'https://staging.alahram-developments.com',
  appName: 'Al-Ahram Developments',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'] as const,
};
