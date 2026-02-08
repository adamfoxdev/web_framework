using BigDataApp.Api.Data;
using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BigDataApp.Api.Services;

public class EfReportService : IReportService
{
    private readonly AppDbContext _db;

    public EfReportService(AppDbContext db) => _db = db;

    public PagedResponse<ReportResponse> GetAll(ReportSearchParams query)
    {
        var q = _db.Reports
            .Include(r => r.ReportTags)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(r => r.Name.ToLower().Contains(s) || r.Description.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
            q = q.Where(r => r.Status == query.Status);

        if (!string.IsNullOrWhiteSpace(query.Type))
            q = q.Where(r => r.Type == query.Type);

        if (query.WorkspaceId.HasValue)
            q = q.Where(r => r.WorkspaceId == query.WorkspaceId);

        if (!string.IsNullOrWhiteSpace(query.Tag))
            q = q.Where(r => r.ReportTags.Any(t => t.Tag == query.Tag));

        // Sort
        q = query.SortBy?.ToLower() switch
        {
            "name" => query.SortDesc ? q.OrderByDescending(r => r.Name) : q.OrderBy(r => r.Name),
            "status" => query.SortDesc ? q.OrderByDescending(r => r.Status) : q.OrderBy(r => r.Status),
            "type" => query.SortDesc ? q.OrderByDescending(r => r.Type) : q.OrderBy(r => r.Type),
            "createdat" => query.SortDesc ? q.OrderByDescending(r => r.CreatedAt) : q.OrderBy(r => r.CreatedAt),
            _ => query.SortDesc ? q.OrderByDescending(r => r.UpdatedAt) : q.OrderBy(r => r.UpdatedAt),
        };

        var total = q.Count();
        var items = q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToList();

        return new PagedResponse<ReportResponse>(
            items.Select(ToResponse).ToList(),
            total,
            query.Page,
            query.PageSize,
            (int)Math.Ceiling(total / (double)query.PageSize)
        );
    }

    public ReportResponse? GetById(Guid id)
    {
        var r = _db.Reports.Include(x => x.ReportTags).FirstOrDefault(x => x.Id == id);
        return r is null ? null : ToResponse(r);
    }

    public ReportResponse Create(CreateReportRequest request, string createdBy)
    {
        var report = new Report
        {
            Name = request.Name,
            Description = request.Description,
            Type = request.Type ?? "Table",
            Status = "Draft",
            CreatedBy = createdBy,
            QuerySql = request.QuerySql ?? "",
            Schedule = request.Schedule ?? "Manual",
            WorkspaceId = request.WorkspaceId,
        };

        if (request.Tags is { Count: > 0 })
            report.ReportTags = request.Tags.Select(t => new ReportTag { ReportId = report.Id, Tag = t }).ToList();

        _db.Reports.Add(report);
        _db.SaveChanges();

        return ToResponse(report);
    }

    public ReportResponse? Update(Guid id, UpdateReportRequest request)
    {
        var report = _db.Reports.Include(r => r.ReportTags).FirstOrDefault(r => r.Id == id);
        if (report is null) return null;

        if (request.Name is not null) report.Name = request.Name;
        if (request.Description is not null) report.Description = request.Description;
        if (request.Type is not null) report.Type = request.Type;
        if (request.Status is not null) report.Status = request.Status;
        if (request.QuerySql is not null) report.QuerySql = request.QuerySql;
        if (request.Schedule is not null) report.Schedule = request.Schedule;

        if (request.Tags is not null)
        {
            _db.ReportTags.RemoveRange(report.ReportTags);
            report.ReportTags = request.Tags.Select(t => new ReportTag { ReportId = id, Tag = t }).ToList();
        }

        report.UpdatedAt = DateTime.UtcNow;
        _db.SaveChanges();

        return ToResponse(report);
    }

    public bool Delete(Guid id)
    {
        var report = _db.Reports.Find(id);
        if (report is null) return false;
        _db.Reports.Remove(report);
        _db.SaveChanges();
        return true;
    }

    public ReportResponse? RunReport(Guid id)
    {
        var report = _db.Reports.Include(r => r.ReportTags).FirstOrDefault(r => r.Id == id);
        if (report is null) return null;

        report.LastRunAt = DateTime.UtcNow;
        report.UpdatedAt = DateTime.UtcNow;
        _db.SaveChanges();

        return ToResponse(report);
    }

    private static ReportResponse ToResponse(Report r) => new(
        r.Id, r.WorkspaceId, r.Name, r.Description, r.Type, r.Status,
        r.CreatedBy, r.QuerySql, r.Schedule, r.LastRunAt,
        r.CreatedAt, r.UpdatedAt, r.Tags
    );
}
