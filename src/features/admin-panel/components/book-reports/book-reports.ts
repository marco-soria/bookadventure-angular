import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RentalReport } from '../../interfaces/admin.interfaces';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-book-reports',
  imports: [CommonModule, FormsModule],
  templateUrl: './book-reports.html',
  styleUrl: './book-reports.css',
})
export class BookReports {
  private adminService = inject(AdminService);

  // Estado
  isLoading = signal<boolean>(false);
  searchDni = '';
  rentalReport = signal<RentalReport | null>(null);

  async searchRentalsByDni() {
    const dni = this.searchDni.trim();
    if (!dni) {
      this.adminService.showError('Please enter a DNI');
      return;
    }

    this.isLoading.set(true);
    try {
      console.log('Searching customer by DNI:', dni);

      // Primero obtener el customer
      const customerResponse = await this.adminService.getCustomerByDni(dni);
      console.log('Customer response:', customerResponse);

      if (customerResponse.success) {
        const customer = customerResponse.data;

        // Ahora obtener las órdenes de renta del customer
        const rentalsResponse = await this.adminService.getRentals();
        console.log('All rentals response:', rentalsResponse);

        if (rentalsResponse.length > 0) {
          // Filtrar las órdenes de este customer
          const customerRentals = rentalsResponse.filter(
            (rental: any) => rental.customerId === customer.id
          );
          console.log('Customer rentals:', customerRentals);

          // Crear el reporte con los libros
          const books: any[] = [];
          customerRentals.forEach((rental: any) => {
            if (rental.details && rental.details.length > 0) {
              rental.details.forEach((detail: any) => {
                books.push({
                  title: detail.bookTitle,
                  author: detail.bookAuthor || 'Unknown',
                  rentalDate: rental.orderDate,
                  returnDate: detail.returnDate,
                  isReturned: detail.isReturned,
                });
              });
            }
          });
          console.log('Rental books:', books);

          const rentalReport: RentalReport = {
            customerDni: customer.dni,
            customerName: `${customer.firstName} ${customer.lastName}`,
            books: books,
          };
          this.rentalReport.set(rentalReport);
        } else {
          this.adminService.showError('Error loading rental data');
          this.rentalReport.set(null);
        }
      } else {
        this.adminService.showError('Customer not found');
        this.rentalReport.set(null);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      this.adminService.showError('Error searching customer');
      this.rentalReport.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  clearReport() {
    this.searchDni = '';
    this.rentalReport.set(null);
  }
}
