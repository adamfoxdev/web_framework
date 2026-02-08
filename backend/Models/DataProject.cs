namespace BigDataApp.Api.Models;

// ---- Data Project ----

public class DataProject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? WorkspaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft"; // Draft, Active, Archived
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<string> Tags { get; set; } = new();
    public List<Dataset> Datasets { get; set; } = new();
    public List<DataForm> Forms { get; set; } = new();
    public List<DataQualityRule> QualityRules { get; set; } = new();
}

// ---- Dataset ----

public class Dataset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;      // e.g. "S3://bucket/path", "SQL Table", "API"
    public string Format { get; set; } = "CSV";              // CSV, JSON, Parquet, SQL, API
    public long RecordCount { get; set; }
    public long SizeBytes { get; set; }
    public List<DataColumn> Columns { get; set; } = new();
    public string Status { get; set; } = "Active";           // Active, Stale, Processing, Error
    public DateTime LastRefreshed { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Data Governance Metadata
    public DatasetGovernance Governance { get; set; } = new();
    public List<CustomMetadataField> CustomMetadata { get; set; } = new();
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
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<FormField> Fields { get; set; } = new();
    public string Status { get; set; } = "Draft";            // Draft, Published, Archived
    public int SubmissionCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
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
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid? DatasetId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RuleType { get; set; } = "completeness";   // completeness, accuracy, consistency, timeliness, uniqueness, validity
    public string? Column { get; set; }
    public string Expression { get; set; } = string.Empty;   // e.g. "NOT NULL", ">= 0", "UNIQUE", "MATCHES [a-z]+"
    public string Severity { get; set; } = "error";          // error, warning, info
    public bool IsActive { get; set; } = true;
    public double? PassRate { get; set; }                     // 0.0 - 100.0
    public string? LastResult { get; set; }                   // pass, fail, error
    public DateTime? LastRunAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
