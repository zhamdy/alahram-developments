import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';

export interface DashboardStats {
  projectCount: number;
  contactCount: number;
  unreadContacts: number;
  subscriberCount: number;
  zoneCount: number;
  galleryCount: number;
}

export interface AdminProject {
  id: number;
  slug: string;
  zoneId: number;
  zoneSlug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  fullDescriptionAr: string;
  fullDescriptionEn: string;
  locationAr: string;
  locationEn: string;
  statusAr: string;
  statusEn: string;
  imageUrl: string;
  progress: number;
  mapEmbedUrl: string;
  isFeatured: number;
  sortOrder: number;
  lastUpdatedAt: string;
  createdAt: string;
  zoneNameAr: string;
  zoneNameEn: string;
  gallery?: AdminGalleryImage[];
}

export interface AdminZone {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
}

export interface AdminGalleryImage {
  id: number;
  projectId: number;
  imageUrl: string;
  captionAr: string;
  captionEn: string;
  sortOrder: number;
  createdAt: string;
  projectNameAr?: string;
  projectNameEn?: string;
  projectSlug?: string;
}

export interface AdminContact {
  id: number;
  name: string;
  phone: string;
  message: string;
  isRead: number;
  submittedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  // Dashboard
  getDashboard(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.base}/dashboard`);
  }

  // Projects
  getProjects(page = 1, limit = 25): Observable<PaginatedResponse<AdminProject>> {
    return this.http.get<PaginatedResponse<AdminProject>>(`${this.base}/projects`, {
      params: { page: page.toString(), limit: limit.toString() },
    });
  }

  getProject(id: number): Observable<ApiResponse<AdminProject>> {
    return this.http.get<ApiResponse<AdminProject>>(`${this.base}/projects/${id}`);
  }

  createProject(data: Partial<AdminProject>): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.base}/projects`, data);
  }

  updateProject(id: number, data: Partial<AdminProject>): Observable<ApiResponse<{ id: number }>> {
    return this.http.put<ApiResponse<{ id: number }>>(`${this.base}/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/projects/${id}`);
  }

  uploadProjectImage(id: number, file: File): Observable<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ApiResponse<{ imageUrl: string }>>(`${this.base}/projects/${id}/image`, formData);
  }

  // Zones
  getZones(): Observable<ApiResponse<AdminZone[]>> {
    return this.http.get<ApiResponse<AdminZone[]>>(`${this.base}/zones`);
  }

  // Gallery
  getGallery(projectId?: number): Observable<ApiResponse<AdminGalleryImage[]>> {
    const params: Record<string, string> = {};
    if (projectId) params['projectId'] = projectId.toString();
    return this.http.get<ApiResponse<AdminGalleryImage[]>>(`${this.base}/gallery`, { params });
  }

  uploadGalleryImage(file: File, projectId: number, captionAr?: string, captionEn?: string): Observable<ApiResponse<{ id: number; imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('projectId', projectId.toString());
    if (captionAr) formData.append('captionAr', captionAr);
    if (captionEn) formData.append('captionEn', captionEn);
    return this.http.post<ApiResponse<{ id: number; imageUrl: string }>>(`${this.base}/gallery`, formData);
  }

  updateGalleryImage(id: number, data: { captionAr?: string; captionEn?: string; sortOrder?: number }): Observable<ApiResponse<{ id: number }>> {
    return this.http.put<ApiResponse<{ id: number }>>(`${this.base}/gallery/${id}`, data);
  }

  deleteGalleryImage(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/gallery/${id}`);
  }

  // Contacts
  getContacts(page = 1, limit = 25): Observable<PaginatedResponse<AdminContact>> {
    return this.http.get<PaginatedResponse<AdminContact>>(`${this.base}/contacts`, {
      params: { page: page.toString(), limit: limit.toString() },
    });
  }

  markContactRead(id: number): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.base}/contacts/${id}/read`, {});
  }

  deleteContact(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/contacts/${id}`);
  }
}
