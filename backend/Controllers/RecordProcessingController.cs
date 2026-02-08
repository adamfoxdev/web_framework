using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/processing")]
[Authorize]
public class RecordProcessingController : ControllerBase
{
    private readonly IDataProjectService _svc;

    public RecordProcessingController(IDataProjectService svc) => _svc = svc;

    /// <summary>
    /// Get mock records for a dataset (paginated).
    /// </summary>
    [HttpGet("datasets/{datasetId:guid}/records")]
    public IActionResult GetRecords(Guid projectId, Guid datasetId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var result = _svc.GetDatasetRecords(projectId, datasetId, page, pageSize);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Submit a processed record (approve, reject, flag, or skip).
    /// </summary>
    [HttpPost("submit")]
    public IActionResult SubmitRecord(Guid projectId, [FromBody] ProcessRecordRequest request)
    {
        var user = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var result = _svc.ProcessRecord(projectId, request, user);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Get summary of processing session for a dataset+form combo.
    /// </summary>
    [HttpGet("summary")]
    public IActionResult GetSummary(Guid projectId, [FromQuery] Guid datasetId, [FromQuery] Guid formId)
    {
        var result = _svc.GetProcessingSummary(projectId, datasetId, formId);
        return result is null ? NotFound() : Ok(result);
    }
}
