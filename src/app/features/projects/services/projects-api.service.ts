import { Injectable, inject } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';
import { ApiService, I18nService } from '@core/services';
import { ApiZone, ApiZoneDetail, ApiProject, ApiGalleryImage } from '../models/project-api.models';

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);
  private langParam(): Record<string, string> {
    return { lang: this.i18n.locale() };
  }

  getZones(): Observable<ApiZone[]> {
    return this.api.get<ApiZone[]>('/zones', this.langParam()).pipe(
      map(res => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getZoneBySlug(slug: string): Observable<ApiZoneDetail> {
    return this.api.get<ApiZoneDetail>(`/zones/${slug}`, this.langParam()).pipe(
      map(res => res.data),
    );
  }

  getProjects(params?: { featured?: boolean; zone?: string }): Observable<ApiProject[]> {
    const queryParams: Record<string, string> = this.langParam();
    if (params?.featured) queryParams['featured'] = 'true';
    if (params?.zone) queryParams['zone'] = params.zone;
    return this.api.get<ApiProject[]>('/projects', queryParams).pipe(
      map(res => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getProjectBySlug(slug: string): Observable<ApiProject> {
    return this.api.get<ApiProject>(`/projects/${slug}`, this.langParam()).pipe(
      map(res => res.data),
    );
  }

  getGallery(projectSlug?: string): Observable<ApiGalleryImage[]> {
    const params: Record<string, string> = this.langParam();
    if (projectSlug) params['project'] = projectSlug;
    return this.api.get<ApiGalleryImage[]>('/gallery', params).pipe(
      map(res => res.data),
      catchError(() => of([])),
    );
  }
}
