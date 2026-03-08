# API Patterns Guide

This guide covers the API communication layer for the Al-Ahram Developments project: the base `ApiService`, the HTTP interceptor chain, response models, error handling, retry patterns, and how to add new API endpoints.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Response Models](#response-models)
3. [The ApiService](#the-apiservice)
4. [Interceptor Chain](#interceptor-chain)
5. [Error Handling](#error-handling)
6. [Retry Patterns](#retry-patterns)
7. [Adding a New API Endpoint](#adding-a-new-api-endpoint)
8. [SSR and Transfer State](#ssr-and-transfer-state)
9. [Pagination Pattern](#pagination-pattern)
10. [File Upload Pattern](#file-upload-pattern)

---

## Architecture Overview

```
Component / Store
       |
       v
  Feature Service (e.g., ProjectService)
       |
       v
  ApiService (base HTTP wrapper)
       |
       v
  HttpClient
       |
       v
  Interceptor Chain:  auth -> error -> loading
       |
       v
  HTTP Request / Response
```

All API communication flows through this stack. Feature services call `ApiService` methods, which delegate to Angular's `HttpClient`. The interceptor chain handles cross-cutting concerns (authentication, error normalization, loading state) transparently.

---

## Response Models

All API responses follow a consistent structure defined in `src/app/core/models/api-response.model.ts`:

### ApiResponse<T> -- Single Resource

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

Used for: single object responses (get by ID, create, update, delete).

Example server response:
```json
{
  "success": true,
  "data": {
    "id": "proj-001",
    "name": "Al-Ahram Heights",
    "status": "in-progress"
  },
  "message": "Project retrieved successfully"
}
```

### PaginatedResponse<T> -- Collection with Pagination

```typescript
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

Used for: list endpoints with pagination.

Example server response:
```json
{
  "success": true,
  "data": [
    { "id": "proj-001", "name": "Al-Ahram Heights" },
    { "id": "proj-002", "name": "Nile View Residences" }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 12,
    "totalPages": 4
  }
}
```

### ApiError -- Error Response

```typescript
export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
}
```

Used for: error responses from the server.

Example:
```json
{
  "success": false,
  "error": "Project not found",
  "statusCode": 404
}
```

---

## The ApiService

The `ApiService` is a generic HTTP wrapper that provides typed methods for all HTTP verbs:

```typescript
// src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  getPaginated<T>(path: string, params?: Record<string, string | number | boolean>): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`);
  }
}
```

### Key Design Decisions

- **`providedIn: 'root'`**: Singleton, available everywhere.
- **`baseUrl` from environment**: All requests are relative to the API URL configured per environment.
- **Generic type parameter `<T>`**: The response data type is specified at the call site for type safety.
- **`params` as a flat Record**: Simple key-value pairs are converted to `HttpParams`. This avoids the caller needing to construct `HttpParams` manually.
- **Separate `get` and `getPaginated`**: Different return types (`ApiResponse<T>` vs `PaginatedResponse<T>`) for clarity.

### Usage Examples

```typescript
// GET a single resource
this.api.get<Project>('/projects/proj-001');
// Returns Observable<ApiResponse<Project>>

// GET a paginated list
this.api.getPaginated<Project>('/projects', { page: 1, limit: 12, status: 'in-progress' });
// Returns Observable<PaginatedResponse<Project>>

// POST (create)
this.api.post<Project>('/projects', { name: 'New Project', location: 'Cairo' });
// Returns Observable<ApiResponse<Project>>

// PUT (full update)
this.api.put<Project>('/projects/proj-001', { name: 'Updated Name', location: 'Giza' });
// Returns Observable<ApiResponse<Project>>

// PATCH (partial update)
this.api.patch<Project>('/projects/proj-001', { status: 'completed' });
// Returns Observable<ApiResponse<Project>>

// DELETE
this.api.delete<void>('/projects/proj-001');
// Returns Observable<ApiResponse<void>>
```

---

## Interceptor Chain

Interceptors are registered in `app.config.ts` in order:

```typescript
provideHttpClient(
  withFetch(),
  withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
)
```

The execution order for **requests** is left-to-right: `auth -> error -> loading`.
The execution order for **responses** is right-to-left: `loading -> error -> auth`.

### 1. Auth Interceptor

**File**: `src/app/core/interceptors/auth.interceptor.ts`

**Purpose**: Attaches the JWT access token to outgoing requests and handles 401 responses with automatic token refresh.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  // Attach Bearer token if available
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // On 401 (not from the refresh endpoint itself), attempt token refresh
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return auth.refreshToken().pipe(
          switchMap(response => {
            if (response?.success) {
              // Retry the original request with the new token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${response.data.accessToken}` },
              });
              return next(retryReq);
            }
            auth.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

**Behavior**:
1. Reads the access token from `AuthService`.
2. If a token exists, clones the request with an `Authorization: Bearer <token>` header.
3. On a 401 response, calls `AuthService.refreshToken()` to get a new access token.
4. Retries the failed request with the new token.
5. If refresh fails, logs the user out and propagates the error.
6. Skips refresh logic for the `/auth/refresh` endpoint itself (to avoid infinite loops).

### 2. Error Interceptor

**File**: `src/app/core/interceptors/error.interceptor.ts`

**Purpose**: Normalizes HTTP errors into a consistent format with Arabic default messages.

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'حدث خطأ غير متوقع';  // "An unexpected error occurred"

      if (error.error instanceof ErrorEvent) {
        // Client-side error (network, etc.)
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'لا يمكن الاتصال بالخادم';  // "Cannot connect to server"
            break;
          case 400:
            errorMessage = error.error?.error ?? 'طلب غير صالح';  // "Invalid request"
            break;
          case 403:
            errorMessage = 'غير مصرح لك بالوصول';  // "Not authorized"
            break;
          case 404:
            errorMessage = 'المورد غير موجود';  // "Resource not found"
            break;
          case 500:
            errorMessage = 'خطأ في الخادم الداخلي';  // "Internal server error"
            break;
        }
      }

      console.error(`[API Error] ${req.method} ${req.url}:`, errorMessage);

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error,
      }));
    })
  );
};
```

**Behavior**:
1. Catches all HTTP errors.
2. Maps status codes to Arabic error messages.
3. For 400 errors, uses the server-provided message if available.
4. Logs the error to the console.
5. Re-throws a normalized error object with `status`, `message`, and `originalError`.

### 3. Loading Interceptor

**File**: `src/app/core/interceptors/loading.interceptor.ts`

**Purpose**: Tracks active HTTP requests and updates the global loading state.

```typescript
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  loading.start();

  return next(req).pipe(
    finalize(() => loading.stop())
  );
};
```

**Behavior**:
1. Increments the active request counter when a request starts.
2. Decrements the counter when the request completes (success or error).
3. `LoadingService.isLoading` signal becomes `true` when any requests are active.

### LoadingService

```typescript
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _activeRequests = signal(0);

  readonly isLoading = computed(() => this._activeRequests() > 0);

  start(): void {
    this._activeRequests.update(count => count + 1);
  }

  stop(): void {
    this._activeRequests.update(count => Math.max(0, count - 1));
  }
}
```

Usage in a component:

```typescript
@Component({
  template: `
    @if (loading.isLoading()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
        <ahram-loading-spinner size="lg" />
      </div>
    }
  `,
})
export class AppComponent {
  readonly loading = inject(LoadingService);
}
```

---

## Error Handling

### In Feature Services

Feature services should not catch errors unless they need to transform them. Let errors propagate to the component or store:

```typescript
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = inject(ApiService);

  // Let errors propagate -- the store or component handles them
  getProject(id: string): Observable<ApiResponse<Project>> {
    return this.api.get<Project>(`/projects/${id}`);
  }

  getProjects(params: ProjectListParams): Observable<PaginatedResponse<Project>> {
    return this.api.getPaginated<Project>('/projects', params as Record<string, string | number | boolean>);
  }

  createProject(data: CreateProjectDto): Observable<ApiResponse<Project>> {
    return this.api.post<Project>('/projects', data);
  }
}
```

### In Components (Direct Subscription)

```typescript
@Component({
  template: `
    @if (isLoading()) {
      <ahram-loading-spinner />
    } @else if (error()) {
      <div class="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p class="text-sm text-destructive">{{ error() }}</p>
        <ahram-button variant="outline" size="sm" (clicked)="load()">
          {{ 'common.retry' | transloco }}
        </ahram-button>
      </div>
    } @else {
      <!-- render data -->
    }
  `,
})
export class ProjectDetailComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);

  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.params['id'];
    this.isLoading.set(true);
    this.error.set(null);

    this.projectService.getProject(id).subscribe({
      next: response => {
        this.project.set(response.data);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }
}
```

### In Signal Stores (rxMethod)

```typescript
withMethods((store, api = inject(ApiService)) => ({
  loadProject: rxMethod<string>(
    pipe(
      tap(() => patchState(store, { isLoading: true, error: null })),
      switchMap(id =>
        api.get<Project>(`/projects/${id}`).pipe(
          tapResponse({
            next: response => {
              patchState(store, {
                project: response.data,
                isLoading: false,
              });
            },
            error: (err: { message: string }) => {
              patchState(store, {
                error: err.message,
                isLoading: false,
              });
            },
          })
        )
      )
    )
  ),
}))
```

### Normalized Error Shape

After passing through the error interceptor, all errors have this shape:

```typescript
interface NormalizedError {
  status: number;       // HTTP status code (0 for network errors)
  message: string;      // Arabic error message
  originalError: HttpErrorResponse;  // Original Angular error
}
```

---

## Retry Patterns

### Manual Retry (User-Initiated)

The simplest pattern -- a "Retry" button that re-triggers the API call:

```typescript
@Component({
  template: `
    @if (error()) {
      <ahram-button variant="outline" (clicked)="loadData()">
        {{ 'common.retry' | transloco }}
      </ahram-button>
    }
  `,
})
export class SomeComponent {
  loadData(): void {
    this.error.set(null);
    this.service.getData().subscribe({
      next: response => { /* handle */ },
      error: err => this.error.set(err.message),
    });
  }
}
```

### Automatic Retry with RxJS

For transient failures (network issues, 5xx errors), use RxJS `retry`:

```typescript
import { retry, timer } from 'rxjs';

getProjectWithRetry(id: string): Observable<ApiResponse<Project>> {
  return this.api.get<Project>(`/projects/${id}`).pipe(
    retry({
      count: 3,
      delay: (error, retryCount) => {
        // Only retry on network errors or server errors
        if (error.status === 0 || error.status >= 500) {
          // Exponential backoff: 1s, 2s, 4s
          return timer(Math.pow(2, retryCount - 1) * 1000);
        }
        // Don't retry client errors (4xx)
        throw error;
      },
    })
  );
}
```

### Retry in Signal Store

```typescript
loadProjects: rxMethod<void>(
  pipe(
    tap(() => patchState(store, { isLoading: true, error: null })),
    switchMap(() =>
      api.getPaginated<Project>('/projects').pipe(
        retry({
          count: 2,
          delay: (error, retryCount) => {
            if (error.status >= 500) {
              return timer(retryCount * 1000);
            }
            throw error;
          },
        }),
        tapResponse({
          next: response => patchState(store, {
            projects: response.data,
            isLoading: false,
          }),
          error: (err: { message: string }) => patchState(store, {
            error: err.message,
            isLoading: false,
          }),
        })
      )
    )
  )
),
```

---

## Adding a New API Endpoint

Step-by-step guide to adding a new feature endpoint (e.g., "Contact Inquiries").

### Step 1: Define the Model

```typescript
// src/app/features/contact/models/inquiry.model.ts
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectId?: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
}

export interface CreateInquiryDto {
  name: string;
  email: string;
  phone: string;
  projectId?: string;
  message: string;
}
```

### Step 2: Create the Feature Service

```typescript
// src/app/features/contact/services/inquiry.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ApiResponse, PaginatedResponse } from '@core/models';
import { Inquiry, CreateInquiryDto } from '../models/inquiry.model';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  private readonly api = inject(ApiService);

  getInquiries(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<PaginatedResponse<Inquiry>> {
    return this.api.getPaginated<Inquiry>('/inquiries', params as Record<string, string | number | boolean>);
  }

  getInquiry(id: string): Observable<ApiResponse<Inquiry>> {
    return this.api.get<Inquiry>(`/inquiries/${id}`);
  }

  createInquiry(data: CreateInquiryDto): Observable<ApiResponse<Inquiry>> {
    return this.api.post<Inquiry>('/inquiries', data);
  }

  updateInquiryStatus(id: string, status: Inquiry['status']): Observable<ApiResponse<Inquiry>> {
    return this.api.patch<Inquiry>(`/inquiries/${id}`, { status });
  }

  deleteInquiry(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/inquiries/${id}`);
  }
}
```

### Step 3: Create the Feature Store (Optional)

```typescript
// src/app/features/contact/state/inquiries.store.ts
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { InquiryService } from '../services/inquiry.service';
import { Inquiry, CreateInquiryDto } from '../models/inquiry.model';

interface InquiriesState {
  inquiries: Inquiry[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: InquiriesState = {
  inquiries: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0 },
};

export const InquiriesStore = signalStore(
  withState(initialState),
  withComputed(store => ({
    totalPages: computed(() =>
      Math.ceil(store.pagination().total / store.pagination().limit)
    ),
    hasInquiries: computed(() => store.inquiries().length > 0),
  })),
  withMethods((store, service = inject(InquiryService)) => ({
    loadInquiries: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          const { page, limit } = store.pagination();
          return service.getInquiries({ page, limit }).pipe(
            tapResponse({
              next: response => {
                patchState(store, {
                  inquiries: response.data,
                  pagination: { ...store.pagination(), total: response.meta.total },
                  isLoading: false,
                });
              },
              error: (err: { message: string }) => {
                patchState(store, { error: err.message, isLoading: false });
              },
            })
          );
        })
      )
    ),
    setPage(page: number): void {
      patchState(store, state => ({
        pagination: { ...state.pagination, page },
      }));
    },
  })),
  withHooks({
    onInit(store) {
      store.loadInquiries();
    },
  })
);
```

### Step 4: Use in a Component

```typescript
// src/app/features/contact/pages/inquiry-list/inquiry-list.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { CardComponent, ButtonComponent, LoadingSpinnerComponent } from '@shared/ui';
import { TranslateNumberPipe, RelativeTimePipe } from '@shared/pipes';
import { InquiriesStore } from '../../state/inquiries.store';

@Component({
  selector: 'ahram-inquiry-list',
  standalone: true,
  imports: [TranslocoDirective, CardComponent, ButtonComponent, LoadingSpinnerComponent, TranslateNumberPipe, RelativeTimePipe],
  providers: [InquiriesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section *transloco="let t" class="container px-4 py-8">
      <h1 class="mb-6 text-3xl font-bold font-display">{{ t('inquiries.title') }}</h1>

      @if (store.isLoading()) {
        <ahram-loading-spinner />
      } @else if (store.error()) {
        <div class="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p class="text-sm text-destructive">{{ store.error() }}</p>
          <ahram-button variant="outline" size="sm" (clicked)="store.loadInquiries()">
            {{ t('common.retry') }}
          </ahram-button>
        </div>
      } @else {
        @for (inquiry of store.inquiries(); track inquiry.id) {
          <ahram-card [title]="inquiry.name" class="mb-4">
            <p class="text-sm text-muted-foreground">{{ inquiry.message }}</p>
            <span class="text-xs text-muted-foreground">{{ inquiry.createdAt | relativeTime }}</span>
          </ahram-card>
        } @empty {
          <p class="text-muted-foreground">{{ t('common.noResults') }}</p>
        }
      }
    </section>
  `,
})
export class InquiryListComponent {
  readonly store = inject(InquiriesStore);
}
```

### Step 5: Add the Route

```typescript
// src/app/features/contact/contact.routes.ts
import { Routes } from '@angular/router';

export const CONTACT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inquiry-list/inquiry-list.component')
      .then(m => m.InquiryListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/inquiry-detail/inquiry-detail.component')
      .then(m => m.InquiryDetailComponent),
  },
];
```

Register in the app routes:

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: 'contact',
    loadChildren: () => import('./features/contact/contact.routes').then(m => m.CONTACT_ROUTES),
  },
  // ...other routes
];
```

### Step 6: Add Translation Keys

Add to both `ar.json` and `en.json`:

```json
{
  "inquiries": {
    "title": "استفسارات العملاء",
    "detail": "تفاصيل الاستفسار",
    "status": {
      "new": "جديد",
      "contacted": "تم التواصل",
      "closed": "مغلق"
    }
  }
}
```

---

## SSR and Transfer State

### Automatic Caching

Because `ApiService` uses `HttpClient`, all GET and POST requests made during server-side rendering are automatically captured by Angular's HTTP Transfer State (configured via `withHttpTransferCacheOptions({ includePostRequests: true })`).

This means:
1. The server fetches data from the API.
2. The response is serialized into the HTML as JSON.
3. On the client, the same request returns instantly from the cache.
4. No duplicate API calls are made.

### Excluding Requests from Transfer State

For requests that should always be fresh on the client:

```typescript
import { HttpContext } from '@angular/common/http';

// In ApiService or a feature service
getAnalytics(): Observable<ApiResponse<Analytics>> {
  return this.http.get<ApiResponse<Analytics>>(`${this.baseUrl}/analytics`, {
    context: new HttpContext().set(/* transfer cache token */, false),
  });
}
```

---

## Pagination Pattern

### Standard Pagination Flow

```typescript
// In a feature store
withState({
  items: [] as Item[],
  pagination: { page: 1, limit: 20, total: 0 },
}),
withComputed(store => ({
  totalPages: computed(() =>
    Math.ceil(store.pagination().total / store.pagination().limit)
  ),
  hasPreviousPage: computed(() => store.pagination().page > 1),
  hasNextPage: computed(() => store.pagination().page < Math.ceil(store.pagination().total / store.pagination().limit)),
})),
withMethods(store => ({
  nextPage(): void {
    if (store.pagination().page < store.totalPages()) {
      patchState(store, state => ({
        pagination: { ...state.pagination, page: state.pagination.page + 1 },
      }));
      store.loadItems();
    }
  },
  previousPage(): void {
    if (store.pagination().page > 1) {
      patchState(store, state => ({
        pagination: { ...state.pagination, page: state.pagination.page - 1 },
      }));
      store.loadItems();
    }
  },
  goToPage(page: number): void {
    patchState(store, state => ({
      pagination: { ...state.pagination, page },
    }));
    store.loadItems();
  },
}))
```

### Pagination Template

```html
<div class="flex items-center justify-between">
  <p class="text-sm text-muted-foreground">
    {{ t('common.page') }} {{ store.pagination().page | translateNumber }}
    {{ t('common.of') }} {{ store.totalPages() | translateNumber }}
  </p>
  <div class="flex gap-2">
    <ahram-button
      variant="outline"
      size="sm"
      [disabled]="!store.hasPreviousPage()"
      (clicked)="store.previousPage()"
    >
      {{ t('common.previous') }}
    </ahram-button>
    <ahram-button
      variant="outline"
      size="sm"
      [disabled]="!store.hasNextPage()"
      (clicked)="store.nextPage()"
    >
      {{ t('common.next') }}
    </ahram-button>
  </div>
</div>
```

---

## File Upload Pattern

For file uploads (images, documents), use `HttpClient` directly with `FormData`:

```typescript
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  uploadImage(file: File, folder: string = 'projects'): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return this.http.post<ApiResponse<{ url: string }>>(
      `${this.baseUrl}/uploads/image`,
      formData,
      {
        // Do not set Content-Type -- the browser sets it with the boundary
      }
    );
  }

  uploadDocument(file: File): Observable<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('document', file);

    return this.http.post<ApiResponse<{ url: string; filename: string }>>(
      `${this.baseUrl}/uploads/document`,
      formData
    );
  }
}
```

Note: File uploads bypass the `ApiService` because `FormData` bodies require different handling than JSON. The interceptor chain (auth, error, loading) still applies since the requests go through `HttpClient`.
