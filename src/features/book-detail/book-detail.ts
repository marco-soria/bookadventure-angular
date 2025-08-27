import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { RentBookDialogComponent } from '../../shared/components/rent-book-dialog/rent-book-dialog';
import { Book } from '../../types/book';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterModule, RentBookDialogComponent],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
})
export class BookDetailComponent implements OnInit {
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  book = signal<Book | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  showRentDialog = signal(false);

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      this.loadBook(parseInt(bookId, 10));
    } else {
      this.router.navigate(['/']);
    }
  }

  private loadBook(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.bookService.getBookById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.book.set(response.data);
        } else {
          this.error.set(response.errorMessage || 'Book not found');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load book details');
        this.isLoading.set(false);
      },
    });
  }

  onImageError(event: any): void {
    event.target.src = '/booknotfound.png';
  }

  rentBook(): void {
    const currentBook = this.book();
    if (currentBook) {
      this.showRentDialog.set(true);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
