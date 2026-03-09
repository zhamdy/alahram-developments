export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'الأهرام للتطوير العقاري',
    alternateName: 'Al-Ahram Developments',
    url: 'https://alahram-developments.com',
    logo: 'https://alahram-developments.com/assets/images/logo.jpg',
    telephone: '+201031198677',
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

const BASE_URL = 'https://alahram-developments.com';

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
