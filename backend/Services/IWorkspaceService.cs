using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IWorkspaceService
{
    PagedResponse<WorkspaceResponse> Search(WorkspaceSearchParams search);
    WorkspaceResponse? GetById(Guid id);
    WorkspaceResponse Create(CreateWorkspaceRequest request, string createdBy);
    WorkspaceResponse? Update(Guid id, UpdateWorkspaceRequest request);
    bool Delete(Guid id);
    List<WorkspaceResponse> GetWorkspacesForUser(string username);
    List<string> GetDepartments();
}
