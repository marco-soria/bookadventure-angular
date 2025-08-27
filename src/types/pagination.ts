export interface PaginationDto {
  page?: number;
  recordsPerPage?: number;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface BookSearchDto extends PaginationDto {
  genreId?: number;
  author?: string;
  inStock?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  totalRecords?: number;
  message?: string;
  errorMessage?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
