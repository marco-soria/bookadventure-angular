import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Book,
  Customer,
  RentalForm,
  RentalOrder,
} from '../../interfaces/admin.interfaces';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-rentals-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './rentals-management.html',
  styleUrl: './rentals-management.css',
})
export class RentalsManagement implements OnInit {
  private adminService = inject(AdminService);

  // Estado
  rentals = signal<RentalOrder[]>([]);
  customers = signal<Customer[]>([]);
  books = signal<Book[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  showDetailModal = signal<boolean>(false);
  editingItem = signal<RentalOrder | null>(null);
  selectedRentalDetails = signal<RentalOrder | null>(null);

  // Formulario
  form = signal<RentalForm>({
    customerId: 0,
    rentalDays: 7,
    notes: '',
    bookIds: [],
    allowPartialOrder: false,
  });

  // Computed properties
  filteredRentals = computed(() =>
    this.rentals().filter((rental) => rental.status === 'Active')
  );

  filteredBooks = computed(() =>
    this.books().filter((book) => book.status && book.isAvailable)
  );

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [rentalsResult, customersResult, booksResult] = await Promise.all([
        this.adminService.getRentalsWithPagination(1, 50),
        this.adminService.getCustomersWithPagination(1, 50),
        this.adminService.getBooksWithPagination(1, 100),
      ]);

      if (rentalsResult.success) {
        this.rentals.set(rentalsResult.data);
      } else {
        this.rentals.set([]);
      }

      if (customersResult.success) {
        this.customers.set(customersResult.data);
      } else {
        this.customers.set([]);
      }

      if (booksResult.success) {
        this.books.set(booksResult.data);
      } else {
        this.books.set([]);
      }

      if (
        !rentalsResult.success ||
        !customersResult.success ||
        !booksResult.success
      ) {
        this.adminService.showError('Error loading data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.adminService.showError('Error loading data');
      this.rentals.set([]);
      this.customers.set([]);
      this.books.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  openForm(rental?: RentalOrder) {
    if (rental) {
      this.editingItem.set(rental);
      this.form.set({
        customerId: rental.customerId,
        rentalDays: 7,
        notes: '',
        bookIds: [],
        allowPartialOrder: false,
      });
    } else {
      this.editingItem.set(null);
      this.form.set({
        customerId: 0,
        rentalDays: 7,
        notes: '',
        bookIds: [],
        allowPartialOrder: false,
      });
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingItem.set(null);
  }

  async openDetailModal(rentalId: number) {
    this.isLoading.set(true);
    try {
      const response = await this.adminService.getRentalDetails(rentalId);
      if (response.success) {
        this.selectedRentalDetails.set(response.data);
        this.showDetailModal.set(true);
      } else {
        this.adminService.showError('Error loading rental details');
      }
    } catch (error) {
      console.error('Error loading rental details:', error);
      this.adminService.showError('Error loading rental details');
    } finally {
      this.isLoading.set(false);
    }
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedRentalDetails.set(null);
  }

  async returnBook(rentalId: number, bookId: number) {
    const confirmed = await this.adminService.confirmRestore(
      'Return Book',
      'Are you sure you want to mark this book as returned?'
    );

    if (confirmed) {
      try {
        const response = await this.adminService.returnPartialBooks(rentalId, [
          bookId,
        ]);
        if (response.success) {
          this.adminService.showSuccess('Book returned successfully');
          // Refresh the details
          await this.openDetailModal(rentalId);
          // Refresh the main list
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error returning book'
          );
        }
      } catch (error) {
        console.error('Error returning book:', error);
        this.adminService.showError('Error returning book');
      }
    }
  }

  async restore(rentalId: number) {
    const confirmed = await this.adminService.confirmRestore(
      'Restore Rental Order',
      `Are you sure you want to restore rental order #${rentalId}?`
    );

    if (confirmed) {
      try {
        const response = await this.adminService.restoreRental(rentalId);
        if (response.success) {
          this.adminService.showSuccess('Rental order restored successfully');
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error restoring rental order'
          );
        }
      } catch (error) {
        console.error('Error restoring rental order:', error);
        this.adminService.showError('Error restoring rental order');
      }
    }
  }

  // Helper methods for display
  getOrderStatusClass(orderStatus: string): string {
    switch (orderStatus?.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'active':
        return 'badge-info';
      case 'returned':
        return 'badge-success';
      case 'overdue':
        return 'badge-error';
      case 'cancelled':
        return 'badge-neutral';
      default:
        return 'badge-ghost';
    }
  }

  formatOrderStatus(orderStatus: string): string {
    switch (orderStatus?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'active':
        return 'Active';
      case 'returned':
        return 'Returned';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
      default:
        return orderStatus || 'Unknown';
    }
  }

  isOrderCompletelyReturned(rental: RentalOrder): boolean {
    return (
      rental.details &&
      rental.details.length > 0 &&
      rental.details.every((detail) => detail.isReturned)
    );
  }

  async save() {
    const formData = this.form();
    if (!formData.customerId || formData.bookIds.length === 0) {
      this.adminService.showError(
        'Please select a customer and at least one book'
      );
      return;
    }

    this.isLoading.set(true);
    try {
      const editing = this.editingItem();
      let response: any;

      if (editing) {
        response = await this.adminService.updateRental(editing.id, formData);
      } else {
        response = await this.adminService.createRental(formData);
      }

      if (response && response.success) {
        this.adminService.showSuccess(
          `Rental ${editing ? 'updated' : 'created'} successfully`
        );
        await this.loadData();
        this.closeForm();
      } else {
        this.adminService.showError(
          response?.errorMessage || 'Error saving rental'
        );
      }
    } catch (error) {
      console.error('Error saving rental:', error);
      this.adminService.showError('Error saving rental');
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(rentalId: number) {
    const confirmed = await this.adminService.confirmDelete(
      'Delete Rental Order',
      `Are you sure you want to delete rental order #${rentalId}?`
    );

    if (confirmed) {
      try {
        const response = await this.adminService.deleteRental(rentalId);
        if (response.success) {
          this.adminService.showSuccess('Rental order deleted successfully');
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error deleting rental order'
          );
        }
      } catch (error) {
        console.error('Error deleting rental order:', error);
        this.adminService.showError('Error deleting rental order');
      }
    }
  }

  toggleBookSelection(bookId: number, event: any) {
    const isChecked = event.target.checked;
    const currentBookIds = this.form().bookIds;

    if (isChecked) {
      if (!currentBookIds.includes(bookId)) {
        this.form.set({
          ...this.form(),
          bookIds: [...currentBookIds, bookId],
        });
      }
    } else {
      this.form.set({
        ...this.form(),
        bookIds: currentBookIds.filter((id) => id !== bookId),
      });
    }
  }
}
