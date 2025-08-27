import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { Genre, GenreResponse } from '../../types/genre';

@Injectable({
  providedIn: 'root',
})
export class GenreService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseUrl}genres`;

  getGenres(): Observable<GenreResponse> {
    return this.http
      .get<GenreResponse>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  getGenreById(id: number): Observable<{
    success: boolean;
    data: Genre;
    message?: string;
    errorMessage?: string;
  }> {
    return this.http
      .get<{
        success: boolean;
        data: Genre;
        message?: string;
        errorMessage?: string;
      }>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      errorMessage =
        'Cannot connect to server. Please ensure the backend is running on localhost:7260';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.error?.errorMessage) {
        errorMessage = error.error.errorMessage;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Genre Service Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
    });

    return throwError(() => ({
      message: errorMessage,
      statusCode: error.status,
    }));
  }
}
