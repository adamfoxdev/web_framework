using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IReportService
{
    PagedResponse<ReportResponse> GetAll(ReportSearchParams query);
    ReportResponse? GetById(Guid id);
    ReportResponse Create(CreateReportRequest request, string createdBy);
    ReportResponse? Update(Guid id, UpdateReportRequest request);
    bool Delete(Guid id);
    ReportResponse? RunReport(Guid id);
}
