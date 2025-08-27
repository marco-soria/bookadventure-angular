import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ErrorHandlingService } from '../../../core/services/error-handling.service';
import { ApiError, HttpErrorContext } from '../../../types/error';

@Component({
  selector: 'app-error-monitor',
  imports: [CommonModule],
  template: `
    @if (showMonitor()) {
    <div class="fixed bottom-4 right-4 z-50 max-w-sm">
      <div class="bg-error text-error-content p-4 rounded-lg shadow-lg">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-sm">Error Monitor</h3>
          <button class="btn btn-xs btn-ghost" (click)="toggleMonitor()">
            ×
          </button>
        </div>

        @if (currentError()) {
        <div class="space-y-2">
          <p class="text-xs">
            <strong>Last Error:</strong> {{ currentError()?.message }}
          </p>
          <p class="text-xs opacity-80">
            Status: {{ currentError()?.statusCode }}
          </p>
          <p class="text-xs opacity-80">
            Time: {{ formatTime(currentError()?.timestamp) }}
          </p>
        </div>
        }

        <div class="flex gap-2 mt-3">
          <button class="btn btn-xs btn-ghost" (click)="showErrorHistory()">
            History ({{ errorCount() }})
          </button>
          <button class="btn btn-xs btn-ghost" (click)="clearErrors()">
            Clear
          </button>
        </div>
      </div>
    </div>
    } @if (showHistory()) {
    <div
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-base-100 text-base-content p-6 rounded-lg max-w-4xl max-h-96 overflow-auto"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold">Error History</h2>
          <button class="btn btn-sm btn-ghost" (click)="hideErrorHistory()">
            ×
          </button>
        </div>

        @if (errorHistory().length === 0) {
        <p class="text-base-content/70">No errors recorded.</p>
        } @else {
        <div class="space-y-3">
          @for (error of errorHistory(); track $index) {
          <div class="border border-base-300 p-3 rounded">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p class="font-medium">{{ error.message }}</p>
                <p class="text-sm text-base-content/70">
                  Status: {{ error.statusCode }} |
                  {{ formatTime(error.timestamp) }}
                </p>
                @if (error.context) {
                <p class="text-xs text-base-content/60 mt-1">
                  {{ error.context.method }} {{ error.context.url }}
                </p>
                }
              </div>
              <span
                class="badge badge-sm"
                [class.badge-error]="error.statusCode >= 500"
                [class.badge-warning]="
                  error.statusCode >= 400 && error.statusCode < 500
                "
                [class.badge-info]="error.statusCode < 400"
              >
                {{ error.statusCode }}
              </span>
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>
    }
  `,
  styles: [
    `
      .z-50 {
        z-index: 50;
      }
    `,
  ],
})
export class ErrorMonitorComponent implements OnInit {
  private errorHandlingService = inject(ErrorHandlingService);

  showMonitor = signal(false);
  showHistory = signal(false);
  currentError = signal<ApiError | null>(null);
  errorHistory = signal<(ApiError & { context?: HttpErrorContext })[]>([]);
  errorCount = signal(0);

  ngOnInit() {
    // Only show in development mode
    this.showMonitor.set(!this.isProduction());

    // Subscribe to errors
    this.errorHandlingService.error$.subscribe((error) => {
      if (error) {
        this.currentError.set(error);
        this.updateErrorHistory();
      }
    });
  }

  toggleMonitor() {
    this.showMonitor.set(!this.showMonitor());
  }

  showErrorHistory() {
    this.updateErrorHistory();
    this.showHistory.set(true);
  }

  hideErrorHistory() {
    this.showHistory.set(false);
  }

  clearErrors() {
    this.errorHandlingService.clearErrorHistory();
    this.currentError.set(null);
    this.updateErrorHistory();
  }

  formatTime(timestamp?: string): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  }

  private updateErrorHistory() {
    const history = this.errorHandlingService.getErrorHistory();
    this.errorHistory.set(history);
    this.errorCount.set(history.length);
  }

  private isProduction(): boolean {
    return !!(window as any)['production'] || location.hostname !== 'localhost';
  }
}
