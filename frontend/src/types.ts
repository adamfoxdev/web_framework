// ---- Shared types matching the .NET API DTOs ----

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
}

export interface Role {
  name: string;
  description: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  roles: string[];
  expiration: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: string[];
}

// --- Pagination & Bulk ---

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserQuery {
  search?: string;
  role?: string;
  isActive?: boolean | null;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BulkOperationResult {
  affected: number;
  total: number;
}
