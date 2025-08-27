import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserProfileService } from '../../../core/services/user-profile.service';

interface RentalOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  returnDate?: string;
  dueDate: string;
  orderStatus: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;

  // Customer Information
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerDNI: string;

  // Order Details
  details?: {
    id: number;
    quantity: number;
    rentalDays: number;
    dueDate: string;
    returnDate?: string;
    isReturned: boolean;
    isOverdue: boolean;
    notes?: string;

    // Book Information
    bookId: number;
    bookTitle: string;
    bookAuthor: string;
    bookISBN?: string;
    bookImageUrl?: string;
    bookGenre?: string;

    // Rental Order Information
    rentalOrderId: number;
    rentalOrderNumber: string;
  }[];

  // Summary Information
  totalBooks: number;
  activeBooks: number;
  returnedBooks: number;
  hasOverdueBooks: boolean;
}

@Component({
  selector: 'app-rentals',
  imports: [RouterModule],
  templateUrl: './rentals.html',
  styleUrl: './rentals.css',
})
export class RentalsComponent {
  private userProfileService = inject(UserProfileService);

  // Rental orders
  rentalOrders = signal<RentalOrder[]>([]);
  isLoadingOrders = signal(false);
  ordersError = signal<string | null>(null);

  loadRentalOrders(): void {
    this.isLoadingOrders.set(true);
    this.ordersError.set(null);

    console.log('Loading rental orders...');

    this.userProfileService.getMyRentalOrders().subscribe({
      next: (response) => {
        console.log('Rental orders response:', response);
        if (response.success && response.data) {
          console.log('Rental orders data:', response.data);
          this.rentalOrders.set(response.data);
        } else {
          console.error(
            'No rental orders data or unsuccessful response:',
            response
          );
          this.ordersError.set(
            response.errorMessage || 'Failed to load rental orders'
          );
        }
        this.isLoadingOrders.set(false);
      },
      error: (error) => {
        console.error('Error loading rental orders:', error);
        this.ordersError.set(error.message || 'Failed to load rental orders');
        this.isLoadingOrders.set(false);
      },
    });
  }

  calculateTotalBooks(order: RentalOrder): number {
    const total = order.details?.length || order.totalBooks || 0;
    console.log(
      `Order ${order.id} - Total books:`,
      total,
      'Details:',
      order.details
    );
    return total;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid date';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-info';
      case 'overdue':
        return 'badge-error';
      case 'cancelled':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  }
}
