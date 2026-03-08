import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoData {
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
  robots?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly defaultTitle = 'الأهرام للتطوير العقاري | Al-Ahram Developments';

  updateSeo(data: SeoData): void {
    const fullTitle = data.title
      ? `${data.title} | الأهرام للتطوير العقاري`
      : this.defaultTitle;

    this.title.setTitle(fullTitle);

    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
    }

    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    this.meta.updateTag({ property: 'og:title', content: data.ogTitle ?? fullTitle });

    if (data.ogDescription ?? data.description) {
      this.meta.updateTag({
        property: 'og:description',
        content: (data.ogDescription ?? data.description)!,
      });
    }

    if (data.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: data.ogImage });
    }

    if (data.ogUrl) {
      this.meta.updateTag({ property: 'og:url', content: data.ogUrl });
    }

    if (data.robots) {
      this.meta.updateTag({ name: 'robots', content: data.robots });
    }

    this.updateCanonicalUrl(data.canonicalUrl);
  }

  private updateCanonicalUrl(url?: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');

    if (url) {
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    } else if (link) {
      link.remove();
    }
  }

  resetSeo(): void {
    this.title.setTitle(this.defaultTitle);
    this.meta.removeTag('name="description"');
    this.meta.removeTag('name="keywords"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:url"');
  }
}
