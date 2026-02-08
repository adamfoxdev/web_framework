import { api } from './api';
import type { User, CreateUserRequest, UpdateUserRequest, PagedResponse, UserQuery, BulkOperationResult } from '../types';

function toQueryString(query: UserQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.role) params.set('role', query.role);
  if (query.isActive !== undefined && query.isActive !== null)
    params.set('isActive', String(query.isActive));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDesc) params.set('sortDesc', 'true');
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const userService = {
  getAll: (query: UserQuery = {}) =>
    api.get<PagedResponse<User>>(`/users${toQueryString(query)}`),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getMe: () => api.get<User>('/users/me'),
  create: (data: CreateUserRequest) => api.post<User>('/users', data),
  update: (id: string, data: UpdateUserRequest) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  assignRole: (userId: string, role: string) =>
    api.post(`/users/${userId}/roles`, { userId, role }),
  removeRole: (userId: string, role: string) =>
    api.delete(`/users/${userId}/roles/${role}`),

  // Bulk operations
  bulkAssignRoles: (userIds: string[], roles: string[]) =>
    api.post<BulkOperationResult>('/users/bulk/assign-roles', { userIds, roles }),
  bulkRemoveRoles: (userIds: string[], roles: string[]) =>
    api.post<BulkOperationResult>('/users/bulk/remove-roles', { userIds, roles }),
  bulkSetStatus: (userIds: string[], isActive: boolean) =>
    api.post<BulkOperationResult>('/users/bulk/set-status', { userIds, isActive }),
  bulkDelete: (userIds: string[]) =>
    api.post<BulkOperationResult>('/users/bulk/delete', { userIds }),
};
