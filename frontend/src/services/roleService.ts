import { api } from './api';
import type { Role } from '../types';

export const roleService = {
  getAll: () => api.get<Role[]>('/roles'),
  create: (name: string, description: string) =>
    api.post<Role>('/roles', { name, description }),
  delete: (name: string) => api.delete(`/roles/${name}`),
};
