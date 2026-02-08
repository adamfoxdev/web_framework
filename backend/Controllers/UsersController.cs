using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService) => _userService = userService;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public IActionResult GetAll() => Ok(_userService.GetAll());

    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id)
    {
        var user = _userService.GetById(id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public IActionResult Create([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = _userService.Create(request);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public IActionResult Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = _userService.Update(id, request);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public IActionResult Delete(Guid id)
    {
        return _userService.Delete(id) ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/roles")]
    [Authorize(Roles = "Admin")]
    public IActionResult AssignRole(Guid id, [FromBody] AssignRoleRequest request)
    {
        return _userService.AssignRole(id, request.Role) ? Ok() : NotFound();
    }

    [HttpDelete("{id:guid}/roles/{role}")]
    [Authorize(Roles = "Admin")]
    public IActionResult RemoveRole(Guid id, string role)
    {
        return _userService.RemoveRole(id, role) ? Ok() : NotFound();
    }

    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var username = User.Identity?.Name;
        if (username is null) return Unauthorized();

        var user = _userService.GetByUsername(username);
        return user is null ? NotFound() : Ok(user);
    }
}
