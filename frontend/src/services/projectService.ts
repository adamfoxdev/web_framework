import { api } from './api';
import type {
  DataProject,
  DataProjectDetail,
  Dataset,
  DataForm,
  DataQualityRule,
  PagedResponse,
  ProjectSearchParams,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateDatasetRequest,
  CreateFormRequest,
  CreateQualityRuleRequest,
  RunQualityCheckResult,
  DatasetRecordsResponse,
  ProcessRecordRequest,
  ProcessRecordResponse,
  ProcessingSessionSummary,
  ImportRecordsRequest,
  ImportRecordsResponse,
  ExportRecordsResponse,
  DeleteRecordsRequest,
  DeleteRecordsResponse,
} from '../types';

function toQS(params: ProjectSearchParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.tag) qs.set('tag', params.tag);
  if (params.workspaceId) qs.set('workspaceId', params.workspaceId);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDesc) qs.set('sortDesc', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const projectService = {
  // Projects
  search: (params: ProjectSearchParams = {}) =>
    api.get<PagedResponse<DataProject>>(`/projects${toQS(params)}`),
  getById: (id: string) =>
    api.get<DataProjectDetail>(`/projects/${id}`),
  create: (data: CreateProjectRequest) =>
    api.post<DataProjectDetail>('/projects', data),
  update: (id: string, data: UpdateProjectRequest) =>
    api.put<DataProjectDetail>(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/projects/${id}`),

  // Datasets
  createDataset: (projectId: string, data: CreateDatasetRequest) =>
    api.post<Dataset>(`/projects/${projectId}/datasets`, data),
  updateDataset: (projectId: string, datasetId: string, data: Partial<Dataset>) =>
    api.put<Dataset>(`/projects/${projectId}/datasets/${datasetId}`, data),
  deleteDataset: (projectId: string, datasetId: string) =>
    api.delete(`/projects/${projectId}/datasets/${datasetId}`),

  // Forms
  createForm: (projectId: string, data: CreateFormRequest) =>
    api.post<DataForm>(`/projects/${projectId}/forms`, data),
  updateForm: (projectId: string, formId: string, data: Partial<DataForm>) =>
    api.put<DataForm>(`/projects/${projectId}/forms/${formId}`, data),
  deleteForm: (projectId: string, formId: string) =>
    api.delete(`/projects/${projectId}/forms/${formId}`),

  // Quality Rules
  createQualityRule: (projectId: string, data: CreateQualityRuleRequest) =>
    api.post<DataQualityRule>(`/projects/${projectId}/quality-rules`, data),
  updateQualityRule: (projectId: string, ruleId: string, data: Partial<DataQualityRule>) =>
    api.put<DataQualityRule>(`/projects/${projectId}/quality-rules/${ruleId}`, data),
  deleteQualityRule: (projectId: string, ruleId: string) =>
    api.delete(`/projects/${projectId}/quality-rules/${ruleId}`),
  runQualityCheck: (projectId: string, ruleId: string) =>
    api.post<RunQualityCheckResult>(`/projects/${projectId}/quality-rules/${ruleId}/run`, {}),

  // Lookups
  getStatuses: () => api.get<string[]>('/projects/statuses'),
  getFormats: () => api.get<string[]>('/projects/formats'),
  getRuleTypes: () => api.get<string[]>('/projects/rule-types'),

  // Record Processing
  getRecords: (projectId: string, datasetId: string, page = 1, pageSize = 50) =>
    api.get<DatasetRecordsResponse>(`/projects/${projectId}/processing/datasets/${datasetId}/records?page=${page}&pageSize=${pageSize}`),
  submitRecord: (projectId: string, data: ProcessRecordRequest) =>
    api.post<ProcessRecordResponse>(`/projects/${projectId}/processing/submit`, data),
  getProcessingSummary: (projectId: string, datasetId: string, formId: string) =>
    api.get<ProcessingSessionSummary>(`/projects/${projectId}/processing/summary?datasetId=${datasetId}&formId=${formId}`),

  // Record Browser / Import / Export
  browseRecords: (projectId: string, datasetId: string, page = 1, pageSize = 50) =>
    api.get<DatasetRecordsResponse>(`/projects/${projectId}/datasets/${datasetId}/records?page=${page}&pageSize=${pageSize}`),
  importRecords: (projectId: string, datasetId: string, data: ImportRecordsRequest) =>
    api.post<ImportRecordsResponse>(`/projects/${projectId}/datasets/${datasetId}/records/import`, data),
  exportRecords: (projectId: string, datasetId: string, format: 'csv' | 'json' = 'csv') =>
    api.get<ExportRecordsResponse>(`/projects/${projectId}/datasets/${datasetId}/records/export?format=${format}`),
  deleteRecords: (projectId: string, datasetId: string, data: DeleteRecordsRequest) =>
    api.post<DeleteRecordsResponse>(`/projects/${projectId}/datasets/${datasetId}/records/delete`, data),
};
