using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IUserService
{
    IEnumerable<UserResponse> GetAll();
    PagedResponse<UserResponse> GetPaged(UserQuery query);
    UserResponse? GetById(Guid id);
    UserResponse? GetByUsername(string username);
    UserResponse Create(CreateUserRequest request);
    UserResponse? Update(Guid id, UpdateUserRequest request);
    bool Delete(Guid id);
    bool AssignRole(Guid userId, string role);
    bool RemoveRole(Guid userId, string role);
    BulkOperationResult BulkAssignRoles(List<Guid> userIds, List<string> roles);
    BulkOperationResult BulkRemoveRoles(List<Guid> userIds, List<string> roles);
    BulkOperationResult BulkSetStatus(List<Guid> userIds, bool isActive);
    BulkOperationResult BulkDelete(List<Guid> userIds);
}
