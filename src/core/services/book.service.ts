import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { Book } from '../../types/book';
import { BookSearchDto, PaginatedResponse } from '../../types/pagination';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseUrl}books`;

  getBooks(searchParams?: BookSearchDto): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams();

    if (searchParams) {
      if (searchParams.page) {
        params = params.set('page', searchParams.page.toString());
      }
      if (searchParams.recordsPerPage) {
        params = params.set(
          'recordsPerPage',
          searchParams.recordsPerPage.toString()
        );
      }
      if (searchParams.search) {
        params = params.set('search', searchParams.search);
      }
      if (searchParams.sortBy) {
        params = params.set('sortBy', searchParams.sortBy);
      }
      if (searchParams.sortDescending !== undefined) {
        params = params.set(
          'sortDescending',
          searchParams.sortDescending.toString()
        );
      }
      if (searchParams.genreId) {
        params = params.set('genreId', searchParams.genreId.toString());
      }
      if (searchParams.author) {
        params = params.set('author', searchParams.author);
      }
      if (searchParams.inStock !== undefined) {
        params = params.set('inStock', searchParams.inStock.toString());
      }
    }

    return this.http
      .get<PaginatedResponse<Book>>(this.baseUrl, { params })
      .pipe(catchError(this.handleError));
  }

  getBookById(id: number): Observable<{
    success: boolean;
    data: Book;
    message?: string;
    errorMessage?: string;
  }> {
    return this.http
      .get<{
        success: boolean;
        data: Book;
        message?: string;
        errorMessage?: string;
      }>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  searchBooks(title: string): Observable<PaginatedResponse<Book>> {
    const params = new HttpParams().set('title', title);
    return this.http
      .get<PaginatedResponse<Book>>(`${this.baseUrl}/search`, { params })
      .pipe(catchError(this.handleError));
  }

  getBooksByGenre(
    genreId: number,
    pagination?: { page?: number; recordsPerPage?: number }
  ): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams();

    if (pagination?.page) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination?.recordsPerPage) {
      params = params.set(
        'recordsPerPage',
        pagination.recordsPerPage.toString()
      );
    }

    return this.http
      .get<PaginatedResponse<Book>>(`${this.baseUrl}/genre/${genreId}`, {
        params,
      })
      .pipe(catchError(this.handleError));
  }

  getBooksInStock(pagination?: {
    page?: number;
    recordsPerPage?: number;
  }): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams();

    if (pagination?.page) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination?.recordsPerPage) {
      params = params.set(
        'recordsPerPage',
        pagination.recordsPerPage.toString()
      );
    }

    return this.http
      .get<PaginatedResponse<Book>>(`${this.baseUrl}/in-stock`, { params })
      .pipe(catchError(this.handleError));
  }

  getBooksAlphabetical(
    descending: boolean = false,
    pagination?: { page?: number; recordsPerPage?: number }
  ): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams();

    params = params.set('descending', descending.toString());

    if (pagination?.page) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination?.recordsPerPage) {
      params = params.set(
        'recordsPerPage',
        pagination.recordsPerPage.toString()
      );
    }

    return this.http
      .get<PaginatedResponse<Book>>(`${this.baseUrl}/alphabetical`, { params })
      .pipe(catchError(this.handleError));
  }

  getBooksByGenreAlphabetical(
    genreId: number,
    descending: boolean = false,
    pagination?: { page?: number; recordsPerPage?: number }
  ): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams();

    params = params.set('descending', descending.toString());

    if (pagination?.page) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination?.recordsPerPage) {
      params = params.set(
        'recordsPerPage',
        pagination.recordsPerPage.toString()
      );
    }

    return this.http
      .get<PaginatedResponse<Book>>(
        `${this.baseUrl}/genre/${genreId}/alphabetical`,
        { params }
      )
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

    console.error('Book Service Error:', {
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
