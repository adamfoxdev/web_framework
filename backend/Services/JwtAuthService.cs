using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BigDataApp.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace BigDataApp.Api.Services;

public class JwtAuthService : IAuthService
{
    private readonly MockUserService _userService;
    private readonly IConfiguration _config;

    public JwtAuthService(IUserService userService, IConfiguration config)
    {
        _userService = (MockUserService)userService;
        _config = config;
    }

    public LoginResponse? Login(LoginRequest request)
    {
        var user = _userService.GetUserEntityByUsername(request.Username);
        if (user is null || !user.IsActive)
            return null;

        if (!MockUserService.VerifyPassword(request.Password, user.PasswordHash))
            return null;

        var expiration = DateTime.UtcNow.AddHours(8);
        var token = GenerateToken(user, expiration);

        return new LoginResponse(token, user.Username, user.Roles.ToArray(), expiration);
    }

    private string GenerateToken(User user, DateTime expiration)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new("firstName", user.FirstName),
            new("lastName", user.LastName)
        };

        foreach (var role in user.Roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
