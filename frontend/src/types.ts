// ---- Shared types matching the .NET API DTOs ----

// --- Workspaces ---

export interface Workspace {
  id: string;
  name: string;
  description: string;
  department: string;
  color: string;
  icon: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  isDefault: boolean;
  projectCount: number;
  queryCount: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  description: string;
  department: string;
  color?: string;
  icon?: string;
  members?: string[];
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  department?: string;
  color?: string;
  icon?: string;
  members?: string[];
}

export interface WorkspaceSearchParams {
  search?: string;
  department?: string;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

// --- Users ---

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

// --- Query Repository ---

export interface SavedQuery {
  id: string;
  workspaceId?: string;
  name: string;
  description: string;
  sqlText: string;
  database: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPublic: boolean;
  lastValidation: QueryValidation | null;
}

export interface QueryValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
}

export interface CreateQueryRequest {
  name: string;
  description: string;
  sqlText: string;
  database: string;
  tags?: string[];
  isPublic?: boolean;
  workspaceId?: string;
}

export interface UpdateQueryRequest {
  name?: string;
  description?: string;
  sqlText?: string;
  database?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface QuerySearchParams {
  search?: string;
  database?: string;
  tag?: string;
  createdBy?: string;
  workspaceId?: string;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

// --- Data Projects ---

export interface DataProject {
  id: string;
  workspaceId?: string;
  name: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  datasetCount: number;
  formCount: number;
  qualityRuleCount: number;
}

export interface DataProjectDetail {
  id: string;
  workspaceId?: string;
  name: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  datasets: Dataset[];
  forms: DataForm[];
  qualityRules: DataQualityRule[];
}

export interface Dataset {
  id: string;
  projectId: string;
  name: string;
  description: string;
  source: string;
  format: string;
  recordCount: number;
  sizeBytes: number;
  columns: DataColumnInfo[];
  status: string;
  lastRefreshed: string;
  createdAt: string;
  governance: DatasetGovernance;
  customMetadata: CustomMetadataField[];
}

export interface DataColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  description: string;
}

export interface DatasetGovernance {
  dataOwner: string;
  dataSteward: string;
  classification: string;         // Public, Internal, Confidential, Restricted
  sensitivityLevel: string;       // Low, Medium, High, Critical
  containsPii: boolean;
  containsPhi: boolean;
  retentionPolicy: string;
  dataDomain: string;
  updateFrequency: string;        // Real-time, Hourly, Daily, Weekly, Monthly, Quarterly, Annually, Ad-hoc
  qualityScore?: number;          // 0–100
  lineageInfo: string;
  complianceFrameworks: string[];
}

export interface CustomMetadataField {
  key: string;
  value: string;
  fieldType: string;              // text, number, date, boolean, url, email
}

export interface DataForm {
  id: string;
  projectId: string;
  name: string;
  description: string;
  fields: FormField[];
  status: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  name: string;
  label: string;
  fieldType: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

export interface DataQualityRule {
  id: string;
  projectId: string;
  datasetId?: string;
  name: string;
  description: string;
  ruleType: string;
  column?: string;
  expression: string;
  severity: string;
  isActive: boolean;
  passRate?: number;
  lastResult?: string;
  lastRunAt?: string;
  createdAt: string;
}

export interface ProjectSearchParams {
  search?: string;
  status?: string;
  tag?: string;
  workspaceId?: string;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  tags?: string[];
  workspaceId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  tags?: string[];
}

export interface CreateDatasetRequest {
  name: string;
  description: string;
  source: string;
  format: string;
  columns?: DataColumnInfo[];
}

export interface CreateFormRequest {
  name: string;
  description: string;
  fields?: FormField[];
}

export interface CreateQualityRuleRequest {
  name: string;
  description: string;
  datasetId?: string;
  ruleType: string;
  column?: string;
  expression: string;
  severity: string;
}

export interface RunQualityCheckResult {
  ruleId: string;
  ruleName: string;
  passRate: number;
  result: string;
  runAt: string;
}

// --- Advanced Search ---

export interface SearchResult {
  id: string;
  entityType: string;       // project, dataset, form, rule, query, user, workspace
  name: string;
  description: string;
  status: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  tags: string[] | null;
  parentProjectId: string | null;
  parentProjectName: string | null;
  workspaceId: string | null;
  classification: string | null;
  containsPii: boolean | null;
  dataOwner: string | null;
}

export interface SearchParams {
  q?: string;
  entityType?: string;      // comma-separated
  status?: string;
  workspace?: string;
  tag?: string;
  createdBy?: string;
  classification?: string;
  containsPii?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

// --- Record Processing ---

export interface DatasetRecord {
  rowIndex: number;
  values: Record<string, string>;
}

export interface DatasetRecordsResponse {
  datasetId: string;
  datasetName: string;
  totalRecords: number;
  columns: DataColumnInfo[];
  records: DatasetRecord[];
}

export interface ColumnFieldMapping {
  columnName: string;
  fieldName: string;
}

export interface ProcessRecordRequest {
  datasetId: string;
  formId: string;
  rowIndex: number;
  mappings: ColumnFieldMapping[];
  values: Record<string, string>;
}

export interface ProcessRecordResponse {
  submissionId: string;
  datasetId: string;
  formId: string;
  rowIndex: number;
  status: string;
  originalValues: Record<string, string>;
  submittedValues: Record<string, string>;
  processedBy: string;
  processedAt: string;
}

export interface ProcessingSessionSummary {
  projectId: string;
  datasetId: string;
  formId: string;
  totalRecords: number;
  processedCount: number;
  approvedCount: number;
  rejectedCount: number;
  flaggedCount: number;
  skippedCount: number;
  submissions: ProcessRecordResponse[];
}

// --- Record Browser / Import / Export ---

export interface ImportRecordsRequest {
  format: 'csv' | 'json';
  data: string;
}

export interface ImportRecordsResponse {
  datasetId: string;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface ExportRecordsResponse {
  datasetId: string;
  datasetName: string;
  format: string;
  data: string;
  recordCount: number;
}

export interface DeleteRecordsRequest {
  rowIndices: number[];
}

export interface DeleteRecordsResponse {
  deletedCount: number;
}

// --- Reports ---
export interface Report {
  id: string;
  workspaceId?: string;
  name: string;
  description: string;
  type: string;
  status: string;
  createdBy: string;
  querySql: string;
  schedule: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface CreateReportRequest {
  name: string;
  description: string;
  type?: string;
  querySql?: string;
  schedule?: string;
  tags?: string[];
  workspaceId?: string;
}

export interface UpdateReportRequest {
  name?: string;
  description?: string;
  type?: string;
  status?: string;
  querySql?: string;
  schedule?: string;
  tags?: string[];
}

export interface ReportSearchParams {
  search?: string;
  status?: string;
  type?: string;
  tag?: string;
  workspaceId?: string;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}
// --- Validation Types ---

export enum ValidationOperator {
  Equals = 'Equals',
  NotEquals = 'NotEquals',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  GreaterThanOrEqual = 'GreaterThanOrEqual',
  LessThanOrEqual = 'LessThanOrEqual',
  Contains = 'Contains',
  NotContains = 'NotContains',
  StartsWith = 'StartsWith',
  EndsWith = 'EndsWith',
  Matches = 'Matches',
  Between = 'Between',
  In = 'In',
  NotIn = 'NotIn',
  IsNull = 'IsNull',
  IsNotNull = 'IsNotNull',
  IsEmail = 'IsEmail',
  IsUrl = 'IsUrl',
  IsPhoneNumber = 'IsPhoneNumber',
  Length = 'Length',
  MinLength = 'MinLength',
  MaxLength = 'MaxLength',
  NumericRange = 'NumericRange',
  DateRange = 'DateRange'
}

export enum DataType {
  String = 'String',
  Integer = 'Integer',
  Decimal = 'Decimal',
  Boolean = 'Boolean',
  DateTime = 'DateTime',
  Email = 'Email',
  PhoneNumber = 'PhoneNumber',
  Url = 'Url'
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  fieldName: string;
  fieldType: DataType;
  operator: ValidationOperator;
  operatorValue?: string;
  errorMessage?: string;
  isActive: boolean;
  canAutoCorrect: boolean;
  autoCorrectAction?: string;
  createdAt: string;
}

export interface ValidationFieldResult {
  fieldName: string;
  value?: any;
  isValid: boolean;
  errorMessage?: string;
  suggestion?: string;
  failedRule?: ValidationOperator;
}

export interface ValidationRowResult {
  rowNumber: number;
  rowId: string;
  isValid: boolean;
  fieldResults: ValidationFieldResult[];
  crossFieldErrors: string[];
  hasDuplicate: boolean;
  duplicateRowNumber?: number;
}

export interface FieldProfile {
  fieldName: string;
  fieldType: DataType;
  completeness: number;
  uniqueness: number;
  nullCount: number;
  uniqueValues: number;
  minValue?: any;
  maxValue?: any;
  average?: number;
  stdDeviation?: number;
  topValues?: Record<string, number>;
}

export interface DataProfile {
  id: string;
  dataSourceName: string;
  profiledAt: string;
  totalRows: number;
  totalFields: number;
  fieldProfiles: FieldProfile[];
  potentialIssues: string[];
}

export interface ValidationReport {
  id: string;
  dataSourceName: string;
  executedAt: string;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    validityPercentage: number;
    duplicateCount: number;
  };
  results: ValidationRowResult[];
  errorSummary: Record<string, number>;
  profile?: DataProfile;
}

export interface AutoCorrectionSuggestion {
  rowNumber: number;
  fieldName: string;
  currentValue?: any;
  suggestedValue?: any;
  reason: string;
  confidence: number;
}

export interface ValidateDataRequest {
  dataSourceName: string;
  rows: Record<string, any>[];
  validationRuleIds?: string[];
  detectDuplicates?: boolean;
  duplicateCheckFields?: string[];
  generateProfile?: boolean;
  includeAutoCorrections?: boolean;
}