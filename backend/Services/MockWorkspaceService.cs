using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public class MockWorkspaceService : IWorkspaceService
{
    private readonly List<Workspace> _workspaces = new();
    private IDataProjectService? _projectService;
    private IQueryService? _queryService;

    public MockWorkspaceService()
    {
        SeedData();
    }

    public void SetProjectService(IDataProjectService projectService) => _projectService = projectService;
    public void SetQueryService(IQueryService queryService) => _queryService = queryService;

    private void SeedData()
    {
        _workspaces.AddRange(new[]
        {
            new Workspace
            {
                Name = "Engineering",
                Description = "Software engineering and platform development team workspace. Manages technical infrastructure, data pipelines, and system integrations.",
                Department = "Engineering",
                Color = "#4f46e5",
                Icon = "⚙️",
                CreatedBy = "admin",
                CreatedAt = DateTime.UtcNow.AddDays(-180),
                UpdatedAt = DateTime.UtcNow.AddDays(-2),
                Members = new() { "admin", "jdoe", "analyst1" },
                IsDefault = true,
            },
            new Workspace
            {
                Name = "Marketing Analytics",
                Description = "Marketing department workspace for campaign tracking, customer segmentation, and attribution analysis.",
                Department = "Marketing",
                Color = "#ec4899",
                Icon = "📣",
                CreatedBy = "admin",
                CreatedAt = DateTime.UtcNow.AddDays(-150),
                UpdatedAt = DateTime.UtcNow.AddDays(-5),
                Members = new() { "admin", "analyst1" },
            },
            new Workspace
            {
                Name = "Finance & Revenue",
                Description = "Finance team workspace for revenue reporting, cost analysis, budgeting, and financial compliance.",
                Department = "Finance",
                Color = "#16a34a",
                Icon = "💰",
                CreatedBy = "admin",
                CreatedAt = DateTime.UtcNow.AddDays(-200),
                UpdatedAt = DateTime.UtcNow.AddDays(-3),
                Members = new() { "admin", "analyst1" },
            },
            new Workspace
            {
                Name = "Data Science Lab",
                Description = "Data science and ML team workspace for experimentation, model development, and feature engineering.",
                Department = "Data Science",
                Color = "#9333ea",
                Icon = "🔬",
                CreatedBy = "admin",
                CreatedAt = DateTime.UtcNow.AddDays(-90),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                Members = new() { "admin", "jdoe" },
            },
            new Workspace
            {
                Name = "Operations",
                Description = "Operations workspace for monitoring IoT pipelines, manufacturing data, and infrastructure health.",
                Department = "Operations",
                Color = "#ea580c",
                Icon = "🏭",
                CreatedBy = "admin",
                CreatedAt = DateTime.UtcNow.AddDays(-120),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                Members = new() { "admin", "jdoe", "analyst1" },
            },
        });
    }

    // ---- Mapping ----

    private WorkspaceResponse ToResponse(Workspace w) => new(
        w.Id, w.Name, w.Description, w.Department, w.Color, w.Icon,
        w.CreatedBy, w.CreatedAt, w.UpdatedAt, w.Members, w.IsDefault,
        _projectService?.SearchProjects(new ProjectSearchParams(WorkspaceId: w.Id, PageSize: 1)).TotalCount ?? 0,
        _queryService?.Search(new QuerySearchParams(WorkspaceId: w.Id, PageSize: 1)).TotalCount ?? 0
    );

    // ---- Interface ----

    public PagedResponse<WorkspaceResponse> Search(WorkspaceSearchParams search)
    {
        var q = _workspaces.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search.Search))
        {
            var s = search.Search.ToLowerInvariant();
            q = q.Where(w => w.Name.Contains(s, StringComparison.OrdinalIgnoreCase)
                          || w.Description.Contains(s, StringComparison.OrdinalIgnoreCase)
                          || w.Department.Contains(s, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search.Department))
            q = q.Where(w => w.Department.Equals(search.Department, StringComparison.OrdinalIgnoreCase));

        q = search.SortBy?.ToLowerInvariant() switch
        {
            "department" => search.SortDesc ? q.OrderByDescending(w => w.Department) : q.OrderBy(w => w.Department),
            "createdat" => search.SortDesc ? q.OrderByDescending(w => w.CreatedAt) : q.OrderBy(w => w.CreatedAt),
            "updatedat" => search.SortDesc ? q.OrderByDescending(w => w.UpdatedAt) : q.OrderBy(w => w.UpdatedAt),
            _ => search.SortDesc ? q.OrderByDescending(w => w.Name) : q.OrderBy(w => w.Name),
        };

        var total = q.Count();
        var items = q.Skip((search.Page - 1) * search.PageSize).Take(search.PageSize).ToList();

        return new PagedResponse<WorkspaceResponse>(
            items.Select(ToResponse).ToList(),
            total,
            search.Page,
            search.PageSize,
            (int)Math.Ceiling(total / (double)search.PageSize)
        );
    }

    public WorkspaceResponse? GetById(Guid id)
    {
        var w = _workspaces.FirstOrDefault(x => x.Id == id);
        return w is null ? null : ToResponse(w);
    }

    public WorkspaceResponse Create(CreateWorkspaceRequest request, string createdBy)
    {
        var w = new Workspace
        {
            Name = request.Name,
            Description = request.Description,
            Department = request.Department,
            Color = request.Color ?? "#4f46e5",
            Icon = request.Icon ?? "📁",
            CreatedBy = createdBy,
            Members = request.Members ?? new() { createdBy },
        };
        _workspaces.Add(w);
        return ToResponse(w);
    }

    public WorkspaceResponse? Update(Guid id, UpdateWorkspaceRequest request)
    {
        var w = _workspaces.FirstOrDefault(x => x.Id == id);
        if (w is null) return null;

        if (request.Name is not null) w.Name = request.Name;
        if (request.Description is not null) w.Description = request.Description;
        if (request.Department is not null) w.Department = request.Department;
        if (request.Color is not null) w.Color = request.Color;
        if (request.Icon is not null) w.Icon = request.Icon;
        if (request.Members is not null) w.Members = request.Members;
        w.UpdatedAt = DateTime.UtcNow;

        return ToResponse(w);
    }

    public bool Delete(Guid id)
    {
        var w = _workspaces.FirstOrDefault(x => x.Id == id);
        if (w is null) return false;
        _workspaces.Remove(w);
        return true;
    }

    public List<WorkspaceResponse> GetWorkspacesForUser(string username)
    {
        return _workspaces
            .Where(w => w.Members.Any(m => m.Equals(username, StringComparison.OrdinalIgnoreCase)))
            .Select(ToResponse)
            .ToList();
    }

    public List<string> GetDepartments() =>
        _workspaces.Select(w => w.Department).Distinct().OrderBy(d => d).ToList();

    public int GetProjectCount(Guid workspaceId) =>
        _projectService?.SearchProjects(new ProjectSearchParams(WorkspaceId: workspaceId, PageSize: 1)).TotalCount ?? 0;

    public int GetQueryCount(Guid workspaceId) =>
        _queryService?.Search(new QuerySearchParams(WorkspaceId: workspaceId, PageSize: 1)).TotalCount ?? 0;

    // Expose workspace IDs for seeding
    public List<Guid> GetWorkspaceIds() => _workspaces.Select(w => w.Id).ToList();
}
