using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

/// <summary>
/// In-memory mock implementation of IUserService.
/// Replace with a real database-backed service later.
/// </summary>
public class MockUserService : IUserService
{
    private static readonly List<User> _users = new()
    {
        new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Username = "admin",
            Email = "admin@bigdata.app",
            PasswordHash = BCryptHash("Admin123!"),
            FirstName = "System",
            LastName = "Administrator",
            IsActive = true,
            Roles = new List<string> { "Admin", "User" }
        },
        new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Username = "jdoe",
            Email = "jdoe@bigdata.app",
            PasswordHash = BCryptHash("User123!"),
            FirstName = "John",
            LastName = "Doe",
            IsActive = true,
            Roles = new List<string> { "User" }
        },
        new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Username = "analyst1",
            Email = "analyst1@bigdata.app",
            PasswordHash = BCryptHash("Analyst123!"),
            FirstName = "Jane",
            LastName = "Smith",
            IsActive = true,
            Roles = new List<string> { "Analyst", "User" }
        }
    };

    private static readonly object _lock = new();

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
