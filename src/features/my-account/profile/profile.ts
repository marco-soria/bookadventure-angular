import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth-service';
import {
  CustomerProfile,
  UpdateProfileRequest,
  UserProfileService,
} from '../../../core/services/user-profile.service';
import { User } from '../../../types/auth';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);

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

    console.log('Loading customer profile...');

    this.userProfileService.getProfile().subscribe({
      next: (response) => {
        console.log('Customer profile response:', response);
        if (response.success && response.data) {
          console.log('Customer profile data:', response.data);
          this.customerProfile.set(response.data);
          this.editForm.set({
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            age: response.data.age,
            phoneNumber: response.data.phoneNumber || '',
          });

          // Log the specific values that are showing as 0
          console.log('Total Rental Orders:', response.data.totalRentalOrders);
          console.log('Active Rentals:', response.data.activeRentals);
          console.log('Overdue Rentals:', response.data.overdueRentals);
        } else {
          console.error('Profile load failed:', response.errorMessage);
          this.userError.set(response.errorMessage || 'Failed to load profile');
        }
        this.isLoadingUser.set(false);
      },
      error: (error) => {
        // Error interceptor will handle the notification
        // Only handle specific business logic here if needed
        console.error('Profile load error:', error);
        this.userError.set(error.message || 'Failed to load profile');
        this.isLoadingUser.set(false);
      },
    });
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
          this.showSuccess('Profile updated successfully!');
        } else {
          this.showError(
            'Failed to update profile: ' +
              (response.errorMessage || 'Unknown error')
          );
        }
      },
      error: (error) => {
        this.showError(
          'Failed to update profile: ' + (error.message || 'Unknown error')
        );
      },
    });
  }

  // Métodos privados para SweetAlert2 con importación dinámica
  private async showSuccess(message: string) {
    const { default: Swal } = await import('sweetalert2');
    return Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      confirmButtonText: 'Great!',
      confirmButtonColor: '#28a745',
      background: 'hsl(var(--b1))',
      color: 'hsl(var(--bc))',
    });
  }

  private async showError(message: string) {
    const { default: Swal } = await import('sweetalert2');
    return Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545',
      background: 'hsl(var(--b1))',
      color: 'hsl(var(--bc))',
    });
  }
}
