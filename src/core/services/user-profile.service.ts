import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CustomerProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dni: string;
  age: number;
  phoneNumber?: string;
  userId?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  totalRentalOrders: number;
  activeRentals: number;
  overdueRentals: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dni?: string;
  age?: number;
  phoneNumber?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorMessage?: string;
  totalRecords?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}users`;

  /**
   * Get current user's customer profile
   */
  getProfile(): Observable<ApiResponse<CustomerProfile>> {
    return this.http.get<ApiResponse<CustomerProfile>>(
      `${this.apiUrl}/profile`
    );
  }

  /**
   * Update current user's customer profile
   */
  updateProfile(
    request: UpdateProfileRequest
  ): Observable<ApiResponse<CustomerProfile>> {
    return this.http.put<ApiResponse<CustomerProfile>>(
      `${this.apiUrl}/profile`,
      request
    );
  }

  /**
   * Get current user's rental orders
   */
  getMyRentalOrders(pagination?: {
    page?: number;
    recordsPerPage?: number;
  }): Observable<ApiResponse<any[]>> {
    let url = `${environment.baseUrl}rentalorders/my-orders`;
    const params: string[] = [];

    if (pagination?.page) {
      params.push(`page=${pagination.page}`);
    }
    if (pagination?.recordsPerPage) {
      params.push(`recordsPerPage=${pagination.recordsPerPage}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<ApiResponse<any[]>>(url);
  }
}
