import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { GenreService } from '../../core/services/genre.service';
import { Book } from '../../types/book';
import { Genre } from '../../types/genre';
import { BookSearchDto } from '../../types/pagination';

@Component({
  selector: 'app-home',
  imports: [RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private bookService = inject(BookService);
  private genreService = inject(GenreService);
  private route = inject(ActivatedRoute);

  books = signal<Book[]>([]);
  genres = signal<Genre[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Filters
  selectedGenre = signal<number | null>(null);
  sortOrder = signal<'asc' | 'desc'>('asc');
  searchFromNavbar = signal<string>('');

  // Pagination
  currentPage = signal(1);
  totalRecords = signal(0);
  pageSize = signal(8); // 8 books per page (4 per row x 2 rows)
  totalPages = signal(0);

  // Make Math available in template
  Math = Math;

  ngOnInit(): void {
    this.loadGenres();

    // Listen to query parameters for search from navbar
    this.route.queryParams.subscribe((params) => {
      if (params['search']) {
        this.searchFromNavbar.set(params['search']);
        this.currentPage.set(1);
        this.loadBooks();
      } else {
        this.searchFromNavbar.set('');
        this.loadBooks();
      }
    });
  }

  loadGenres(): void {
    this.genreService.getGenres().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.genres.set(response.data.filter((genre) => genre.status));
        }
      },
      error: (err) => {
        console.error('Failed to load genres:', err);
      },
    });
  }

  loadBooks(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const pagination = {
      page: this.currentPage(),
      recordsPerPage: this.pageSize(),
    };

    let request;

    // Determine which API endpoint to use based on filters
    if (this.searchFromNavbar()) {
      // Search from navbar
      const searchParams: BookSearchDto = {
        page: this.currentPage(),
        recordsPerPage: this.pageSize(),
        search: this.searchFromNavbar(),
        sortBy: 'title',
        sortDescending: false,
      };
      request = this.bookService.getBooks(searchParams);
    } else if (this.selectedGenre()) {
      // Genre + alphabetical sort (always apply sort since we have default)
      const descending = this.sortOrder() === 'desc';
      request = this.bookService.getBooksByGenreAlphabetical(
        this.selectedGenre()!,
        descending,
        pagination
      );
    } else {
      // Alphabetical sort only (default behavior)
      const descending = this.sortOrder() === 'desc';
      request = this.bookService.getBooksAlphabetical(descending, pagination);
    }

    request.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.books.set(response.data);
          this.totalRecords.set(response.totalRecords || 0);
          this.totalPages.set(
            Math.ceil((response.totalRecords || 0) / this.pageSize())
          );
        } else {
          this.error.set(response.errorMessage || 'Failed to load books');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load books');
        this.isLoading.set(false);
      },
    });
  }

  onGenreChange(): void {
    this.currentPage.set(1);
    this.loadBooks();
  }

  onSortChange(): void {
    this.currentPage.set(1);
    this.loadBooks();
  }

  clearFilters(): void {
    this.selectedGenre.set(null);
    this.sortOrder.set('asc');
    this.currentPage.set(1);
    this.loadBooks();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadBooks();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Show up to 5 page numbers
    const maxPages = 5;
    let start = Math.max(1, current - Math.floor(maxPages / 2));
    let end = Math.min(total, start + maxPages - 1);

    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  onImageError(event: any): void {
    event.target.src = '/booknotfound.png';
  }

  onRentBook(book: Book): void {
    // TODO: Implement rental functionality
    console.log('Renting book:', book.title);
    alert(`Rental functionality will be implemented soon for: ${book.title}`);
  }
}
