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
        this.http.get<any>(`${this.baseUrl}books`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
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

  // === GENRES ===
  async getGenres() {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}genres`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading genres:', error);
      return [];
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

  // === CUSTOMERS ===
  async getCustomers() {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}customers`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
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

  // === RENTALS ===
  async getRentals() {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}rentalorders`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error loading rentals:', error);
      return [];
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

  // === UTILITY METHODS ===
  showSuccess(message: string) {
    Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: 'hsl(var(--b1))',
      color: 'hsl(var(--bc))',
    });
  }

  showError(message: string) {
    Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      background: 'hsl(var(--b1))',
      color: 'hsl(var(--bc))',
      confirmButtonColor: '#ef4444',
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
      background: 'hsl(var(--b1))',
      color: 'hsl(var(--bc))',
    });
    return result.isConfirmed;
  }
}
