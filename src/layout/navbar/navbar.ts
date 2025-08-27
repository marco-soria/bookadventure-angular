import {
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AuthService } from '../../core/services/auth-service';
import { BookService } from '../../core/services/book.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService = inject(AuthService);
  private bookService = inject(BookService);
  private router = inject(Router);
  private searchSubject = new Subject<string>();

  // Signals para estado reactivo
  searchQuery = signal('');
  isUserMenuOpen = signal(false);
  currentTheme = signal<'retro' | 'dark'>('retro');

  // Auth computed signals from service
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.user;
  isAdmin = this.authService.isAdmin;
  userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });
  firstName = computed(() => {
    const user = this.currentUser();
    return user ? user.firstName : '';
  });

  constructor() {
    this.initializeTheme();
    this.setupSearch();
  }

  // Setup debounced search
  setupSearch() {
    this.searchSubject
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged() // Only emit if value has changed
      )
      .subscribe((searchTerm) => {
        if (searchTerm.trim()) {
          // Navigate to home with search parameter
          this.router.navigate(['/home'], {
            queryParams: { search: searchTerm.trim() },
          });
        }
      });
  }

  // Inicializar tema según preferencia del sistema o localStorage
  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as 'retro' | 'dark' | null;

    // Si no hay tema guardado, DaisyUI maneja automáticamente con --default y --prefersdark
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Detectar preferencia del sistema
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      const theme = systemPrefersDark ? 'dark' : 'retro';
      this.currentTheme.set(theme);
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Escuchar cambios en la preferencia del sistema
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          const newTheme = e.matches ? 'dark' : 'retro';
          this.currentTheme.set(newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
        }
      });
  }

  // Métodos de navegación
  onSearch() {
    const query = this.searchQuery();
    if (query.trim()) {
      this.router.navigate(['/home'], {
        queryParams: { search: query.trim() },
      });
    }
  }

  onSearchInput() {
    // Trigger debounced search
    this.searchSubject.next(this.searchQuery());
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
    const newTheme = this.currentTheme() === 'dark' ? 'retro' : 'dark';
    this.currentTheme.set(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  // Cerrar menú cuando se hace click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown');
    if (!dropdown && this.isUserMenuOpen()) {
      this.closeUserMenu();
    }
  }
}
