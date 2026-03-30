/** API response models — already-localized text (no translation keys) */

export interface ApiZone {
  id: number;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  projectCount: number;
}

export interface ApiProject {
  id: number;
  slug: string;
  zoneId: number;
  zoneSlug: string;
  name: string;
  description: string;
  statusDescription?: string;
  location: string;
  status: string;
  zoneName?: string;
  imageUrl: string;
  progress: number;
  mapEmbedUrl?: string;
  isFeatured: number;
  lastUpdatedAt: string;
  gallery?: ApiGalleryImage[];
}

export interface ApiGalleryImage {
  id: number;
  imageUrl: string;
  caption: string;
  sortOrder: number;
  mediaType?: 'image' | 'video';
  projectSlug?: string;
  projectName?: string;
}

export interface ApiZoneDetail extends ApiZone {
  projects: ApiProject[];
}
