import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { BooksManagement } from './components/books-management/books-management';
import { CustomersManagement } from './components/customers-management/customers-management';
import { GenresManagement } from './components/genres-management/genres-management';
import { RentalReports } from './components/rental-reports/rental-reports';
import { RentalsManagement } from './components/rentals-management/rentals-management';

@Component({
  selector: 'app-admin-panel',
  imports: [
    CommonModule,
    BooksManagement,
    GenresManagement,
    CustomersManagement,
    RentalsManagement,
    RentalReports,
  ],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class AdminPanel implements OnInit {
  // Estado de navegación
  activeTab = signal<string>('books');

  ngOnInit() {
    console.log('AdminPanel initialized');
  }

  // Navegación de tabs
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }
}
