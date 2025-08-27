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
  status: number;
}

export interface RentalOrder {
  id: number;
  customerId: number;
  customerName: string;
  orderDate: string;
  returnDate?: string;
  status: number;
  details: RentalDetail[];
}

export interface RentalDetail {
  id: number;
  bookTitle: string;
  rentalDate: string;
  returnDate?: string;
  isReturned: boolean;
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
  dni: string;
  age: number;
  phoneNumber: string;
}

export interface RentalForm {
  customerId: number;
  rentalDays: number;
  notes: string;
  bookIds: number[];
  allowPartialOrder: boolean;
}
