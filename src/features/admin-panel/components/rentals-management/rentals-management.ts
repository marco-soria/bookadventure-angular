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
  editingItem = signal<RentalOrder | null>(null);

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
    this.rentals().filter((rental) => rental.status === 1)
  );

  filteredBooks = computed(() =>
    this.books().filter((book) => book.status === 1 && book.isAvailable)
  );

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [rentals, customers, books] = await Promise.all([
        this.adminService.getRentals(),
        this.adminService.getCustomers(),
        this.adminService.getBooks(),
      ]);
      this.rentals.set(rentals);
      this.customers.set(customers);
      this.books.set(books);
    } catch (error) {
      console.error('Error loading data:', error);
      this.adminService.showError('Error loading data');
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
