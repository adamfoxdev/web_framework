using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BigDataApp.Api.Models;

// ---- Data Project ----

public class DataProject
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? WorkspaceId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Active, Archived

    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Tags stored as JSON column
    public string TagsJson { get; set; } = "[]";

    [NotMapped]
    public List<string> Tags
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(TagsJson ?? "[]") ?? new();
        set => TagsJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<string>());
    }

    // Navigation
    public Workspace? Workspace { get; set; }
    public List<Dataset> Datasets { get; set; } = new();
    public List<DataForm> Forms { get; set; } = new();
    public List<DataQualityRule> QualityRules { get; set; } = new();
}

// ---- Dataset ----

public class Dataset
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProjectId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Source { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Format { get; set; } = "CSV";

    public long RecordCount { get; set; }
    public long SizeBytes { get; set; }

    // Columns stored as JSON
    public string ColumnsJson { get; set; } = "[]";

    [NotMapped]
    public List<DataColumn> Columns
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<DataColumn>>(ColumnsJson ?? "[]") ?? new();
        set => ColumnsJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<DataColumn>());
    }

    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    public DateTime LastRefreshed { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Governance metadata stored as JSON
    public string GovernanceJson { get; set; } = "{}";

    [NotMapped]
    public DatasetGovernance Governance
    {
        get => System.Text.Json.JsonSerializer.Deserialize<DatasetGovernance>(GovernanceJson ?? "{}") ?? new();
        set => GovernanceJson = System.Text.Json.JsonSerializer.Serialize(value ?? new DatasetGovernance());
    }

    // Custom metadata stored as JSON
    public string CustomMetadataJson { get; set; } = "[]";

    [NotMapped]
    public List<CustomMetadataField> CustomMetadata
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<CustomMetadataField>>(CustomMetadataJson ?? "[]") ?? new();
        set => CustomMetadataJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<CustomMetadataField>());
    }

    // Navigation
    public DataProject Project { get; set; } = null!;
}

// ---- Data Governance Metadata ----

public class DatasetGovernance
{
    public string DataOwner { get; set; } = string.Empty;           // Person/team responsible for the data
    public string DataSteward { get; set; } = string.Empty;         // Person managing data quality
    public string Classification { get; set; } = "Internal";        // Public, Internal, Confidential, Restricted
    public string SensitivityLevel { get; set; } = "Low";           // Low, Medium, High, Critical
    public bool ContainsPii { get; set; }                            // Personally Identifiable Information
    public bool ContainsPhi { get; set; }                            // Protected Health Information
    public string RetentionPolicy { get; set; } = string.Empty;     // e.g. "7 years", "90 days", "indefinite"
    public string DataDomain { get; set; } = string.Empty;          // e.g. "Customer", "Financial", "Operational"
    public string UpdateFrequency { get; set; } = string.Empty;     // Real-time, Hourly, Daily, Weekly, Monthly, Quarterly, Annually, Ad-hoc
    public double? QualityScore { get; set; }                        // 0.0 – 100.0
    public string LineageInfo { get; set; } = string.Empty;          // Origin / downstream info
    public List<string> ComplianceFrameworks { get; set; } = new();  // GDPR, HIPAA, SOX, PCI-DSS, CCPA, etc.
}

// ---- Custom Metadata Field ----

public class CustomMetadataField
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string FieldType { get; set; } = "text";              // text, number, date, boolean, url, email
}

public class DataColumn
{
    public string Name { get; set; } = string.Empty;
    public string DataType { get; set; } = "string";         // string, int, float, bool, date, datetime, json
    public bool Nullable { get; set; } = true;
    public string Description { get; set; } = string.Empty;
}

// ---- Data Form ----

public class DataForm
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProjectId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    // Fields stored as JSON
    public string FieldsJson { get; set; } = "[]";

    [NotMapped]
    public List<FormField> Fields
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<FormField>>(FieldsJson ?? "[]") ?? new();
        set => FieldsJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<FormField>());
    }

    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    public int SubmissionCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DataProject Project { get; set; } = null!;
}

public class FormField
{
    public string Name { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string FieldType { get; set; } = "text";          // text, number, date, select, checkbox, textarea, email
    public bool Required { get; set; }
    public List<string>? Options { get; set; }                // for select fields
    public string? Placeholder { get; set; }
    public string? DefaultValue { get; set; }
}

// ---- Data Quality Rule ----

public class DataQualityRule
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProjectId { get; set; }
    public Guid? DatasetId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string RuleType { get; set; } = "completeness";

    [MaxLength(200)]
    public string? Column { get; set; }

    public string Expression { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Severity { get; set; } = "error";

    public bool IsActive { get; set; } = true;
    public double? PassRate { get; set; }

    [MaxLength(50)]
    public string? LastResult { get; set; }

    public DateTime? LastRunAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public DataProject Project { get; set; } = null!;
}
