export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  errorMessage?: string;
  data?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    token: string;
    expirationDate: string;
    refreshToken: string;
    refreshTokenExpirationDate: string;
    roles: string[];
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  age: number;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  success: boolean;
  errorMessage?: string;
  data?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
