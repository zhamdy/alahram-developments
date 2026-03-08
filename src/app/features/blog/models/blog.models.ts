export interface BlogPost {
  readonly id: string;
  readonly slug: string;
  readonly titleKey: string;
  readonly excerptKey: string;
  readonly contentKeys: readonly string[];
  readonly author: string;
  readonly date: string;
  readonly imageUrl: string;
  readonly category: BlogCategory;
  readonly tags: readonly string[];
}

export type BlogCategory = 'company-news' | 'market-insights' | 'investment-tips';
