import { api } from './api';
import type { PagedResponse, SearchResult, SearchParams } from '../types';

function toQueryString(params: SearchParams): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.entityType) qs.set('entityType', params.entityType);
  if (params.status) qs.set('status', params.status);
  if (params.workspace) qs.set('workspace', params.workspace);
  if (params.tag) qs.set('tag', params.tag);
  if (params.createdBy) qs.set('createdBy', params.createdBy);
  if (params.classification) qs.set('classification', params.classification);
  if (params.containsPii !== undefined) qs.set('containsPii', String(params.containsPii));
  if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params.dateTo) qs.set('dateTo', params.dateTo);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDesc !== undefined) qs.set('sortDesc', String(params.sortDesc));
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return qs.toString();
}

export const searchService = {
  search: (params: SearchParams) =>
    api.get<PagedResponse<SearchResult>>(`/search?${toQueryString(params)}`),

  getEntityTypes: () => api.get<string[]>('/search/entity-types'),
};
