using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QueriesController : ControllerBase
{
    private readonly IQueryService _queryService;

    public QueriesController(IQueryService queryService) => _queryService = queryService;

    [HttpGet]
    public IActionResult Search([FromQuery] QuerySearchParams search)
    {
        return Ok(_queryService.Search(search));
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id)
    {
        var query = _queryService.GetById(id);
        return query is null ? NotFound() : Ok(query);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateQueryRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var result = _queryService.Create(request, username);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, [FromBody] UpdateQueryRequest request)
    {
        var result = _queryService.Update(id, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        return _queryService.Delete(id) ? NoContent() : NotFound();
    }

    [HttpPost("validate")]
    public IActionResult Validate([FromBody] ValidateQueryRequest request)
    {
        return Ok(_queryService.Validate(request));
    }

    [HttpGet("databases")]
    public IActionResult GetDatabases() => Ok(_queryService.GetDatabases());

    [HttpGet("tags")]
    public IActionResult GetTags() => Ok(_queryService.GetTags());
}
