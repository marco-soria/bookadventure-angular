import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateRentalOrderForUserDto,
  RentalOrderResponse,
} from '../../types/rental';

@Injectable({
  providedIn: 'root',
})
export class RentalOrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}rentalorders`;

  /**
   * Create a rental order for a single book for the current authenticated user
   */
  rentSingleBookForCurrentUser(
    bookId: number,
    rentalDays: number,
    notes?: string
  ): Observable<RentalOrderResponse> {
    const request: CreateRentalOrderForUserDto = {
      rentalDays,
      notes,
      bookIds: [bookId],
      allowPartialOrder: false,
    };

    return this.http.post<RentalOrderResponse>(
      `${this.apiUrl}/create-for-me`,
      request
    );
  }

  /**
   * Create a rental order for multiple books for the current authenticated user
   */
  createRentalOrderForCurrentUser(
    request: CreateRentalOrderForUserDto
  ): Observable<RentalOrderResponse> {
    return this.http.post<RentalOrderResponse>(
      `${this.apiUrl}/create-for-me`,
      request
    );
  }

  /**
   * Get current user's rental orders
   */
  getMyRentalOrders(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-orders`);
  }
}
