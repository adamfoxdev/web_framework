import { api } from './api';
import type {
  Workspace,
  PagedResponse,
  WorkspaceSearchParams,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from '../types';

function toQS(params: WorkspaceSearchParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.department) qs.set('department', params.department);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDesc) qs.set('sortDesc', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const workspaceService = {
  search: (params: WorkspaceSearchParams = {}) =>
    api.get<PagedResponse<Workspace>>(`/workspaces${toQS(params)}`),

  getMyWorkspaces: () =>
    api.get<Workspace[]>('/workspaces/mine'),

  getById: (id: string) =>
    api.get<Workspace>(`/workspaces/${id}`),

  create: (data: CreateWorkspaceRequest) =>
    api.post<Workspace>('/workspaces', data),

  update: (id: string, data: UpdateWorkspaceRequest) =>
    api.put<Workspace>(`/workspaces/${id}`, data),

  delete: (id: string) =>
    api.delete(`/workspaces/${id}`),

  getDepartments: () =>
    api.get<string[]>('/workspaces/departments'),
};
