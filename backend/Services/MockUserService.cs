using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

/// <summary>
/// In-memory mock implementation of IUserService.
/// Seeds 80,000+ users for scale testing. Replace with a real DB later.
/// </summary>
public class MockUserService : IUserService
{
    private static readonly List<User> _users;
    private static readonly object _lock = new();

    private static readonly string[] _roles = { "Admin", "User", "Analyst", "DataEngineer", "Viewer",
        "Manager", "Auditor", "Developer", "Support", "Operations" };

    static MockUserService()
    {
        _users = new List<User>(80_010);

        // Seed well-known accounts
        _users.Add(new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Username = "admin",
            Email = "admin@bigdata.app",
            PasswordHash = BCryptHash("Admin123!"),
            FirstName = "System",
            LastName = "Administrator",
            IsActive = true,
            Roles = new List<string> { "Admin", "User" }
        });
        _users.Add(new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Username = "jdoe",
            Email = "jdoe@bigdata.app",
            PasswordHash = BCryptHash("User123!"),
            FirstName = "John",
            LastName = "Doe",
            IsActive = true,
            Roles = new List<string> { "User" }
        });
        _users.Add(new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Username = "analyst1",
            Email = "analyst1@bigdata.app",
            PasswordHash = BCryptHash("Analyst123!"),
            FirstName = "Jane",
            LastName = "Smith",
            IsActive = true,
            Roles = new List<string> { "Analyst", "User" }
        });

        // Seed 80,000 generated users
        var firstNames = new[] { "Alice", "Bob", "Carlos", "Diana", "Ethan", "Fatima", "George",
            "Hannah", "Ivan", "Julia", "Kevin", "Luna", "Marcus", "Nina", "Oscar", "Priya",
            "Quinn", "Rashid", "Sofia", "Tyler" };
        var lastNames = new[] { "Anderson", "Brown", "Chen", "Davis", "Evans", "Fischer", "Garcia",
            "Hernandez", "Ibrahim", "Johnson", "Kim", "Lee", "Martinez", "Nguyen", "Ortiz",
            "Patel", "Quinn", "Robinson", "Singh", "Taylor" };

        var rng = new Random(42); // deterministic seed
        for (int i = 0; i < 80_000; i++)
        {
            var fn = firstNames[rng.Next(firstNames.Length)];
            var ln = lastNames[rng.Next(lastNames.Length)];
            var roleCount = rng.Next(1, 4);
            var userRoles = new HashSet<string> { "User" };
            for (int r = 0; r < roleCount; r++)
                userRoles.Add(_roles[rng.Next(_roles.Length)]);

            _users.Add(new User
            {
                Id = Guid.NewGuid(),
                Username = $"user{i:D6}",
                Email = $"user{i:D6}@bigdata.app",
                PasswordHash = BCryptHash("Pass123!"),
                FirstName = fn,
                LastName = ln,
                IsActive = rng.NextDouble() > 0.1,
                Roles = userRoles.ToList()
            });
        }
    }

    // Simple password hashing — swap out for real BCrypt in production
    private static string BCryptHash(string password)
    {
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    public static bool VerifyPassword(string password, string hash)
    {
        return BCryptHash(password) == hash;
    }

    public IEnumerable<UserResponse> GetAll()
    {
        lock (_lock)
        {
            return _users.Select(ToResponse).ToList();
        }
    }

    public PagedResponse<UserResponse> GetPaged(UserQuery query)
    {
        lock (_lock)
        {
            IEnumerable<User> q = _users;

            // Filter by search term (username, email, first/last name)
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim();
                q = q.Where(u =>
                    u.Username.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                    u.Email.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                    u.FirstName.Contains(s, StringComparison.OrdinalIgnoreCase) ||
                    u.LastName.Contains(s, StringComparison.OrdinalIgnoreCase));
            }

            // Filter by role
            if (!string.IsNullOrWhiteSpace(query.Role))
                q = q.Where(u => u.Roles.Contains(query.Role, StringComparer.OrdinalIgnoreCase));

            // Filter by active status
            if (query.IsActive.HasValue)
                q = q.Where(u => u.IsActive == query.IsActive.Value);

            var totalCount = q.Count();

            // Sort
            q = query.SortBy?.ToLowerInvariant() switch
            {
                "email" => query.SortDesc ? q.OrderByDescending(u => u.Email) : q.OrderBy(u => u.Email),
                "firstname" => query.SortDesc ? q.OrderByDescending(u => u.FirstName) : q.OrderBy(u => u.FirstName),
                "lastname" => query.SortDesc ? q.OrderByDescending(u => u.LastName) : q.OrderBy(u => u.LastName),
                "createdat" => query.SortDesc ? q.OrderByDescending(u => u.CreatedAt) : q.OrderBy(u => u.CreatedAt),
                "isactive" => query.SortDesc ? q.OrderByDescending(u => u.IsActive) : q.OrderBy(u => u.IsActive),
                _ => query.SortDesc ? q.OrderByDescending(u => u.Username) : q.OrderBy(u => u.Username),
            };

            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 1, 200);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var items = q
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(ToResponse)
                .ToList();

            return new PagedResponse<UserResponse>(items, totalCount, page, pageSize, totalPages);
        }
    }

    public UserResponse? GetById(Guid id)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            return user is null ? null : ToResponse(user);
        }
    }

    public UserResponse? GetByUsername(string username)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u =>
                u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
            return user is null ? null : ToResponse(user);
        }
    }

    public UserResponse Create(CreateUserRequest request)
    {
        lock (_lock)
        {
            if (_users.Any(u => u.Username.Equals(request.Username, StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException($"Username '{request.Username}' already exists.");

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCryptHash(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Roles = request.Roles ?? new List<string> { "User" }
            };

            _users.Add(user);
            return ToResponse(user);
        }
    }

    public UserResponse? Update(Guid id, UpdateUserRequest request)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user is null) return null;

            if (request.Email is not null) user.Email = request.Email;
            if (request.FirstName is not null) user.FirstName = request.FirstName;
            if (request.LastName is not null) user.LastName = request.LastName;
            if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
            if (request.Roles is not null) user.Roles = request.Roles;

            return ToResponse(user);
        }
    }

    public bool Delete(Guid id)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user is null) return false;
            _users.Remove(user);
            return true;
        }
    }

    public bool AssignRole(Guid userId, string role)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == userId);
            if (user is null) return false;
            if (user.Roles.Contains(role, StringComparer.OrdinalIgnoreCase)) return true;
            user.Roles.Add(role);
            return true;
        }
    }

    public bool RemoveRole(Guid userId, string role)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == userId);
            if (user is null) return false;
            user.Roles.RemoveAll(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));
            return true;
        }
    }

    public BulkOperationResult BulkAssignRoles(List<Guid> userIds, List<string> roles)
    {
        lock (_lock)
        {
            int affected = 0;
            foreach (var id in userIds)
            {
                var user = _users.FirstOrDefault(u => u.Id == id);
                if (user is null) continue;
                foreach (var role in roles)
                {
                    if (!user.Roles.Contains(role, StringComparer.OrdinalIgnoreCase))
                        user.Roles.Add(role);
                }
                affected++;
            }
            return new BulkOperationResult(affected, userIds.Count);
        }
    }

    public BulkOperationResult BulkRemoveRoles(List<Guid> userIds, List<string> roles)
    {
        lock (_lock)
        {
            int affected = 0;
            foreach (var id in userIds)
            {
                var user = _users.FirstOrDefault(u => u.Id == id);
                if (user is null) continue;
                foreach (var role in roles)
                    user.Roles.RemoveAll(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));
                affected++;
            }
            return new BulkOperationResult(affected, userIds.Count);
        }
    }

    public BulkOperationResult BulkSetStatus(List<Guid> userIds, bool isActive)
    {
        lock (_lock)
        {
            int affected = 0;
            foreach (var id in userIds)
            {
                var user = _users.FirstOrDefault(u => u.Id == id);
                if (user is null) continue;
                user.IsActive = isActive;
                affected++;
            }
            return new BulkOperationResult(affected, userIds.Count);
        }
    }

    public BulkOperationResult BulkDelete(List<Guid> userIds)
    {
        lock (_lock)
        {
            var toRemove = _users.Where(u => userIds.Contains(u.Id)).ToList();
            foreach (var u in toRemove) _users.Remove(u);
            return new BulkOperationResult(toRemove.Count, userIds.Count);
        }
    }

    /// <summary>
    /// Internal: used by AuthService to verify credentials.
    /// </summary>
    public User? GetUserEntityByUsername(string username)
    {
        lock (_lock)
        {
            return _users.FirstOrDefault(u =>
                u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
        }
    }

    private static UserResponse ToResponse(User u) => new(
        u.Id, u.Username, u.Email, u.FirstName, u.LastName, u.IsActive, u.CreatedAt, u.Roles
    );
}
