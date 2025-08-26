import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Interfaces para tipado
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  // Signals para estado reactivo
  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);
  searchQuery = signal('');
  isUserMenuOpen = signal(false);
  currentTheme = signal<'cupcake' | 'dark'>('cupcake');

  // Computed signals
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  userName = computed(() => this.currentUser()?.name || '');

  constructor() {
    this.initializeTheme();
    this.checkAuthStatus();
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

  // Simular verificación de autenticación (reemplazar con servicio real)
  checkAuthStatus() {
    // TODO: Implementar con servicio de autenticación real
    const token = localStorage.getItem('authToken');
    if (token) {
      this.isAuthenticated.set(true);
      // TODO: Obtener datos del usuario desde el backend
      this.currentUser.set({
        id: '1',
        name: 'Marco Antonio',
        email: 'marco@example.com',
        role: 'admin', // Cambiar por 'user' para probar vista de usuario normal
      });
    }
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
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    localStorage.removeItem('authToken');
    console.log('User logged out');
    // TODO: Navegar a home
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
