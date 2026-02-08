using BigDataApp.Api.Data;
using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public class EfRoleService : IRoleService
{
    private readonly AppDbContext _db;

    public EfRoleService(AppDbContext db) => _db = db;

    public IEnumerable<Role> GetAll() => _db.Roles.OrderBy(r => r.Name).ToList();

    public Role? GetByName(string name) =>
        _db.Roles.FirstOrDefault(r => r.Name == name);

    public Role Create(CreateRoleRequest request)
    {
        if (_db.Roles.Any(r => r.Name == request.Name))
            throw new InvalidOperationException($"Role '{request.Name}' already exists.");

        var role = new Role { Name = request.Name, Description = request.Description };
        _db.Roles.Add(role);
        _db.SaveChanges();
        return role;
    }

    public bool Delete(string name)
    {
        var role = _db.Roles.FirstOrDefault(r => r.Name == name);
        if (role is null) return false;
        _db.Roles.Remove(role);
        _db.SaveChanges();
        return true;
    }
}
