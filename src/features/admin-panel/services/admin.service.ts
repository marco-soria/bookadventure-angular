import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  // === BOOKS ===
  async getBooks() {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}books/admin/all`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
    }
  }

  async getBooksWithPagination(page: number = 1, pageSize: number = 10) {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(
          `${this.baseUrl}books/admin/all?page=${page}&recordsPerPage=${pageSize}`
        )
      );

      if (response.success) {
        return {
          data: response.data || [],
          totalRecords: response.totalRecords || 0,
          success: true,
        };
      }

      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    } catch (error) {
      console.error('Error loading books with pagination:', error);
      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    }
  }

  async createBook(book: any) {
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}books`, book)
    );
    return response;
  }

  async updateBook(id: number, book: any) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}books/${id}`, book)
    );
    return response;
  }

  async deleteBook(id: number) {
    const response = await firstValueFrom(
      this.http.delete<any>(`${this.baseUrl}books/${id}`)
    );
    return response;
  }

  async restoreBook(id: number) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}books/${id}/restore`, {})
    );
    return response;
  }

  // === GENRES ===
  async getGenres() {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}genres/admin/all`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading genres:', error);
      return [];
    }
  }

  async getGenresWithPagination(page: number = 1, pageSize: number = 10) {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(
          `${this.baseUrl}genres/admin/all?page=${page}&recordsPerPage=${pageSize}`
        )
      );

      if (response.success) {
        return {
          data: response.data || [],
          totalRecords: response.totalRecords || 0,
          success: true,
        };
      }

      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    } catch (error) {
      console.error('Error loading genres with pagination:', error);
      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    }
  }

  async createGenre(genre: any) {
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}genres`, genre)
    );
    return response;
  }

  async updateGenre(id: number, genre: any) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}genres/${id}`, genre)
    );
    return response;
  }

  async deleteGenre(id: number) {
    const response = await firstValueFrom(
      this.http.delete<any>(`${this.baseUrl}genres/${id}`)
    );
    return response;
  }

  async restoreGenre(id: number) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}genres/${id}/restore`, {})
    );
    return response;
  }

  // === CUSTOMERS ===
  async getCustomers() {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}customers/admin/all`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }

  async getCustomersWithPagination(page: number = 1, pageSize: number = 10) {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(
          `${this.baseUrl}customers/admin/all?page=${page}&recordsPerPage=${pageSize}`
        )
      );

      if (response.success) {
        return {
          data: response.data || [],
          totalRecords: response.totalRecords || 0,
          success: true,
        };
      }

      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    } catch (error) {
      console.error('Error loading customers with pagination:', error);
      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    }
  }

  async getCustomerByDni(dni: string) {
    const response = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}customers/dni/${dni}`)
    );
    return response;
  }

  async createCustomer(customer: any) {
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}customers`, customer)
    );
    return response;
  }

  async updateCustomer(id: number, customer: any) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}customers/${id}`, customer)
    );
    return response;
  }

  async deleteCustomer(id: number) {
    const response = await firstValueFrom(
      this.http.delete<any>(`${this.baseUrl}customers/${id}`)
    );
    return response;
  }

  async restoreCustomer(id: number) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}customers/${id}/restore`, {})
    );
    return response;
  }

  // === RENTALS ===
  async getRentals() {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}rentalorders/admin/all`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading rentals:', error);
      return [];
    }
  }

  async getRentalsWithPagination(page: number = 1, pageSize: number = 10) {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(
          `${this.baseUrl}rentalorders/admin/all?page=${page}&recordsPerPage=${pageSize}`
        )
      );

      if (response.success) {
        return {
          data: response.data || [],
          totalRecords: response.totalRecords || 0,
          success: true,
        };
      }

      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    } catch (error) {
      console.error('Error loading rentals with pagination:', error);
      return {
        data: [],
        totalRecords: 0,
        success: false,
      };
    }
  }

  async createRental(rental: any) {
    const response = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}rentalorders`, rental)
    );
    return response;
  }

  async updateRental(id: number, rental: any) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}rentalorders/${id}`, rental)
    );
    return response;
  }

  async deleteRental(id: number) {
    const response = await firstValueFrom(
      this.http.delete<any>(`${this.baseUrl}rentalorders/${id}`)
    );
    return response;
  }

  async restoreRental(id: number) {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.baseUrl}rentalorders/${id}/restore`, {})
    );
    return response;
  }

  // === UTILITY METHODS ===
  showSuccess(message: string) {
    Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: '#1f2937',
      color: '#f9fafb',
      customClass: {
        popup: 'shadow-lg border border-gray-600',
      },
    });
  }

  showError(message: string) {
    Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      background: '#1f2937',
      color: '#f9fafb',
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'shadow-lg border border-gray-600',
      },
    });
  }

  async confirmDelete(title: string, text: string): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      background: '#1f2937',
      color: '#f9fafb',
      customClass: {
        popup: 'shadow-lg border border-gray-600',
      },
    });
    return result.isConfirmed;
  }

  async confirmRestore(title: string, text: string): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore it!',
      background: '#1f2937',
      color: '#f9fafb',
      customClass: {
        popup: 'shadow-lg border border-gray-600',
      },
    });
    return result.isConfirmed;
  }
}
