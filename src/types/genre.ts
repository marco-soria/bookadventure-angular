export interface Genre {
  id: number;
  name: string;
  description?: string;
  status: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GenreResponse {
  success: boolean;
  data: Genre[];
  message?: string;
  errorMessage?: string;
}
