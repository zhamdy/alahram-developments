/** API response models — already-localized text (no translation keys) */

export type UnitStatus = 'available' | 'reserved' | 'sold';

export interface ApiUnit {
  id: number;
  projectId: number;
  projectSlug: string;
  projectName: string;
  zoneSlug: string;
  unitCode: string;
  unitType: string;
  area: number;
  rooms: number;
  bathrooms: number;
  floor: number | null;
  price: number;
  status: UnitStatus;
  deliveryYear: number | null;
  unitImageUrl: string;
}

export interface UnitFilters {
  project?: string;
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minRooms?: number;
  status?: UnitStatus;
}
