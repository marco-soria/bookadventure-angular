import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  description?: string;
  stock: number;
  genreId: number;
  imageUrl?: string;
  isAvailable: boolean;
  status: number;
}

interface Genre {
  id: number;
  name: string;
  description: string;
  status: number;
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  age: number;
  phoneNumber?: string;
  status: number;
}

interface RentalOrder {
  id: number;
  customerId: number;
  customerName: string;
  orderDate: string;
  returnDate?: string;
  status: number;
  details: RentalDetail[];
}

interface RentalDetail {
  id: number;
  bookTitle: string;
  rentalDate: string;
  returnDate?: string;
  isReturned: boolean;
}

interface RentalReport {
  customerDni: string;
  customerName: string;
  books: {
    title: string;
    author: string;
    rentalDate: string;
    returnDate?: string;
    isReturned: boolean;
  }[];
}

@Component({
  selector: 'app-admin-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class AdminPanel implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  // Estado de la aplicación
  activeTab = signal<string>('books');
  isLoading = signal<boolean>(false);

  // Datos
  books = signal<Book[]>([]);
  genres = signal<Genre[]>([]);
  customers = signal<Customer[]>([]);
  rentals = signal<RentalOrder[]>([]);

  // Estados de formularios
  showBookForm = signal<boolean>(false);
  showGenreForm = signal<boolean>(false);
  showCustomerForm = signal<boolean>(false);
  showRentalModal = signal<boolean>(false);
  editingItem = signal<any>(null);
  selectedRental = signal<RentalOrder | null>(null);
  isEditingRental = signal<boolean>(false);

  // Formularios
  bookForm = signal({
    title: '',
    author: '',
    isbn: '',
    description: '',
    stock: 1,
    genreId: 0,
    imageUrl: '',
    isAvailable: true,
  });

  genreForm = signal({
    name: '',
    description: '',
  });

  customerForm = signal({
    firstName: '',
    lastName: '',
    email: '',
    dni: '',
    age: 18,
    phoneNumber: '',
  });

  rentalForm = signal({
    customerId: 0,
    rentalDays: 7,
    notes: '',
    bookIds: [] as number[],
    allowPartialOrder: false,
  });

  // Búsqueda de reportes
  searchDni = '';
  rentalReport = signal<RentalReport | null>(null);

  // Computed properties
  filteredBooks = computed(() =>
    this.books().filter((book) => book.status === 1)
  );
  filteredGenres = computed(() =>
    this.genres().filter((genre) => genre.status === 1)
  );
  filteredCustomers = computed(() =>
    this.customers().filter((customer) => customer.status === 1)
  );
  filteredRentals = computed(() =>
    this.rentals().filter((rental) => rental.status === 1)
  );

  ngOnInit() {
    console.log('AdminPanel initialized');
    this.loadInitialData();
  }

  // Navegación de tabs
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.resetForms();
  }

  // Carga inicial de datos
  async loadInitialData() {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.loadBooks(),
        this.loadGenres(),
        this.loadCustomers(),
        this.loadRentals(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Error loading data');
    } finally {
      this.isLoading.set(false);
    }
  }

  // === BOOKS ===
  async loadBooks() {
    try {
      console.log('Loading books...');
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}books`)
      );
      console.log('Books response:', response);
      if (response.success) {
        this.books.set(response.data);
        console.log('Books loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  }

  openBookForm(book?: Book) {
    if (book) {
      this.editingItem.set(book);
      this.bookForm.set({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: '',
        stock: 1,
        genreId: 0, // Se necesitaría mapear el género
        imageUrl: '',
        isAvailable: book.isAvailable,
      });
    } else {
      this.editingItem.set(null);
      this.bookForm.set({
        title: '',
        author: '',
        isbn: '',
        description: '',
        stock: 1,
        genreId: 0,
        imageUrl: '',
        isAvailable: true,
      });
    }
    this.showBookForm.set(true);
  }

  async saveBook() {
    const form = this.bookForm();
    if (!form.title || !form.author || !form.genreId || form.stock < 0) {
      this.showError('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    try {
      const editing = this.editingItem();
      const url = editing
        ? `${this.baseUrl}books/${editing.id}`
        : `${this.baseUrl}books`;

      let response: any;
      if (editing) {
        response = await firstValueFrom(this.http.put<any>(url, form));
      } else {
        response = await firstValueFrom(this.http.post<any>(url, form));
      }

      if (response && response.success) {
        this.showSuccess(
          `Book ${editing ? 'updated' : 'created'} successfully`
        );
        this.loadBooks();
        this.closeBookForm();
      } else {
        this.showError(response?.errorMessage || 'Error saving book');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      this.showError('Error saving book');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteBook(bookId: number) {
    const book = this.books().find((b) => b.id === bookId);
    if (!book) return;

    const result = await Swal.fire({
      title: 'Delete Book',
      text: `Are you sure you want to delete "${book.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await firstValueFrom(
          this.http.delete<any>(`${this.baseUrl}books/${book.id}`)
        );
        if (response.success) {
          this.showSuccess('Book deleted successfully');
          this.loadBooks();
        } else {
          this.showError(response.errorMessage || 'Error deleting book');
        }
      } catch (error) {
        console.error('Error deleting book:', error);
        this.showError('Error deleting book');
      }
    }
  }

  closeBookForm() {
    this.showBookForm.set(false);
    this.editingItem.set(null);
  }

  // === GENRES ===
  async loadGenres() {
    try {
      console.log('Loading genres...');
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}genres`)
      );
      console.log('Genres response:', response);
      if (response.success) {
        this.genres.set(response.data);
        console.log('Genres loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  }

  openGenreForm(genre?: Genre) {
    if (genre) {
      this.editingItem.set(genre);
      this.genreForm.set({
        name: genre.name,
        description: genre.description,
      });
    } else {
      this.editingItem.set(null);
      this.genreForm.set({
        name: '',
        description: '',
      });
    }
    this.showGenreForm.set(true);
  }

  async saveGenre() {
    const form = this.genreForm();
    if (!form.name) {
      this.showError('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    try {
      const editing = this.editingItem();
      const url = editing
        ? `${this.baseUrl}genres/${editing.id}`
        : `${this.baseUrl}genres`;

      let response: any;
      if (editing) {
        response = await firstValueFrom(this.http.put<any>(url, form));
      } else {
        response = await firstValueFrom(this.http.post<any>(url, form));
      }

      if (response && response.success) {
        this.showSuccess(
          `Genre ${editing ? 'updated' : 'created'} successfully`
        );
        this.loadGenres();
        this.closeGenreForm();
      } else {
        this.showError(response?.errorMessage || 'Error saving genre');
      }
    } catch (error) {
      console.error('Error saving genre:', error);
      this.showError('Error saving genre');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteGenre(genreId: number) {
    const genre = this.genres().find((g) => g.id === genreId);
    if (!genre) return;

    const result = await Swal.fire({
      title: 'Delete Genre',
      text: `Are you sure you want to delete "${genre.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await firstValueFrom(
          this.http.delete<any>(`${this.baseUrl}genres/${genre.id}`)
        );
        if (response.success) {
          this.showSuccess('Genre deleted successfully');
          this.loadGenres();
        } else {
          this.showError(response.errorMessage || 'Error deleting genre');
        }
      } catch (error) {
        console.error('Error deleting genre:', error);
        this.showError('Error deleting genre');
      }
    }
  }

  closeGenreForm() {
    this.showGenreForm.set(false);
    this.editingItem.set(null);
  }

  // === CUSTOMERS ===
  async loadCustomers() {
    try {
      console.log('Loading customers...');
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}customers`)
      );
      console.log('Customers response:', response);
      if (response.success) {
        this.customers.set(response.data);
        console.log('Customers loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  openCustomerForm(customer?: Customer) {
    if (customer) {
      this.editingItem.set(customer);
      this.customerForm.set({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        dni: customer.dni,
        age: customer.age,
        phoneNumber: customer.phoneNumber || '',
      });
    } else {
      this.editingItem.set(null);
      this.customerForm.set({
        firstName: '',
        lastName: '',
        email: '',
        dni: '',
        age: 18,
        phoneNumber: '',
      });
    }
    this.showCustomerForm.set(true);
  }

  async saveCustomer() {
    const form = this.customerForm();
    if (!form.firstName || !form.lastName || !form.email || !form.dni) {
      this.showError('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    try {
      const editing = this.editingItem();
      const url = editing
        ? `${this.baseUrl}customers/${editing.id}`
        : `${this.baseUrl}customers`;

      let response: any;
      if (editing) {
        response = await firstValueFrom(this.http.put<any>(url, form));
      } else {
        response = await firstValueFrom(this.http.post<any>(url, form));
      }

      if (response && response.success) {
        this.showSuccess(
          `Customer ${editing ? 'updated' : 'created'} successfully`
        );
        this.loadCustomers();
        this.closeCustomerForm();
      } else {
        this.showError(response?.errorMessage || 'Error saving customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      this.showError('Error saving customer');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteCustomer(customerId: number) {
    const customer = this.customers().find((c) => c.id === customerId);
    if (!customer) return;

    const result = await Swal.fire({
      title: 'Delete Customer',
      text: `Are you sure you want to delete "${customer.firstName} ${customer.lastName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await firstValueFrom(
          this.http.delete<any>(`${this.baseUrl}customers/${customer.id}`)
        );
        if (response.success) {
          this.showSuccess('Customer deleted successfully');
          this.loadCustomers();
        } else {
          this.showError(response.errorMessage || 'Error deleting customer');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        this.showError('Error deleting customer');
      }
    }
  }

  closeCustomerForm() {
    this.showCustomerForm.set(false);
    this.editingItem.set(null);
  }

  // === RENTAL ORDERS ===
  async loadRentals() {
    try {
      console.log('Loading rentals...');
      const response = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}rentalorders`)
      );
      console.log('Rentals response:', response);
      if (response.success) {
        this.rentals.set(response.data);
        console.log('Rentals loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading rentals:', error);
    }
  }

  async deleteRental(rentalId: number) {
    const result = await Swal.fire({
      title: 'Delete Rental Order',
      text: `Are you sure you want to delete rental order #${rentalId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await firstValueFrom(
          this.http.delete<any>(`${this.baseUrl}rentalorders/${rentalId}`)
        );
        if (response.success) {
          this.showSuccess('Rental order deleted successfully');
          this.loadRentals();
        } else {
          this.showError(
            response.errorMessage || 'Error deleting rental order'
          );
        }
      } catch (error) {
        console.error('Error deleting rental order:', error);
        this.showError('Error deleting rental order');
      }
    }
  }

  openAddRentalForm() {
    this.isEditingRental.set(false);
    this.rentalForm.set({
      customerId: 0,
      rentalDays: 7,
      notes: '',
      bookIds: [],
      allowPartialOrder: false,
    });
    this.showRentalModal.set(true);
  }

  editRental(rental: RentalOrder) {
    this.isEditingRental.set(true);
    // Como el rental existente no tiene los mismos campos que el DTO de request,
    // creamos un formulario básico para editar
    this.rentalForm.set({
      customerId: rental.customerId,
      rentalDays: 7, // valor por defecto
      notes: '',
      bookIds: [], // extraer de details si es necesario
      allowPartialOrder: false,
    });
    this.selectedRental.set(rental);
    this.showRentalModal.set(true);
  }

  async saveRental() {
    try {
      const rental = this.rentalForm();
      if (this.isEditingRental()) {
        // Para editar, usamos PUT - aunque el backend puede no soportar edición completa
        const response = await firstValueFrom(
          this.http.put<any>(
            `${this.baseUrl}rentalorders/${this.selectedRental()?.id}`,
            rental
          )
        );
        if (response.success) {
          this.showSuccess('Rental updated successfully');
          this.showRentalModal.set(false);
          await this.loadRentals();
        }
      } else {
        const response = await firstValueFrom(
          this.http.post<any>(`${this.baseUrl}rentalorders`, rental)
        );
        if (response.success) {
          this.showSuccess('Rental created successfully');
          this.showRentalModal.set(false);
          await this.loadRentals();
        }
      }
    } catch (error) {
      console.error('Error saving rental:', error);
      this.showError('Error saving rental');
    }
  }

  addBookToRental() {
    const currentBookIds = this.rentalForm().bookIds;
    // No agregamos automáticamente, el usuario debe seleccionar un libro
    // Este método se puede usar para agregar a una lista de selección
  }

  removeBookFromRental(bookId: number) {
    const currentBookIds = this.rentalForm().bookIds;
    this.rentalForm.set({
      ...this.rentalForm(),
      bookIds: currentBookIds.filter((id) => id !== bookId),
    });
  }

  toggleBookSelection(bookId: number, event: any) {
    const isChecked = event.target.checked;
    const currentBookIds = this.rentalForm().bookIds;

    if (isChecked) {
      // Agregar el libro si no está ya en la lista
      if (!currentBookIds.includes(bookId)) {
        this.rentalForm.set({
          ...this.rentalForm(),
          bookIds: [...currentBookIds, bookId],
        });
      }
    } else {
      // Remover el libro de la lista
      this.rentalForm.set({
        ...this.rentalForm(),
        bookIds: currentBookIds.filter((id) => id !== bookId),
      });
    }
  }

  // === REPORTS ===
  async searchRentalsByDni() {
    const dni = this.searchDni.trim();
    if (!dni) {
      this.showError('Please enter a DNI');
      return;
    }

    this.isLoading.set(true);
    try {
      console.log('Searching customer by DNI:', dni);
      // Primero obtener el customer
      const customerResponse = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}customers/dni/${dni}`)
      );
      console.log('Customer response:', customerResponse);

      if (customerResponse.success) {
        const customer = customerResponse.data;

        // Ahora obtener las órdenes de renta del customer
        const rentalsResponse = await firstValueFrom(
          this.http.get<any>(`${this.baseUrl}rentalorders`)
        );
        console.log('All rentals response:', rentalsResponse);

        if (rentalsResponse.success) {
          // Filtrar las órdenes de este customer
          const customerRentals = rentalsResponse.data.filter(
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
          this.showError('Error loading rental data');
          this.rentalReport.set(null);
        }
      } else {
        this.showError('Customer not found');
        this.rentalReport.set(null);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      this.showError('Error searching customer');
      this.rentalReport.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  clearReport() {
    this.searchDni = '';
    this.rentalReport.set(null);
  }

  // === HELPERS ===
  resetForms() {
    this.showBookForm.set(false);
    this.showGenreForm.set(false);
    this.showCustomerForm.set(false);
    this.editingItem.set(null);
  }

  private showSuccess(message: string) {
    Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: '#1f2937',
      color: '#ffffff',
      customClass: {
        popup: 'dark-swal-popup',
        title: 'dark-swal-title',
      },
    });
  }

  private showError(message: string) {
    Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'dark-swal-popup',
        title: 'dark-swal-title',
      },
    });
  }
}
