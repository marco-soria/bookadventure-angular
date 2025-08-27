import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { LoginRequest } from '../../types/auth';

@Component({
  selector: 'app-login',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Signals para estado local
  showPassword = signal(false);

  // Auth state from service
  isLoading = this.authService.isLoading;
  error = this.authService.error;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      const credentials: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          if (response.success) {
            // Check for pending rental after successful login
            this.handlePendingRental();
          }
        },
        // Error handling is now managed by the error interceptor
        // No need for explicit error handling here
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((current) => !current);
  }

  clearError(): void {
    this.authService.clearError();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private handlePendingRental(): void {
    const pendingRental = sessionStorage.getItem('pendingRental');
    if (pendingRental) {
      try {
        const rentalInfo = JSON.parse(pendingRental);
        sessionStorage.removeItem('pendingRental');

        // Navigate back to the book detail page
        this.router.navigate([rentalInfo.returnUrl || '/']);
      } catch (error) {
        console.error('Error parsing pending rental info:', error);
        // Fallback navigation
        const user = this.authService.user();
        if (user?.roles?.includes('admin')) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      }
    } else {
      // Normal login flow - redirect based on role
      const user = this.authService.user();
      if (user?.roles?.includes('admin')) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  // Getters para validación
  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }
}
