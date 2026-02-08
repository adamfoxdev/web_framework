using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IQueryService
{
    PagedResponse<QueryResponse> Search(QuerySearchParams search);
    QueryResponse? GetById(Guid id);
    QueryResponse Create(CreateQueryRequest request, string createdBy);
    QueryResponse? Update(Guid id, UpdateQueryRequest request);
    bool Delete(Guid id);
    QueryValidationResponse Validate(ValidateQueryRequest request);
    IEnumerable<string> GetDatabases();
    IEnumerable<string> GetTags();
}
