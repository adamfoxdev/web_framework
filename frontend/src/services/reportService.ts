import { api } from './api';
import type { Report, CreateReportRequest, UpdateReportRequest, PagedResponse, ReportSearchParams } from '../types';

function toQueryString(query: Partial<ReportSearchParams>): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.type) params.set('type', query.type);
  if (query.tag) params.set('tag', query.tag);
  if (query.workspaceId) params.set('workspaceId', query.workspaceId);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDesc) params.set('sortDesc', 'true');
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const reportService = {
  getAll: (query: Partial<ReportSearchParams> = {}) =>
    api.get<PagedResponse<Report>>(`/reports${toQueryString(query)}`),
  getById: (id: string) => api.get<Report>(`/reports/${id}`),
  create: (data: CreateReportRequest) => api.post<Report>('/reports', data),
  update: (id: string, data: UpdateReportRequest) => api.put<Report>(`/reports/${id}`, data),
  delete: (id: string) => api.delete(`/reports/${id}`),
  run: (id: string) => api.post<Report>(`/reports/${id}/run`),
};
