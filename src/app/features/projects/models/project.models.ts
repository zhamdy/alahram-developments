export interface Zone {
  slug: string;
  nameKey: string;
  descriptionKey: string;
  imageUrl: string;
  projectCount: number;
}

export interface UnitType {
  nameKey: string;
  area: string;
  priceRangeKey: string;
}

export interface Project {
  id: string;
  slug: string;
  zoneSlug: string;
  nameKey: string;
  descriptionKey: string;
  statusDescriptionKey?: string;
  locationKey: string;
  statusKey: string;
  imageUrl: string;
  progress: number;
  lastUpdatedAt: string;
  unitTypes?: UnitType[];
  amenityKeys?: string[];
  galleryImages?: string[];
  mapEmbedUrl?: string;
}
