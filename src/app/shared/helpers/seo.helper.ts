import { environment } from '@env';

const BASE_URL = environment.siteUrl;

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: BASE_URL,
    logo: `${BASE_URL}/assets/images/logo.jpg`,
    telephone: '+201031198677',
    // TODO: Add email when confirmed — email: 'info@alahram-eg.com',
    sameAs: [
      'https://www.facebook.com/people/%D8%A7%D9%84%D8%A3%D9%87%D8%B1%D8%A7%D9%85-%D9%84%D9%84%D8%AA%D8%B7%D9%88%D9%8A%D8%B1-%D9%88%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AB%D9%85%D8%A7%D8%B1-%D8%A7%D9%84%D8%B9%D9%82%D8%A7%D8%B1%D9%8A/61567314396170/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+201031198677',
      contactType: 'sales',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'مدينة السادات',
      addressLocality: 'مدينة السادات، المنوفية',
      addressCountry: 'EG',
    },
    areaServed: {
      '@type': 'Place',
      name: 'مدينة السادات، المنوفية، مصر',
    },
  };
}

export function buildProjectSchema(project: {
  slug: string;
  imageUrl: string;
  galleryImages: string[];
  unitTypes: { area: string }[];
}, name: string, description: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name,
    description,
    url: `${BASE_URL}/projects/${project.slug}`,
    image: [
      `${BASE_URL}/${project.imageUrl}`,
      ...project.galleryImages.map(img => `${BASE_URL}/${img}`),
    ],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EGP',
      availability: 'https://schema.org/InStock',
    },
    floorSize: project.unitTypes.map(u => ({
      '@type': 'QuantitativeValue',
      value: u.area,
      unitCode: 'MTK',
    })),
    provider: {
      '@type': 'RealEstateAgent',
      name: 'الأهرام للتطوير العقاري',
      url: BASE_URL,
      telephone: '+201031198677',
    },
  };
}

export function buildLocalBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: BASE_URL,
    telephone: '+201031198677',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'مدينة السادات',
      addressLocality: 'مدينة السادات',
      addressRegion: 'المنوفية',
      addressCountry: 'EG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.0376,
      longitude: 30.3713,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '18:00',
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
