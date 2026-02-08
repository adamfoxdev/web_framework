using BigDataApp.Api.Data;
using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BigDataApp.Api.Services;

public class EfQueryService : IQueryService
{
    private readonly AppDbContext _db;

    public EfQueryService(AppDbContext db) => _db = db;

    public PagedResponse<QueryResponse> Search(QuerySearchParams search)
    {
        IQueryable<SavedQuery> q = _db.SavedQueries.Include(sq => sq.QueryTags);

        if (!string.IsNullOrWhiteSpace(search.Search))
        {
            var s = search.Search.ToLower();
            q = q.Where(sq => sq.Name.ToLower().Contains(s) || sq.Description.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(search.Database))
            q = q.Where(sq => sq.Database == search.Database);
        if (!string.IsNullOrWhiteSpace(search.Tag))
            q = q.Where(sq => sq.QueryTags.Any(t => t.Tag == search.Tag));
        if (!string.IsNullOrWhiteSpace(search.CreatedBy))
            q = q.Where(sq => sq.CreatedBy == search.CreatedBy);
        if (search.WorkspaceId.HasValue)
            q = q.Where(sq => sq.WorkspaceId == search.WorkspaceId);

        q = search.SortBy?.ToLower() switch
        {
            "name" => search.SortDesc ? q.OrderByDescending(sq => sq.Name) : q.OrderBy(sq => sq.Name),
            "database" => search.SortDesc ? q.OrderByDescending(sq => sq.Database) : q.OrderBy(sq => sq.Database),
            "createdat" => search.SortDesc ? q.OrderByDescending(sq => sq.CreatedAt) : q.OrderBy(sq => sq.CreatedAt),
            _ => search.SortDesc ? q.OrderByDescending(sq => sq.UpdatedAt) : q.OrderBy(sq => sq.UpdatedAt),
        };

        var total = q.Count();
        var items = q.Skip((search.Page - 1) * search.PageSize).Take(search.PageSize)
            .AsEnumerable().Select(ToResponse).ToList();

        return new PagedResponse<QueryResponse>(items, total, search.Page, search.PageSize,
            (int)Math.Ceiling(total / (double)search.PageSize));
    }

    public QueryResponse? GetById(Guid id)
    {
        var sq = _db.SavedQueries.Include(q => q.QueryTags).FirstOrDefault(q => q.Id == id);
        return sq is null ? null : ToResponse(sq);
    }

    public QueryResponse Create(CreateQueryRequest request, string createdBy)
    {
        var sq = new SavedQuery
        {
            Id = Guid.NewGuid(),
            WorkspaceId = request.WorkspaceId,
            Name = request.Name,
            Description = request.Description,
            SqlText = request.SqlText,
            Database = request.Database,
            CreatedBy = createdBy,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.SavedQueries.Add(sq);

        if (request.Tags is { Count: > 0 })
            foreach (var tag in request.Tags)
                _db.QueryTags.Add(new QueryTag { QueryId = sq.Id, Tag = tag });

        _db.SaveChanges();
        return ToResponse(_db.SavedQueries.Include(q => q.QueryTags).First(q => q.Id == sq.Id));
    }

    public QueryResponse? Update(Guid id, UpdateQueryRequest request)
    {
        var sq = _db.SavedQueries.Include(q => q.QueryTags).FirstOrDefault(q => q.Id == id);
        if (sq is null) return null;

        if (request.Name is not null) sq.Name = request.Name;
        if (request.Description is not null) sq.Description = request.Description;
        if (request.SqlText is not null) sq.SqlText = request.SqlText;
        if (request.Database is not null) sq.Database = request.Database;
        if (request.IsPublic.HasValue) sq.IsPublic = request.IsPublic.Value;
        sq.UpdatedAt = DateTime.UtcNow;

        if (request.Tags is not null)
        {
            _db.QueryTags.RemoveRange(sq.QueryTags);
            foreach (var tag in request.Tags)
                _db.QueryTags.Add(new QueryTag { QueryId = sq.Id, Tag = tag });
        }

        _db.SaveChanges();
        return ToResponse(_db.SavedQueries.Include(q => q.QueryTags).First(q => q.Id == id));
    }

    public bool Delete(Guid id)
    {
        var sq = _db.SavedQueries.FirstOrDefault(q => q.Id == id);
        if (sq is null) return false;
        _db.SavedQueries.Remove(sq);
        _db.SaveChanges();
        return true;
    }

    public QueryValidationResponse Validate(ValidateQueryRequest request)
    {
        // Simple mock validation — in production this would parse SQL
        var errors = new List<string>();
        var warnings = new List<string>();

        if (string.IsNullOrWhiteSpace(request.SqlText))
            errors.Add("SQL text cannot be empty");
        else
        {
            var sql = request.SqlText.ToUpper();
            if (!sql.TrimStart().StartsWith("SELECT") &&
                !sql.TrimStart().StartsWith("WITH") &&
                !sql.TrimStart().StartsWith("EXPLAIN"))
                warnings.Add("Query does not start with SELECT, WITH, or EXPLAIN");
            if (sql.Contains("DROP ") || sql.Contains("DELETE ") || sql.Contains("TRUNCATE "))
                errors.Add("Destructive statements (DROP, DELETE, TRUNCATE) are not allowed");
        }

        return new QueryValidationResponse(errors.Count == 0, errors, warnings, DateTime.UtcNow);
    }

    public IEnumerable<string> GetDatabases() =>
        _db.SavedQueries.Select(q => q.Database).Distinct().OrderBy(d => d).ToList();

    public IEnumerable<string> GetTags() =>
        _db.QueryTags.Select(t => t.Tag).Distinct().OrderBy(t => t).ToList();

    private static QueryResponse ToResponse(SavedQuery sq) =>
        new(sq.Id, sq.WorkspaceId, sq.Name, sq.Description, sq.SqlText, sq.Database,
            sq.CreatedBy, sq.CreatedAt, sq.UpdatedAt,
            sq.QueryTags.Select(t => t.Tag).ToList(), sq.IsPublic,
            sq.ValidationIsValid.HasValue
                ? new QueryValidationResponse(
                    sq.ValidationIsValid.Value,
                    DeserializeList(sq.ValidationErrorsJson),
                    DeserializeList(sq.ValidationWarningsJson),
                    sq.ValidationValidatedAt ?? DateTime.UtcNow)
                : null);

    private static List<string> DeserializeList(string? json) =>
        string.IsNullOrEmpty(json) ? new() : System.Text.Json.JsonSerializer.Deserialize<List<string>>(json) ?? new();
}
