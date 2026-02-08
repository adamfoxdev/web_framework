namespace BigDataApp.Api.Models;

// --- Workspace DTOs ---

public record CreateWorkspaceRequest(
    string Name,
    string Description,
    string Department,
    string? Color,
    string? Icon,
    List<string>? Members
);

public record UpdateWorkspaceRequest(
    string? Name,
    string? Description,
    string? Department,
    string? Color,
    string? Icon,
    List<string>? Members
);

public record WorkspaceResponse(
    Guid Id,
    string Name,
    string Description,
    string Department,
    string Color,
    string Icon,
    string CreatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<string> Members,
    bool IsDefault,
    int ProjectCount,
    int QueryCount
);

public record WorkspaceSearchParams(
    string? Search = null,
    string? Department = null,
    string SortBy = "name",
    bool SortDesc = false,
    int Page = 1,
    int PageSize = 25
);

// --- Auth DTOs ---

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, string Username, string[] Roles, DateTime Expiration);

// --- User DTOs ---

public record CreateUserRequest(
    string Username,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    List<string>? Roles
);

public record UpdateUserRequest(
    string? Email,
    string? FirstName,
    string? LastName,
    bool? IsActive,
    List<string>? Roles
);

public record UserResponse(
    Guid Id,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive,
    DateTime CreatedAt,
    List<string> Roles
);

// --- Paginated Response ---

public record PagedResponse<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record UserQuery(
    string? Search = null,
    string? Role = null,
    bool? IsActive = null,
    string SortBy = "username",
    bool SortDesc = false,
    int Page = 1,
    int PageSize = 50
);

// --- Bulk Operation DTOs ---

public record BulkRoleRequest(List<Guid> UserIds, List<string> Roles);

public record BulkStatusRequest(List<Guid> UserIds, bool IsActive);

public record BulkDeleteRequest(List<Guid> UserIds);

public record BulkOperationResult(int Affected, int Total);

// --- Role DTOs ---

public record CreateRoleRequest(string Name, string Description);

public record AssignRoleRequest(Guid UserId, string Role);

// --- Query Repository DTOs ---

public record CreateQueryRequest(
    string Name,
    string Description,
    string SqlText,
    string Database,
    List<string>? Tags,
    bool IsPublic = true,
    Guid? WorkspaceId = null
);

public record UpdateQueryRequest(
    string? Name,
    string? Description,
    string? SqlText,
    string? Database,
    List<string>? Tags,
    bool? IsPublic
);

public record QueryResponse(
    Guid Id,
    Guid? WorkspaceId,
    string Name,
    string Description,
    string SqlText,
    string Database,
    string CreatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<string> Tags,
    bool IsPublic,
    QueryValidationResponse? LastValidation
);

public record QueryValidationResponse(
    bool IsValid,
    List<string> Errors,
    List<string> Warnings,
    DateTime ValidatedAt
);

public record ValidateQueryRequest(string SqlText, string Database);

public record QuerySearchParams(
    string? Search = null,
    string? Database = null,
    string? Tag = null,
    string? CreatedBy = null,
    Guid? WorkspaceId = null,
    string SortBy = "updatedat",
    bool SortDesc = true,
    int Page = 1,
    int PageSize = 25
);

// --- Data Project DTOs ---

public record CreateProjectRequest(
    string Name,
    string Description,
    List<string>? Tags,
    Guid? WorkspaceId = null
);

public record UpdateProjectRequest(
    string? Name,
    string? Description,
    string? Status,
    List<string>? Tags
);

public record ProjectResponse(
    Guid Id,
    Guid? WorkspaceId,
    string Name,
    string Description,
    string Status,
    string CreatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<string> Tags,
    int DatasetCount,
    int FormCount,
    int QualityRuleCount
);

public record ProjectDetailResponse(
    Guid Id,
    Guid? WorkspaceId,
    string Name,
    string Description,
    string Status,
    string CreatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<string> Tags,
    List<DatasetResponse> Datasets,
    List<DataFormResponse> Forms,
    List<DataQualityRuleResponse> QualityRules
);

public record ProjectSearchParams(
    string? Search = null,
    string? Status = null,
    string? Tag = null,
    Guid? WorkspaceId = null,
    string SortBy = "updatedat",
    bool SortDesc = true,
    int Page = 1,
    int PageSize = 25
);

// --- Dataset DTOs ---

public record CreateDatasetRequest(
    string Name,
    string Description,
    string Source,
    string Format,
    List<DataColumnDto>? Columns,
    DatasetGovernanceDto? Governance,
    List<CustomMetadataFieldDto>? CustomMetadata
);

public record UpdateDatasetRequest(
    string? Name,
    string? Description,
    string? Source,
    string? Format,
    string? Status,
    List<DataColumnDto>? Columns,
    DatasetGovernanceDto? Governance,
    List<CustomMetadataFieldDto>? CustomMetadata
);

public record DataColumnDto(
    string Name,
    string DataType,
    bool Nullable,
    string Description
);

public record DatasetResponse(
    Guid Id,
    Guid ProjectId,
    string Name,
    string Description,
    string Source,
    string Format,
    long RecordCount,
    long SizeBytes,
    List<DataColumnDto> Columns,
    string Status,
    DateTime LastRefreshed,
    DateTime CreatedAt,
    DatasetGovernanceDto Governance,
    List<CustomMetadataFieldDto> CustomMetadata
);

// ---- Governance & Custom Metadata DTOs ----

public record DatasetGovernanceDto(
    string DataOwner,
    string DataSteward,
    string Classification,
    string SensitivityLevel,
    bool ContainsPii,
    bool ContainsPhi,
    string RetentionPolicy,
    string DataDomain,
    string UpdateFrequency,
    double? QualityScore,
    string LineageInfo,
    List<string> ComplianceFrameworks
);

public record CustomMetadataFieldDto(
    string Key,
    string Value,
    string FieldType
);

// --- Data Form DTOs ---

public record CreateFormRequest(
    string Name,
    string Description,
    List<FormFieldDto>? Fields
);

public record UpdateFormRequest(
    string? Name,
    string? Description,
    string? Status,
    List<FormFieldDto>? Fields
);

public record FormFieldDto(
    string Name,
    string Label,
    string FieldType,
    bool Required,
    List<string>? Options,
    string? Placeholder,
    string? DefaultValue
);

public record DataFormResponse(
    Guid Id,
    Guid ProjectId,
    string Name,
    string Description,
    List<FormFieldDto> Fields,
    string Status,
    int SubmissionCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

// --- Data Quality Rule DTOs ---

public record CreateQualityRuleRequest(
    string Name,
    string Description,
    Guid? DatasetId,
    string RuleType,
    string? Column,
    string Expression,
    string Severity
);

public record UpdateQualityRuleRequest(
    string? Name,
    string? Description,
    Guid? DatasetId,
    string? RuleType,
    string? Column,
    string? Expression,
    string? Severity,
    bool? IsActive
);

public record DataQualityRuleResponse(
    Guid Id,
    Guid ProjectId,
    Guid? DatasetId,
    string Name,
    string Description,
    string RuleType,
    string? Column,
    string Expression,
    string Severity,
    bool IsActive,
    double? PassRate,
    string? LastResult,
    DateTime? LastRunAt,
    DateTime CreatedAt
);

public record RunQualityCheckResponse(
    Guid RuleId,
    string RuleName,
    double PassRate,
    string Result,
    DateTime RunAt
);

// --- Record Processing DTOs ---

public record DatasetRecordResponse(
    int RowIndex,
    Dictionary<string, string> Values
);

public record DatasetRecordsResponse(
    Guid DatasetId,
    string DatasetName,
    int TotalRecords,
    List<DataColumnDto> Columns,
    List<DatasetRecordResponse> Records
);

public record ColumnFieldMapping(
    string ColumnName,
    string FieldName
);

public record ProcessRecordRequest(
    Guid DatasetId,
    Guid FormId,
    int RowIndex,
    List<ColumnFieldMapping> Mappings,
    Dictionary<string, string> Values // the submitted form values
);

public record ProcessRecordResponse(
    Guid SubmissionId,
    Guid DatasetId,
    Guid FormId,
    int RowIndex,
    string Status,           // Approved, Rejected, Flagged, Skipped
    Dictionary<string, string> OriginalValues,
    Dictionary<string, string> SubmittedValues,
    string ProcessedBy,
    DateTime ProcessedAt
);

public record ProcessingSessionSummary(
    Guid ProjectId,
    Guid DatasetId,
    Guid FormId,
    int TotalRecords,
    int ProcessedCount,
    int ApprovedCount,
    int RejectedCount,
    int FlaggedCount,
    int SkippedCount,
    List<ProcessRecordResponse> Submissions
);
