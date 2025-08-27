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
    documentNumber: '',
    age: 18,
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Computed properties
  activeCustomers = computed(() =>
    this.customers().filter((customer) => customer.status === 'Active')
  );

  deletedCustomers = computed(() =>
    this.customers().filter((customer) => customer.status === 'Deleted')
  );

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // Use the customers/admin/all endpoint which already returns all customers including deleted ones
      const customersData = await this.adminService.getCustomers();
      this.customers.set(customersData);
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
        documentNumber: customer.dni, // Mapear dni a documentNumber
        age: customer.age,
        phoneNumber: customer.phoneNumber || '',
        password: '', // Password vazio para edición
        confirmPassword: '',
      });
    } else {
      this.editingItem.set(null);
      this.form.set({
        firstName: '',
        lastName: '',
        email: '',
        documentNumber: '',
        age: 18,
        phoneNumber: '',
        password: '',
        confirmPassword: '',
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
    const editing = this.editingItem();

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.documentNumber
    ) {
      this.adminService.showError('Please fill in all required fields');
      return;
    }

    // Specific field validation
    if (formData.firstName.trim().length < 2) {
      this.adminService.showError('First name must be at least 2 characters');
      return;
    }

    if (formData.lastName.trim().length < 2) {
      this.adminService.showError('Last name must be at least 2 characters');
      return;
    }

    if (formData.documentNumber.trim().length < 8) {
      this.adminService.showError(
        'Document number must be at least 8 characters'
      );
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      this.adminService.showError('Please enter a valid email');
      return;
    }

    // Age validation
    if (formData.age < 18) {
      this.adminService.showError('Age must be at least 18 years old');
      return;
    }

    if (formData.age > 120) {
      this.adminService.showError('Age cannot exceed 120 years');
      return;
    }

    // Phone validation (if provided)
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        this.adminService.showError(
          'Please enter a valid phone number (8-15 digits)'
        );
        return;
      }
    }

    // Password validation only for new customers
    if (!editing) {
      if (!formData.password || !formData.confirmPassword) {
        this.adminService.showError(
          'Password and confirm password are required for new customers'
        );
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        this.adminService.showError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        this.adminService.showError(
          'Password must be at least 6 characters long'
        );
        return;
      }
    }

    this.isLoading.set(true);
    try {
      let response: any;

      if (editing) {
        // Para edición, usar el endpoint de customers (sin password)
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          documentNumber: formData.documentNumber,
          age: formData.age,
          phoneNumber: formData.phoneNumber,
        };
        response = await this.adminService.updateCustomer(
          editing.id,
          updateData
        );
      } else {
        // Para creación, usar el endpoint de registro (con password)
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

  async restore(customerId: number) {
    const customer = this.customers().find((c) => c.id === customerId);
    if (!customer) return;

    const confirmed = await this.adminService.confirmRestore(
      'Restore Customer',
      `Are you sure you want to restore "${customer.firstName} ${customer.lastName}"?`
    );

    if (confirmed) {
      try {
        const response = await this.adminService.restoreCustomer(customer.id);
        if (response.success) {
          this.adminService.showSuccess('Customer restored successfully');
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error restoring customer'
          );
        }
      } catch (error) {
        console.error('Error restoring customer:', error);
        this.adminService.showError('Error restoring customer');
      }
    }
  }
}
