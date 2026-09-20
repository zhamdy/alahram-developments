import { environment } from '@env';
import { SOCIAL_LINKS, BUSINESS_LOCATION } from '../../core/config/social.config';

const BASE_URL = environment.siteUrl;

// Stable identifiers so the site describes one company and one site, and every
// page-level node can point at them instead of repeating a copy.
export const ORGANIZATION_ID = `${BASE_URL}/#organization`;
export const WEBSITE_ID = `${BASE_URL}/#website`;

// Schema URLs are consumed as-is, so they must be the trailing-slash form the
// canonical uses; the slash-less form 308s.
function canonical(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

// The single company node. This used to exist twice — once here and once as
// buildLocalBusinessSchema — with the same url, no @id and different phone
// numbers, which left the two impossible to reconcile.
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': ORGANIZATION_ID,
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: BASE_URL,
    logo: `${BASE_URL}/assets/images/logo-transparent.png`,
    image: `${BASE_URL}/assets/images/logo-transparent.png`,
    telephone: SOCIAL_LINKS.phone,
    sameAs: [SOCIAL_LINKS.facebook],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SOCIAL_LINKS.phone,
      contactType: 'sales',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS_LOCATION.streetAddress,
      addressLocality: BUSINESS_LOCATION.addressLocality,
      addressRegion: BUSINESS_LOCATION.addressRegion,
      addressCountry: BUSINESS_LOCATION.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS_LOCATION.latitude,
      longitude: BUSINESS_LOCATION.longitude,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '18:00',
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
  locale: string,
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
    // The locale matters: without it this url 301s.
    url: canonical(`${BASE_URL}/${locale}/projects/${project.zoneSlug}/${project.slug}`),
    image: images,
    // No `offers`. An AggregateOffer with a currency and no price is invalid, and
    // no price is published — restore it only alongside a real one.
    provider: { '@id': ORGANIZATION_ID },
  };

  // floorSize takes a single value, not a list, and the value must be a number.
  const areas = (project.unitTypes ?? [])
    .map(u => Number.parseFloat(u.area))
    .filter(area => Number.isFinite(area));
  if (areas.length > 0) {
    schema['floorSize'] = {
      '@type': 'QuantitativeValue',
      minValue: Math.min(...areas),
      maxValue: Math.max(...areas),
      unitCode: 'MTK',
    };
  }

  return schema;
}

export function buildSadatMapsSchema(
  zones: readonly { label: string; pdfFileName: string }[],
  pageUrl: string,
  pdfBaseUrl: string,
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
      // Without a url the list names 36 maps and points at none of them.
      url: `${pdfBaseUrl}/${zone.pdfFileName}.pdf`,
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
      item: canonical(item.url),
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
