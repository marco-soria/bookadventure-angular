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
  isAdmin = computed(() => this.authState().user?.role === 'admin');

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
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
          this.setAuthData(
            response.token,
            response.user,
            response.refreshToken
          );
          this.updateAuthState({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null,
          });
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
      .post<RegisterResponse>(`${environment.baseUrl}auth/register`, userData)
      .pipe(
        tap((response) => {
          this.setAuthData(
            response.token,
            response.user,
            response.refreshToken
          );
          this.updateAuthState({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null,
          });
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

    return this.http
      .post<LoginResponse>(`${environment.baseUrl}auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          this.setAuthData(
            response.token,
            response.user,
            response.refreshToken
          );
          this.updateAuthState({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null,
          });
        }),
        catchError((error) => this.handleError(error))
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.baseUrl}auth/me`).pipe(
      tap((user) => {
        this.updateAuthState({
          ...this.authState(),
          user,
        });
        localStorage.setItem('user', JSON.stringify(user));
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

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        // Handle validation errors
        const validationErrors = Object.values(error.error.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

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
