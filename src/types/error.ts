// Error response types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  errorMessage: string;
  statusCode?: number;
  details?: any;
  timestamp?: string;
}

// Error notification configuration
export interface ErrorNotificationConfig {
  showToast: boolean;
  duration: number;
  position: 'top' | 'bottom' | 'center';
  type: 'error' | 'warning' | 'info';
}

// Error handling options
export interface ErrorHandlingOptions {
  skipGlobalHandler?: boolean;
  customMessage?: string;
  silent?: boolean;
  redirectOnError?: string;
  retryAttempts?: number;
}

// HTTP Error context for better error tracking
export interface HttpErrorContext {
  url: string;
  method: string;
  statusCode: number;
  statusText: string;
  timestamp: Date;
  userAgent?: string;
  userId?: string;
}
