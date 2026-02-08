using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class DataProjectsController : ControllerBase
{
    private readonly IDataProjectService _svc;

    public DataProjectsController(IDataProjectService svc) => _svc = svc;

    // ==================== Projects ====================

    [HttpGet]
    public IActionResult Search([FromQuery] ProjectSearchParams search) =>
        Ok(_svc.SearchProjects(search));

    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id)
    {
        var p = _svc.GetProjectById(id);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateProjectRequest request)
    {
        var user = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var result = _svc.CreateProject(request, user);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var result = _svc.UpdateProject(id, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id) =>
        _svc.DeleteProject(id) ? NoContent() : NotFound();

    // ==================== Datasets ====================

    [HttpGet("{projectId:guid}/datasets/{datasetId:guid}")]
    public IActionResult GetDataset(Guid projectId, Guid datasetId)
    {
        var ds = _svc.GetDataset(projectId, datasetId);
        return ds is null ? NotFound() : Ok(ds);
    }

    [HttpPost("{projectId:guid}/datasets")]
    public IActionResult CreateDataset(Guid projectId, [FromBody] CreateDatasetRequest request)
    {
        try
        {
            var result = _svc.CreateDataset(projectId, request);
            return Created($"/api/projects/{projectId}/datasets/{result.Id}", result);
        }
        catch { return NotFound(); }
    }

    [HttpPut("{projectId:guid}/datasets/{datasetId:guid}")]
    public IActionResult UpdateDataset(Guid projectId, Guid datasetId, [FromBody] UpdateDatasetRequest request)
    {
        var result = _svc.UpdateDataset(projectId, datasetId, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{projectId:guid}/datasets/{datasetId:guid}")]
    public IActionResult DeleteDataset(Guid projectId, Guid datasetId) =>
        _svc.DeleteDataset(projectId, datasetId) ? NoContent() : NotFound();

    // ==================== Forms ====================

    [HttpGet("{projectId:guid}/forms/{formId:guid}")]
    public IActionResult GetForm(Guid projectId, Guid formId)
    {
        var f = _svc.GetForm(projectId, formId);
        return f is null ? NotFound() : Ok(f);
    }

    [HttpPost("{projectId:guid}/forms")]
    public IActionResult CreateForm(Guid projectId, [FromBody] CreateFormRequest request)
    {
        try
        {
            var result = _svc.CreateForm(projectId, request);
            return Created($"/api/projects/{projectId}/forms/{result.Id}", result);
        }
        catch { return NotFound(); }
    }

    [HttpPut("{projectId:guid}/forms/{formId:guid}")]
    public IActionResult UpdateForm(Guid projectId, Guid formId, [FromBody] UpdateFormRequest request)
    {
        var result = _svc.UpdateForm(projectId, formId, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{projectId:guid}/forms/{formId:guid}")]
    public IActionResult DeleteForm(Guid projectId, Guid formId) =>
        _svc.DeleteForm(projectId, formId) ? NoContent() : NotFound();

    // ==================== Quality Rules ====================

    [HttpGet("{projectId:guid}/quality-rules/{ruleId:guid}")]
    public IActionResult GetQualityRule(Guid projectId, Guid ruleId)
    {
        var r = _svc.GetQualityRule(projectId, ruleId);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPost("{projectId:guid}/quality-rules")]
    public IActionResult CreateQualityRule(Guid projectId, [FromBody] CreateQualityRuleRequest request)
    {
        try
        {
            var result = _svc.CreateQualityRule(projectId, request);
            return Created($"/api/projects/{projectId}/quality-rules/{result.Id}", result);
        }
        catch { return NotFound(); }
    }

    [HttpPut("{projectId:guid}/quality-rules/{ruleId:guid}")]
    public IActionResult UpdateQualityRule(Guid projectId, Guid ruleId, [FromBody] UpdateQualityRuleRequest request)
    {
        var result = _svc.UpdateQualityRule(projectId, ruleId, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{projectId:guid}/quality-rules/{ruleId:guid}")]
    public IActionResult DeleteQualityRule(Guid projectId, Guid ruleId) =>
        _svc.DeleteQualityRule(projectId, ruleId) ? NoContent() : NotFound();

    [HttpPost("{projectId:guid}/quality-rules/{ruleId:guid}/run")]
    public IActionResult RunQualityCheck(Guid projectId, Guid ruleId)
    {
        var result = _svc.RunQualityCheck(projectId, ruleId);
        return result is null ? NotFound() : Ok(result);
    }

    // ==================== Lookups ====================

    [HttpGet("statuses")]
    public IActionResult GetStatuses() => Ok(_svc.GetProjectStatuses());

    [HttpGet("formats")]
    public IActionResult GetFormats() => Ok(_svc.GetDatasetFormats());

    [HttpGet("rule-types")]
    public IActionResult GetRuleTypes() => Ok(_svc.GetRuleTypes());
}
