import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { buildRedirects, MANIFEST_PATH, OUT_PATH } = require('./generate-redirects.js');

interface Manifest {
  zones: string[];
  projects: { slug: string; zoneSlug: string }[];
}

const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

function ruleLines(output: string): string[] {
  return output
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function parse(line: string) {
  const [source, destination, status] = line.split(/\s+/);
  return { source, destination, status };
}

const output = buildRedirects(manifest);
const rules = ruleLines(output).map(parse);

describe('buildRedirects', () => {
  it('emits a trailing-slash rewrite to the prerendered file for every zone in both locales', () => {
    for (const locale of ['ar', 'en']) {
      for (const zone of manifest.zones) {
        const source = `/${locale}/projects/${zone}/`;
        expect(rules).toContainEqual({
          source,
          destination: `${source}index.html`,
          status: '200',
        });
      }
    }
  });

  it('emits a trailing-slash rewrite to the prerendered file for every project in both locales', () => {
    for (const locale of ['ar', 'en']) {
      for (const project of manifest.projects) {
        const source = `/${locale}/projects/${project.zoneSlug}/${project.slug}/`;
        expect(rules).toContainEqual({
          source,
          destination: `${source}index.html`,
          status: '200',
        });
      }
    }
  });

  // The production bug this generator exists to prevent: Cloudflare follows a
  // matching redirect even when a static asset exists, so any wildcard over
  // /projects serves the client shell instead of the prerendered page.
  it('never emits a placeholder or splat rule that could shadow a prerendered project page', () => {
    const shadowing = rules.filter(
      r =>
        /^\/(ar|en)\/projects\//.test(r.source) &&
        (r.source.includes(':') || r.source.includes('*')),
    );
    expect(shadowing).toEqual([]);
  });

  it('does not emit slash-less forms, leaving one canonical 200 URL per page', () => {
    const slashless = rules.filter(
      r => r.status === '200' && r.source.includes('/projects/') && !r.source.endsWith('/'),
    );
    expect(slashless).toEqual([]);
  });

  it('preserves the legacy, removed-feature and admin rules across regeneration', () => {
    const sources = rules.map(r => r.source);
    expect(sources).toContain('/');
    expect(sources).toContain('/faq');
    expect(sources).toContain('/ar/units/');
    expect(sources).toContain('/admin/*');
  });

  it('stays within Cloudflare limits of 2000 static and 100 dynamic rules', () => {
    const dynamic = rules.filter(r => r.source.includes(':') || r.source.includes('*'));
    expect(rules.length - dynamic.length).toBeLessThanOrEqual(2000);
    expect(dynamic.length).toBeLessThanOrEqual(100);
  });

  it('matches the committed public/_redirects so the deployed file cannot drift', () => {
    expect(readFileSync(OUT_PATH, 'utf8')).toBe(output);
  });
});
