import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ApiError,
  ErrorNotificationConfig,
  HttpErrorContext,
} from '../../types/error';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlingService {
  // Subject to emit errors for components that want to listen
  private errorSubject = new BehaviorSubject<ApiError | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Track error history for debugging
  private errorHistory: (ApiError & { context?: HttpErrorContext })[] = [];
  private readonly MAX_ERROR_HISTORY = 50;

  // Default notification configuration
  private defaultNotificationConfig: ErrorNotificationConfig = {
    showToast: true,
    duration: 5000,
    position: 'top',
    type: 'error',
  };

  // Track retry attempts for failed requests
  private retryAttempts = new Map<string, number>();

  constructor() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
      this.logError({
        message: 'Unhandled Promise Rejection',
        statusCode: 0,
        error: event.reason?.toString() || 'Unknown error',
        details: event.reason,
      });
    });

    // Listen for unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('🚨 Unhandled JavaScript Error:', event.error);
      this.logError({
        message: 'JavaScript Runtime Error',
        statusCode: 0,
        error: event.message,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        },
      });
    });
  }

  /**
   * Main error handling method called by the interceptor
   */
  handleError(httpError: HttpErrorResponse, context: HttpErrorContext): void {
    const apiError: ApiError = {
      message: this.extractErrorMessage(httpError),
      statusCode: httpError.status,
      error: httpError.statusText,
      details: httpError.error,
      timestamp: new Date().toISOString(),
    };

    this.logError(apiError, context);
    this.notifyError(apiError, context);
  }

  /**
   * Handle application-level errors
   */
  handleApplicationError(error: any, customMessage?: string): void {
    const apiError: ApiError = {
      message: customMessage || error.message || 'Application error occurred',
      statusCode: 0,
      error: error.name || 'ApplicationError',
      details: {
        stack: error.stack,
        cause: error.cause,
      },
      timestamp: new Date().toISOString(),
    };

    this.logError(apiError);
    this.notifyError(apiError);
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): (ApiError & { context?: HttpErrorContext })[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.retryAttempts.clear();
  }

  /**
   * Check if a request should be retried
   */
  shouldRetry(url: string, maxRetries: number = 3): boolean {
    const attempts = this.retryAttempts.get(url) || 0;
    return attempts < maxRetries;
  }

  /**
   * Increment retry attempt for a URL
   */
  incrementRetryAttempt(url: string): number {
    const attempts = (this.retryAttempts.get(url) || 0) + 1;
    this.retryAttempts.set(url, attempts);
    return attempts;
  }

  /**
   * Reset retry attempts for a URL (on success)
   */
  resetRetryAttempts(url: string): void {
    this.retryAttempts.delete(url);
  }

  /**
   * Show user-friendly error notification
   */
  private async notifyError(
    error: ApiError,
    context?: HttpErrorContext
  ): Promise<void> {
    // Emit error for reactive components
    this.errorSubject.next(error);

    // Don't show notifications for certain status codes in certain contexts
    if (this.shouldSkipNotification(error, context)) {
      return;
    }

    // Use SweetAlert2 for error notifications
    try {
      const { default: Swal } = await import('sweetalert2');

      let title = 'Error';
      let icon: 'error' | 'warning' | 'info' = 'error';

      // Customize notification based on error type
      switch (error.statusCode) {
        case 401:
          title = 'Authentication Required';
          icon = 'warning';
          break;
        case 403:
          title = 'Access Denied';
          icon = 'warning';
          break;
        case 404:
          title = 'Not Found';
          icon = 'info';
          break;
        case 429:
          title = 'Rate Limited';
          icon = 'warning';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          title = 'Server Error';
          break;
        case 0:
          title = 'Connection Error';
          break;
      }

      await Swal.fire({
        title,
        text: error.message,
        icon,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
        background: 'hsl(var(--b1))',
        color: 'hsl(var(--bc))',
        timer: error.statusCode === 401 ? undefined : 5000,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInDown',
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp',
        },
      });
    } catch (swalError) {
      // Fallback to console if SweetAlert2 fails
      console.error('Failed to show error notification:', swalError);
      console.error('Original error:', error);
    }
  }

  /**
   * Log error with context
   */
  private logError(error: ApiError, context?: HttpErrorContext): void {
    // Add to error history
    const errorWithContext = { ...error, context };
    this.errorHistory.unshift(errorWithContext);

    // Keep only recent errors
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory.length = this.MAX_ERROR_HISTORY;
    }

    // Enhanced logging
    console.group(`🚨 Error Logged [${error.statusCode}]`);
    console.error('Message:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
    if (context) {
      console.error('Context:', context);
    }
    console.error('Timestamp:', error.timestamp);
    console.groupEnd();

    // In production, you might want to send errors to a logging service
    if (this.isProduction()) {
      this.sendToLoggingService(errorWithContext);
    }
  }

  /**
   * Extract user-friendly message from HTTP error
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error) {
      if (typeof error.error === 'object') {
        return (
          error.error.errorMessage ||
          error.error.message ||
          error.error.title ||
          this.getDefaultMessage(error.status)
        );
      }

      if (typeof error.error === 'string') {
        return error.error;
      }
    }

    return this.getDefaultMessage(error.status);
  }

  /**
   * Get default message for status code
   */
  private getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
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
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Determine if notification should be skipped
   */
  private shouldSkipNotification(
    error: ApiError,
    context?: HttpErrorContext
  ): boolean {
    // Skip notifications for certain API endpoints
    const skipNotificationUrls = [
      '/api/auth/refresh', // Token refresh failures
      '/api/health', // Health check failures
    ];

    if (
      context?.url &&
      skipNotificationUrls.some((url) => context.url.includes(url))
    ) {
      return true;
    }

    // Skip notifications for 404 on optional resources
    if (error.statusCode === 404 && context?.url?.includes('optional')) {
      return true;
    }

    return false;
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return !!(window as any)['production'] || location.hostname !== 'localhost';
  }

  /**
   * Send error to external logging service (placeholder)
   */
  private sendToLoggingService(
    error: ApiError & { context?: HttpErrorContext }
  ): void {
    // In a real application, you would send errors to a service like:
    // - Sentry
    // - LogRocket
    // - Application Insights
    // - Custom logging endpoint

    console.info('📊 Error would be sent to logging service:', error);
  }
}
