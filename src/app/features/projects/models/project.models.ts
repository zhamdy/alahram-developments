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
  imageUrl: string;
  unitTypes: UnitType[];
  amenityKeys: string[];
  galleryImages: string[];
}
