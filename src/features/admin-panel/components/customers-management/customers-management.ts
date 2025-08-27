import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer, CustomerForm } from '../../interfaces/admin.interfaces';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-customers-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './customers-management.html',
  styleUrl: './customers-management.css',
})
export class CustomersManagement implements OnInit {
  private adminService = inject(AdminService);

  // Estado
  customers = signal<Customer[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingItem = signal<Customer | null>(null);

  // Formulario
  form = signal<CustomerForm>({
    firstName: '',
    lastName: '',
    email: '',
    dni: '',
    age: 18,
    phoneNumber: '',
  });

  // Computed properties
  filteredCustomers = computed(() =>
    this.customers().filter((customer) => customer.status === 1)
  );

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const customersResult = await this.adminService.getCustomersWithPagination(1, 50);
      if (customersResult.success) {
        this.customers.set(customersResult.data);
      } else {
        this.customers.set([]);
        this.adminService.showError('Error loading customers');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.adminService.showError('Error loading data');
      this.customers.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  openForm(customer?: Customer) {
    if (customer) {
      this.editingItem.set(customer);
      this.form.set({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        dni: customer.dni,
        age: customer.age,
        phoneNumber: customer.phoneNumber || '',
      });
    } else {
      this.editingItem.set(null);
      this.form.set({
        firstName: '',
        lastName: '',
        email: '',
        dni: '',
        age: 18,
        phoneNumber: '',
      });
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingItem.set(null);
  }

  async save() {
    const formData = this.form();
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.dni
    ) {
      this.adminService.showError('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    try {
      const editing = this.editingItem();
      let response: any;

      if (editing) {
        response = await this.adminService.updateCustomer(editing.id, formData);
      } else {
        response = await this.adminService.createCustomer(formData);
      }

      if (response && response.success) {
        this.adminService.showSuccess(
          `Customer ${editing ? 'updated' : 'created'} successfully`
        );
        await this.loadData();
        this.closeForm();
      } else {
        this.adminService.showError(
          response?.errorMessage || 'Error saving customer'
        );
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      this.adminService.showError('Error saving customer');
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(customerId: number) {
    const customer = this.customers().find((c) => c.id === customerId);
    if (!customer) return;

    const confirmed = await this.adminService.confirmDelete(
      'Delete Customer',
      `Are you sure you want to delete "${customer.firstName} ${customer.lastName}"?`
    );

    if (confirmed) {
      try {
        const response = await this.adminService.deleteCustomer(customer.id);
        if (response.success) {
          this.adminService.showSuccess('Customer deleted successfully');
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error deleting customer'
          );
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        this.adminService.showError('Error deleting customer');
      }
    }
  }
}
