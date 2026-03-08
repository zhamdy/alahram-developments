import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlatformService } from './platform.service';
import { User, AuthTokens, LoginRequest, LoginResponse, ApiResponse } from '../models';

const TOKEN_KEY = 'ahram-access-token';
const REFRESH_KEY = 'ahram-refresh-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _user = signal<User | null>(null);
  private readonly _isLoading = signal(false);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isLoading = this._isLoading.asReadonly();

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success) {
          this._user.set(response.data.user);
          this.storeTokens(response.data.tokens);
        }
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  logout(): void {
    this._user.set(null);
    this.clearTokens();
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<ApiResponse<AuthTokens> | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }
    return this.http.post<ApiResponse<AuthTokens>>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.success) {
          this.storeTokens(response.data);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  getAccessToken(): string | null {
    if (!this.platform.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    if (!this.platform.isBrowser) return null;
    return localStorage.getItem(REFRESH_KEY);
  }

  private storeTokens(tokens: AuthTokens): void {
    this.platform.runInBrowser(() => {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    });
  }

  private clearTokens(): void {
    this.platform.runInBrowser(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    });
  }
}
