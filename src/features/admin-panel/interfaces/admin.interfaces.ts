export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  stock: number;
  isAvailable: boolean;
  imageUrl?: string;
  status: boolean; // Changed from number to boolean to match backend
  createdAt: string;
  updatedAt?: string;
  genreId: number;
  genreName: string; // Added to match backend response
}

export interface Genre {
  id: number;
  name: string;
  description: string;
  status: boolean; // true = Active, false = Deleted (soft deleted)
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  age: number;
  phoneNumber?: string;
  status: string; // Changed from number to string to match backend CustomerResponseDto
}

// Order Status Enum
export enum OrderStatus {
  Pending = 1,
  Active = 2,
  Returned = 3,
  Overdue = 4,
  Cancelled = 5,
}

// Order Status Helper
export const ORDER_STATUS_OPTIONS = [
  { value: OrderStatus.Pending, label: 'Pending', class: 'badge-warning' },
  { value: OrderStatus.Active, label: 'Active', class: 'badge-info' },
  { value: OrderStatus.Returned, label: 'Returned', class: 'badge-success' },
  { value: OrderStatus.Overdue, label: 'Overdue', class: 'badge-error' },
  { value: OrderStatus.Cancelled, label: 'Cancelled', class: 'badge-neutral' },
];

export interface RentalOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  returnDate?: string;
  dueDate: string;
  orderStatus: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  // Customer Information
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerDNI: string;
  // Order Details
  details: RentalOrderDetail[];
  // Summary Information
  totalBooks: number;
  activeBooks: number;
  returnedBooks: number;
  hasOverdueBooks: boolean;
}

export interface RentalOrderDetail {
  id: number;
  quantity: number;
  rentalDays: number;
  dueDate: string;
  returnDate?: string;
  isReturned: boolean;
  isOverdue: boolean;
  notes?: string;
  // Book Information
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  bookISBN?: string;
  bookImageUrl?: string;
  bookGenre?: string;
  // Rental Order Information
  rentalOrderId: number;
  rentalOrderNumber: string;
}

export interface RentalReport {
  customerDni: string;
  customerName: string;
  books: {
    title: string;
    author: string;
    rentalDate: string;
    returnDate?: string;
    isReturned: boolean;
  }[];
}

export interface BookForm {
  title: string;
  author: string;
  isbn: string;
  description: string;
  stock: number;
  genreId: number;
  imageUrl: string;
  isAvailable: boolean;
}

export interface GenreForm {
  name: string;
  status: boolean;
}

export interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string; // Cambio de dni a documentNumber para coincidir con el DTO
  age: number;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
}

export interface RentalForm {
  customerId: number;
  rentalDays: number;
  notes: string;
  bookIds: number[];
  allowPartialOrder: boolean;
}
