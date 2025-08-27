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

  // Estado
  books = signal<Book[]>([]);
  genres = signal<Genre[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingItem = signal<Book | null>(null);

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
  filteredBooks = computed(() =>
    this.books().filter((book) => book.status === 1)
  );

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [books, genres] = await Promise.all([
        this.adminService.getBooks(),
        this.adminService.getGenres(),
      ]);
      this.books.set(books);
      this.genres.set(genres);
    } catch (error) {
      console.error('Error loading data:', error);
      this.adminService.showError('Error loading data');
    } finally {
      this.isLoading.set(false);
    }
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
}
