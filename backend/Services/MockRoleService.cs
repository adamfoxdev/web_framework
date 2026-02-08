using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public class MockRoleService : IRoleService
{
    private static readonly List<Role> _roles = new()
    {
        new Role { Name = "Admin", Description = "Full system access" },
        new Role { Name = "User", Description = "Standard user access" },
        new Role { Name = "Analyst", Description = "Data analysis and reporting" },
        new Role { Name = "DataEngineer", Description = "Data pipeline management" },
        new Role { Name = "Viewer", Description = "Read-only access" }
    };

    private static readonly object _lock = new();

    public IEnumerable<Role> GetAll()
    {
        lock (_lock) { return _roles.ToList(); }
    }

    public Role? GetByName(string name)
    {
        lock (_lock)
        {
            return _roles.FirstOrDefault(r =>
                r.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        }
    }

    public Role Create(CreateRoleRequest request)
    {
        lock (_lock)
        {
            if (_roles.Any(r => r.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException($"Role '{request.Name}' already exists.");

            var role = new Role { Name = request.Name, Description = request.Description };
            _roles.Add(role);
            return role;
        }
    }

    public bool Delete(string name)
    {
        lock (_lock)
        {
            var role = _roles.FirstOrDefault(r =>
                r.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            if (role is null) return false;
            _roles.Remove(role);
            return true;
        }
    }
}
