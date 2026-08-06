import { LucideIconData } from '@lucide/angular';

export interface FeaturedProject {
  id: string;
  nameKey: string;
  descriptionKey: string;
  locationKey: string;
  statusKey: string;
  imageUrl: string;
  link: string;
}

export interface Testimonial {
  id: string;
  nameAr: string;
  nameEn: string;
  quoteAr: string;
  quoteEn: string;
}

export interface ValuePillar {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIconData;
}

export interface BrandStoryHighlight {
  valueKey: string;
  labelKey: string;
}

export interface MosaicTile {
  id: string;
  imageUrl: string;
  nameKey: string;
  link: string;
  tileSize: 'sm' | 'md' | 'lg';
}

export interface LifestyleAmenity {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIconData;
}
