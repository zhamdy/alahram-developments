import { environment } from '@env';
import { SOCIAL_LINKS } from '../../core/config/social.config';

const BASE_URL = environment.siteUrl;

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: BASE_URL,
    logo: `${BASE_URL}/assets/images/logo-transparent.png`,
    telephone: SOCIAL_LINKS.whatsapp,
    sameAs: [SOCIAL_LINKS.facebook],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SOCIAL_LINKS.whatsapp,
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

export function buildProjectSchema(
  project: {
    slug: string;
    zoneSlug: string;
    imageUrl: string;
    galleryImages?: string[];
    unitTypes?: { area: string }[];
  },
  name: string,
  description: string,
): Record<string, unknown> {
  const images = [`${BASE_URL}/${project.imageUrl}`];
  if (project.galleryImages) {
    images.push(...project.galleryImages.map(img => `${BASE_URL}/${img}`));
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name,
    description,
    url: `${BASE_URL}/projects/${project.zoneSlug}/${project.slug}`,
    image: images,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EGP',
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'RealEstateAgent',
      name: 'الأهرام للتطوير العقاري',
      url: BASE_URL,
      telephone: SOCIAL_LINKS.whatsapp,
    },
  };

  if (project.unitTypes && project.unitTypes.length > 0) {
    schema['floorSize'] = project.unitTypes.map(u => ({
      '@type': 'QuantitativeValue',
      value: u.area,
      unitCode: 'MTK',
    }));
  }

  return schema;
}

export function buildLocalBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: BASE_URL,
    telephone: '+201153516871',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'مدينة السادات',
      addressLocality: 'مدينة السادات',
      addressRegion: 'المنوفية',
      addressCountry: 'EG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.393021,
      longitude: 30.58132,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '18:00',
    },
  };
}

export function buildSadatMapsSchema(
  zones: readonly { label: string }[],
  pageUrl: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'خرائط مناطق مدينة السادات',
    description: 'قائمة بخرائط PDF لجميع مناطق مدينة السادات',
    url: pageUrl,
    numberOfItems: zones.length,
    itemListElement: zones.map((zone, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: zone.label,
    })),
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

export function buildFaqSchema(
  items: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
