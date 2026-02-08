using BigDataApp.Api.Data;
using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BigDataApp.Api.Services;

public class EfUserService : IUserService
{
    private readonly AppDbContext _db;

    public EfUserService(AppDbContext db) => _db = db;

    public IEnumerable<UserResponse> GetAll() =>
        _db.Users.Include(u => u.UserRoles).AsEnumerable().Select(ToResponse).ToList();

    public PagedResponse<UserResponse> GetPaged(UserQuery query)
    {
        IQueryable<User> q = _db.Users.Include(u => u.UserRoles);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(u =>
                u.Username.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s) ||
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(query.Role))
            q = q.Where(u => u.UserRoles.Any(ur => ur.RoleName == query.Role));
        if (query.IsActive.HasValue)
            q = q.Where(u => u.IsActive == query.IsActive.Value);

        q = query.SortBy?.ToLower() switch
        {
            "email" => query.SortDesc ? q.OrderByDescending(u => u.Email) : q.OrderBy(u => u.Email),
            "firstname" => query.SortDesc ? q.OrderByDescending(u => u.FirstName) : q.OrderBy(u => u.FirstName),
            "lastname" => query.SortDesc ? q.OrderByDescending(u => u.LastName) : q.OrderBy(u => u.LastName),
            "createdat" => query.SortDesc ? q.OrderByDescending(u => u.CreatedAt) : q.OrderBy(u => u.CreatedAt),
            _ => query.SortDesc ? q.OrderByDescending(u => u.Username) : q.OrderBy(u => u.Username),
        };

        var total = q.Count();
        var items = q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .AsEnumerable().Select(ToResponse).ToList();

        return new PagedResponse<UserResponse>(items, total, query.Page, query.PageSize,
            (int)Math.Ceiling(total / (double)query.PageSize));
    }

    public UserResponse? GetById(Guid id)
    {
        var u = _db.Users.Include(u => u.UserRoles).FirstOrDefault(u => u.Id == id);
        return u is null ? null : ToResponse(u);
    }

    public UserResponse? GetByUsername(string username)
    {
        var u = _db.Users.Include(u => u.UserRoles).FirstOrDefault(u => u.Username == username);
        return u is null ? null : ToResponse(u);
    }

    public UserResponse Create(CreateUserRequest request)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = JwtAuthService.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);

        if (request.Roles is { Count: > 0 })
        {
            foreach (var role in request.Roles)
                _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleName = role });
        }

        _db.SaveChanges();
        return ToResponse(_db.Users.Include(u => u.UserRoles).First(u => u.Id == user.Id));
    }

    public UserResponse? Update(Guid id, UpdateUserRequest request)
    {
        var user = _db.Users.Include(u => u.UserRoles).FirstOrDefault(u => u.Id == id);
        if (user is null) return null;

        if (request.Email is not null) user.Email = request.Email;
        if (request.FirstName is not null) user.FirstName = request.FirstName;
        if (request.LastName is not null) user.LastName = request.LastName;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        if (request.Roles is not null)
        {
            _db.UserRoles.RemoveRange(user.UserRoles);
            foreach (var role in request.Roles)
                _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleName = role });
        }

        _db.SaveChanges();
        return ToResponse(_db.Users.Include(u => u.UserRoles).First(u => u.Id == id));
    }

    public bool Delete(Guid id)
    {
        var user = _db.Users.FirstOrDefault(u => u.Id == id);
        if (user is null) return false;
        _db.Users.Remove(user);
        _db.SaveChanges();
        return true;
    }

    public bool AssignRole(Guid userId, string role)
    {
        if (_db.UserRoles.Any(ur => ur.UserId == userId && ur.RoleName == role)) return true;
        _db.UserRoles.Add(new UserRole { UserId = userId, RoleName = role });
        _db.SaveChanges();
        return true;
    }

    public bool RemoveRole(Guid userId, string role)
    {
        var ur = _db.UserRoles.FirstOrDefault(ur => ur.UserId == userId && ur.RoleName == role);
        if (ur is null) return false;
        _db.UserRoles.Remove(ur);
        _db.SaveChanges();
        return true;
    }

    public BulkOperationResult BulkAssignRoles(List<Guid> userIds, List<string> roles)
    {
        int affected = 0;
        foreach (var uid in userIds)
            foreach (var role in roles)
                if (!_db.UserRoles.Any(ur => ur.UserId == uid && ur.RoleName == role))
                {
                    _db.UserRoles.Add(new UserRole { UserId = uid, RoleName = role });
                    affected++;
                }
        _db.SaveChanges();
        return new BulkOperationResult(affected, userIds.Count);
    }

    public BulkOperationResult BulkRemoveRoles(List<Guid> userIds, List<string> roles)
    {
        var toRemove = _db.UserRoles
            .Where(ur => userIds.Contains(ur.UserId) && roles.Contains(ur.RoleName)).ToList();
        _db.UserRoles.RemoveRange(toRemove);
        _db.SaveChanges();
        return new BulkOperationResult(toRemove.Count, userIds.Count);
    }

    public BulkOperationResult BulkSetStatus(List<Guid> userIds, bool isActive)
    {
        var users = _db.Users.Where(u => userIds.Contains(u.Id)).ToList();
        foreach (var u in users) u.IsActive = isActive;
        _db.SaveChanges();
        return new BulkOperationResult(users.Count, userIds.Count);
    }

    public BulkOperationResult BulkDelete(List<Guid> userIds)
    {
        var users = _db.Users.Where(u => userIds.Contains(u.Id)).ToList();
        _db.Users.RemoveRange(users);
        _db.SaveChanges();
        return new BulkOperationResult(users.Count, userIds.Count);
    }

    private static UserResponse ToResponse(User u) =>
        new(u.Id, u.Username, u.Email, u.FirstName, u.LastName, u.IsActive, u.CreatedAt,
            u.UserRoles.Select(ur => ur.RoleName).ToList());
}
