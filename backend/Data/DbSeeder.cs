using System.Security.Cryptography;
using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BigDataApp.Api.Data;

/// <summary>
/// Seeds the database with initial data if it is empty.
/// Called once at startup after EnsureCreated / Migrate.
/// </summary>
public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Roles.Any()) return; // already seeded

        // ===================== Roles =====================
        var roles = new[]
        {
            new Role { Name = "Admin",        Description = "Full system access" },
            new Role { Name = "Analyst",      Description = "Read & query access, can create projects" },
            new Role { Name = "Viewer",       Description = "Read-only access to data and dashboards" },
            new Role { Name = "DataEngineer", Description = "Manage datasets, ETL pipelines, quality rules" },
        };
        db.Roles.AddRange(roles);

        // ===================== Users =====================
        var adminId   = Guid.NewGuid();
        var analystId = Guid.NewGuid();
        var viewerId  = Guid.NewGuid();
        var engId     = Guid.NewGuid();
        var analyst2Id = Guid.NewGuid();

        var users = new[]
        {
            new User { Id = adminId,    Username = "admin",    Email = "admin@bigdata.local",    PasswordHash = HashPassword("Admin123!"),    FirstName = "Alice",   LastName = "Admin",    IsActive = true, CreatedAt = Utc(-90) },
            new User { Id = analystId,  Username = "jsmith",   Email = "jsmith@bigdata.local",   PasswordHash = HashPassword("Analyst123!"),  FirstName = "John",    LastName = "Smith",    IsActive = true, CreatedAt = Utc(-80) },
            new User { Id = viewerId,   Username = "mjones",   Email = "mjones@bigdata.local",   PasswordHash = HashPassword("Viewer123!"),   FirstName = "Mary",    LastName = "Jones",    IsActive = true, CreatedAt = Utc(-70) },
            new User { Id = engId,      Username = "bwilson",  Email = "bwilson@bigdata.local",  PasswordHash = HashPassword("Engineer123!"), FirstName = "Bob",     LastName = "Wilson",   IsActive = true, CreatedAt = Utc(-60) },
            new User { Id = analyst2Id, Username = "lchen",    Email = "lchen@bigdata.local",    PasswordHash = HashPassword("Analyst123!"),  FirstName = "Lisa",    LastName = "Chen",     IsActive = true, CreatedAt = Utc(-50) },
        };
        db.Users.AddRange(users);

        // ---- User-Role assignments ----
        db.UserRoles.AddRange(
            new UserRole { UserId = adminId,    RoleName = "Admin" },
            new UserRole { UserId = adminId,    RoleName = "Analyst" },
            new UserRole { UserId = analystId,  RoleName = "Analyst" },
            new UserRole { UserId = viewerId,   RoleName = "Viewer" },
            new UserRole { UserId = engId,      RoleName = "DataEngineer" },
            new UserRole { UserId = engId,      RoleName = "Analyst" },
            new UserRole { UserId = analyst2Id, RoleName = "Analyst" }
        );

        // ===================== Workspaces =====================
        var ws1 = Guid.NewGuid(); // Engineering
        var ws2 = Guid.NewGuid(); // Marketing
        var ws3 = Guid.NewGuid(); // Finance
        var ws4 = Guid.NewGuid(); // Data Science
        var ws5 = Guid.NewGuid(); // Operations

        var workspaces = new[]
        {
            new Workspace { Id = ws1, Name = "Engineering",   Description = "Engineering team workspace — ETL, pipelines, infrastructure data",   Department = "Engineering",   Color = "#2563eb", Icon = "🔧", CreatedBy = "admin", IsDefault = true,  CreatedAt = Utc(-90), UpdatedAt = Utc(-1) },
            new Workspace { Id = ws2, Name = "Marketing",     Description = "Campaign performance, customer segments, and market research data",   Department = "Marketing",     Color = "#7c3aed", Icon = "📢", CreatedBy = "admin", IsDefault = false, CreatedAt = Utc(-85), UpdatedAt = Utc(-2) },
            new Workspace { Id = ws3, Name = "Finance",       Description = "Revenue tracking, budgets, and financial compliance datasets",        Department = "Finance",       Color = "#059669", Icon = "💰", CreatedBy = "admin", IsDefault = false, CreatedAt = Utc(-80), UpdatedAt = Utc(-3) },
            new Workspace { Id = ws4, Name = "Data Science",  Description = "ML models, experiments, and feature store datasets",                  Department = "Data Science",  Color = "#d97706", Icon = "🧪", CreatedBy = "jsmith", IsDefault = false, CreatedAt = Utc(-75), UpdatedAt = Utc(-4) },
            new Workspace { Id = ws5, Name = "Operations",    Description = "Supply chain, logistics, and operational metrics",                    Department = "Operations",    Color = "#dc2626", Icon = "⚙️", CreatedBy = "bwilson", IsDefault = false, CreatedAt = Utc(-70), UpdatedAt = Utc(-5) },
        };
        db.Workspaces.AddRange(workspaces);

        db.WorkspaceMembers.AddRange(
            new WorkspaceMember { WorkspaceId = ws1, Username = "admin" },
            new WorkspaceMember { WorkspaceId = ws1, Username = "bwilson" },
            new WorkspaceMember { WorkspaceId = ws1, Username = "jsmith" },
            new WorkspaceMember { WorkspaceId = ws2, Username = "admin" },
            new WorkspaceMember { WorkspaceId = ws2, Username = "jsmith" },
            new WorkspaceMember { WorkspaceId = ws2, Username = "lchen" },
            new WorkspaceMember { WorkspaceId = ws3, Username = "admin" },
            new WorkspaceMember { WorkspaceId = ws3, Username = "mjones" },
            new WorkspaceMember { WorkspaceId = ws4, Username = "jsmith" },
            new WorkspaceMember { WorkspaceId = ws4, Username = "lchen" },
            new WorkspaceMember { WorkspaceId = ws4, Username = "bwilson" },
            new WorkspaceMember { WorkspaceId = ws5, Username = "bwilson" },
            new WorkspaceMember { WorkspaceId = ws5, Username = "admin" }
        );

        // ===================== Data Projects =====================
        var p1 = Guid.NewGuid();
        var p2 = Guid.NewGuid();
        var p3 = Guid.NewGuid();
        var p4 = Guid.NewGuid();
        var p5 = Guid.NewGuid();

        db.DataProjects.AddRange(
            new DataProject
            {
                Id = p1, WorkspaceId = ws1, Name = "Customer Analytics",
                Description = "Comprehensive customer behavior analysis across all channels",
                Status = "Active", CreatedBy = "admin",
                TagsJson = ToJson(new[] { "analytics", "customer", "production" }),
                CreatedAt = Utc(-90), UpdatedAt = Utc(-1)
            },
            new DataProject
            {
                Id = p2, WorkspaceId = ws2, Name = "Marketing Campaigns",
                Description = "Campaign performance tracking and ROI measurement",
                Status = "Active", CreatedBy = "jsmith",
                TagsJson = ToJson(new[] { "marketing", "campaigns", "roi" }),
                CreatedAt = Utc(-60), UpdatedAt = Utc(-2)
            },
            new DataProject
            {
                Id = p3, WorkspaceId = ws3, Name = "Financial Reports",
                Description = "Quarterly financial data aggregation and compliance reporting",
                Status = "Active", CreatedBy = "admin",
                TagsJson = ToJson(new[] { "finance", "compliance", "quarterly" }),
                CreatedAt = Utc(-50), UpdatedAt = Utc(-3)
            },
            new DataProject
            {
                Id = p4, WorkspaceId = ws4, Name = "ML Feature Store",
                Description = "Centralized feature engineering and model training datasets",
                Status = "Draft", CreatedBy = "jsmith",
                TagsJson = ToJson(new[] { "ml", "features", "data-science" }),
                CreatedAt = Utc(-30), UpdatedAt = Utc(-5)
            },
            new DataProject
            {
                Id = p5, WorkspaceId = ws5, Name = "Supply Chain Monitoring",
                Description = "Real-time supply chain metrics, vendor performance, and logistics",
                Status = "Active", CreatedBy = "bwilson",
                TagsJson = ToJson(new[] { "supply-chain", "logistics", "operations" }),
                CreatedAt = Utc(-45), UpdatedAt = Utc(-4)
            }
        );

        // ===================== Datasets =====================
        var ds1 = Guid.NewGuid();
        var ds2 = Guid.NewGuid();
        var ds3 = Guid.NewGuid();
        var ds4 = Guid.NewGuid();
        var ds5 = Guid.NewGuid();
        var ds6 = Guid.NewGuid();

        db.Datasets.AddRange(
            new Dataset
            {
                Id = ds1, ProjectId = p1, Name = "Customer Transactions",
                Description = "All customer purchase transactions from POS and online",
                Source = "s3://data-lake/transactions/", Format = "Parquet",
                RecordCount = 12_500_000, SizeBytes = 4_800_000_000,
                Status = "Active", LastRefreshed = Utc(-0.1), CreatedAt = Utc(-90),
                ColumnsJson = ToJson(new[]
                {
                    new DataColumn { Name = "transaction_id", DataType = "string", Nullable = false, Description = "Unique transaction identifier" },
                    new DataColumn { Name = "customer_id",    DataType = "string", Nullable = false, Description = "Customer identifier" },
                    new DataColumn { Name = "amount",         DataType = "float",  Nullable = false, Description = "Transaction amount in USD" },
                    new DataColumn { Name = "category",       DataType = "string", Nullable = true,  Description = "Product category" },
                    new DataColumn { Name = "timestamp",      DataType = "datetime", Nullable = false, Description = "Transaction datetime" },
                    new DataColumn { Name = "channel",        DataType = "string", Nullable = true,  Description = "Sales channel (online, in-store, mobile)" },
                }),
                GovernanceJson = ToJson(new DatasetGovernance
                {
                    DataOwner = "Commerce Team", DataSteward = "Jane Smith",
                    Classification = "Confidential", SensitivityLevel = "High",
                    ContainsPii = true, ContainsPhi = false,
                    RetentionPolicy = "7 years", DataDomain = "Customer",
                    UpdateFrequency = "Real-time", QualityScore = 97.5,
                    LineageInfo = "POS systems → Kafka → S3 data lake",
                    ComplianceFrameworks = new() { "GDPR", "CCPA", "PCI-DSS" }
                }),
                CustomMetadataJson = ToJson(new[]
                {
                    new CustomMetadataField { Key = "Business Unit", Value = "eCommerce", FieldType = "text" },
                    new CustomMetadataField { Key = "SLA (hours)", Value = "4", FieldType = "number" },
                }),
            },
            new Dataset
            {
                Id = ds2, ProjectId = p1, Name = "Customer Profiles",
                Description = "Enriched customer profiles with demographics and preferences",
                Source = "postgresql://analytics-db/customers", Format = "SQL",
                RecordCount = 850_000, SizeBytes = 320_000_000,
                Status = "Active", LastRefreshed = Utc(-1), CreatedAt = Utc(-85),
                ColumnsJson = ToJson(new[]
                {
                    new DataColumn { Name = "customer_id", DataType = "string", Nullable = false, Description = "Primary key" },
                    new DataColumn { Name = "name",        DataType = "string", Nullable = false, Description = "Full name" },
                    new DataColumn { Name = "email",       DataType = "string", Nullable = true,  Description = "Email address" },
                    new DataColumn { Name = "segment",     DataType = "string", Nullable = true,  Description = "Customer segment" },
                    new DataColumn { Name = "ltv",         DataType = "float",  Nullable = true,  Description = "Lifetime value in USD" },
                }),
                GovernanceJson = ToJson(new DatasetGovernance
                {
                    DataOwner = "CRM Team", DataSteward = "John Smith",
                    Classification = "Confidential", SensitivityLevel = "High",
                    ContainsPii = true, ContainsPhi = false,
                    RetentionPolicy = "5 years", DataDomain = "Customer",
                    UpdateFrequency = "Daily", QualityScore = 95.2,
                    LineageInfo = "CRM → ETL Pipeline → Analytics DB",
                    ComplianceFrameworks = new() { "GDPR", "CCPA" }
                }),
            },
            new Dataset
            {
                Id = ds3, ProjectId = p2, Name = "Campaign Metrics",
                Description = "Performance metrics for all marketing campaigns",
                Source = "s3://marketing-data/campaigns/", Format = "CSV",
                RecordCount = 2_400_000, SizeBytes = 680_000_000,
                Status = "Active", LastRefreshed = Utc(-2), CreatedAt = Utc(-60),
                ColumnsJson = ToJson(new[]
                {
                    new DataColumn { Name = "campaign_id",  DataType = "string",   Nullable = false, Description = "Campaign identifier" },
                    new DataColumn { Name = "impressions",  DataType = "int",      Nullable = false, Description = "Total impressions" },
                    new DataColumn { Name = "clicks",       DataType = "int",      Nullable = false, Description = "Total clicks" },
                    new DataColumn { Name = "conversions",  DataType = "int",      Nullable = true,  Description = "Total conversions" },
                    new DataColumn { Name = "spend",        DataType = "float",    Nullable = false, Description = "Campaign spend in USD" },
                }),
                GovernanceJson = ToJson(new DatasetGovernance
                {
                    DataOwner = "Marketing Ops", DataSteward = "Lisa Chen",
                    Classification = "Internal", SensitivityLevel = "Medium",
                    ContainsPii = false, ContainsPhi = false,
                    RetentionPolicy = "3 years", DataDomain = "Marketing",
                    UpdateFrequency = "Hourly", QualityScore = 91.0,
                    LineageInfo = "Ad platforms → S3 → Redshift",
                    ComplianceFrameworks = new() { "SOX" }
                }),
            },
            new Dataset
            {
                Id = ds4, ProjectId = p3, Name = "Revenue Data",
                Description = "Daily revenue figures by department and region",
                Source = "sqlserver://finance-db/revenue", Format = "SQL",
                RecordCount = 1_800_000, SizeBytes = 520_000_000,
                Status = "Active", LastRefreshed = Utc(-1), CreatedAt = Utc(-50),
                ColumnsJson = ToJson(new[]
                {
                    new DataColumn { Name = "date",        DataType = "date",   Nullable = false, Description = "Revenue date" },
                    new DataColumn { Name = "department",  DataType = "string", Nullable = false, Description = "Department name" },
                    new DataColumn { Name = "region",      DataType = "string", Nullable = false, Description = "Geographic region" },
                    new DataColumn { Name = "revenue",     DataType = "float",  Nullable = false, Description = "Revenue in USD" },
                    new DataColumn { Name = "cost",        DataType = "float",  Nullable = true,  Description = "Cost in USD" },
                }),
                GovernanceJson = ToJson(new DatasetGovernance
                {
                    DataOwner = "Finance Team", DataSteward = "Mary Jones",
                    Classification = "Restricted", SensitivityLevel = "Critical",
                    ContainsPii = false, ContainsPhi = false,
                    RetentionPolicy = "10 years", DataDomain = "Financial",
                    UpdateFrequency = "Daily", QualityScore = 98.8,
                    LineageInfo = "ERP → Finance DB → Reporting layer",
                    ComplianceFrameworks = new() { "SOX", "GAAP" }
                }),
            },
            new Dataset
            {
                Id = ds5, ProjectId = p4, Name = "Feature Vectors",
                Description = "Precomputed feature vectors for ML models",
                Source = "s3://ml-features/vectors/", Format = "Parquet",
                RecordCount = 5_000_000, SizeBytes = 2_100_000_000,
                Status = "Active", LastRefreshed = Utc(-3), CreatedAt = Utc(-30),
                ColumnsJson = ToJson(new[]
                {
                    new DataColumn { Name = "entity_id",   DataType = "string", Nullable = false, Description = "Entity identifier" },
                    new DataColumn { Name = "feature_set", DataType = "string", Nullable = false, Description = "Feature set name" },
                    new DataColumn { Name = "vector",      DataType = "json",   Nullable = false, Description = "Feature vector (JSON)" },
                    new DataColumn { Name = "timestamp",   DataType = "datetime", Nullable = false, Description = "Computation timestamp" },
                }),
            },
            new Dataset
            {
                Id = ds6, ProjectId = p5, Name = "Inventory Feed",
                Description = "Real-time inventory levels across all warehouses",
                Source = "kafka://inventory-stream", Format = "JSON",
                RecordCount = 8_200_000, SizeBytes = 1_600_000_000,
                Status = "Active", LastRefreshed = Utc(-0.5), CreatedAt = Utc(-45),
                ColumnsJson = ToJson(new[]
                {
                    new DataColumn { Name = "sku",         DataType = "string", Nullable = false, Description = "Stock keeping unit" },
                    new DataColumn { Name = "warehouse",   DataType = "string", Nullable = false, Description = "Warehouse code" },
                    new DataColumn { Name = "quantity",     DataType = "int",    Nullable = false, Description = "Current quantity" },
                    new DataColumn { Name = "updated_at",  DataType = "datetime", Nullable = false, Description = "Last update time" },
                }),
                GovernanceJson = ToJson(new DatasetGovernance
                {
                    DataOwner = "Supply Chain Team", DataSteward = "Bob Wilson",
                    Classification = "Internal", SensitivityLevel = "Medium",
                    ContainsPii = false, ContainsPhi = false,
                    RetentionPolicy = "2 years", DataDomain = "Operations",
                    UpdateFrequency = "Real-time", QualityScore = 82.1,
                    LineageInfo = "WMS → Kafka stream → Data Lake",
                    ComplianceFrameworks = new() { "SOX" }
                }),
            }
        );

        // ===================== Data Forms =====================
        db.DataForms.AddRange(
            new DataForm
            {
                Id = Guid.NewGuid(), ProjectId = p1, Name = "Customer Review Form",
                Description = "Manual review form for customer transaction records",
                Status = "Published", SubmissionCount = 145,
                FieldsJson = ToJson(new[]
                {
                    new FormField { Name = "status",  Label = "Status",  FieldType = "select", Required = true, Options = new() { "Approved", "Rejected", "Flagged" } },
                    new FormField { Name = "notes",   Label = "Notes",   FieldType = "textarea", Required = false },
                    new FormField { Name = "amount",  Label = "Corrected Amount", FieldType = "number", Required = false },
                }),
                CreatedAt = Utc(-80), UpdatedAt = Utc(-5),
            },
            new DataForm
            {
                Id = Guid.NewGuid(), ProjectId = p2, Name = "Campaign Approval",
                Description = "Approval workflow for marketing campaign data",
                Status = "Published", SubmissionCount = 38,
                FieldsJson = ToJson(new[]
                {
                    new FormField { Name = "approved", Label = "Approved", FieldType = "checkbox", Required = true },
                    new FormField { Name = "reviewer", Label = "Reviewer", FieldType = "text", Required = true },
                }),
                CreatedAt = Utc(-55), UpdatedAt = Utc(-10),
            }
        );

        // ===================== Quality Rules =====================
        db.DataQualityRules.AddRange(
            new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1, DatasetId = ds1, Name = "Transaction ID Not Null",   Description = "Ensure transaction_id is never null",         RuleType = "completeness", Column = "transaction_id", Expression = "NOT NULL", Severity = "error",   IsActive = true, PassRate = 100,  LastResult = "pass", LastRunAt = Utc(-1), CreatedAt = Utc(-85) },
            new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1, DatasetId = ds1, Name = "Amount Positive",           Description = "Transaction amounts must be positive",         RuleType = "validity",     Column = "amount",         Expression = "> 0",     Severity = "error",   IsActive = true, PassRate = 99.7, LastResult = "pass", LastRunAt = Utc(-1), CreatedAt = Utc(-85) },
            new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p1, DatasetId = ds2, Name = "Email Format",              Description = "Customer email should be a valid format",      RuleType = "validity",     Column = "email",          Expression = "MATCHES ^.+@.+$", Severity = "warning", IsActive = true, PassRate = 94.5, LastResult = "pass", LastRunAt = Utc(-2), CreatedAt = Utc(-80) },
            new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p2, DatasetId = ds3, Name = "Impressions ≥ Clicks",      Description = "Impressions should always be >= clicks",       RuleType = "consistency",  Column = null,             Expression = "impressions >= clicks", Severity = "error",   IsActive = true, PassRate = 98.1, LastResult = "pass", LastRunAt = Utc(-2), CreatedAt = Utc(-55) },
            new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p3, DatasetId = ds4, Name = "Revenue Not Negative",      Description = "Revenue figures should not be negative",       RuleType = "validity",     Column = "revenue",        Expression = ">= 0",   Severity = "error",   IsActive = true, PassRate = 100,  LastResult = "pass", LastRunAt = Utc(-1), CreatedAt = Utc(-45) },
            new DataQualityRule { Id = Guid.NewGuid(), ProjectId = p5, DatasetId = ds6, Name = "Inventory Quantity ≥ 0",    Description = "Inventory quantity must not be negative",      RuleType = "validity",     Column = "quantity",       Expression = ">= 0",   Severity = "error",   IsActive = true, PassRate = 82.1, LastResult = "fail", LastRunAt = Utc(-1), CreatedAt = Utc(-40) }
        );

        // ===================== Saved Queries =====================
        var q1 = Guid.NewGuid();
        var q2 = Guid.NewGuid();
        var q3 = Guid.NewGuid();
        var q4 = Guid.NewGuid();
        var q5 = Guid.NewGuid();

        db.SavedQueries.AddRange(
            new SavedQuery
            {
                Id = q1, WorkspaceId = ws1, Name = "Top Customers by LTV",
                Description = "Find the top 100 customers ordered by lifetime value",
                SqlText = "SELECT customer_id, name, segment, ltv\nFROM customer_profiles\nORDER BY ltv DESC\nLIMIT 100;",
                Database = "analytics", CreatedBy = "admin", IsPublic = true,
                CreatedAt = Utc(-60), UpdatedAt = Utc(-5),
                ValidationIsValid = true, ValidationValidatedAt = Utc(-5),
                ValidationErrorsJson = "[]", ValidationWarningsJson = "[]",
            },
            new SavedQuery
            {
                Id = q2, WorkspaceId = ws1, Name = "Daily Transaction Volume",
                Description = "Aggregate daily transaction counts and totals",
                SqlText = "SELECT DATE_TRUNC('day', timestamp) AS txn_date,\n       COUNT(*) AS txn_count,\n       SUM(amount) AS total_amount\nFROM customer_transactions\nGROUP BY txn_date\nORDER BY txn_date DESC;",
                Database = "analytics", CreatedBy = "jsmith", IsPublic = true,
                CreatedAt = Utc(-55), UpdatedAt = Utc(-3),
                ValidationIsValid = true, ValidationValidatedAt = Utc(-3),
                ValidationErrorsJson = "[]", ValidationWarningsJson = "[]",
            },
            new SavedQuery
            {
                Id = q3, WorkspaceId = ws2, Name = "Campaign ROI Summary",
                Description = "Calculate return on investment for each campaign",
                SqlText = "SELECT campaign_id,\n       SUM(conversions) AS total_conversions,\n       SUM(spend) AS total_spend,\n       ROUND(SUM(conversions)::numeric / NULLIF(SUM(spend), 0), 4) AS roi\nFROM campaign_metrics\nGROUP BY campaign_id\nORDER BY roi DESC;",
                Database = "marketing", CreatedBy = "lchen", IsPublic = true,
                CreatedAt = Utc(-40), UpdatedAt = Utc(-7),
            },
            new SavedQuery
            {
                Id = q4, WorkspaceId = ws3, Name = "Monthly Revenue by Region",
                Description = "Regional revenue breakdown for the current quarter",
                SqlText = "SELECT region,\n       DATE_TRUNC('month', date) AS month,\n       SUM(revenue) AS total_revenue,\n       SUM(cost) AS total_cost\nFROM revenue_data\nWHERE date >= DATE_TRUNC('quarter', CURRENT_DATE)\nGROUP BY region, month\nORDER BY month, region;",
                Database = "finance", CreatedBy = "admin", IsPublic = true,
                CreatedAt = Utc(-35), UpdatedAt = Utc(-2),
                ValidationIsValid = true, ValidationValidatedAt = Utc(-2),
                ValidationErrorsJson = "[]", ValidationWarningsJson = "[]",
            },
            new SavedQuery
            {
                Id = q5, WorkspaceId = ws5, Name = "Low Inventory Alert",
                Description = "Find SKUs with inventory below reorder point",
                SqlText = "SELECT sku, warehouse, quantity\nFROM inventory_feed\nWHERE quantity < 100\nORDER BY quantity ASC;",
                Database = "operations", CreatedBy = "bwilson", IsPublic = true,
                CreatedAt = Utc(-25), UpdatedAt = Utc(-1),
            }
        );

        // Query tags
        db.QueryTags.AddRange(
            new QueryTag { QueryId = q1, Tag = "customer" },
            new QueryTag { QueryId = q1, Tag = "ltv" },
            new QueryTag { QueryId = q2, Tag = "transactions" },
            new QueryTag { QueryId = q2, Tag = "daily" },
            new QueryTag { QueryId = q2, Tag = "aggregation" },
            new QueryTag { QueryId = q3, Tag = "campaign" },
            new QueryTag { QueryId = q3, Tag = "roi" },
            new QueryTag { QueryId = q3, Tag = "marketing" },
            new QueryTag { QueryId = q4, Tag = "revenue" },
            new QueryTag { QueryId = q4, Tag = "regional" },
            new QueryTag { QueryId = q4, Tag = "finance" },
            new QueryTag { QueryId = q5, Tag = "inventory" },
            new QueryTag { QueryId = q5, Tag = "alert" },
            new QueryTag { QueryId = q5, Tag = "supply-chain" }
        );

        // ===================== Reports =====================
        var rpt1 = Guid.NewGuid();
        var rpt2 = Guid.NewGuid();
        var rpt3 = Guid.NewGuid();
        var rpt4 = Guid.NewGuid();
        var rpt5 = Guid.NewGuid();

        db.Reports.AddRange(
            new Report { Id = rpt1, WorkspaceId = ws1, Name = "Weekly Revenue Report", Description = "Summarises revenue across all product lines for the past week", Type = "Summary", Status = "Published", CreatedBy = "admin", QuerySql = "SELECT ProductLine, SUM(Revenue) AS TotalRevenue FROM sales GROUP BY ProductLine", Schedule = "Weekly", LastRunAt = Utc(-1), CreatedAt = Utc(-30), UpdatedAt = Utc(-1) },
            new Report { Id = rpt2, WorkspaceId = ws2, Name = "Campaign Performance Dashboard", Description = "Real-time metrics for active marketing campaigns", Type = "Dashboard", Status = "Published", CreatedBy = "jsmith", QuerySql = "SELECT Campaign, Impressions, Clicks, Conversions FROM marketing_metrics WHERE IsActive = 1", Schedule = "Daily", LastRunAt = Utc(-0.5), CreatedAt = Utc(-45), UpdatedAt = Utc(-0.5) },
            new Report { Id = rpt3, WorkspaceId = ws3, Name = "Financial Compliance Audit", Description = "Monthly compliance check across all financial datasets", Type = "Table", Status = "Published", CreatedBy = "admin", QuerySql = "SELECT DatasetName, ComplianceStatus, LastAudit FROM compliance_log", Schedule = "Monthly", LastRunAt = Utc(-5), CreatedAt = Utc(-60), UpdatedAt = Utc(-5) },
            new Report { Id = rpt4, WorkspaceId = ws4, Name = "ML Model Accuracy Tracker", Description = "Tracks prediction accuracy over time for deployed models", Type = "Chart", Status = "Draft", CreatedBy = "jsmith", QuerySql = "SELECT ModelName, TrainDate, Accuracy FROM ml_models ORDER BY TrainDate", Schedule = "Manual", CreatedAt = Utc(-15), UpdatedAt = Utc(-15) },
            new Report { Id = rpt5, WorkspaceId = ws5, Name = "Inventory Alert Summary", Description = "Current low-stock and overstock alerts for all warehouses", Type = "Table", Status = "Published", CreatedBy = "bwilson", QuerySql = "SELECT Warehouse, ProductSKU, CurrentStock, AlertType FROM inventory_alerts", Schedule = "Daily", LastRunAt = Utc(-0.2), CreatedAt = Utc(-20), UpdatedAt = Utc(-0.2) }
        );

        db.ReportTags.AddRange(
            new ReportTag { ReportId = rpt1, Tag = "revenue" },
            new ReportTag { ReportId = rpt1, Tag = "weekly" },
            new ReportTag { ReportId = rpt1, Tag = "finance" },
            new ReportTag { ReportId = rpt2, Tag = "marketing" },
            new ReportTag { ReportId = rpt2, Tag = "campaign" },
            new ReportTag { ReportId = rpt2, Tag = "dashboard" },
            new ReportTag { ReportId = rpt3, Tag = "compliance" },
            new ReportTag { ReportId = rpt3, Tag = "audit" },
            new ReportTag { ReportId = rpt4, Tag = "ml" },
            new ReportTag { ReportId = rpt4, Tag = "accuracy" },
            new ReportTag { ReportId = rpt5, Tag = "inventory" },
            new ReportTag { ReportId = rpt5, Tag = "alert" }
        );

        db.SaveChanges();
    }

    // ---- helpers ----
    private static DateTime Utc(double daysAgo) => DateTime.UtcNow.AddDays(daysAgo);

    private static string ToJson<T>(T obj) => System.Text.Json.JsonSerializer.Serialize(obj);

    private static string HashPassword(string password)
    {
        // Same algorithm used by MockUserService — PBKDF2
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }
}
