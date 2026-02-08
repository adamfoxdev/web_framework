using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly IUserService _users;
    private readonly IQueryService _queries;
    private readonly IDataProjectService _projects;
    private readonly IWorkspaceService _workspaces;

    public SearchController(
        IUserService users,
        IQueryService queries,
        IDataProjectService projects,
        IWorkspaceService workspaces)
    {
        _users = users;
        _queries = queries;
        _projects = projects;
        _workspaces = workspaces;
    }

    [HttpGet]
    public IActionResult Search(
        [FromQuery] string? q,
        [FromQuery] string? entityType,    // project, dataset, form, rule, query, user, workspace (comma-separated)
        [FromQuery] string? status,
        [FromQuery] string? workspace,     // workspaceId
        [FromQuery] string? tag,
        [FromQuery] string? createdBy,
        [FromQuery] string? classification,
        [FromQuery] bool? containsPii,
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo,
        [FromQuery] string sortBy = "relevance",
        [FromQuery] bool sortDesc = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var term = q?.Trim().ToLowerInvariant() ?? "";
        var types = string.IsNullOrWhiteSpace(entityType)
            ? new HashSet<string> { "project", "dataset", "form", "rule", "query", "user", "workspace" }
            : new HashSet<string>(entityType.Split(',').Select(t => t.Trim().ToLowerInvariant()));

        DateTime? from = null, to = null;
        if (DateTime.TryParse(dateFrom, out var df)) from = df;
        if (DateTime.TryParse(dateTo, out var dt)) to = dt;

        Guid? wsId = null;
        if (Guid.TryParse(workspace, out var wid)) wsId = wid;

        var results = new List<SearchResult>();

        // --- Projects ---
        if (types.Contains("project"))
        {
            var paged = _projects.SearchProjects(new ProjectSearchParams { PageSize = 200, WorkspaceId = wsId });
            foreach (var p in paged.Items)
            {
                if (!string.IsNullOrEmpty(term) &&
                    !p.Name.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !p.Description.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !p.Tags.Any(t => t.Contains(term, StringComparison.OrdinalIgnoreCase)))
                    continue;

                if (!string.IsNullOrWhiteSpace(status) && !p.Status.Equals(status, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (!string.IsNullOrWhiteSpace(tag) && !p.Tags.Any(t => t.Equals(tag, StringComparison.OrdinalIgnoreCase)))
                    continue;
                if (!string.IsNullOrWhiteSpace(createdBy) && !p.CreatedBy.Equals(createdBy, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (from.HasValue && p.CreatedAt < from.Value) continue;
                if (to.HasValue && p.CreatedAt > to.Value.AddDays(1)) continue;

                results.Add(new SearchResult(
                    p.Id, "project", p.Name, p.Description, p.Status,
                    p.CreatedBy, p.CreatedAt, p.UpdatedAt,
                    p.Tags, null, null, p.WorkspaceId, null, null, null));
            }
        }

        // --- Datasets, Forms, Quality Rules (need detail) ---
        if (types.Contains("dataset") || types.Contains("form") || types.Contains("rule"))
        {
            var paged = _projects.SearchProjects(new ProjectSearchParams { PageSize = 200, WorkspaceId = wsId });
            foreach (var proj in paged.Items)
            {
                var detail = _projects.GetProjectById(proj.Id);
                if (detail is null) continue;

                if (types.Contains("dataset"))
                {
                    foreach (var ds in detail.Datasets)
                    {
                        if (!string.IsNullOrEmpty(term) &&
                            !ds.Name.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !ds.Description.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !ds.Source.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !ds.Columns.Any(c => c.Name.Contains(term, StringComparison.OrdinalIgnoreCase) || c.Description.Contains(term, StringComparison.OrdinalIgnoreCase)) &&
                            !(ds.Governance?.DataOwner?.Contains(term, StringComparison.OrdinalIgnoreCase) == true) &&
                            !(ds.Governance?.DataDomain?.Contains(term, StringComparison.OrdinalIgnoreCase) == true))
                            continue;

                        if (!string.IsNullOrWhiteSpace(status) && !ds.Status.Equals(status, StringComparison.OrdinalIgnoreCase))
                            continue;
                        if (!string.IsNullOrWhiteSpace(classification) && ds.Governance?.Classification != classification)
                            continue;
                        if (containsPii.HasValue && ds.Governance?.ContainsPii != containsPii.Value)
                            continue;
                        if (from.HasValue && ds.CreatedAt < from.Value) continue;
                        if (to.HasValue && ds.CreatedAt > to.Value.AddDays(1)) continue;

                        results.Add(new SearchResult(
                            ds.Id, "dataset", ds.Name, ds.Description, ds.Status,
                            null, ds.CreatedAt, ds.LastRefreshed,
                            null, proj.Id, proj.Name, proj.WorkspaceId,
                            ds.Governance?.Classification, ds.Governance?.ContainsPii, ds.Governance?.DataOwner));
                    }
                }

                if (types.Contains("form"))
                {
                    foreach (var f in detail.Forms)
                    {
                        if (!string.IsNullOrEmpty(term) &&
                            !f.Name.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !f.Description.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !f.Fields.Any(fld => fld.Name.Contains(term, StringComparison.OrdinalIgnoreCase) || fld.Label.Contains(term, StringComparison.OrdinalIgnoreCase)))
                            continue;

                        if (!string.IsNullOrWhiteSpace(status) && !f.Status.Equals(status, StringComparison.OrdinalIgnoreCase))
                            continue;
                        if (from.HasValue && f.CreatedAt < from.Value) continue;
                        if (to.HasValue && f.CreatedAt > to.Value.AddDays(1)) continue;

                        results.Add(new SearchResult(
                            f.Id, "form", f.Name, f.Description, f.Status,
                            null, f.CreatedAt, f.UpdatedAt,
                            null, proj.Id, proj.Name, proj.WorkspaceId, null, null, null));
                    }
                }

                if (types.Contains("rule"))
                {
                    foreach (var r in detail.QualityRules)
                    {
                        if (!string.IsNullOrEmpty(term) &&
                            !r.Name.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !r.Description.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !r.Expression.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                            !(r.Column?.Contains(term, StringComparison.OrdinalIgnoreCase) == true))
                            continue;

                        if (from.HasValue && r.CreatedAt < from.Value) continue;
                        if (to.HasValue && r.CreatedAt > to.Value.AddDays(1)) continue;

                        results.Add(new SearchResult(
                            r.Id, "rule", r.Name, r.Description, r.LastResult ?? "not run",
                            null, r.CreatedAt, r.LastRunAt,
                            null, proj.Id, proj.Name, proj.WorkspaceId, null, null, null));
                    }
                }
            }
        }

        // --- Queries ---
        if (types.Contains("query"))
        {
            var qp = new QuerySearchParams { PageSize = 200, WorkspaceId = wsId };
            var queriesResult = _queries.Search(qp);
            foreach (var qr in queriesResult.Items)
            {
                if (!string.IsNullOrEmpty(term) &&
                    !qr.Name.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !qr.Description.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !qr.SqlText.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !qr.Database.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !qr.Tags.Any(t => t.Contains(term, StringComparison.OrdinalIgnoreCase)))
                    continue;

                if (!string.IsNullOrWhiteSpace(tag) && !qr.Tags.Any(t => t.Equals(tag, StringComparison.OrdinalIgnoreCase)))
                    continue;
                if (!string.IsNullOrWhiteSpace(createdBy) && !qr.CreatedBy.Equals(createdBy, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (from.HasValue && qr.CreatedAt < from.Value) continue;
                if (to.HasValue && qr.CreatedAt > to.Value.AddDays(1)) continue;

                results.Add(new SearchResult(
                    qr.Id, "query", qr.Name, qr.Description, qr.Database,
                    qr.CreatedBy, qr.CreatedAt, qr.UpdatedAt,
                    qr.Tags, null, null, qr.WorkspaceId, null, null, null));
            }
        }

        // --- Users ---
        if (types.Contains("user"))
        {
            var users = _users.GetPaged(new UserQuery { PageSize = 200 });
            foreach (var u in users.Items)
            {
                if (!string.IsNullOrEmpty(term) &&
                    !u.Username.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !u.Email.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !u.FirstName.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !u.LastName.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !u.Roles.Any(r => r.Contains(term, StringComparison.OrdinalIgnoreCase)))
                    continue;

                if (from.HasValue && u.CreatedAt < from.Value) continue;
                if (to.HasValue && u.CreatedAt > to.Value.AddDays(1)) continue;

                var userStatus = u.IsActive ? "Active" : "Inactive";
                if (!string.IsNullOrWhiteSpace(status) && !userStatus.Equals(status, StringComparison.OrdinalIgnoreCase))
                    continue;

                results.Add(new SearchResult(
                    u.Id, "user", $"{u.FirstName} {u.LastName}", $"@{u.Username} · {u.Email}", userStatus,
                    u.Username, u.CreatedAt, u.CreatedAt,
                    u.Roles, null, null, null, null, null, null));
            }
        }

        // --- Workspaces ---
        if (types.Contains("workspace"))
        {
            var wsList = _workspaces.Search(new WorkspaceSearchParams { PageSize = 200 });
            foreach (var ws in wsList.Items)
            {
                if (!string.IsNullOrEmpty(term) &&
                    !ws.Name.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !ws.Description.Contains(term, StringComparison.OrdinalIgnoreCase) &&
                    !ws.Department.Contains(term, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (from.HasValue && ws.CreatedAt < from.Value) continue;
                if (to.HasValue && ws.CreatedAt > to.Value.AddDays(1)) continue;

                results.Add(new SearchResult(
                    ws.Id, "workspace", ws.Name, ws.Description, ws.Department,
                    ws.CreatedBy, ws.CreatedAt, ws.UpdatedAt,
                    null, null, null, ws.Id, null, null, null));
            }
        }

        // --- Sort ---
        results = sortBy.ToLowerInvariant() switch
        {
            "name" => (sortDesc ? results.OrderByDescending(r => r.Name) : results.OrderBy(r => r.Name)).ToList(),
            "type" => (sortDesc ? results.OrderByDescending(r => r.EntityType) : results.OrderBy(r => r.EntityType)).ToList(),
            "createdat" => (sortDesc ? results.OrderByDescending(r => r.CreatedAt) : results.OrderBy(r => r.CreatedAt)).ToList(),
            "updatedat" => (sortDesc ? results.OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt) : results.OrderBy(r => r.UpdatedAt ?? r.CreatedAt)).ToList(),
            _ => results // relevance = insertion order
        };

        var total = results.Count;
        var items = results.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new PagedResponse<SearchResult>(
            items, total, page, pageSize,
            (int)Math.Ceiling(total / (double)pageSize)));
    }

    [HttpGet("entity-types")]
    public IActionResult GetEntityTypes() =>
        Ok(new[] { "project", "dataset", "form", "rule", "query", "user", "workspace" });
}

public record SearchResult(
    Guid Id,
    string EntityType,          // project, dataset, form, rule, query, user, workspace
    string Name,
    string Description,
    string? Status,
    string? CreatedBy,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<string>? Tags,
    Guid? ParentProjectId,
    string? ParentProjectName,
    Guid? WorkspaceId,
    string? Classification,
    bool? ContainsPii,
    string? DataOwner
);
