import { api } from './api';
import type {
  SavedQuery,
  CreateQueryRequest,
  UpdateQueryRequest,
  PagedResponse,
  QuerySearchParams,
  QueryValidation,
} from '../types';

function toQueryString(params: QuerySearchParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.database) qs.set('database', params.database);
  if (params.tag) qs.set('tag', params.tag);
  if (params.createdBy) qs.set('createdBy', params.createdBy);
  if (params.workspaceId) qs.set('workspaceId', params.workspaceId);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDesc) qs.set('sortDesc', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const queryService = {
  search: (params: QuerySearchParams = {}) =>
    api.get<PagedResponse<SavedQuery>>(`/queries${toQueryString(params)}`),

  getById: (id: string) =>
    api.get<SavedQuery>(`/queries/${id}`),

  create: (data: CreateQueryRequest) =>
    api.post<SavedQuery>('/queries', data),

  update: (id: string, data: UpdateQueryRequest) =>
    api.put<SavedQuery>(`/queries/${id}`, data),

  delete: (id: string) =>
    api.delete(`/queries/${id}`),

  validate: (sqlText: string, database: string) =>
    api.post<QueryValidation>('/queries/validate', { sqlText, database }),

  getDatabases: () =>
    api.get<string[]>('/queries/databases'),

  getTags: () =>
    api.get<string[]>('/queries/tags'),
};
