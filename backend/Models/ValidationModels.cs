namespace BigDataApp.Api.Models;

/// <summary>
/// Field-level validation operators
/// </summary>
public enum ValidationOperator
{
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
    Contains,
    NotContains,
    StartsWith,
    EndsWith,
    Matches,
    Between,
    In,
    NotIn,
    IsNull,
    IsNotNull,
    IsEmail,
    IsUrl,
    IsPhoneNumber,
    Length,
    MinLength,
    MaxLength,
    NumericRange,
    DateRange
}

/// <summary>
/// Data types for validation
/// </summary>
public enum DataType
{
    String,
    Integer,
    Decimal,
    Boolean,
    DateTime,
    Email,
    PhoneNumber,
    Url
}

/// <summary>
/// Defines a validation rule for data
/// </summary>
public record ValidationRule(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string Description,
    int Priority,  // 1-10, higher = runs first
    string FieldName,
    DataType FieldType,
    ValidationOperator Operator,
    string? OperatorValue,  // The value to compare against
    string? ErrorMessage,
    bool IsActive,
    bool CanAutoCorrect,
    string? AutoCorrectAction,  // JSON with correction logic
    DateTime CreatedAt,
    DateTime? LastModifiedAt,
    string CreatedBy
);

/// <summary>
/// Result of validating a single field
/// </summary>
public record ValidationFieldResult(
    string FieldName,
    object? Value,
    bool IsValid,
    string? ErrorMessage,
    string? Suggestion,
    ValidationOperator? FailedRule
);

/// <summary>
/// Result of validating a single row
/// </summary>
public record ValidationRowResult(
    int RowNumber,
    string RowId,
    bool IsValid,
    List<ValidationFieldResult> FieldResults,
    List<string> CrossFieldErrors,
    bool HasDuplicate,
    int? DuplicateRowNumber
);

/// <summary>
/// Full validation report
/// </summary>
public record ValidationReport(
    Guid Id,
    Guid WorkspaceId,
    string DataSourceName,
    DateTime ExecutedAt,
    int TotalRows,
    int ValidRows,
    int InvalidRows,
    double ValidityPercentage,
    List<ValidationRowResult> RowResults,
    Dictionary<string, int> ErrorSummary,  // Field name -> error count
    List<string> DuplicateFields,
    int DuplicateCount,
    DataProfile? Profile
);

/// <summary>
/// Top value in the data (for FieldProfile)
/// </summary>
public record TopValueEntry(
    string Value,
    int Frequency
);

/// <summary>
/// Statistics about a field in the data
/// </summary>
public record FieldProfile(
    string FieldName,
    DataType FieldType,
    int TotalCount,
    int NullCount,
    double NullPercentage,
    int UniqueValues,
    double UniquenessPercentage,
    object? MinValue,  // For numeric/date fields
    object? MaxValue,
    double? Average,   // For numeric fields
    double? StdDeviation,
    List<TopValueEntry>? TopValues  // Top 10 value frequency
);

/// <summary>
/// Data profiling results
/// </summary>
public record DataProfile(
    Guid Id,
    Guid WorkspaceId,
    string DataSourceName,
    DateTime ProfiledAt,
    int TotalRows,
    int TotalFields,
    Dictionary<string, FieldProfile> FieldProfiles,
    List<string> PotentialIssues  // Flags completeness, skew, etc.
);

/// <summary>
/// Request to validate data
/// </summary>
public record ValidateDataRequest(
    string DataSourceName,
    List<Dictionary<string, object?>> Rows,
    List<Guid>? ValidationRuleIds = null,  // If null, use all active rules
    bool DetectDuplicates = true,
    string[]? DuplicateCheckFields = null,
    bool GenerateProfile = true,
    bool IncludeAutoCorrections = true
);

/// <summary>
/// Request to create a validation rule
/// </summary>
public record CreateValidationRuleRequest(
    string Name,
    string Description,
    int Priority,
    string FieldName,
    DataType FieldType,
    ValidationOperator Operator,
    string? OperatorValue,
    string? ErrorMessage,
    bool CanAutoCorrect = false,
    string? AutoCorrectAction = null
);

/// <summary>
/// Request to update a validation rule
/// </summary>
public record UpdateValidationRuleRequest(
    string? Name,
    string? Description,
    int? Priority,
    string? FieldName,
    DataType? FieldType,
    ValidationOperator? Operator,
    string? OperatorValue,
    string? ErrorMessage,
    bool? CanAutoCorrect,
    string? AutoCorrectAction,
    bool? IsActive
);

/// <summary>
/// Auto-correction suggestion
/// </summary>
public record AutoCorrectionSuggestion(
    int RowNumber,
    string FieldName,
    object? CurrentValue,
    object? SuggestedValue,
    string Reason,
    double Confidence  // 0-1, how confident the suggestion is
);
