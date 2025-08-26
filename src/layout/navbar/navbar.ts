import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService = inject(AuthService);

  // Signals para estado reactivo
  searchQuery = signal('');
  isUserMenuOpen = signal(false);
  currentTheme = signal<'cupcake' | 'dark'>('cupcake');

  // Auth computed signals from service
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.user;
  isAdmin = this.authService.isAdmin;
  userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  constructor() {
    this.initializeTheme();
  }

  // Inicializar tema según preferencia del sistema o localStorage
  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as
      | 'cupcake'
      | 'dark'
      | null;

    // Si no hay tema guardado, DaisyUI maneja automáticamente con --default y --prefersdark
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Detectar preferencia del sistema
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      const theme = systemPrefersDark ? 'dark' : 'cupcake';
      this.currentTheme.set(theme);
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Escuchar cambios en la preferencia del sistema
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          const newTheme = e.matches ? 'dark' : 'cupcake';
          this.currentTheme.set(newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
        }
      });
  }

  // Métodos de navegación
  onSearch() {
    const query = this.searchQuery();
    if (query.trim()) {
      console.log('Searching for:', query);
      // TODO: Implementar búsqueda
    }
  }

  updateSearchQuery(value: string) {
    this.searchQuery.set(value);
  }

  onLogout() {
    this.authService.logout();
    this.closeUserMenu();
  }

  // Toggle user menu dropdown
  toggleUserMenu() {
    this.isUserMenuOpen.update((current) => !current);
  }

  // Cerrar dropdown cuando se hace click fuera
  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  // Toggle theme (DaisyUI)
  toggleTheme() {
    const newTheme = this.currentTheme() === 'dark' ? 'cupcake' : 'dark';
    this.currentTheme.set(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
}
