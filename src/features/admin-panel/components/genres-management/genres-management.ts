import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Genre, GenreForm } from '../../interfaces/admin.interfaces';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-genres-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './genres-management.html',
  styleUrl: './genres-management.css',
})
export class GenresManagement implements OnInit {
  private adminService = inject(AdminService);

  // Estado
  genres = signal<Genre[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingItem = signal<Genre | null>(null);

  // Formulario
  form = signal<GenreForm>({
    name: '',
    description: '',
  });

  // Computed properties
  filteredGenres = computed(() =>
    this.genres().filter((genre) => genre.status === 1)
  );

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const genresResult = await this.adminService.getGenresWithPagination(1, 50);
      if (genresResult.success) {
        this.genres.set(genresResult.data);
      } else {
        this.genres.set([]);
        this.adminService.showError('Error loading genres');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.adminService.showError('Error loading data');
      this.genres.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  openForm(genre?: Genre) {
    if (genre) {
      this.editingItem.set(genre);
      this.form.set({
        name: genre.name,
        description: genre.description,
      });
    } else {
      this.editingItem.set(null);
      this.form.set({
        name: '',
        description: '',
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
    if (!formData.name) {
      this.adminService.showError('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    try {
      const editing = this.editingItem();
      let response: any;

      if (editing) {
        response = await this.adminService.updateGenre(editing.id, formData);
      } else {
        response = await this.adminService.createGenre(formData);
      }

      if (response && response.success) {
        this.adminService.showSuccess(
          `Genre ${editing ? 'updated' : 'created'} successfully`
        );
        await this.loadData();
        this.closeForm();
      } else {
        this.adminService.showError(
          response?.errorMessage || 'Error saving genre'
        );
      }
    } catch (error) {
      console.error('Error saving genre:', error);
      this.adminService.showError('Error saving genre');
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(genreId: number) {
    const genre = this.genres().find((g) => g.id === genreId);
    if (!genre) return;

    const confirmed = await this.adminService.confirmDelete(
      'Delete Genre',
      `Are you sure you want to delete "${genre.name}"?`
    );

    if (confirmed) {
      try {
        const response = await this.adminService.deleteGenre(genre.id);
        if (response.success) {
          this.adminService.showSuccess('Genre deleted successfully');
          await this.loadData();
        } else {
          this.adminService.showError(
            response.errorMessage || 'Error deleting genre'
          );
        }
      } catch (error) {
        console.error('Error deleting genre:', error);
        this.adminService.showError('Error deleting genre');
      }
    }
  }
}
