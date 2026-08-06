import { Injectable, inject } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';
import { ApiService, I18nService } from '@core/services';
import { ApiUnit, UnitFilters } from '../models/unit-api.models';

@Injectable({ providedIn: 'root' })
export class UnitsApiService {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);
  private langParam(): Record<string, string> {
    return { lang: this.i18n.locale() };
  }

  getUnits(filters?: UnitFilters): Observable<ApiUnit[]> {
    const params: Record<string, string> = this.langParam();
    if (filters?.project) params['project'] = filters.project;
    if (filters?.zone) params['zone'] = filters.zone;
    if (filters?.minPrice) params['minPrice'] = String(filters.minPrice);
    if (filters?.maxPrice) params['maxPrice'] = String(filters.maxPrice);
    if (filters?.minArea) params['minArea'] = String(filters.minArea);
    if (filters?.maxArea) params['maxArea'] = String(filters.maxArea);
    if (filters?.minRooms) params['minRooms'] = String(filters.minRooms);
    if (filters?.status) params['status'] = filters.status;

    return this.api.get<ApiUnit[]>('/units', params).pipe(
      map(res => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getUnitById(id: number): Observable<ApiUnit> {
    return this.api.get<ApiUnit>(`/units/${id}`, this.langParam()).pipe(
      map(res => res.data),
    );
  }
}
