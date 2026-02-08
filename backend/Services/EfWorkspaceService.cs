using BigDataApp.Api.Data;
using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BigDataApp.Api.Services;

public class EfWorkspaceService : IWorkspaceService
{
    private readonly AppDbContext _db;

    public EfWorkspaceService(AppDbContext db) => _db = db;

    public PagedResponse<WorkspaceResponse> Search(WorkspaceSearchParams search)
    {
        IQueryable<Workspace> q = _db.Workspaces.Include(w => w.WorkspaceMembers);

        if (!string.IsNullOrWhiteSpace(search.Search))
        {
            var s = search.Search.ToLower();
            q = q.Where(w => w.Name.ToLower().Contains(s) || w.Description.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(search.Department))
            q = q.Where(w => w.Department == search.Department);

        q = search.SortBy?.ToLower() switch
        {
            "department" => search.SortDesc ? q.OrderByDescending(w => w.Department) : q.OrderBy(w => w.Department),
            "createdat" => search.SortDesc ? q.OrderByDescending(w => w.CreatedAt) : q.OrderBy(w => w.CreatedAt),
            "updatedat" => search.SortDesc ? q.OrderByDescending(w => w.UpdatedAt) : q.OrderBy(w => w.UpdatedAt),
            _ => search.SortDesc ? q.OrderByDescending(w => w.Name) : q.OrderBy(w => w.Name),
        };

        var total = q.Count();
        var items = q.Skip((search.Page - 1) * search.PageSize).Take(search.PageSize)
            .AsEnumerable().Select(ToResponse).ToList();

        return new PagedResponse<WorkspaceResponse>(items, total, search.Page, search.PageSize,
            (int)Math.Ceiling(total / (double)search.PageSize));
    }

    public WorkspaceResponse? GetById(Guid id)
    {
        var ws = _db.Workspaces.Include(w => w.WorkspaceMembers).FirstOrDefault(w => w.Id == id);
        return ws is null ? null : ToResponse(ws);
    }

    public WorkspaceResponse Create(CreateWorkspaceRequest request, string createdBy)
    {
        var ws = new Workspace
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Department = request.Department,
            Color = request.Color ?? "#4f46e5",
            Icon = request.Icon ?? "📁",
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Workspaces.Add(ws);

        if (request.Members is { Count: > 0 })
            foreach (var m in request.Members)
                _db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = ws.Id, Username = m });

        _db.SaveChanges();
        return ToResponse(_db.Workspaces.Include(w => w.WorkspaceMembers).First(w => w.Id == ws.Id));
    }

    public WorkspaceResponse? Update(Guid id, UpdateWorkspaceRequest request)
    {
        var ws = _db.Workspaces.Include(w => w.WorkspaceMembers).FirstOrDefault(w => w.Id == id);
        if (ws is null) return null;

        if (request.Name is not null) ws.Name = request.Name;
        if (request.Description is not null) ws.Description = request.Description;
        if (request.Department is not null) ws.Department = request.Department;
        if (request.Color is not null) ws.Color = request.Color;
        if (request.Icon is not null) ws.Icon = request.Icon;
        ws.UpdatedAt = DateTime.UtcNow;

        if (request.Members is not null)
        {
            _db.WorkspaceMembers.RemoveRange(ws.WorkspaceMembers);
            foreach (var m in request.Members)
                _db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = ws.Id, Username = m });
        }

        _db.SaveChanges();
        return ToResponse(_db.Workspaces.Include(w => w.WorkspaceMembers).First(w => w.Id == id));
    }

    public bool Delete(Guid id)
    {
        var ws = _db.Workspaces.FirstOrDefault(w => w.Id == id);
        if (ws is null) return false;
        _db.Workspaces.Remove(ws);
        _db.SaveChanges();
        return true;
    }

    public List<WorkspaceResponse> GetWorkspacesForUser(string username)
    {
        return _db.Workspaces.Include(w => w.WorkspaceMembers)
            .Where(w => w.WorkspaceMembers.Any(m => m.Username == username) || w.IsDefault)
            .AsEnumerable()
            .Select(ToResponse)
            .ToList();
    }

    public List<string> GetDepartments() =>
        _db.Workspaces.Select(w => w.Department).Distinct().OrderBy(d => d).ToList();

    private WorkspaceResponse ToResponse(Workspace w) =>
        new(w.Id, w.Name, w.Description, w.Department, w.Color, w.Icon,
            w.CreatedBy, w.CreatedAt, w.UpdatedAt,
            w.WorkspaceMembers.Select(m => m.Username).ToList(),
            w.IsDefault,
            _db.DataProjects.Count(p => p.WorkspaceId == w.Id),
            _db.SavedQueries.Count(q => q.WorkspaceId == w.Id));
}
