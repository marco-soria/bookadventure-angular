import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import {
  ApiError,
  AuthState,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../../types/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals para estado reactivo
  private authState = signal<AuthState>({
    user: null,
    token: null,
    isLoading: false,
    error: null,
  });

  // Public computed signals
  user = computed(() => this.authState().user);
  token = computed(() => this.authState().token);
  isAuthenticated = computed(
    () => !!this.authState().token && !!this.authState().user
  );
  isLoading = computed(() => this.authState().isLoading);
  error = computed(() => this.authState().error);
  isAdmin = computed(
    () => this.authState().user?.roles?.includes('admin') || false
  );

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    const refreshToken = localStorage.getItem('refreshToken');

    if (token && userStr && refreshToken) {
      try {
        const user = JSON.parse(userStr) as User;
        this.updateAuthState({
          user,
          token,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        this.clearAuthData();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.updateAuthState({
      ...this.authState(),
      isLoading: true,
      error: null,
    });

    return this.http
      .post<LoginResponse>(`${environment.baseUrl}users/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            const user: User = {
              id: response.data.id,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              email: response.data.email,
              roles: response.data.roles,
            };
            this.setAuthData(
              response.data.token,
              user,
              response.data.refreshToken
            );
            this.updateAuthState({
              user,
              token: response.data.token,
              isLoading: false,
              error: null,
            });
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    this.updateAuthState({
      ...this.authState(),
      isLoading: true,
      error: null,
    });

    return this.http
      .post<RegisterResponse>(`${environment.baseUrl}users/register`, userData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // For register, we don't get a token back, so we clear auth state
            // User will need to login after registration
            this.updateAuthState({
              user: null,
              token: null,
              isLoading: false,
              error: null,
            });
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  logout(): void {
    this.clearAuthData();
    this.updateAuthState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    this.router.navigate(['/']);
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http
      .post<LoginResponse>(`${environment.baseUrl}users/refresh-token`, request)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            const user: User = {
              id: response.data.id,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              email: response.data.email,
              roles: response.data.roles,
            };
            this.setAuthData(
              response.data.token,
              user,
              response.data.refreshToken
            );
            this.updateAuthState({
              user,
              token: response.data.token,
              isLoading: false,
              error: null,
            });
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<any>(`${environment.baseUrl}users/profile`).pipe(
      tap((response) => {
        if (response.success && response.data) {
          const user: User = {
            id: response.data.id,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            email: response.data.email,
            roles: response.data.roles || [],
          };
          this.updateAuthState({
            ...this.authState(),
            user,
          });
          localStorage.setItem('user', JSON.stringify(user));
        }
      }),
      catchError((error) => this.handleError(error))
    );
  }

  clearError(): void {
    this.updateAuthState({
      ...this.authState(),
      error: null,
    });
  }

  private setAuthData(token: string, user: User, refreshToken: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  }

  private updateAuthState(newState: AuthState): void {
    this.authState.set(newState);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      // Error de red o backend no disponible
      errorMessage =
        'Cannot connect to server. Please ensure the backend is running on localhost:7260';
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.errorMessage) {
        errorMessage = error.error.errorMessage;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        // Handle validation errors
        const validationErrors = Object.values(error.error.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
    });

    this.updateAuthState({
      ...this.authState(),
      isLoading: false,
      error: errorMessage,
    });

    return throwError(
      () =>
        ({
          message: errorMessage,
          statusCode: error.status,
          errors: error.error?.errors,
        } as ApiError)
    );
  }
}
