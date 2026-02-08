using System.Security.Claims;
using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _svc;

    public ReportsController(IReportService svc) => _svc = svc;

    private string CurrentUser => User.FindFirstValue(ClaimTypes.Name) ?? "unknown";

    [HttpGet]
    public IActionResult GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? type,
        [FromQuery] string? tag,
        [FromQuery] Guid? workspaceId,
        [FromQuery] string sortBy = "updatedat",
        [FromQuery] bool sortDesc = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var result = _svc.GetAll(new ReportSearchParams(search, status, type, tag, workspaceId, sortBy, sortDesc, page, pageSize));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id)
    {
        var report = _svc.GetById(id);
        return report is null ? NotFound() : Ok(report);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateReportRequest request)
    {
        var report = _svc.Create(request, CurrentUser);
        return CreatedAtAction(nameof(GetById), new { id = report.Id }, report);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, [FromBody] UpdateReportRequest request)
    {
        var report = _svc.Update(id, request);
        return report is null ? NotFound() : Ok(report);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        return _svc.Delete(id) ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/run")]
    public IActionResult Run(Guid id)
    {
        var result = _svc.RunReport(id);
        return result is null ? NotFound() : Ok(result);
    }
}
