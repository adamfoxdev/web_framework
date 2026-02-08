import { api } from './api';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types';

export const userService = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getMe: () => api.get<User>('/users/me'),
  create: (data: CreateUserRequest) => api.post<User>('/users', data),
  update: (id: string, data: UpdateUserRequest) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  assignRole: (userId: string, role: string) =>
    api.post(`/users/${userId}/roles`, { userId, role }),
  removeRole: (userId: string, role: string) =>
    api.delete(`/users/${userId}/roles/${role}`),
};
