import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError, HttpErrorContext } from '../../types/error';
import { AuthService } from '../services/auth-service';
import { ErrorHandlingService } from '../services/error-handling.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const errorHandlingService = inject(ErrorHandlingService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Create error context for better tracking
      const errorContext: HttpErrorContext = {
        url: req.url,
        method: req.method,
        statusCode: error.status,
        statusText: error.statusText,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        userId: authService.user()?.id?.toString(),
      };

      // Log error for debugging
      console.group('🚨 HTTP Error Intercepted');
      console.error('Error Context:', errorContext);
      console.error('Full Error:', error);
      console.groupEnd();

      // Check if request has custom error handling options
      const skipGlobalHandler =
        req.headers.get('X-Skip-Error-Handler') === 'true';

      if (!skipGlobalHandler) {
        // Handle different types of errors
        switch (error.status) {
          case 401:
            handleUnauthorizedError(authService, router, errorContext);
            break;
          case 403:
            handleForbiddenError(router, errorContext);
            break;
          case 404:
            handleNotFoundError(errorContext);
            break;
          case 429:
            handleRateLimitError(errorContext);
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            handleServerError(errorContext);
            break;
          case 0:
            handleNetworkError(errorContext);
            break;
          default:
            handleGenericError(error, errorContext);
        }

        // Use error handling service for centralized error management
        errorHandlingService.handleError(error, errorContext);
      }

      // Transform error to consistent format
      const apiError: ApiError = {
        message: getErrorMessage(error),
        statusCode: error.status,
        error: error.statusText,
        details: error.error,
        timestamp: new Date().toISOString(),
      };

      return throwError(() => apiError);
    })
  );
};

// Helper functions for specific error types
function handleUnauthorizedError(
  authService: AuthService,
  router: Router,
  context: HttpErrorContext
): void {
  console.warn('🔐 Unauthorized access - redirecting to login');

  // Clear auth data
  authService.logout();

  // Redirect to login with return URL
  const returnUrl = router.url !== '/login' ? router.url : '/';
  router.navigate(['/login'], {
    queryParams: { returnUrl },
    replaceUrl: true,
  });
}

function handleForbiddenError(router: Router, context: HttpErrorContext): void {
  console.warn('🚫 Access forbidden');
  // Could redirect to an access denied page or show a modal
  // For now, we'll stay on the current page and let the service handle the notification
}

function handleNotFoundError(context: HttpErrorContext): void {
  console.warn('🔍 Resource not found:', context.url);
  // Could implement retry logic or alternative resource loading
}

function handleRateLimitError(context: HttpErrorContext): void {
  console.warn('⏳ Rate limit exceeded');
  // Could implement exponential backoff retry logic
}

function handleServerError(context: HttpErrorContext): void {
  console.error('🔥 Server error:', context.statusCode);
  // Could implement retry logic or offline mode
}

function handleNetworkError(context: HttpErrorContext): void {
  console.error('🌐 Network error - possible offline state');
  // Could implement offline mode or retry logic
}

function handleGenericError(
  error: HttpErrorResponse,
  context: HttpErrorContext
): void {
  console.error('❌ Generic HTTP error:', context.statusCode);
}

// Extract meaningful error message from different error formats
function getErrorMessage(error: HttpErrorResponse): string {
  // Handle different API response formats
  if (error.error) {
    // Check for standard API response format
    if (typeof error.error === 'object') {
      return (
        error.error.errorMessage ||
        error.error.message ||
        error.error.title ||
        error.statusText ||
        'An unexpected error occurred'
      );
    }

    // Handle string error messages
    if (typeof error.error === 'string') {
      return error.error;
    }
  }

  // Fallback to status-based messages
  switch (error.status) {
    case 0:
      return 'Unable to connect to the server. Please check your internet connection.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return error.statusText || 'An unexpected error occurred';
  }
}
