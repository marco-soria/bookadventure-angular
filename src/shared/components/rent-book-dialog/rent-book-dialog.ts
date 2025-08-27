import {
  Component,
  EventEmitter,
  Input,
  Output,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth-service';
import { RentalOrderService } from '../../../core/services/rental-order.service';
import { Book } from '../../../types/book';

@Component({
  selector: 'app-rent-book-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './rent-book-dialog.html',
  styleUrl: './rent-book-dialog.css',
})
export class RentBookDialogComponent {
  private rentalOrderService = inject(RentalOrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Inputs
  @Input() book: Book | null = null;
  @Input() isOpen: boolean = false;

  // Outputs
  @Output() closeDialog = new EventEmitter<void>();

  // Signals for component state
  isLoading = signal(false);
  rentalDays = signal(7); // Default 7 days
  notes = signal('');

  // Auth state from service
  isAuthenticated = this.authService.isAuthenticated;

  constructor() {
    // Effect to handle authentication check when dialog opens
    effect(() => {
      if (this.isOpen && this.book && !this.isAuthenticated()) {
        this.handleUnauthenticatedUser();
      }
    });
  }

  // Computed values - App is free, no cost calculation needed
  // totalCost = computed(() => {
  //   return this.rentalDays() * 2; // Removed as the app should be free
  // });

  // Preset rental days options
  rentalOptions = [
    { days: 7, label: '1 Week' },
    { days: 14, label: '2 Weeks' },
    { days: 21, label: '3 Weeks' },
    { days: 30, label: '1 Month' },
  ];

  private handleUnauthenticatedUser(): void {
    if (!this.book) return;

    // Show login required dialog and redirect
    Swal.fire({
      icon: 'info',
      title: 'Login Required',
      text: 'You need to be logged in to rent books. You will be redirected to the login page.',
      confirmButtonText: 'Go to Login',
      confirmButtonColor: '#8B5CF6',
    }).then((result) => {
      if (result.isConfirmed && this.book) {
        // Store the current book info in session for after login
        sessionStorage.setItem(
          'pendingRental',
          JSON.stringify({
            bookId: this.book.id,
            bookTitle: this.book.title,
            returnUrl: `/book/${this.book.id}`,
          })
        );
        this.router.navigate(['/login']);
      }
      this.close();
    });
  }

  close() {
    this.closeDialog.emit();
    this.notes.set('');
    this.rentalDays.set(7);
  }

  selectRentalDays(days: number) {
    // Ensure positive values only
    if (days > 0) {
      this.rentalDays.set(days);
    }
  }

  // Method to handle custom days input validation
  onCustomDaysChange(event: any) {
    const value = parseInt(event.target.value, 10);
    if (value > 0 && value <= 90) {
      this.rentalDays.set(value);
    } else if (value < 1) {
      // Reset to minimum value
      this.rentalDays.set(1);
      event.target.value = 1;
    } else if (value > 90) {
      // Reset to maximum value
      this.rentalDays.set(90);
      event.target.value = 90;
    }
  }

  async confirmRental() {
    if (!this.book) return;

    this.isLoading.set(true);

    try {
      const response = (await this.rentalOrderService
        .rentSingleBookForCurrentUser(
          this.book.id,
          this.rentalDays(),
          this.notes() || undefined
        )
        .toPromise()) as any;

      if (response?.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Book Rented Successfully!',
          text: `"${
            this.book.title
          }" has been rented for ${this.rentalDays()} days.`,
          confirmButtonText: 'Great!',
          confirmButtonColor: '#28a745',
        });
        this.close();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Rental Failed',
          text:
            response?.errorMessage ||
            'Unable to rent the book. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error?.error?.message ||
          'An unexpected error occurred. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545',
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}
