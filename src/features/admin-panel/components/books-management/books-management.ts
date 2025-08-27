import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book, BookForm, Genre } from '../../interfaces/admin.interfaces';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-books-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './books-management.html',
  styleUrl: './books-management.css',
})
export class BooksManagement implements OnInit {
  private adminService = inject(AdminService);

  // Make Math available in template
  Math = Math;

  // Estado
  books = signal<Book[]>([]);
  genres = signal<Genre[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingItem = signal<Book | null>(null);

  // Paginación
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalItems = signal<number>(0);

  // Formulario
  form = signal<BookForm>({
    title: '',
    author: '',
    isbn: '',
    description: '',
    stock: 1,
    genreId: 0,
    imageUrl: '',
    isAvailable: true,
  });

  // Computed properties
  filteredBooks = computed(() => this.books());

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // Los libros ya vienen paginados del backend
  paginatedBooks = computed(() => this.books());

  // Array para los números de páginas (máximo 10 páginas visibles)
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 10) {
      // Si hay 10 páginas o menos, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas alrededor de la actual
      let start = Math.max(1, current - 4);
      let end = Math.min(total, start + 9);

      if (end - start < 9) {
        start = Math.max(1, end - 9);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [booksResult, genres] = await Promise.all([
        this.adminService.getBooksWithPagination(
          this.currentPage(),
          this.pageSize()
        ),
        this.adminService.getGenres(),
      ]);

      if (booksResult.success) {
        this.books.set(booksResult.data);
        this.totalItems.set(booksResult.totalRecords);
      } else {
        this.books.set([]);
        this.totalItems.set(0);
        this.adminService.showError('Error loading books');
      }

      this.genres.set(genres);
    } catch (error) {
      console.error('Error loading data:', error);
      this.adminService.showError('Error loading data');
      this.books.set([]);
      this.totalItems.set(0);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Métodos de paginación
  async goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      await this.loadData();
    }
  }

  async nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      await this.loadData();
    }
  }

  async prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      await this.loadData();
    }
  }

  async changePageSize(newSize: number) {
    this.pageSize.set(newSize);
    this.currentPage.set(1); // Reset to first page
    await this.loadData();
  }

  openForm(book?: Book) {
    if (book) {
      this.editingItem.set(book);
      this.form.set({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description || '',
        stock: book.stock,
        genreId: book.genreId,
        imageUrl: book.imageUrl || '',
        isAvailable: book.isAvailable,
      });
    } else {
      this.editingItem.set(null);
      this.form.set({
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
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingItem.set(null);
  }

  async save() {
    const formData = this.form();
    if (
      !formData.title ||
      !formData.author ||
      !formData.genreId ||
      formData.stock < 0
    ) {
      this.adminService.showError('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    try {
      const editing = this.editingItem();
      let response: any;

      if (editing) {
        response = await this.adminService.updateBook(editing.id, formData);
      } else {
        response = await this.adminService.createBook(formData);
      }

      if (response && response.success) {
        this.adminService.showSuccess(
          `Book ${editing ? 'updated' : 'created'} successfully`
        );
        await this.loadData();
        this.closeForm();
      } else {
        this.adminService.showError(
          response?.errorMessage || 'Error saving book'
        );
      }
    } catch (error) {
      console.error('Error saving book:', error);
      this.adminService.showError('Error saving book');
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(bookId: number) {
    const book = this.books().find((b) => b.id === bookId);
    if (!book) return;

    const confirmed = await this.adminService.confirmDelete(
      'Delete Book',
      `Are you sure you want to delete "${book.title}"?`
    );

    if (confirmed) {
      try {
        const response = await this.adminService.deleteBook(book.id);
        if (response.success) {
          this.adminService.showSuccess('Book deleted successfully');
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error deleting book'
          );
        }
      } catch (error) {
        console.error('Error deleting book:', error);
        this.adminService.showError('Error deleting book');
      }
    }
  }

  async restore(bookId: number) {
    const book = this.books().find((b) => b.id === bookId);
    if (!book) return;

    const confirmed = await this.adminService.confirmRestore(
      'Restore Book',
      `Are you sure you want to restore "${book.title}"?`
    );

    if (confirmed) {
      try {
        const response = await this.adminService.restoreBook(book.id);
        if (response.success) {
          this.adminService.showSuccess('Book restored successfully');
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error restoring book'
          );
        }
      } catch (error) {
        console.error('Error restoring book:', error);
        this.adminService.showError('Error restoring book');
      }
    }
  }
}
