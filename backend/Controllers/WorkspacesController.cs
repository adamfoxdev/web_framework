using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _svc;

    public WorkspacesController(IWorkspaceService svc) => _svc = svc;

    [HttpGet]
    public IActionResult Search([FromQuery] WorkspaceSearchParams search) =>
        Ok(_svc.Search(search));

    [HttpGet("mine")]
    public IActionResult GetMyWorkspaces()
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        return Ok(_svc.GetWorkspacesForUser(username));
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id)
    {
        var w = _svc.GetById(id);
        return w is null ? NotFound() : Ok(w);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateWorkspaceRequest request)
    {
        var user = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var result = _svc.Create(request, user);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, [FromBody] UpdateWorkspaceRequest request)
    {
        var result = _svc.Update(id, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id) =>
        _svc.Delete(id) ? NoContent() : NotFound();

    [HttpGet("departments")]
    public IActionResult GetDepartments() => Ok(_svc.GetDepartments());
}
