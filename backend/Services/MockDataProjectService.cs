using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public class MockDataProjectService : IDataProjectService
{
    private readonly List<DataProject> _projects = new();

    public MockDataProjectService() { }

    public void SeedWithWorkspaces(List<Guid> workspaceIds)
    {
        SeedData(workspaceIds);
    }

    // ===================== SEED DATA =====================

    private void SeedData(List<Guid> workspaceIds)
    {
        // workspaceIds: 0=Engineering, 1=Marketing, 2=Finance, 3=DataScience, 4=Operations
        var p1Id = Guid.NewGuid();
        var p2Id = Guid.NewGuid();
        var p3Id = Guid.NewGuid();
        var p4Id = Guid.NewGuid();
        var p5Id = Guid.NewGuid();

        // --- Project 1: Customer Analytics → Engineering workspace ---
        var p1 = new DataProject
        {
            Id = p1Id,
            WorkspaceId = workspaceIds.Count > 0 ? workspaceIds[0] : null,
            Name = "Customer Analytics",
            Description = "Comprehensive customer behavior analysis across all channels. Tracks purchases, sessions, and lifetime value.",
            Status = "Active",
            CreatedBy = "admin",
            Tags = new() { "analytics", "customer", "production" },
            CreatedAt = DateTime.UtcNow.AddDays(-90),
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
            Datasets = new()
            {
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Customer Transactions",
                    Description = "All customer purchase transactions from POS and online",
                    Source = "s3://data-lake/transactions/", Format = "Parquet",
                    RecordCount = 12_500_000, SizeBytes = 4_800_000_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "transaction_id", DataType = "string", Nullable = false, Description = "Unique transaction identifier" },
                        new DataColumn { Name = "customer_id", DataType = "string", Nullable = false, Description = "Customer identifier" },
                        new DataColumn { Name = "amount", DataType = "float", Nullable = false, Description = "Transaction amount in USD" },
                        new DataColumn { Name = "category", DataType = "string", Nullable = true, Description = "Product category" },
                        new DataColumn { Name = "timestamp", DataType = "datetime", Nullable = false, Description = "Transaction datetime" },
                        new DataColumn { Name = "channel", DataType = "string", Nullable = true, Description = "Sales channel (online, in-store, mobile)" },
                    },
                    Governance = new DatasetGovernance
                    {
                        DataOwner = "Commerce Team", DataSteward = "Jane Smith",
                        Classification = "Confidential", SensitivityLevel = "High",
                        ContainsPii = true, ContainsPhi = false,
                        RetentionPolicy = "7 years", DataDomain = "Customer",
                        UpdateFrequency = "Real-time", QualityScore = 97.5,
                        LineageInfo = "POS systems → Kafka → S3 data lake",
                        ComplianceFrameworks = new() { "GDPR", "CCPA", "PCI-DSS" }
                    },
                    CustomMetadata = new()
                    {
                        new CustomMetadataField { Key = "Business Unit", Value = "eCommerce", FieldType = "text" },
                        new CustomMetadataField { Key = "SLA (hours)", Value = "4", FieldType = "number" },
                        new CustomMetadataField { Key = "Documentation URL", Value = "https://wiki.internal/datasets/transactions", FieldType = "url" },
                    },
                    Status = "Active", LastRefreshed = DateTime.UtcNow.AddHours(-2), CreatedAt = DateTime.UtcNow.AddDays(-90)
                },
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Customer Profiles",
                    Description = "Enriched customer profiles with demographics and preferences",
                    Source = "postgresql://analytics-db/customers", Format = "SQL",
                    RecordCount = 850_000, SizeBytes = 320_000_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "customer_id", DataType = "string", Nullable = false, Description = "Primary key" },
                        new DataColumn { Name = "email", DataType = "string", Nullable = false, Description = "Customer email" },
                        new DataColumn { Name = "segment", DataType = "string", Nullable = true, Description = "Customer segment" },
                        new DataColumn { Name = "lifetime_value", DataType = "float", Nullable = true, Description = "Calculated LTV" },
                        new DataColumn { Name = "signup_date", DataType = "date", Nullable = false, Description = "Account creation date" },
                    },
                    Governance = new DatasetGovernance
                    {
                        DataOwner = "CRM Team", DataSteward = "Jane Smith",
                        Classification = "Restricted", SensitivityLevel = "Critical",
                        ContainsPii = true, ContainsPhi = false,
                        RetentionPolicy = "5 years after account closure", DataDomain = "Customer",
                        UpdateFrequency = "Daily", QualityScore = 94.2,
                        LineageInfo = "CRM DB → ETL pipeline → Analytics DB",
                        ComplianceFrameworks = new() { "GDPR", "CCPA" }
                    },
                    CustomMetadata = new()
                    {
                        new CustomMetadataField { Key = "Primary Contact", Value = "jane.smith@company.com", FieldType = "email" },
                        new CustomMetadataField { Key = "Last Audit Date", Value = "2025-11-15", FieldType = "date" },
                    },
                    Status = "Active", LastRefreshed = DateTime.UtcNow.AddHours(-6), CreatedAt = DateTime.UtcNow.AddDays(-90)
                },
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Session Events",
                    Description = "Web and mobile session clickstream data",
                    Source = "kafka://events-cluster/sessions", Format = "JSON",
                    RecordCount = 95_000_000, SizeBytes = 28_000_000_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "session_id", DataType = "string", Nullable = false, Description = "Session identifier" },
                        new DataColumn { Name = "user_id", DataType = "string", Nullable = true, Description = "Logged-in user ID" },
                        new DataColumn { Name = "event_type", DataType = "string", Nullable = false, Description = "Event type (click, view, scroll)" },
                        new DataColumn { Name = "page_url", DataType = "string", Nullable = false, Description = "Page URL" },
                        new DataColumn { Name = "timestamp", DataType = "datetime", Nullable = false, Description = "Event timestamp" },
                    },
                    Status = "Active", LastRefreshed = DateTime.UtcNow.AddMinutes(-15), CreatedAt = DateTime.UtcNow.AddDays(-60)
                }
            },
            Forms = new()
            {
                new DataForm
                {
                    Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Customer Feedback Survey",
                    Description = "Post-purchase feedback collection form",
                    Status = "Published", SubmissionCount = 14320,
                    Fields = new()
                    {
                        new FormField { Name = "customer_id", Label = "Customer ID", FieldType = "text", Required = true },
                        new FormField { Name = "satisfaction", Label = "Overall Satisfaction", FieldType = "select", Required = true, Options = new() { "Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied" } },
                        new FormField { Name = "nps_score", Label = "NPS Score (0-10)", FieldType = "number", Required = true, Placeholder = "0-10" },
                        new FormField { Name = "comments", Label = "Additional Comments", FieldType = "textarea", Required = false, Placeholder = "Tell us more..." },
                    },
                    CreatedAt = DateTime.UtcNow.AddDays(-60), UpdatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new DataForm
                {
                    Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Data Correction Request",
                    Description = "Form for teams to submit customer data corrections",
                    Status = "Published", SubmissionCount = 234,
                    Fields = new()
                    {
                        new FormField { Name = "record_id", Label = "Record ID", FieldType = "text", Required = true },
                        new FormField { Name = "field_name", Label = "Field to Correct", FieldType = "select", Required = true, Options = new() { "email", "segment", "lifetime_value", "signup_date" } },
                        new FormField { Name = "current_value", Label = "Current Value", FieldType = "text", Required = true },
                        new FormField { Name = "correct_value", Label = "Correct Value", FieldType = "text", Required = true },
                        new FormField { Name = "justification", Label = "Justification", FieldType = "textarea", Required = true },
                    },
                    CreatedAt = DateTime.UtcNow.AddDays(-30), UpdatedAt = DateTime.UtcNow.AddDays(-2)
                }
            },
            QualityRules = new()
            {
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Customer ID Not Null", Description = "Every transaction must have a customer_id", RuleType = "completeness", Column = "customer_id", Expression = "NOT NULL", Severity = "error", IsActive = true, PassRate = 99.97, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddHours(-2) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Amount Positive", Description = "Transaction amounts must be greater than zero", RuleType = "validity", Column = "amount", Expression = "> 0", Severity = "error", IsActive = true, PassRate = 99.85, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddHours(-2) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Email Format Valid", Description = "Customer emails must match standard format", RuleType = "accuracy", Column = "email", Expression = "MATCHES ^[\\w.-]+@[\\w.-]+\\.\\w+$", Severity = "warning", IsActive = true, PassRate = 98.2, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddHours(-6) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Unique Transaction IDs", Description = "No duplicate transaction IDs should exist", RuleType = "uniqueness", Column = "transaction_id", Expression = "UNIQUE", Severity = "error", IsActive = true, PassRate = 100.0, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddHours(-2) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1Id, Name = "Fresh Session Data", Description = "Session data should not be older than 1 hour", RuleType = "timeliness", Column = "timestamp", Expression = "AGE < 1h", Severity = "warning", IsActive = true, PassRate = 95.3, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddMinutes(-15) },
            }
        };

        // --- Project 2: Revenue Reporting → Finance workspace ---
        var p2 = new DataProject
        {
            Id = p2Id,
            WorkspaceId = workspaceIds.Count > 2 ? workspaceIds[2] : null,
            Name = "Revenue Reporting",
            Description = "Monthly and quarterly revenue reports aggregated across all business units and regions.",
            Status = "Active",
            CreatedBy = "analyst1",
            Tags = new() { "finance", "reporting", "production" },
            CreatedAt = DateTime.UtcNow.AddDays(-180),
            UpdatedAt = DateTime.UtcNow.AddDays(-3),
            Datasets = new()
            {
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p2Id, Name = "Monthly Revenue",
                    Description = "Aggregated monthly revenue by region and product line",
                    Source = "data_warehouse.revenue_monthly", Format = "SQL",
                    RecordCount = 24_000, SizeBytes = 5_200_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "month", DataType = "date", Nullable = false, Description = "Report month" },
                        new DataColumn { Name = "region", DataType = "string", Nullable = false, Description = "Business region" },
                        new DataColumn { Name = "product_line", DataType = "string", Nullable = false, Description = "Product line" },
                        new DataColumn { Name = "revenue", DataType = "float", Nullable = false, Description = "Total revenue" },
                        new DataColumn { Name = "units_sold", DataType = "int", Nullable = false, Description = "Total units sold" },
                    },
                    Governance = new DatasetGovernance
                    {
                        DataOwner = "Finance Department", DataSteward = "Robert Chen",
                        Classification = "Confidential", SensitivityLevel = "High",
                        ContainsPii = false, ContainsPhi = false,
                        RetentionPolicy = "10 years", DataDomain = "Financial",
                        UpdateFrequency = "Monthly", QualityScore = 99.1,
                        LineageInfo = "ERP → Data Warehouse → Reporting Views",
                        ComplianceFrameworks = new() { "SOX", "GAAP" }
                    },
                    CustomMetadata = new()
                    {
                        new CustomMetadataField { Key = "Audit Required", Value = "true", FieldType = "boolean" },
                        new CustomMetadataField { Key = "Report Cycle", Value = "End of Month + 5 business days", FieldType = "text" },
                    },
                    Status = "Active", LastRefreshed = DateTime.UtcNow.AddDays(-1), CreatedAt = DateTime.UtcNow.AddDays(-180)
                },
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p2Id, Name = "Cost Centers",
                    Description = "Cost allocation by department and budget category",
                    Source = "s3://finance-data/cost-centers/", Format = "CSV",
                    RecordCount = 3_200, SizeBytes = 800_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "department", DataType = "string", Nullable = false, Description = "Department name" },
                        new DataColumn { Name = "budget_category", DataType = "string", Nullable = false, Description = "Budget line" },
                        new DataColumn { Name = "allocated", DataType = "float", Nullable = false, Description = "Allocated budget" },
                        new DataColumn { Name = "spent", DataType = "float", Nullable = false, Description = "Amount spent" },
                    },
                    Status = "Active", LastRefreshed = DateTime.UtcNow.AddDays(-7), CreatedAt = DateTime.UtcNow.AddDays(-180)
                }
            },
            Forms = new()
            {
                new DataForm
                {
                    Id = Guid.NewGuid(), ProjectId = p2Id, Name = "Manual Revenue Adjustment",
                    Description = "Submit manual revenue corrections for reconciliation",
                    Status = "Published", SubmissionCount = 87,
                    Fields = new()
                    {
                        new FormField { Name = "period", Label = "Reporting Period", FieldType = "date", Required = true },
                        new FormField { Name = "region", Label = "Region", FieldType = "select", Required = true, Options = new() { "North America", "Europe", "Asia Pacific", "Latin America" } },
                        new FormField { Name = "adjustment_amount", Label = "Adjustment Amount", FieldType = "number", Required = true },
                        new FormField { Name = "reason", Label = "Reason", FieldType = "textarea", Required = true },
                        new FormField { Name = "approved_by", Label = "Approved By", FieldType = "email", Required = true },
                    },
                    CreatedAt = DateTime.UtcNow.AddDays(-120), UpdatedAt = DateTime.UtcNow.AddDays(-10)
                }
            },
            QualityRules = new()
            {
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p2Id, Name = "Revenue Non-Negative", Description = "Revenue values must be >= 0", RuleType = "validity", Column = "revenue", Expression = ">= 0", Severity = "error", IsActive = true, PassRate = 100.0, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddDays(-1) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p2Id, Name = "Region Consistency", Description = "Region must be one of the predefined values", RuleType = "consistency", Column = "region", Expression = "IN (North America, Europe, Asia Pacific, Latin America)", Severity = "error", IsActive = true, PassRate = 100.0, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddDays(-1) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p2Id, Name = "Budget Not Exceeded", Description = "Spent should not exceed 120% of allocated", RuleType = "validity", Column = "spent", Expression = "<= allocated * 1.2", Severity = "warning", IsActive = true, PassRate = 94.5, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddDays(-7) },
            }
        };

        // --- Project 3: IoT Sensor Pipeline → Operations workspace ---
        var p3 = new DataProject
        {
            Id = p3Id,
            WorkspaceId = workspaceIds.Count > 4 ? workspaceIds[4] : null,
            Name = "IoT Sensor Pipeline",
            Description = "Real-time ingestion and monitoring of sensor data from manufacturing floor equipment.",
            Status = "Active",
            CreatedBy = "admin",
            Tags = new() { "iot", "real-time", "manufacturing" },
            CreatedAt = DateTime.UtcNow.AddDays(-45),
            UpdatedAt = DateTime.UtcNow.AddHours(-1),
            Datasets = new()
            {
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p3Id, Name = "Sensor Readings",
                    Description = "Raw sensor telemetry from 500+ devices",
                    Source = "kafka://iot-cluster/sensor-readings", Format = "JSON",
                    RecordCount = 450_000_000, SizeBytes = 120_000_000_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "device_id", DataType = "string", Nullable = false, Description = "Device identifier" },
                        new DataColumn { Name = "metric", DataType = "string", Nullable = false, Description = "Metric name (temp, pressure, vibration)" },
                        new DataColumn { Name = "value", DataType = "float", Nullable = false, Description = "Sensor value" },
                        new DataColumn { Name = "unit", DataType = "string", Nullable = false, Description = "Unit of measurement" },
                        new DataColumn { Name = "timestamp", DataType = "datetime", Nullable = false, Description = "Reading timestamp" },
                    },
                    Governance = new DatasetGovernance
                    {
                        DataOwner = "IoT Platform Team", DataSteward = "Mike Torres",
                        Classification = "Internal", SensitivityLevel = "Medium",
                        ContainsPii = false, ContainsPhi = false,
                        RetentionPolicy = "90 days hot, 2 years cold storage", DataDomain = "Operational",
                        UpdateFrequency = "Real-time", QualityScore = 92.8,
                        LineageInfo = "IoT Devices → Kafka → Time-Series DB + S3 Archive",
                        ComplianceFrameworks = new() { "ISO 27001" }
                    },
                    CustomMetadata = new()
                    {
                        new CustomMetadataField { Key = "Device Count", Value = "523", FieldType = "number" },
                        new CustomMetadataField { Key = "Alert Threshold (ms)", Value = "5000", FieldType = "number" },
                        new CustomMetadataField { Key = "Monitoring Dashboard", Value = "https://grafana.internal/iot", FieldType = "url" },
                    },
                    Status = "Active", LastRefreshed = DateTime.UtcNow.AddSeconds(-30), CreatedAt = DateTime.UtcNow.AddDays(-45)
                },
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p3Id, Name = "Device Registry",
                    Description = "Metadata about all registered IoT devices",
                    Source = "postgresql://iot-db/devices", Format = "SQL",
                    RecordCount = 523, SizeBytes = 150_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "device_id", DataType = "string", Nullable = false, Description = "Device identifier" },
                        new DataColumn { Name = "device_type", DataType = "string", Nullable = false, Description = "Type of sensor" },
                        new DataColumn { Name = "location", DataType = "string", Nullable = false, Description = "Factory zone" },
                        new DataColumn { Name = "installed_at", DataType = "date", Nullable = false, Description = "Installation date" },
                        new DataColumn { Name = "is_active", DataType = "bool", Nullable = false, Description = "Currently active" },
                    },
                    Status = "Active", LastRefreshed = DateTime.UtcNow.AddDays(-1), CreatedAt = DateTime.UtcNow.AddDays(-45)
                }
            },
            Forms = new()
            {
                new DataForm
                {
                    Id = Guid.NewGuid(), ProjectId = p3Id, Name = "Device Maintenance Log",
                    Description = "Log maintenance activities for IoT devices",
                    Status = "Published", SubmissionCount = 1_203,
                    Fields = new()
                    {
                        new FormField { Name = "device_id", Label = "Device ID", FieldType = "text", Required = true },
                        new FormField { Name = "maintenance_type", Label = "Type", FieldType = "select", Required = true, Options = new() { "Calibration", "Repair", "Replacement", "Inspection" } },
                        new FormField { Name = "date", Label = "Date", FieldType = "date", Required = true },
                        new FormField { Name = "technician", Label = "Technician Email", FieldType = "email", Required = true },
                        new FormField { Name = "notes", Label = "Notes", FieldType = "textarea", Required = false },
                    },
                    CreatedAt = DateTime.UtcNow.AddDays(-40), UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new DataForm
                {
                    Id = Guid.NewGuid(), ProjectId = p3Id, Name = "Anomaly Report",
                    Description = "Report anomalous sensor behavior for investigation",
                    Status = "Draft", SubmissionCount = 0,
                    Fields = new()
                    {
                        new FormField { Name = "device_id", Label = "Device ID", FieldType = "text", Required = true },
                        new FormField { Name = "anomaly_type", Label = "Anomaly Type", FieldType = "select", Required = true, Options = new() { "Spike", "Flatline", "Drift", "Missing Data" } },
                        new FormField { Name = "observed_at", Label = "Observed At", FieldType = "date", Required = true },
                        new FormField { Name = "description", Label = "Description", FieldType = "textarea", Required = true },
                    },
                    CreatedAt = DateTime.UtcNow.AddDays(-5), UpdatedAt = DateTime.UtcNow.AddDays(-5)
                }
            },
            QualityRules = new()
            {
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p3Id, Name = "Device ID Registered", Description = "All readings must come from registered devices", RuleType = "consistency", Column = "device_id", Expression = "EXISTS IN device_registry", Severity = "error", IsActive = true, PassRate = 99.99, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddMinutes(-5) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p3Id, Name = "Temperature Range", Description = "Temperature readings must be between -40 and 200°C", RuleType = "validity", Column = "value", Expression = "BETWEEN -40 AND 200 WHERE metric = 'temp'", Severity = "error", IsActive = true, PassRate = 99.92, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddMinutes(-5) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p3Id, Name = "No Stale Readings", Description = "Each device should report at least once per minute", RuleType = "timeliness", Column = "timestamp", Expression = "GAP < 60s PER device_id", Severity = "warning", IsActive = true, PassRate = 87.4, LastResult = "fail", LastRunAt = DateTime.UtcNow.AddMinutes(-5) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p3Id, Name = "Complete Telemetry", Description = "All required fields must be present", RuleType = "completeness", Expression = "ALL FIELDS NOT NULL", Severity = "error", IsActive = true, PassRate = 99.95, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddMinutes(-5) },
            }
        };

        // --- Project 4: HR Data Migration → Engineering workspace ---
        var p4 = new DataProject
        {
            Id = p4Id,
            WorkspaceId = workspaceIds.Count > 0 ? workspaceIds[0] : null,
            Name = "HR Data Migration",
            Description = "Migration of legacy HR system data to the new cloud-based HRIS platform.",
            Status = "Draft",
            CreatedBy = "admin",
            Tags = new() { "migration", "hr", "internal" },
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            UpdatedAt = DateTime.UtcNow.AddDays(-2),
            Datasets = new()
            {
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p4Id, Name = "Legacy Employee Records",
                    Description = "Export from legacy Peoplesoft system",
                    Source = "sftp://legacy-hr/exports/employees.csv", Format = "CSV",
                    RecordCount = 45_000, SizeBytes = 12_000_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "emp_id", DataType = "string", Nullable = false, Description = "Employee ID" },
                        new DataColumn { Name = "full_name", DataType = "string", Nullable = false, Description = "Full Name" },
                        new DataColumn { Name = "department", DataType = "string", Nullable = true, Description = "Department" },
                        new DataColumn { Name = "hire_date", DataType = "date", Nullable = false, Description = "Hire date" },
                        new DataColumn { Name = "salary", DataType = "float", Nullable = true, Description = "Current salary" },
                        new DataColumn { Name = "status", DataType = "string", Nullable = false, Description = "Employment status" },
                    },
                    Governance = new DatasetGovernance
                    {
                        DataOwner = "HR Department", DataSteward = "Lisa Park",
                        Classification = "Restricted", SensitivityLevel = "Critical",
                        ContainsPii = true, ContainsPhi = false,
                        RetentionPolicy = "Duration of employment + 7 years", DataDomain = "Human Resources",
                        UpdateFrequency = "Ad-hoc", QualityScore = 78.3,
                        LineageInfo = "Peoplesoft → SFTP Export → Migration Pipeline",
                        ComplianceFrameworks = new() { "GDPR", "SOX" }
                    },
                    CustomMetadata = new()
                    {
                        new CustomMetadataField { Key = "Migration Target", Value = "Workday", FieldType = "text" },
                        new CustomMetadataField { Key = "Migration Deadline", Value = "2026-06-30", FieldType = "date" },
                        new CustomMetadataField { Key = "Legacy System EOL", Value = "true", FieldType = "boolean" },
                    },
                    Status = "Stale", LastRefreshed = DateTime.UtcNow.AddDays(-10), CreatedAt = DateTime.UtcNow.AddDays(-10)
                }
            },
            Forms = new()
            {
                new DataForm
                {
                    Id = Guid.NewGuid(), ProjectId = p4Id, Name = "Data Mapping Review",
                    Description = "Review and approve field mappings from legacy to new system",
                    Status = "Draft", SubmissionCount = 0,
                    Fields = new()
                    {
                        new FormField { Name = "legacy_field", Label = "Legacy Field", FieldType = "text", Required = true },
                        new FormField { Name = "new_field", Label = "New System Field", FieldType = "text", Required = true },
                        new FormField { Name = "transform", Label = "Transformation Rule", FieldType = "textarea", Required = false },
                        new FormField { Name = "approved", Label = "Approved", FieldType = "checkbox", Required = true },
                    },
                    CreatedAt = DateTime.UtcNow.AddDays(-8), UpdatedAt = DateTime.UtcNow.AddDays(-8)
                }
            },
            QualityRules = new()
            {
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p4Id, Name = "Employee ID Format", Description = "Employee IDs must match pattern EMP-XXXXX", RuleType = "accuracy", Column = "emp_id", Expression = "MATCHES ^EMP-\\d{5}$", Severity = "error", IsActive = true, PassRate = 96.2, LastResult = "fail", LastRunAt = DateTime.UtcNow.AddDays(-2) },
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p4Id, Name = "Salary Reasonable", Description = "Salary should be between 20k and 500k", RuleType = "validity", Column = "salary", Expression = "BETWEEN 20000 AND 500000", Severity = "warning", IsActive = true, PassRate = 98.8, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddDays(-2) },
            }
        };

        // --- Project 5: Marketing Campaign Tracker → Marketing workspace ---
        var p5 = new DataProject
        {
            Id = p5Id,
            WorkspaceId = workspaceIds.Count > 1 ? workspaceIds[1] : null,
            Name = "Marketing Campaign Tracker",
            Description = "Track campaign performance, A/B test results, and attribution across channels.",
            Status = "Archived",
            CreatedBy = "analyst1",
            Tags = new() { "marketing", "campaigns", "archived" },
            CreatedAt = DateTime.UtcNow.AddDays(-365),
            UpdatedAt = DateTime.UtcNow.AddDays(-120),
            Datasets = new()
            {
                new Dataset
                {
                    Id = Guid.NewGuid(), ProjectId = p5Id, Name = "Campaign Performance",
                    Description = "Aggregated metrics from all marketing campaigns",
                    Source = "google_analytics_api", Format = "API",
                    RecordCount = 1_200, SizeBytes = 300_000,
                    Columns = new()
                    {
                        new DataColumn { Name = "campaign_id", DataType = "string", Nullable = false, Description = "Campaign identifier" },
                        new DataColumn { Name = "channel", DataType = "string", Nullable = false, Description = "Marketing channel" },
                        new DataColumn { Name = "impressions", DataType = "int", Nullable = false, Description = "Total impressions" },
                        new DataColumn { Name = "clicks", DataType = "int", Nullable = false, Description = "Total clicks" },
                        new DataColumn { Name = "conversions", DataType = "int", Nullable = false, Description = "Total conversions" },
                        new DataColumn { Name = "spend", DataType = "float", Nullable = false, Description = "Campaign spend" },
                    },
                    Status = "Stale", LastRefreshed = DateTime.UtcNow.AddDays(-120), CreatedAt = DateTime.UtcNow.AddDays(-365)
                }
            },
            Forms = new(),
            QualityRules = new()
            {
                new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p5Id, Name = "Clicks <= Impressions", Description = "Clicks cannot exceed impressions", RuleType = "validity", Column = "clicks", Expression = "<= impressions", Severity = "error", IsActive = false, PassRate = 100.0, LastResult = "pass", LastRunAt = DateTime.UtcNow.AddDays(-120) },
            }
        };

        _projects.AddRange(new[] { p1, p2, p3, p4, p5 });
    }

    // ===================== PROJECT CRUD =====================

    public PagedResponse<ProjectResponse> SearchProjects(ProjectSearchParams search)
    {
        var q = _projects.AsQueryable();

        if (search.WorkspaceId.HasValue)
            q = q.Where(p => p.WorkspaceId == search.WorkspaceId.Value);

        if (!string.IsNullOrWhiteSpace(search.Search))
        {
            var s = search.Search.ToLowerInvariant();
            q = q.Where(p => p.Name.Contains(s, StringComparison.OrdinalIgnoreCase)
                          || p.Description.Contains(s, StringComparison.OrdinalIgnoreCase)
                          || p.Tags.Any(t => t.Contains(s, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(search.Status))
            q = q.Where(p => p.Status.Equals(search.Status, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(search.Tag))
            q = q.Where(p => p.Tags.Any(t => t.Equals(search.Tag, StringComparison.OrdinalIgnoreCase)));

        q = search.SortBy?.ToLowerInvariant() switch
        {
            "name" => search.SortDesc ? q.OrderByDescending(p => p.Name) : q.OrderBy(p => p.Name),
            "status" => search.SortDesc ? q.OrderByDescending(p => p.Status) : q.OrderBy(p => p.Status),
            "createdat" => search.SortDesc ? q.OrderByDescending(p => p.CreatedAt) : q.OrderBy(p => p.CreatedAt),
            _ => search.SortDesc ? q.OrderByDescending(p => p.UpdatedAt) : q.OrderBy(p => p.UpdatedAt),
        };

        var total = q.Count();
        var items = q.Skip((search.Page - 1) * search.PageSize).Take(search.PageSize).ToList();

        return new PagedResponse<ProjectResponse>(
            items.Select(ToProjectResponse).ToList(),
            total,
            search.Page,
            search.PageSize,
            (int)Math.Ceiling(total / (double)search.PageSize)
        );
    }

    public ProjectDetailResponse? GetProjectById(Guid id)
    {
        var p = _projects.FirstOrDefault(x => x.Id == id);
        return p is null ? null : ToProjectDetailResponse(p);
    }

    public ProjectDetailResponse CreateProject(CreateProjectRequest request, string createdBy)
    {
        var p = new DataProject
        {
            Name = request.Name,
            Description = request.Description,
            CreatedBy = createdBy,
            Tags = request.Tags ?? new(),
            WorkspaceId = request.WorkspaceId
        };
        _projects.Add(p);
        return ToProjectDetailResponse(p);
    }

    public ProjectDetailResponse? UpdateProject(Guid id, UpdateProjectRequest request)
    {
        var p = _projects.FirstOrDefault(x => x.Id == id);
        if (p is null) return null;

        if (request.Name is not null) p.Name = request.Name;
        if (request.Description is not null) p.Description = request.Description;
        if (request.Status is not null) p.Status = request.Status;
        if (request.Tags is not null) p.Tags = request.Tags;
        p.UpdatedAt = DateTime.UtcNow;

        return ToProjectDetailResponse(p);
    }

    public bool DeleteProject(Guid id)
    {
        var p = _projects.FirstOrDefault(x => x.Id == id);
        if (p is null) return false;
        _projects.Remove(p);
        return true;
    }

    // ===================== DATASET CRUD =====================

    public DatasetResponse? GetDataset(Guid projectId, Guid datasetId)
    {
        var ds = _projects.FirstOrDefault(p => p.Id == projectId)?.Datasets.FirstOrDefault(d => d.Id == datasetId);
        return ds is null ? null : ToDatasetResponse(ds);
    }

    public DatasetResponse CreateDataset(Guid projectId, CreateDatasetRequest request)
    {
        var p = _projects.First(x => x.Id == projectId);
        var ds = new Dataset
        {
            ProjectId = projectId,
            Name = request.Name,
            Description = request.Description,
            Source = request.Source,
            Format = request.Format,
            Columns = request.Columns?.Select(c => new DataColumn { Name = c.Name, DataType = c.DataType, Nullable = c.Nullable, Description = c.Description }).ToList() ?? new(),
            Governance = request.Governance is not null ? ToGovernanceModel(request.Governance) : new DatasetGovernance(),
            CustomMetadata = request.CustomMetadata?.Select(ToCustomFieldModel).ToList() ?? new()
        };
        p.Datasets.Add(ds);
        p.UpdatedAt = DateTime.UtcNow;
        return ToDatasetResponse(ds);
    }

    public DatasetResponse? UpdateDataset(Guid projectId, Guid datasetId, UpdateDatasetRequest request)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var ds = p?.Datasets.FirstOrDefault(d => d.Id == datasetId);
        if (ds is null) return null;

        if (request.Name is not null) ds.Name = request.Name;
        if (request.Description is not null) ds.Description = request.Description;
        if (request.Source is not null) ds.Source = request.Source;
        if (request.Format is not null) ds.Format = request.Format;
        if (request.Status is not null) ds.Status = request.Status;
        if (request.Columns is not null) ds.Columns = request.Columns.Select(c => new DataColumn { Name = c.Name, DataType = c.DataType, Nullable = c.Nullable, Description = c.Description }).ToList();
        if (request.Governance is not null) ds.Governance = ToGovernanceModel(request.Governance);
        if (request.CustomMetadata is not null) ds.CustomMetadata = request.CustomMetadata.Select(ToCustomFieldModel).ToList();
        p!.UpdatedAt = DateTime.UtcNow;

        return ToDatasetResponse(ds);
    }

    public bool DeleteDataset(Guid projectId, Guid datasetId)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var ds = p?.Datasets.FirstOrDefault(d => d.Id == datasetId);
        if (ds is null) return false;
        p!.Datasets.Remove(ds);
        p.UpdatedAt = DateTime.UtcNow;
        return true;
    }

    // ===================== FORM CRUD =====================

    public DataFormResponse? GetForm(Guid projectId, Guid formId)
    {
        var f = _projects.FirstOrDefault(p => p.Id == projectId)?.Forms.FirstOrDefault(x => x.Id == formId);
        return f is null ? null : ToFormResponse(f);
    }

    public DataFormResponse CreateForm(Guid projectId, CreateFormRequest request)
    {
        var p = _projects.First(x => x.Id == projectId);
        var f = new DataForm
        {
            ProjectId = projectId,
            Name = request.Name,
            Description = request.Description,
            Fields = request.Fields?.Select(ToFormField).ToList() ?? new()
        };
        p.Forms.Add(f);
        p.UpdatedAt = DateTime.UtcNow;
        return ToFormResponse(f);
    }

    public DataFormResponse? UpdateForm(Guid projectId, Guid formId, UpdateFormRequest request)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var f = p?.Forms.FirstOrDefault(x => x.Id == formId);
        if (f is null) return null;

        if (request.Name is not null) f.Name = request.Name;
        if (request.Description is not null) f.Description = request.Description;
        if (request.Status is not null) f.Status = request.Status;
        if (request.Fields is not null) f.Fields = request.Fields.Select(ToFormField).ToList();
        f.UpdatedAt = DateTime.UtcNow;
        p!.UpdatedAt = DateTime.UtcNow;

        return ToFormResponse(f);
    }

    public bool DeleteForm(Guid projectId, Guid formId)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var f = p?.Forms.FirstOrDefault(x => x.Id == formId);
        if (f is null) return false;
        p!.Forms.Remove(f);
        p.UpdatedAt = DateTime.UtcNow;
        return true;
    }

    // ===================== QUALITY RULE CRUD =====================

    public DataQualityRuleResponse? GetQualityRule(Guid projectId, Guid ruleId)
    {
        var r = _projects.FirstOrDefault(p => p.Id == projectId)?.QualityRules.FirstOrDefault(x => x.Id == ruleId);
        return r is null ? null : ToRuleResponse(r);
    }

    public DataQualityRuleResponse CreateQualityRule(Guid projectId, CreateQualityRuleRequest request)
    {
        var p = _projects.First(x => x.Id == projectId);
        var r = new DataQualityRule
        {
            ProjectId = projectId,
            DatasetId = request.DatasetId,
            Name = request.Name,
            Description = request.Description,
            RuleType = request.RuleType,
            Column = request.Column,
            Expression = request.Expression,
            Severity = request.Severity
        };
        p.QualityRules.Add(r);
        p.UpdatedAt = DateTime.UtcNow;
        return ToRuleResponse(r);
    }

    public DataQualityRuleResponse? UpdateQualityRule(Guid projectId, Guid ruleId, UpdateQualityRuleRequest request)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var r = p?.QualityRules.FirstOrDefault(x => x.Id == ruleId);
        if (r is null) return null;

        if (request.Name is not null) r.Name = request.Name;
        if (request.Description is not null) r.Description = request.Description;
        if (request.DatasetId is not null) r.DatasetId = request.DatasetId;
        if (request.RuleType is not null) r.RuleType = request.RuleType;
        if (request.Column is not null) r.Column = request.Column;
        if (request.Expression is not null) r.Expression = request.Expression;
        if (request.Severity is not null) r.Severity = request.Severity;
        if (request.IsActive is not null) r.IsActive = request.IsActive.Value;
        p!.UpdatedAt = DateTime.UtcNow;

        return ToRuleResponse(r);
    }

    public bool DeleteQualityRule(Guid projectId, Guid ruleId)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var r = p?.QualityRules.FirstOrDefault(x => x.Id == ruleId);
        if (r is null) return false;
        p!.QualityRules.Remove(r);
        p.UpdatedAt = DateTime.UtcNow;
        return true;
    }

    public RunQualityCheckResponse? RunQualityCheck(Guid projectId, Guid ruleId)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var r = p?.QualityRules.FirstOrDefault(x => x.Id == ruleId);
        if (r is null) return null;

        // Simulate running a quality check
        var rng = new Random();
        r.PassRate = Math.Round(85.0 + rng.NextDouble() * 15.0, 2);
        r.LastResult = r.PassRate >= 95.0 ? "pass" : (r.PassRate >= 80.0 ? "fail" : "error");
        r.LastRunAt = DateTime.UtcNow;

        return new RunQualityCheckResponse(r.Id, r.Name, r.PassRate.Value, r.LastResult, r.LastRunAt.Value);
    }

    // ===================== RECORD PROCESSING =====================

    // In-memory store for processing submissions
    private readonly List<ProcessRecordResponse> _submissions = new();

    // Generate mock records from dataset column definitions
    public DatasetRecordsResponse? GetDatasetRecords(Guid projectId, Guid datasetId, int page = 1, int pageSize = 50)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var ds = p?.Datasets.FirstOrDefault(d => d.Id == datasetId);
        if (ds is null) return null;

        var rng = new Random(ds.Id.GetHashCode()); // deterministic per dataset
        var totalRecords = (int)Math.Min(ds.RecordCount, 200); // cap at 200 for mock
        var records = new List<DatasetRecordResponse>();

        var startIndex = (page - 1) * pageSize;
        var endIndex = Math.Min(startIndex + pageSize, totalRecords);

        for (int i = startIndex; i < endIndex; i++)
        {
            var values = new Dictionary<string, string>();
            foreach (var col in ds.Columns)
            {
                values[col.Name] = GenerateMockValue(col, i, rng);
            }
            records.Add(new DatasetRecordResponse(i, values));
        }

        return new DatasetRecordsResponse(
            ds.Id,
            ds.Name,
            totalRecords,
            ds.Columns.Select(c => new DataColumnDto(c.Name, c.DataType, c.Nullable, c.Description)).ToList(),
            records
        );
    }

    public ProcessRecordResponse? ProcessRecord(Guid projectId, ProcessRecordRequest request, string processedBy)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        if (p is null) return null;
        var ds = p.Datasets.FirstOrDefault(d => d.Id == request.DatasetId);
        var form = p.Forms.FirstOrDefault(f => f.Id == request.FormId);
        if (ds is null || form is null) return null;

        // Get original values for this row
        var recordsResponse = GetDatasetRecords(projectId, request.DatasetId, request.RowIndex / 50 + 1, 50);
        var originalRecord = recordsResponse?.Records.FirstOrDefault(r => r.RowIndex == request.RowIndex);
        var originalValues = originalRecord?.Values ?? new Dictionary<string, string>();

        // Determine status based on submitted values
        var status = request.Values.ContainsKey("_status") ? request.Values["_status"] : "Approved";

        var submission = new ProcessRecordResponse(
            Guid.NewGuid(),
            request.DatasetId,
            request.FormId,
            request.RowIndex,
            status,
            originalValues,
            request.Values,
            processedBy,
            DateTime.UtcNow
        );

        _submissions.Add(submission);

        // Increment form submission count
        form.SubmissionCount++;

        return submission;
    }

    public ProcessingSessionSummary? GetProcessingSummary(Guid projectId, Guid datasetId, Guid formId)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        if (p is null) return null;
        var ds = p.Datasets.FirstOrDefault(d => d.Id == datasetId);
        if (ds is null) return null;

        var subs = _submissions
            .Where(s => s.DatasetId == datasetId && s.FormId == formId)
            .ToList();

        var totalRecords = (int)Math.Min(ds.RecordCount, 200);

        return new ProcessingSessionSummary(
            projectId, datasetId, formId,
            totalRecords,
            subs.Count,
            subs.Count(s => s.Status == "Approved"),
            subs.Count(s => s.Status == "Rejected"),
            subs.Count(s => s.Status == "Flagged"),
            subs.Count(s => s.Status == "Skipped"),
            subs
        );
    }

    private static string GenerateMockValue(DataColumn col, int rowIndex, Random rng)
    {
        var names = new[] { "Alice Johnson", "Bob Williams", "Carlos Garcia", "Diana Chen", "Erik Müller", "Fatima Al-Rashid", "Grace Park", "Hiro Tanaka", "Irene Costa", "James O'Brien" };
        var emails = new[] { "alice.j@corp.com", "bob.w@corp.com", "carlos.g@corp.com", "diana.c@corp.com", "erik.m@corp.com", "fatima.a@corp.com", "grace.p@corp.com", "hiro.t@corp.com", "irene.c@corp.com", "james.o@corp.com" };
        var departments = new[] { "Engineering", "Marketing", "Finance", "Operations", "HR", "Sales", "Support", "Legal", "Product", "Design" };
        var statuses = new[] { "Active", "Inactive", "Pending", "Completed", "Processing" };
        var categories = new[] { "Electronics", "Clothing", "Food", "Software", "Services", "Hardware", "Books", "Health" };
        var channels = new[] { "online", "in-store", "mobile", "wholesale", "partner" };
        var regions = new[] { "North America", "Europe", "Asia Pacific", "Latin America" };
        var metrics = new[] { "temperature", "pressure", "vibration", "humidity", "flow_rate" };
        var units = new[] { "°C", "psi", "mm/s", "%", "L/min" };

        var colLower = col.Name.ToLowerInvariant();
        var seed = rowIndex * 31 + col.Name.GetHashCode();

        return col.DataType.ToLowerInvariant() switch
        {
            "int" => colLower switch
            {
                "impressions" => (10000 + (seed % 90000)).ToString(),
                "clicks" => (500 + (seed % 5000)).ToString(),
                "conversions" => (10 + (seed % 500)).ToString(),
                "units_sold" => (100 + (seed % 9000)).ToString(),
                _ => (1 + Math.Abs(seed) % 10000).ToString()
            },
            "float" => colLower switch
            {
                "amount" or "spend" => $"{10.0 + Math.Abs(seed) % 5000:F2}",
                "revenue" or "allocated" or "spent" => $"{1000.0 + Math.Abs(seed) % 100000:F2}",
                "salary" or "lifetime_value" => $"{30000.0 + Math.Abs(seed) % 170000:F2}",
                "value" => $"{Math.Abs(seed) % 200:F1}",
                _ => $"{Math.Abs(seed) % 10000:F2}"
            },
            "date" => DateTime.UtcNow.AddDays(-(Math.Abs(seed) % 730)).ToString("yyyy-MM-dd"),
            "datetime" => DateTime.UtcNow.AddMinutes(-(Math.Abs(seed) % 525600)).ToString("yyyy-MM-dd HH:mm:ss"),
            "bool" => (seed % 2 == 0) ? "true" : "false",
            _ => colLower switch
            {
                var n when n.Contains("id") && n.Contains("customer") => $"CUST-{100000 + rowIndex:D6}",
                var n when n.Contains("id") && n.Contains("transaction") => $"TXN-{200000 + rowIndex:D6}",
                var n when n.Contains("id") && n.Contains("session") => $"SES-{300000 + rowIndex:D6}",
                var n when n.Contains("id") && n.Contains("device") => $"DEV-{1000 + rowIndex:D4}",
                var n when n.Contains("id") && n.Contains("emp") => $"EMP-{10000 + rowIndex:D5}",
                var n when n.Contains("id") && n.Contains("campaign") => $"CMP-{rowIndex + 1:D4}",
                var n when n.Contains("email") => emails[Math.Abs(seed) % emails.Length],
                var n when n.Contains("name") && n.Contains("full") => names[Math.Abs(seed) % names.Length],
                var n when n.Contains("department") => departments[Math.Abs(seed) % departments.Length],
                var n when n.Contains("status") => statuses[Math.Abs(seed) % statuses.Length],
                var n when n.Contains("category") => categories[Math.Abs(seed) % categories.Length],
                var n when n.Contains("channel") => channels[Math.Abs(seed) % channels.Length],
                var n when n.Contains("region") => regions[Math.Abs(seed) % regions.Length],
                var n when n.Contains("segment") => new[] { "Premium", "Standard", "Basic", "Enterprise" }[Math.Abs(seed) % 4],
                var n when n.Contains("metric") => metrics[Math.Abs(seed) % metrics.Length],
                var n when n.Contains("unit") => units[Math.Abs(seed) % units.Length],
                var n when n.Contains("type") && n.Contains("event") => new[] { "click", "view", "scroll", "submit", "navigate" }[Math.Abs(seed) % 5],
                var n when n.Contains("type") && n.Contains("device") => new[] { "Thermostat", "Pressure Gauge", "Vibration Sensor", "Hygrometer", "Flow Meter" }[Math.Abs(seed) % 5],
                var n when n.Contains("url") => $"https://app.example.com/page/{Math.Abs(seed) % 500}",
                var n when n.Contains("location") => new[] { "Zone A", "Zone B", "Zone C", "Zone D", "Warehouse" }[Math.Abs(seed) % 5],
                var n when n.Contains("product_line") => new[] { "Enterprise SaaS", "Consumer Apps", "Platform Services", "Professional Services" }[Math.Abs(seed) % 4],
                var n when n.Contains("budget_category") => new[] { "Personnel", "Infrastructure", "Marketing", "R&D", "Operations" }[Math.Abs(seed) % 5],
                _ => $"value-{rowIndex}-{col.Name[..Math.Min(3, col.Name.Length)]}"
            }
        };
    }

    // ===================== RECORD BROWSER / IMPORT / EXPORT =====================

    // In-memory store for imported records (keyed by datasetId)
    private readonly Dictionary<Guid, List<Dictionary<string, string>>> _importedRecords = new();

    public ImportRecordsResponse? ImportRecords(Guid projectId, Guid datasetId, ImportRecordsRequest request)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var ds = p?.Datasets.FirstOrDefault(d => d.Id == datasetId);
        if (ds is null) return null;

        var errors = new List<string>();
        var imported = new List<Dictionary<string, string>>();

        try
        {
            if (request.Format.Equals("csv", StringComparison.OrdinalIgnoreCase))
            {
                var lines = request.Data.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                if (lines.Length < 2)
                {
                    errors.Add("CSV must have at least a header row and one data row");
                    return new ImportRecordsResponse(datasetId, 0, 0, errors);
                }

                var headers = lines[0].Split(',').Select(h => h.Trim().Trim('"')).ToArray();

                for (int i = 1; i < lines.Length; i++)
                {
                    var values = SplitCsvLine(lines[i]);
                    if (values.Length != headers.Length)
                    {
                        errors.Add($"Row {i}: expected {headers.Length} columns, got {values.Length}");
                        continue;
                    }
                    var row = new Dictionary<string, string>();
                    for (int j = 0; j < headers.Length; j++)
                        row[headers[j]] = values[j].Trim().Trim('"');
                    imported.Add(row);
                }
            }
            else if (request.Format.Equals("json", StringComparison.OrdinalIgnoreCase))
            {
                var rows = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, string>>>(request.Data);
                if (rows is null || rows.Count == 0)
                {
                    errors.Add("JSON must be an array of objects");
                    return new ImportRecordsResponse(datasetId, 0, 0, errors);
                }
                imported.AddRange(rows);
            }
            else
            {
                errors.Add($"Unsupported format: {request.Format}. Use 'csv' or 'json'.");
                return new ImportRecordsResponse(datasetId, 0, 0, errors);
            }
        }
        catch (Exception ex)
        {
            errors.Add($"Parse error: {ex.Message}");
            return new ImportRecordsResponse(datasetId, 0, imported.Count, errors);
        }

        // Store imported records
        if (!_importedRecords.ContainsKey(datasetId))
            _importedRecords[datasetId] = new List<Dictionary<string, string>>();
        _importedRecords[datasetId].AddRange(imported);

        // Update dataset record count and size
        ds.RecordCount += imported.Count;
        ds.SizeBytes += imported.Sum(r => r.Sum(kv => kv.Key.Length + kv.Value.Length)) * 2;

        // Auto-detect columns from first imported row if dataset has no columns
        if (ds.Columns.Count == 0 && imported.Count > 0)
        {
            ds.Columns = imported[0].Keys.Select(k => new DataColumn
            {
                Name = k,
                DataType = "string",
                Nullable = true,
                Description = $"Imported column: {k}"
            }).ToList();
        }

        return new ImportRecordsResponse(datasetId, imported.Count, errors.Count, errors);
    }

    public ExportRecordsResponse? ExportRecords(Guid projectId, Guid datasetId, string format = "csv")
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var ds = p?.Datasets.FirstOrDefault(d => d.Id == datasetId);
        if (ds is null) return null;

        // Gather all records (mock + imported), cap at 500 for export
        var allRecords = new List<Dictionary<string, string>>();

        // Get mock records (all pages)
        var mockTotal = (int)Math.Min(ds.RecordCount, 200);
        if (ds.Columns.Count > 0)
        {
            var rng = new Random(ds.Id.GetHashCode());
            for (int i = 0; i < mockTotal; i++)
            {
                var values = new Dictionary<string, string>();
                foreach (var col in ds.Columns)
                    values[col.Name] = GenerateMockValue(col, i, rng);
                allRecords.Add(values);
            }
        }

        // Add imported records
        if (_importedRecords.ContainsKey(datasetId))
            allRecords.AddRange(_importedRecords[datasetId]);

        // Cap at 500
        if (allRecords.Count > 500)
            allRecords = allRecords.Take(500).ToList();

        // Determine column names from dataset, or from record keys
        var columnNames = ds.Columns.Count > 0
            ? ds.Columns.Select(c => c.Name).ToList()
            : allRecords.Count > 0
                ? allRecords[0].Keys.ToList()
                : new List<string>();

        string data;
        if (format.Equals("json", StringComparison.OrdinalIgnoreCase))
        {
            data = System.Text.Json.JsonSerializer.Serialize(allRecords, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        }
        else
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine(string.Join(",", columnNames.Select(EscapeCsv)));
            foreach (var row in allRecords)
            {
                var vals = columnNames.Select(c => row.TryGetValue(c, out var v) ? EscapeCsv(v) : "");
                sb.AppendLine(string.Join(",", vals));
            }
            data = sb.ToString();
        }

        return new ExportRecordsResponse(datasetId, ds.Name, format, data, allRecords.Count);
    }

    public DeleteRecordsResponse? DeleteRecords(Guid projectId, Guid datasetId, DeleteRecordsRequest request)
    {
        var p = _projects.FirstOrDefault(x => x.Id == projectId);
        var ds = p?.Datasets.FirstOrDefault(d => d.Id == datasetId);
        if (ds is null) return null;

        // For mock data we just decrement the count; for imported records, actually remove them
        var deletedCount = 0;
        if (_importedRecords.ContainsKey(datasetId))
        {
            var mockTotal = (int)Math.Min(ds.RecordCount - _importedRecords[datasetId].Count, 200);
            var importedIndices = request.RowIndices.Where(i => i >= mockTotal).Select(i => i - mockTotal).OrderByDescending(i => i).ToList();
            foreach (var idx in importedIndices)
            {
                if (idx >= 0 && idx < _importedRecords[datasetId].Count)
                {
                    _importedRecords[datasetId].RemoveAt(idx);
                    deletedCount++;
                }
            }
            deletedCount += request.RowIndices.Count(i => i < mockTotal);
        }
        else
        {
            deletedCount = request.RowIndices.Count;
        }

        ds.RecordCount = Math.Max(0, ds.RecordCount - deletedCount);
        return new DeleteRecordsResponse(deletedCount);
    }

    private static string EscapeCsv(string val)
    {
        if (val.Contains(',') || val.Contains('"') || val.Contains('\n'))
            return $"\"{val.Replace("\"", "\"\"")}\"";
        return val;
    }

    private static string[] SplitCsvLine(string line)
    {
        var result = new List<string>();
        var current = new System.Text.StringBuilder();
        bool inQuotes = false;
        for (int i = 0; i < line.Length; i++)
        {
            if (inQuotes)
            {
                if (line[i] == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"') { current.Append('"'); i++; }
                    else inQuotes = false;
                }
                else current.Append(line[i]);
            }
            else
            {
                if (line[i] == '"') inQuotes = true;
                else if (line[i] == ',') { result.Add(current.ToString()); current.Clear(); }
                else current.Append(line[i]);
            }
        }
        result.Add(current.ToString());
        return result.ToArray();
    }

    // ===================== LOOKUPS =====================

    public List<string> GetProjectStatuses() => new() { "Draft", "Active", "Archived" };
    public List<string> GetDatasetFormats() => new() { "CSV", "JSON", "Parquet", "SQL", "API" };
    public List<string> GetRuleTypes() => new() { "completeness", "accuracy", "consistency", "timeliness", "uniqueness", "validity" };

    // ===================== MAPPING HELPERS =====================

    private static ProjectResponse ToProjectResponse(DataProject p) => new(
        p.Id, p.WorkspaceId, p.Name, p.Description, p.Status, p.CreatedBy,
        p.CreatedAt, p.UpdatedAt, p.Tags,
        p.Datasets.Count, p.Forms.Count, p.QualityRules.Count
    );

    private static ProjectDetailResponse ToProjectDetailResponse(DataProject p) => new(
        p.Id, p.WorkspaceId, p.Name, p.Description, p.Status, p.CreatedBy,
        p.CreatedAt, p.UpdatedAt, p.Tags,
        p.Datasets.Select(ToDatasetResponse).ToList(),
        p.Forms.Select(ToFormResponse).ToList(),
        p.QualityRules.Select(ToRuleResponse).ToList()
    );

    private static DatasetResponse ToDatasetResponse(Dataset d) => new(
        d.Id, d.ProjectId, d.Name, d.Description, d.Source, d.Format,
        d.RecordCount, d.SizeBytes,
        d.Columns.Select(c => new DataColumnDto(c.Name, c.DataType, c.Nullable, c.Description)).ToList(),
        d.Status, d.LastRefreshed, d.CreatedAt,
        ToGovernanceDto(d.Governance),
        d.CustomMetadata.Select(ToCustomFieldDto).ToList()
    );

    private static DatasetGovernanceDto ToGovernanceDto(DatasetGovernance g) => new(
        g.DataOwner, g.DataSteward, g.Classification, g.SensitivityLevel,
        g.ContainsPii, g.ContainsPhi, g.RetentionPolicy, g.DataDomain,
        g.UpdateFrequency, g.QualityScore, g.LineageInfo, g.ComplianceFrameworks
    );

    private static DatasetGovernance ToGovernanceModel(DatasetGovernanceDto g) => new()
    {
        DataOwner = g.DataOwner, DataSteward = g.DataSteward,
        Classification = g.Classification, SensitivityLevel = g.SensitivityLevel,
        ContainsPii = g.ContainsPii, ContainsPhi = g.ContainsPhi,
        RetentionPolicy = g.RetentionPolicy, DataDomain = g.DataDomain,
        UpdateFrequency = g.UpdateFrequency, QualityScore = g.QualityScore,
        LineageInfo = g.LineageInfo, ComplianceFrameworks = g.ComplianceFrameworks ?? new()
    };

    private static CustomMetadataFieldDto ToCustomFieldDto(CustomMetadataField f) => new(f.Key, f.Value, f.FieldType);

    private static CustomMetadataField ToCustomFieldModel(CustomMetadataFieldDto f) => new()
    {
        Key = f.Key, Value = f.Value, FieldType = f.FieldType
    };

    private static DataFormResponse ToFormResponse(DataForm f) => new(
        f.Id, f.ProjectId, f.Name, f.Description,
        f.Fields.Select(x => new FormFieldDto(x.Name, x.Label, x.FieldType, x.Required, x.Options, x.Placeholder, x.DefaultValue)).ToList(),
        f.Status, f.SubmissionCount, f.CreatedAt, f.UpdatedAt
    );

    private static DataQualityRuleResponse ToRuleResponse(DataQualityRule r) => new(
        r.Id, r.ProjectId, r.DatasetId, r.Name, r.Description,
        r.RuleType, r.Column, r.Expression, r.Severity,
        r.IsActive, r.PassRate, r.LastResult, r.LastRunAt, r.CreatedAt
    );

    private static FormField ToFormField(FormFieldDto dto) => new()
    {
        Name = dto.Name, Label = dto.Label, FieldType = dto.FieldType,
        Required = dto.Required, Options = dto.Options,
        Placeholder = dto.Placeholder, DefaultValue = dto.DefaultValue
    };
}
