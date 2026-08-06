import { describe, it, expect } from 'vitest';
import {
  buildOrganizationSchema,
  buildLocalBusinessSchema,
  buildBreadcrumbSchema,
  buildProjectSchema,
  buildSadatMapsSchema,
  buildFaqSchema,
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

describe('buildLocalBusinessSchema', () => {
  it('returns RealEstateAgent with geo coordinates', () => {
    const schema = buildLocalBusinessSchema() as Record<string, unknown>;
    expect(schema['@type']).toBe('RealEstateAgent');
    const geo = schema['geo'] as Record<string, unknown>;
    expect(geo['@type']).toBe('GeoCoordinates');
    expect(typeof geo['latitude']).toBe('number');
    expect(typeof geo['longitude']).toBe('number');
  });

  it('includes opening hours', () => {
    const schema = buildLocalBusinessSchema() as Record<string, unknown>;
    expect(schema['openingHoursSpecification']).toBeDefined();
  });
});

describe('buildBreadcrumbSchema', () => {
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
    const schema = buildProjectSchema(project, 'مشروع 629', 'وصف المشروع') as Record<string, unknown>;
    expect(schema['@type']).toBe('RealEstateListing');
    expect(schema['url']).toBe(`${BASE}/projects/zone-21/project-629`);
  });

  it('includes hero image with correct domain', () => {
    const schema = buildProjectSchema(project, 'Test', 'Desc') as Record<string, unknown>;
    const images = schema['image'] as string[];
    expect(images[0].startsWith(BASE)).toBe(true);
  });

  it('includes gallery images when provided', () => {
    const withGallery = { ...project, galleryImages: ['assets/images/g1.webp', 'assets/images/g2.webp'] };
    const schema = buildProjectSchema(withGallery, 'Test', 'Desc') as Record<string, unknown>;
    expect((schema['image'] as string[]).length).toBe(3);
  });

  it('includes floorSize when unitTypes provided', () => {
    const withUnits = { ...project, unitTypes: [{ area: '90' }, { area: '120' }] };
    const schema = buildProjectSchema(withUnits, 'Test', 'Desc') as Record<string, unknown>;
    const floors = schema['floorSize'] as unknown[];
    expect(floors).toHaveLength(2);
  });
});

describe('buildSadatMapsSchema', () => {
  const zones = [{ label: 'المنطقة 21' }, { label: 'المنطقة 22' }] as const;

  it('returns ItemList with correct count', () => {
    const schema = buildSadatMapsSchema(zones, `${BASE}/ar/sadat-city-maps`) as Record<string, unknown>;
    expect(schema['@type']).toBe('ItemList');
    expect(schema['numberOfItems']).toBe(2);
  });

  it('assigns sequential positions', () => {
    const schema = buildSadatMapsSchema(zones, `${BASE}/ar/sadat-city-maps`) as Record<string, unknown>;
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
