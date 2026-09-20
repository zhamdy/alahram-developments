import { describe, it, expect } from 'vitest';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildProjectSchema,
  buildSadatMapsSchema,
  buildFaqSchema,
  ORGANIZATION_ID,
} from './seo.helper';

const BASE = 'https://www.alahram-developments-sadat.com';

describe('buildOrganizationSchema', () => {
  it('returns RealEstateAgent with correct domain', () => {
    const schema = buildOrganizationSchema() as Record<string, unknown>;
    expect(schema['@type']).toBe('RealEstateAgent');
    expect(schema['url']).toBe(BASE);
    expect((schema['logo'] as string).startsWith(BASE)).toBe(true);
  });

  it('includes sameAs social links', () => {
    const schema = buildOrganizationSchema() as Record<string, unknown>;
    expect(Array.isArray(schema['sameAs'])).toBe(true);
    expect((schema['sameAs'] as string[]).length).toBeGreaterThan(0);
  });
});

describe('buildOrganizationSchema — merged local business fields', () => {
  it('carries the geo coordinates the separate node used to hold', () => {
    const schema = buildOrganizationSchema() as Record<string, unknown>;
    const geo = schema['geo'] as Record<string, unknown>;
    expect(geo['@type']).toBe('GeoCoordinates');
    expect(typeof geo['latitude']).toBe('number');
    expect(typeof geo['longitude']).toBe('number');
  });

  it('includes opening hours', () => {
    const schema = buildOrganizationSchema() as Record<string, unknown>;
    expect(schema['openingHoursSpecification']).toBeDefined();
  });

  it('has a stable @id so other nodes can reference it', () => {
    const schema = buildOrganizationSchema() as Record<string, unknown>;
    expect(schema['@id']).toBe(ORGANIZATION_ID);
  });

  it('publishes the phone number, not the WhatsApp number', () => {
    const schema = buildOrganizationSchema() as Record<string, unknown>;
    expect(schema['telephone']).toBe('+201031198677');
  });

  it('gives a street address distinct from the locality', () => {
    const address = (buildOrganizationSchema() as Record<string, unknown>)['address'] as Record<string, unknown>;
    expect(address['streetAddress']).not.toBe(address['addressLocality']);
  });
});

describe('buildBreadcrumbSchema', () => {
  it('normalises item urls to the trailing-slash canonical form', () => {
    const schema = buildBreadcrumbSchema([{ name: 'المشاريع', url: `${BASE}/ar/projects` }]) as Record<string, unknown>;
    const list = schema['itemListElement'] as Record<string, unknown>[];
    expect(list[0]['item']).toBe(`${BASE}/ar/projects/`);
  });

  it('returns BreadcrumbList with correct item count', () => {
    const items = [
      { name: 'الرئيسية', url: `${BASE}/ar` },
      { name: 'المشاريع', url: `${BASE}/ar/projects` },
    ];
    const schema = buildBreadcrumbSchema(items) as Record<string, unknown>;
    expect(schema['@type']).toBe('BreadcrumbList');
    const list = schema['itemListElement'] as unknown[];
    expect(list).toHaveLength(2);
  });

  it('assigns sequential positions starting at 1', () => {
    const items = [
      { name: 'الرئيسية', url: `${BASE}/ar` },
      { name: 'عن الشركة', url: `${BASE}/ar/about` },
    ];
    const list = (buildBreadcrumbSchema(items) as Record<string, unknown>)['itemListElement'] as Record<string, unknown>[];
    expect(list[0]['position']).toBe(1);
    expect(list[1]['position']).toBe(2);
  });

  it('single item produces BreadcrumbList with one entry', () => {
    const items = [{ name: 'الرئيسية', url: `${BASE}/ar` }];
    const schema = buildBreadcrumbSchema(items) as Record<string, unknown>;
    const list = schema['itemListElement'] as unknown[];
    expect(list).toHaveLength(1);
  });
});

describe('buildProjectSchema', () => {
  const project = {
    slug: 'project-629',
    zoneSlug: 'zone-21',
    imageUrl: 'assets/images/projects/project-629/hero.webp',
  };

  it('returns RealEstateListing with correct URL', () => {
    const schema = buildProjectSchema(project, 'مشروع 629', 'وصف المشروع', 'ar') as Record<string, unknown>;
    expect(schema['@type']).toBe('RealEstateListing');
    // Locale-prefixed and trailing-slash: the old form 301ed.
    expect(schema['url']).toBe(`${BASE}/ar/projects/zone-21/project-629/`);
  });

  it('references the company by @id instead of inlining a copy', () => {
    const schema = buildProjectSchema(project, 'Test', 'Desc', 'ar') as Record<string, unknown>;
    expect(schema['provider']).toEqual({ '@id': ORGANIZATION_ID });
  });

  it('omits offers, since no price is published', () => {
    const schema = buildProjectSchema(project, 'Test', 'Desc', 'ar') as Record<string, unknown>;
    expect(schema['offers']).toBeUndefined();
  });

  it('includes hero image with correct domain', () => {
    const schema = buildProjectSchema(project, 'Test', 'Desc', 'ar') as Record<string, unknown>;
    const images = schema['image'] as string[];
    expect(images[0].startsWith(BASE)).toBe(true);
  });

  it('includes gallery images when provided', () => {
    const withGallery = { ...project, galleryImages: ['assets/images/g1.webp', 'assets/images/g2.webp'] };
    const schema = buildProjectSchema(withGallery, 'Test', 'Desc', 'ar') as Record<string, unknown>;
    expect((schema['image'] as string[]).length).toBe(3);
  });

  it('expresses floorSize as one numeric range, not a list of strings', () => {
    const withUnits = { ...project, unitTypes: [{ area: '90' }, { area: '120' }] };
    const schema = buildProjectSchema(withUnits, 'Test', 'Desc', 'ar') as Record<string, unknown>;
    const floor = schema['floorSize'] as Record<string, unknown>;
    expect(floor['@type']).toBe('QuantitativeValue');
    expect(floor['minValue']).toBe(90);
    expect(floor['maxValue']).toBe(120);
  });
});

describe('buildSadatMapsSchema', () => {
  const zones = [
    { label: 'المنطقة 21', pdfFileName: 'area-21' },
    { label: 'المنطقة 22', pdfFileName: 'area-22' },
  ] as const;
  const PDFS = `${BASE}/assets/maps-pdf`;

  it('returns ItemList with correct count', () => {
    const schema = buildSadatMapsSchema(zones, `${BASE}/ar/sadat-city-maps`, PDFS) as Record<string, unknown>;
    expect(schema['@type']).toBe('ItemList');
    expect(schema['numberOfItems']).toBe(2);
  });

  it('points every entry at its PDF', () => {
    const schema = buildSadatMapsSchema(zones, `${BASE}/ar/sadat-city-maps`, PDFS) as Record<string, unknown>;
    const list = schema['itemListElement'] as Record<string, unknown>[];
    expect(list[0]['url']).toBe(`${PDFS}/area-21.pdf`);
    expect(list[1]['url']).toBe(`${PDFS}/area-22.pdf`);
  });

  it('assigns sequential positions', () => {
    const schema = buildSadatMapsSchema(zones, `${BASE}/ar/sadat-city-maps`, PDFS) as Record<string, unknown>;
    const list = schema['itemListElement'] as Record<string, unknown>[];
    expect(list[0]['position']).toBe(1);
    expect(list[1]['position']).toBe(2);
  });
});

describe('buildFaqSchema', () => {
  it('returns FAQPage with correct mainEntity length for 3 items', () => {
    const items = [
      { question: 'ما هي أسعار الشقق؟', answer: 'تبدأ من 11,500 جنيه للمتر.' },
      { question: 'هل يوجد تقسيط؟', answer: 'نعم، بدون فوائد حتى 7 سنوات.' },
      { question: 'ما موقع المدينة؟', answer: '90 كم من القاهرة.' },
    ];
    const schema = buildFaqSchema(items) as Record<string, unknown>;
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('FAQPage');
    const mainEntity = schema['mainEntity'] as Record<string, unknown>[];
    expect(mainEntity).toHaveLength(3);
    expect(mainEntity[0]['@type']).toBe('Question');
    expect(mainEntity[0]['name']).toBe('ما هي أسعار الشقق؟');
    const answer = mainEntity[0]['acceptedAnswer'] as Record<string, unknown>;
    expect(answer['@type']).toBe('Answer');
    expect(answer['text']).toBe('تبدأ من 11,500 جنيه للمتر.');
  });

  it('returns FAQPage with empty mainEntity for empty input without throwing', () => {
    const schema = buildFaqSchema([]) as Record<string, unknown>;
    expect(schema['@type']).toBe('FAQPage');
    expect(schema['mainEntity']).toEqual([]);
  });

  it('serializes answers with special characters and quotes correctly', () => {
    const items = [
      { question: 'Are prices "fixed"?', answer: 'Yes — prices include VAT & fees <see brochure>.' },
    ];
    const schema = buildFaqSchema(items) as Record<string, unknown>;
    const mainEntity = schema['mainEntity'] as Record<string, unknown>[];
    const answer = mainEntity[0]['acceptedAnswer'] as Record<string, unknown>;
    expect(answer['text']).toBe('Yes — prices include VAT & fees <see brochure>.');
    // Should be JSON-serializable without throwing
    expect(() => JSON.stringify(schema)).not.toThrow();
  });
});
