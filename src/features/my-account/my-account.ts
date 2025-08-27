import { AfterViewInit, Component, signal, ViewChild } from '@angular/core';
import { ProfileComponent } from './profile/profile';
import { RentalsComponent } from './rentals/rentals';

@Component({
  selector: 'app-my-account',
  imports: [ProfileComponent, RentalsComponent],
  templateUrl: './my-account.html',
  styleUrl: './my-account.css',
})
export class MyAccount implements AfterViewInit {
  @ViewChild('rentalsComponent') rentalsComponent?: RentalsComponent;

  // Tab management
  activeTab = signal<'profile' | 'orders'>('profile');

  ngAfterViewInit(): void {
    // ViewChild will be available here
  }

  setActiveTab(tab: 'profile' | 'orders'): void {
    this.activeTab.set(tab);
    if (tab === 'orders') {
      // Load rentals when switching to orders tab
      setTimeout(() => {
        if (this.rentalsComponent) {
          this.rentalsComponent.loadRentalOrders();
        }
      }, 100); // Small delay to ensure the component is rendered
    }
  }
}
