using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IRoleService
{
    IEnumerable<Role> GetAll();
    Role? GetByName(string name);
    Role Create(CreateRoleRequest request);
    bool Delete(string name);
}
