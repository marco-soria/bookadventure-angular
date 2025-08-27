import { HttpHeaders } from '@angular/common/http';
import { ErrorHandlingOptions } from '../../types/error';

/**
 * Utility class for creating HTTP headers with error handling options
 */
export class HttpUtils {
  /**
   * Create headers with error handling options
   */
  static createHeaders(options?: {
    errorHandling?: ErrorHandlingOptions;
    contentType?: string;
    additionalHeaders?: Record<string, string>;
  }): HttpHeaders {
    let headers = new HttpHeaders();

    // Set content type
    if (options?.contentType) {
      headers = headers.set('Content-Type', options.contentType);
    }

    // Set error handling options
    if (options?.errorHandling?.skipGlobalHandler) {
      headers = headers.set('X-Skip-Error-Handler', 'true');
    }

    if (options?.errorHandling?.silent) {
      headers = headers.set('X-Silent-Error', 'true');
    }

    if (options?.errorHandling?.customMessage) {
      headers = headers.set(
        'X-Custom-Error-Message',
        options.errorHandling.customMessage
      );
    }

    if (options?.errorHandling?.retryAttempts) {
      headers = headers.set(
        'X-Retry-Attempts',
        options.errorHandling.retryAttempts.toString()
      );
    }

    // Add additional headers
    if (options?.additionalHeaders) {
      Object.entries(options.additionalHeaders).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Create headers for requests that should skip global error handling
   */
  static createSilentHeaders(
    additionalHeaders?: Record<string, string>
  ): HttpHeaders {
    return this.createHeaders({
      errorHandling: { skipGlobalHandler: true, silent: true },
      additionalHeaders,
    });
  }

  /**
   * Create headers for requests with custom error messages
   */
  static createCustomErrorHeaders(
    customMessage: string,
    additionalHeaders?: Record<string, string>
  ): HttpHeaders {
    return this.createHeaders({
      errorHandling: { customMessage },
      additionalHeaders,
    });
  }

  /**
   * Create headers for requests with retry logic
   */
  static createRetryHeaders(
    retryAttempts: number,
    additionalHeaders?: Record<string, string>
  ): HttpHeaders {
    return this.createHeaders({
      errorHandling: { retryAttempts },
      additionalHeaders,
    });
  }
}
