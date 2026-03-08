export interface UnitType {
  nameKey: string;
  area: string;
  priceRangeKey: string;
}

export interface Project {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  fullDescriptionKey: string;
  locationKey: string;
  statusKey: string;
  gradientFrom: string;
  gradientTo: string;
  unitTypes: UnitType[];
  amenityKeys: string[];
  galleryGradients: { id: number; from: string; to: string }[];
}
