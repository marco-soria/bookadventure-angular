export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  stock: number;
  imageUrl?: string;
  status: boolean;
  createdAt: string;
  updatedAt?: string;
  genreId: number;
  genreName: string;
}

export interface BookCreateRequest {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  stock: number;
  imageUrl?: string;
  genreId: number;
}

export interface BookUpdateRequest extends BookCreateRequest {
  id: number;
}
