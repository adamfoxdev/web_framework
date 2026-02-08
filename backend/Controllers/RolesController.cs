using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService) => _roleService = roleService;

    [HttpGet]
    public IActionResult GetAll() => Ok(_roleService.GetAll());

    [HttpGet("{name}")]
    public IActionResult GetByName(string name)
    {
        var role = _roleService.GetByName(name);
        return role is null ? NotFound() : Ok(role);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public IActionResult Create([FromBody] CreateRoleRequest request)
    {
        try
        {
            var role = _roleService.Create(request);
            return CreatedAtAction(nameof(GetByName), new { name = role.Name }, role);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{name}")]
    [Authorize(Roles = "Admin")]
    public IActionResult Delete(string name)
    {
        return _roleService.Delete(name) ? NoContent() : NotFound();
    }
}
