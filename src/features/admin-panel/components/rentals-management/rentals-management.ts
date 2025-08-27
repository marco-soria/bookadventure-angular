import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Book,
  Customer,
  ORDER_STATUS_OPTIONS,
  OrderStatus,
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
  showStatusModal = signal<boolean>(false);
  editingItem = signal<RentalOrder | null>(null);
  selectedRentalDetails = signal<RentalOrder | null>(null);
  statusEditingItem = signal<RentalOrder | null>(null);
  selectedStatus = signal<number>(1);
  bookSearchTerm = signal<string>('');

  // Formulario
  form = signal<RentalForm>({
    customerId: 0,
    rentalDays: 7,
    notes: '',
    bookIds: [],
    allowPartialOrder: false,
  });

  // Computed properties
  filteredRentals = computed(() => this.rentals()); // Show all rentals (active and deleted)

  filteredBooks = computed(() =>
    this.books().filter((book) => book.status && book.isAvailable)
  );

  filteredBooksWithSearch = computed(() => {
    const searchTerm = this.bookSearchTerm().toLowerCase();
    if (!searchTerm) {
      return this.filteredBooks();
    }

    return this.filteredBooks().filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.isbn.toLowerCase().includes(searchTerm) ||
        book.genreName.toLowerCase().includes(searchTerm)
    );
  });

  // Order Status Options
  orderStatusOptions = ORDER_STATUS_OPTIONS;

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
      // For editing, populate with existing data
      this.form.set({
        customerId: rental.customerId,
        rentalDays:
          rental.details && rental.details.length > 0
            ? rental.details[0].rentalDays
            : 7,
        notes: rental.notes || '',
        bookIds: rental.details ? rental.details.map((d) => d.bookId) : [],
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
    this.bookSearchTerm.set('');
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

  openStatusModal(rental: RentalOrder) {
    this.statusEditingItem.set(rental);
    // Set current status as default
    const currentStatus = this.getStatusValue(rental.orderStatus);
    this.selectedStatus.set(currentStatus);
    this.showStatusModal.set(true);
  }

  closeStatusModal() {
    this.showStatusModal.set(false);
    this.statusEditingItem.set(null);
  }

  async updateStatus() {
    const rental = this.statusEditingItem();
    const newStatus = this.selectedStatus();

    if (!rental) return;

    this.isLoading.set(true);
    try {
      const response = await this.adminService.updateRentalStatus(
        rental.id,
        newStatus
      );
      if (response.success) {
        this.adminService.showSuccess('Rental status updated successfully');
        await this.loadData();
        this.closeStatusModal();
      } else {
        this.adminService.showError(
          response.errorMessage || 'Error updating rental status'
        );
      }
    } catch (error) {
      console.error('Error updating rental status:', error);
      this.adminService.showError('Error updating rental status');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getStatusValue(orderStatus: string): number {
    switch (orderStatus?.toLowerCase()) {
      case 'pending':
        return OrderStatus.Pending;
      case 'active':
        return OrderStatus.Active;
      case 'returned':
        return OrderStatus.Returned;
      case 'overdue':
        return OrderStatus.Overdue;
      case 'cancelled':
        return OrderStatus.Cancelled;
      default:
        return OrderStatus.Pending;
    }
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
  getOrderStatusClass(rental: RentalOrder): string {
    if (this.isDeleted(rental)) {
      return 'badge-error';
    }

    switch (rental.orderStatus?.toLowerCase()) {
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

  formatOrderStatus(rental: RentalOrder): string {
    if (this.isDeleted(rental)) {
      return 'Deleted';
    }

    switch (rental.orderStatus?.toLowerCase()) {
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
        return rental.orderStatus || 'Unknown';
    }
  }

  isDeleted(rental: RentalOrder): boolean {
    return (
      rental.status === 'Deleted' ||
      rental.status === 'deleted' ||
      (typeof rental.status === 'number' && rental.status === 2)
    );
  }

  canEdit(rental: RentalOrder): boolean {
    return (
      !this.isDeleted(rental) &&
      (rental.orderStatus === 'Active' || rental.orderStatus === 'Pending')
    );
  }

  canDelete(rental: RentalOrder): boolean {
    return !this.isDeleted(rental) && rental.orderStatus !== 'Cancelled';
  }

  canRestore(rental: RentalOrder): boolean {
    return this.isDeleted(rental);
  }

  canEditStatus(rental: RentalOrder): boolean {
    return !this.isDeleted(rental);
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
    const editing = this.editingItem();

    console.log('Saving rental:', { formData, editing: !!editing });

    if (!this.isFormValid()) {
      if (editing) {
        this.adminService.showError('Please enter valid rental days (1-365)');
      } else {
        this.adminService.showError(
          'Please select a customer and at least one book'
        );
      }
      return;
    }

    this.isLoading.set(true);
    try {
      let response: any;

      if (editing) {
        // For editing, only send the fields that can be updated
        const updateData = {
          customerId: formData.customerId,
          rentalDays: formData.rentalDays,
          notes: formData.notes || null,
          bookIds: formData.bookIds.length > 0 ? formData.bookIds : null,
        };
        console.log('Updating rental with data:', updateData);
        response = await this.adminService.updateRental(editing.id, updateData);
      } else {
        // For creating, send all required fields
        const createData = {
          customerId: formData.customerId,
          rentalDays: formData.rentalDays,
          notes: formData.notes || null,
          bookIds: formData.bookIds,
          allowPartialOrder: formData.allowPartialOrder,
        };
        console.log('Creating rental with data:', createData);
        response = await this.adminService.createRental(createData);
      }

      console.log('Rental operation response:', response);

      if (response && response.success) {
        this.adminService.showSuccess(
          `Rental ${editing ? 'updated' : 'created'} successfully`
        );
        await this.loadData();
        this.closeForm();
      } else {
        this.adminService.showError(
          response?.errorMessage ||
            `Error ${editing ? 'updating' : 'creating'} rental`
        );
      }
    } catch (error) {
      console.error('Error saving rental:', error);
      this.adminService.showError(
        `Error ${editing ? 'updating' : 'creating'} rental`
      );
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
    const currentForm = this.form();
    const currentBookIds = [...currentForm.bookIds];

    if (isChecked) {
      if (!currentBookIds.includes(bookId)) {
        this.form.set({
          ...currentForm,
          bookIds: [...currentBookIds, bookId],
        });
      }
    } else {
      this.form.set({
        ...currentForm,
        bookIds: currentBookIds.filter((id) => id !== bookId),
      });
    }
  }

  // New methods for improved book selection
  onBookSearch() {
    // The computed property will automatically filter
    // This method can be used for additional logic if needed
  }

  removeBook(bookId: number) {
    const currentForm = this.form();
    const currentBookIds = [...currentForm.bookIds];
    this.form.set({
      ...currentForm,
      bookIds: currentBookIds.filter((id) => id !== bookId),
    });
  }

  getBookTitle(bookId: number): string {
    const book = this.books().find((b) => b.id === bookId);
    return book ? `${book.title} by ${book.author}` : 'Unknown Book';
  }

  isFormValid(): boolean {
    const formData = this.form();
    const editing = this.editingItem();

    if (editing) {
      // For editing, only require rental days and notes are optional
      return formData.rentalDays > 0 && formData.rentalDays <= 365;
    } else {
      // For creating, require customer and at least one book
      return (
        formData.customerId > 0 &&
        formData.bookIds.length > 0 &&
        formData.rentalDays > 0 &&
        formData.rentalDays <= 365
      );
    }
  }

  updateFormField(field: keyof RentalForm, value: any) {
    const currentForm = this.form();
    this.form.set({
      ...currentForm,
      [field]: value,
    });
  }
}
