using BigDataApp.Api.Data;
using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BigDataApp.Api.Services;

public class EfDataProjectService : IDataProjectService
{
    private readonly AppDbContext _db;

    // In-memory stores for record processing (not persisted — same pattern as mock)
    private static readonly List<ProcessRecordResponse> _submissions = new();
    private static readonly Dictionary<Guid, List<Dictionary<string, string>>> _importedRecords = new();

    public EfDataProjectService(AppDbContext db) => _db = db;

    // ===================== PROJECT CRUD =====================

    public PagedResponse<ProjectResponse> SearchProjects(ProjectSearchParams search)
    {
        IQueryable<DataProject> q = _db.DataProjects
            .Include(p => p.Datasets).Include(p => p.Forms).Include(p => p.QualityRules);

        if (!string.IsNullOrWhiteSpace(search.Search))
        {
            var s = search.Search.ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(s) || p.Description.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(search.Status))
            q = q.Where(p => p.Status == search.Status);
        if (!string.IsNullOrWhiteSpace(search.Tag))
            q = q.Where(p => p.TagsJson.Contains(search.Tag));
        if (search.WorkspaceId.HasValue)
            q = q.Where(p => p.WorkspaceId == search.WorkspaceId);

        q = search.SortBy?.ToLower() switch
        {
            "name" => search.SortDesc ? q.OrderByDescending(p => p.Name) : q.OrderBy(p => p.Name),
            "status" => search.SortDesc ? q.OrderByDescending(p => p.Status) : q.OrderBy(p => p.Status),
            "createdat" => search.SortDesc ? q.OrderByDescending(p => p.CreatedAt) : q.OrderBy(p => p.CreatedAt),
            _ => search.SortDesc ? q.OrderByDescending(p => p.UpdatedAt) : q.OrderBy(p => p.UpdatedAt),
        };

        var total = q.Count();
        var items = q.Skip((search.Page - 1) * search.PageSize).Take(search.PageSize)
            .AsEnumerable().Select(ToProjectResponse).ToList();

        return new PagedResponse<ProjectResponse>(items, total, search.Page, search.PageSize,
            (int)Math.Ceiling(total / (double)search.PageSize));
    }

    public ProjectDetailResponse? GetProjectById(Guid id)
    {
        var p = LoadProject(id);
        return p is null ? null : ToProjectDetailResponse(p);
    }

    public ProjectDetailResponse CreateProject(CreateProjectRequest request, string createdBy)
    {
        var p = new DataProject
        {
            Id = Guid.NewGuid(),
            WorkspaceId = request.WorkspaceId,
            Name = request.Name,
            Description = request.Description,
            CreatedBy = createdBy,
            Tags = request.Tags ?? new(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.DataProjects.Add(p);
        _db.SaveChanges();
        return ToProjectDetailResponse(LoadProject(p.Id)!);
    }

    public ProjectDetailResponse? UpdateProject(Guid id, UpdateProjectRequest request)
    {
        var p = LoadProject(id);
        if (p is null) return null;

        if (request.Name is not null) p.Name = request.Name;
        if (request.Description is not null) p.Description = request.Description;
        if (request.Status is not null) p.Status = request.Status;
        if (request.Tags is not null) p.Tags = request.Tags;
        p.UpdatedAt = DateTime.UtcNow;

        _db.SaveChanges();
        return ToProjectDetailResponse(LoadProject(id)!);
    }

    public bool DeleteProject(Guid id)
    {
        var p = _db.DataProjects.FirstOrDefault(x => x.Id == id);
        if (p is null) return false;
        _db.DataProjects.Remove(p);
        _db.SaveChanges();
        return true;
    }

    // ===================== DATASET CRUD =====================

    public DatasetResponse? GetDataset(Guid projectId, Guid datasetId)
    {
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
        return ds is null ? null : ToDatasetResponse(ds);
    }

    public DatasetResponse CreateDataset(Guid projectId, CreateDatasetRequest request)
    {
        var ds = new Dataset
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = request.Name,
            Description = request.Description,
            Source = request.Source,
            Format = request.Format,
            Columns = request.Columns?.Select(c => new DataColumn
            {
                Name = c.Name, DataType = c.DataType, Nullable = c.Nullable, Description = c.Description
            }).ToList() ?? new(),
            Governance = request.Governance is not null ? ToGovernanceModel(request.Governance) : new(),
            CustomMetadata = request.CustomMetadata?.Select(ToCustomFieldModel).ToList() ?? new(),
            CreatedAt = DateTime.UtcNow,
        };
        _db.Datasets.Add(ds);
        _db.DataProjects.Where(p => p.Id == projectId).ExecuteUpdate(s => s.SetProperty(p => p.UpdatedAt, DateTime.UtcNow));
        _db.SaveChanges();
        return ToDatasetResponse(ds);
    }

    public DatasetResponse? UpdateDataset(Guid projectId, Guid datasetId, UpdateDatasetRequest request)
    {
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
        if (ds is null) return null;

        if (request.Name is not null) ds.Name = request.Name;
        if (request.Description is not null) ds.Description = request.Description;
        if (request.Source is not null) ds.Source = request.Source;
        if (request.Format is not null) ds.Format = request.Format;
        if (request.Status is not null) ds.Status = request.Status;
        if (request.Columns is not null)
            ds.Columns = request.Columns.Select(c => new DataColumn
            {
                Name = c.Name, DataType = c.DataType, Nullable = c.Nullable, Description = c.Description
            }).ToList();
        if (request.Governance is not null) ds.Governance = ToGovernanceModel(request.Governance);
        if (request.CustomMetadata is not null) ds.CustomMetadata = request.CustomMetadata.Select(ToCustomFieldModel).ToList();

        _db.SaveChanges();
        return ToDatasetResponse(ds);
    }

    public bool DeleteDataset(Guid projectId, Guid datasetId)
    {
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
        if (ds is null) return false;
        _db.Datasets.Remove(ds);
        _db.SaveChanges();
        return true;
    }

    // ===================== FORM CRUD =====================

    public DataFormResponse? GetForm(Guid projectId, Guid formId)
    {
        var f = _db.DataForms.FirstOrDefault(x => x.ProjectId == projectId && x.Id == formId);
        return f is null ? null : ToFormResponse(f);
    }

    public DataFormResponse CreateForm(Guid projectId, CreateFormRequest request)
    {
        var f = new DataForm
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = request.Name,
            Description = request.Description,
            Fields = request.Fields?.Select(ToFormField).ToList() ?? new(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.DataForms.Add(f);
        _db.SaveChanges();
        return ToFormResponse(f);
    }

    public DataFormResponse? UpdateForm(Guid projectId, Guid formId, UpdateFormRequest request)
    {
        var f = _db.DataForms.FirstOrDefault(x => x.ProjectId == projectId && x.Id == formId);
        if (f is null) return null;

        if (request.Name is not null) f.Name = request.Name;
        if (request.Description is not null) f.Description = request.Description;
        if (request.Status is not null) f.Status = request.Status;
        if (request.Fields is not null) f.Fields = request.Fields.Select(ToFormField).ToList();
        f.UpdatedAt = DateTime.UtcNow;

        _db.SaveChanges();
        return ToFormResponse(f);
    }

    public bool DeleteForm(Guid projectId, Guid formId)
    {
        var f = _db.DataForms.FirstOrDefault(x => x.ProjectId == projectId && x.Id == formId);
        if (f is null) return false;
        _db.DataForms.Remove(f);
        _db.SaveChanges();
        return true;
    }

    // ===================== QUALITY RULE CRUD =====================

    public DataQualityRuleResponse? GetQualityRule(Guid projectId, Guid ruleId)
    {
        var r = _db.DataQualityRules.FirstOrDefault(x => x.ProjectId == projectId && x.Id == ruleId);
        return r is null ? null : ToRuleResponse(r);
    }

    public DataQualityRuleResponse CreateQualityRule(Guid projectId, CreateQualityRuleRequest request)
    {
        var r = new DataQualityRule
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            DatasetId = request.DatasetId,
            Name = request.Name,
            Description = request.Description,
            RuleType = request.RuleType,
            Column = request.Column,
            Expression = request.Expression,
            Severity = request.Severity,
            CreatedAt = DateTime.UtcNow,
        };
        _db.DataQualityRules.Add(r);
        _db.SaveChanges();
        return ToRuleResponse(r);
    }

    public DataQualityRuleResponse? UpdateQualityRule(Guid projectId, Guid ruleId, UpdateQualityRuleRequest request)
    {
        var r = _db.DataQualityRules.FirstOrDefault(x => x.ProjectId == projectId && x.Id == ruleId);
        if (r is null) return null;

        if (request.Name is not null) r.Name = request.Name;
        if (request.Description is not null) r.Description = request.Description;
        if (request.DatasetId is not null) r.DatasetId = request.DatasetId;
        if (request.RuleType is not null) r.RuleType = request.RuleType;
        if (request.Column is not null) r.Column = request.Column;
        if (request.Expression is not null) r.Expression = request.Expression;
        if (request.Severity is not null) r.Severity = request.Severity;
        if (request.IsActive is not null) r.IsActive = request.IsActive.Value;

        _db.SaveChanges();
        return ToRuleResponse(r);
    }

    public bool DeleteQualityRule(Guid projectId, Guid ruleId)
    {
        var r = _db.DataQualityRules.FirstOrDefault(x => x.ProjectId == projectId && x.Id == ruleId);
        if (r is null) return false;
        _db.DataQualityRules.Remove(r);
        _db.SaveChanges();
        return true;
    }

    public RunQualityCheckResponse? RunQualityCheck(Guid projectId, Guid ruleId)
    {
        var r = _db.DataQualityRules.FirstOrDefault(x => x.ProjectId == projectId && x.Id == ruleId);
        if (r is null) return null;

        var rng = new Random();
        r.PassRate = Math.Round(85.0 + rng.NextDouble() * 15.0, 2);
        r.LastResult = r.PassRate >= 95.0 ? "pass" : (r.PassRate >= 80.0 ? "fail" : "error");
        r.LastRunAt = DateTime.UtcNow;
        _db.SaveChanges();

        return new RunQualityCheckResponse(r.Id, r.Name, r.PassRate.Value, r.LastResult, r.LastRunAt.Value);
    }

    // ===================== RECORD PROCESSING =====================

    public DatasetRecordsResponse? GetDatasetRecords(Guid projectId, Guid datasetId, int page = 1, int pageSize = 50)
    {
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
        if (ds is null) return null;

        var rng = new Random(ds.Id.GetHashCode());
        var totalRecords = (int)Math.Min(ds.RecordCount, 200);
        var records = new List<DatasetRecordResponse>();

        var startIndex = (page - 1) * pageSize;
        var endIndex = Math.Min(startIndex + pageSize, totalRecords);

        for (int i = startIndex; i < endIndex; i++)
        {
            var values = new Dictionary<string, string>();
            foreach (var col in ds.Columns)
                values[col.Name] = GenerateMockValue(col, i, rng);
            records.Add(new DatasetRecordResponse(i, values));
        }

        return new DatasetRecordsResponse(
            ds.Id, ds.Name, totalRecords,
            ds.Columns.Select(c => new DataColumnDto(c.Name, c.DataType, c.Nullable, c.Description)).ToList(),
            records);
    }

    public ProcessRecordResponse? ProcessRecord(Guid projectId, ProcessRecordRequest request, string processedBy)
    {
        var p = LoadProject(projectId);
        if (p is null) return null;
        var ds = p.Datasets.FirstOrDefault(d => d.Id == request.DatasetId);
        var form = p.Forms.FirstOrDefault(f => f.Id == request.FormId);
        if (ds is null || form is null) return null;

        var recordsResponse = GetDatasetRecords(projectId, request.DatasetId, request.RowIndex / 50 + 1, 50);
        var originalRecord = recordsResponse?.Records.FirstOrDefault(r => r.RowIndex == request.RowIndex);
        var originalValues = originalRecord?.Values ?? new Dictionary<string, string>();

        var status = request.Values.ContainsKey("_status") ? request.Values["_status"] : "Approved";

        var submission = new ProcessRecordResponse(
            Guid.NewGuid(), request.DatasetId, request.FormId, request.RowIndex,
            status, originalValues, request.Values, processedBy, DateTime.UtcNow);

        _submissions.Add(submission);
        form.SubmissionCount++;
        _db.SaveChanges();

        return submission;
    }

    public ProcessingSessionSummary? GetProcessingSummary(Guid projectId, Guid datasetId, Guid formId)
    {
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
        if (ds is null) return null;

        var subs = _submissions.Where(s => s.DatasetId == datasetId && s.FormId == formId).ToList();
        var totalRecords = (int)Math.Min(ds.RecordCount, 200);

        return new ProcessingSessionSummary(
            projectId, datasetId, formId, totalRecords,
            subs.Count,
            subs.Count(s => s.Status == "Approved"),
            subs.Count(s => s.Status == "Rejected"),
            subs.Count(s => s.Status == "Flagged"),
            subs.Count(s => s.Status == "Skipped"),
            subs);
    }

    // ===================== IMPORT / EXPORT / DELETE RECORDS =====================

    public ImportRecordsResponse? ImportRecords(Guid projectId, Guid datasetId, ImportRecordsRequest request)
    {
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
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

        if (!_importedRecords.ContainsKey(datasetId))
            _importedRecords[datasetId] = new List<Dictionary<string, string>>();
        _importedRecords[datasetId].AddRange(imported);

        ds.RecordCount += imported.Count;
        ds.SizeBytes += imported.Sum(r => r.Sum(kv => kv.Key.Length + kv.Value.Length)) * 2;

        if (ds.Columns.Count == 0 && imported.Count > 0)
        {
            ds.Columns = imported[0].Keys.Select(k => new DataColumn
            {
                Name = k, DataType = "string", Nullable = true, Description = $"Imported column: {k}"
            }).ToList();
        }

        _db.SaveChanges();
        return new ImportRecordsResponse(datasetId, imported.Count, errors.Count, errors);
    }

    public ExportRecordsResponse? ExportRecords(Guid projectId, Guid datasetId, string format = "csv")
    {
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
        if (ds is null) return null;

        var allRecords = new List<Dictionary<string, string>>();

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

        if (_importedRecords.ContainsKey(datasetId))
            allRecords.AddRange(_importedRecords[datasetId]);

        if (allRecords.Count > 500)
            allRecords = allRecords.Take(500).ToList();

        var columnNames = ds.Columns.Count > 0
            ? ds.Columns.Select(c => c.Name).ToList()
            : allRecords.Count > 0 ? allRecords[0].Keys.ToList() : new List<string>();

        string data;
        if (format.Equals("json", StringComparison.OrdinalIgnoreCase))
        {
            data = System.Text.Json.JsonSerializer.Serialize(allRecords,
                new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
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
        var ds = _db.Datasets.FirstOrDefault(d => d.ProjectId == projectId && d.Id == datasetId);
        if (ds is null) return null;

        var deletedCount = 0;
        if (_importedRecords.ContainsKey(datasetId))
        {
            var mockTotal = (int)Math.Min(ds.RecordCount - _importedRecords[datasetId].Count, 200);
            var importedIndices = request.RowIndices.Where(i => i >= mockTotal)
                .Select(i => i - mockTotal).OrderByDescending(i => i).ToList();
            foreach (var idx in importedIndices)
                if (idx >= 0 && idx < _importedRecords[datasetId].Count)
                {
                    _importedRecords[datasetId].RemoveAt(idx);
                    deletedCount++;
                }
            deletedCount += request.RowIndices.Count(i => i < mockTotal);
        }
        else
        {
            deletedCount = request.RowIndices.Count;
        }

        ds.RecordCount = Math.Max(0, ds.RecordCount - deletedCount);
        _db.SaveChanges();
        return new DeleteRecordsResponse(deletedCount);
    }

    // ===================== LOOKUPS =====================

    public List<string> GetProjectStatuses() => new() { "Draft", "Active", "Archived" };
    public List<string> GetDatasetFormats() => new() { "CSV", "JSON", "Parquet", "SQL", "API" };
    public List<string> GetRuleTypes() => new() { "completeness", "accuracy", "consistency", "timeliness", "uniqueness", "validity" };

    // ===================== HELPERS =====================

    private DataProject? LoadProject(Guid id) =>
        _db.DataProjects
            .Include(p => p.Datasets)
            .Include(p => p.Forms)
            .Include(p => p.QualityRules)
            .FirstOrDefault(p => p.Id == id);

    private static ProjectResponse ToProjectResponse(DataProject p) => new(
        p.Id, p.WorkspaceId, p.Name, p.Description, p.Status, p.CreatedBy,
        p.CreatedAt, p.UpdatedAt, p.Tags,
        p.Datasets.Count, p.Forms.Count, p.QualityRules.Count);

    private static ProjectDetailResponse ToProjectDetailResponse(DataProject p) => new(
        p.Id, p.WorkspaceId, p.Name, p.Description, p.Status, p.CreatedBy,
        p.CreatedAt, p.UpdatedAt, p.Tags,
        p.Datasets.Select(ToDatasetResponse).ToList(),
        p.Forms.Select(ToFormResponse).ToList(),
        p.QualityRules.Select(ToRuleResponse).ToList());

    private static DatasetResponse ToDatasetResponse(Dataset d) => new(
        d.Id, d.ProjectId, d.Name, d.Description, d.Source, d.Format,
        d.RecordCount, d.SizeBytes,
        d.Columns.Select(c => new DataColumnDto(c.Name, c.DataType, c.Nullable, c.Description)).ToList(),
        d.Status, d.LastRefreshed, d.CreatedAt,
        ToGovernanceDto(d.Governance),
        d.CustomMetadata.Select(ToCustomFieldDto).ToList());

    private static DatasetGovernanceDto ToGovernanceDto(DatasetGovernance g) => new(
        g.DataOwner, g.DataSteward, g.Classification, g.SensitivityLevel,
        g.ContainsPii, g.ContainsPhi, g.RetentionPolicy, g.DataDomain,
        g.UpdateFrequency, g.QualityScore, g.LineageInfo, g.ComplianceFrameworks);

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
    { Key = f.Key, Value = f.Value, FieldType = f.FieldType };

    private static DataFormResponse ToFormResponse(DataForm f) => new(
        f.Id, f.ProjectId, f.Name, f.Description,
        f.Fields.Select(x => new FormFieldDto(x.Name, x.Label, x.FieldType, x.Required, x.Options, x.Placeholder, x.DefaultValue)).ToList(),
        f.Status, f.SubmissionCount, f.CreatedAt, f.UpdatedAt);

    private static DataQualityRuleResponse ToRuleResponse(DataQualityRule r) => new(
        r.Id, r.ProjectId, r.DatasetId, r.Name, r.Description,
        r.RuleType, r.Column, r.Expression, r.Severity,
        r.IsActive, r.PassRate, r.LastResult, r.LastRunAt, r.CreatedAt);

    private static FormField ToFormField(FormFieldDto dto) => new()
    {
        Name = dto.Name, Label = dto.Label, FieldType = dto.FieldType,
        Required = dto.Required, Options = dto.Options,
        Placeholder = dto.Placeholder, DefaultValue = dto.DefaultValue
    };

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
}
