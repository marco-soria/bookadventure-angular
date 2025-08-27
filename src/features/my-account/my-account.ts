import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import {
  CustomerProfile,
  UpdateProfileRequest,
  UserProfileService,
} from '../../core/services/user-profile.service';
import { User } from '../../types/auth';

interface RentalOrder {
  id: number;
  orderDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  rentalOrderDetails?: {
    id: number;
    bookId: number;
    bookTitle: string;
    bookAuthor: string;
    rentalDays: number;
    pricePerDay: number;
    subtotal: number;
  }[];
}

@Component({
  selector: 'app-my-account',
  imports: [FormsModule, RouterModule],
  templateUrl: './my-account.html',
  styleUrl: './my-account.css',
})
export class MyAccount implements OnInit {
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);

  // Tab management
  activeTab = signal<'profile' | 'orders'>('profile');

  // User data
  user = signal<User | null>(null);
  customerProfile = signal<CustomerProfile | null>(null);
  isLoadingUser = signal(false);
  userError = signal<string | null>(null);

  // Edit mode for profile
  isEditing = signal(false);
  editForm = signal({
    firstName: '',
    lastName: '',
    age: 0,
    phoneNumber: '',
  });

  // Rental orders
  rentalOrders = signal<RentalOrder[]>([]);
  isLoadingOrders = signal(false);
  ordersError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadCustomerProfile();
  }

  private loadUserProfile(): void {
    const currentUser = this.authService.user();
    if (currentUser) {
      this.user.set(currentUser);
    }
  }

  private loadCustomerProfile(): void {
    this.isLoadingUser.set(true);
    this.userError.set(null);

    this.userProfileService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerProfile.set(response.data);
          this.editForm.set({
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            age: response.data.age,
            phoneNumber: response.data.phoneNumber || '',
          });
        } else {
          this.userError.set(response.errorMessage || 'Failed to load profile');
        }
        this.isLoadingUser.set(false);
      },
      error: (error) => {
        this.userError.set(error.message || 'Failed to load profile');
        this.isLoadingUser.set(false);
      },
    });
  }

  setActiveTab(tab: 'profile' | 'orders'): void {
    this.activeTab.set(tab);
    if (tab === 'orders' && this.rentalOrders().length === 0) {
      this.loadRentalOrders();
    }
  }

  toggleEditMode(): void {
    if (this.isEditing()) {
      // Cancel editing - restore original values
      const profile = this.customerProfile();
      if (profile) {
        this.editForm.set({
          firstName: profile.firstName,
          lastName: profile.lastName,
          age: profile.age,
          phoneNumber: profile.phoneNumber || '',
        });
      }
    }
    this.isEditing.set(!this.isEditing());
  }

  saveProfile(): void {
    const updateRequest: UpdateProfileRequest = {
      firstName: this.editForm().firstName,
      lastName: this.editForm().lastName,
      age: this.editForm().age,
      phoneNumber: this.editForm().phoneNumber || undefined,
    };

    this.userProfileService.updateProfile(updateRequest).subscribe({
      next: (response) => {
        if (response.success) {
          // Reload the profile to get updated data
          this.loadCustomerProfile();
          this.isEditing.set(false);
          alert('Profile updated successfully!');
        } else {
          alert(
            'Failed to update profile: ' +
              (response.errorMessage || 'Unknown error')
          );
        }
      },
      error: (error) => {
        alert(
          'Failed to update profile: ' + (error.message || 'Unknown error')
        );
      },
    });
  }

  private loadRentalOrders(): void {
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

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
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

  calculateTotalBooks(order: RentalOrder): number {
    return order.rentalOrderDetails?.length || 0;
  }
}
