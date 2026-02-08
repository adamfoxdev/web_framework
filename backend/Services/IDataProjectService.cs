using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IDataProjectService
{
    // Projects
    PagedResponse<ProjectResponse> SearchProjects(ProjectSearchParams search);
    ProjectDetailResponse? GetProjectById(Guid id);
    ProjectDetailResponse CreateProject(CreateProjectRequest request, string createdBy);
    ProjectDetailResponse? UpdateProject(Guid id, UpdateProjectRequest request);
    bool DeleteProject(Guid id);

    // Datasets
    DatasetResponse? GetDataset(Guid projectId, Guid datasetId);
    DatasetResponse CreateDataset(Guid projectId, CreateDatasetRequest request);
    DatasetResponse? UpdateDataset(Guid projectId, Guid datasetId, UpdateDatasetRequest request);
    bool DeleteDataset(Guid projectId, Guid datasetId);

    // Forms
    DataFormResponse? GetForm(Guid projectId, Guid formId);
    DataFormResponse CreateForm(Guid projectId, CreateFormRequest request);
    DataFormResponse? UpdateForm(Guid projectId, Guid formId, UpdateFormRequest request);
    bool DeleteForm(Guid projectId, Guid formId);

    // Quality Rules
    DataQualityRuleResponse? GetQualityRule(Guid projectId, Guid ruleId);
    DataQualityRuleResponse CreateQualityRule(Guid projectId, CreateQualityRuleRequest request);
    DataQualityRuleResponse? UpdateQualityRule(Guid projectId, Guid ruleId, UpdateQualityRuleRequest request);
    bool DeleteQualityRule(Guid projectId, Guid ruleId);
    RunQualityCheckResponse? RunQualityCheck(Guid projectId, Guid ruleId);

    // Record Processing
    DatasetRecordsResponse? GetDatasetRecords(Guid projectId, Guid datasetId, int page = 1, int pageSize = 50);
    ProcessRecordResponse? ProcessRecord(Guid projectId, ProcessRecordRequest request, string processedBy);
    ProcessingSessionSummary? GetProcessingSummary(Guid projectId, Guid datasetId, Guid formId);

    // Lookups
    List<string> GetProjectStatuses();
    List<string> GetDatasetFormats();
    List<string> GetRuleTypes();
}
