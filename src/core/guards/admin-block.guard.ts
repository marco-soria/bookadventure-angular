import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const adminBlockGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si es admin, redirigir al admin panel
  if (authService.isAdmin()) {
    router.navigate(['/admin']);
    return false;
  }

  // Si no es admin, permitir acceso
  return true;
};
