export function createJsonLd(doc: Document, data: Record<string, unknown>): void {
  const script = doc.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  doc.head.appendChild(script);
}

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
