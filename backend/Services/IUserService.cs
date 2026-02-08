using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IUserService
{
    IEnumerable<UserResponse> GetAll();
    UserResponse? GetById(Guid id);
    UserResponse? GetByUsername(string username);
    UserResponse Create(CreateUserRequest request);
    UserResponse? Update(Guid id, UpdateUserRequest request);
    bool Delete(Guid id);
    bool AssignRole(Guid userId, string role);
    bool RemoveRole(Guid userId, string role);
}
