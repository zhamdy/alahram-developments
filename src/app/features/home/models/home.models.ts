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

import { LucideIconData } from '@lucide/angular';

export interface ValuePillar {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIconData;
}
