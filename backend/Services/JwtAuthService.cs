using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BigDataApp.Api.Data;
using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BigDataApp.Api.Services;

public class JwtAuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public JwtAuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public LoginResponse? Login(LoginRequest request)
    {
        var user = _db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefault(u => u.Username == request.Username);

        if (user is null || !user.IsActive)
            return null;

        if (!VerifyPassword(request.Password, user.PasswordHash))
            return null;

        var expiration = DateTime.UtcNow.AddHours(8);
        var roles = user.UserRoles.Select(ur => ur.RoleName).ToArray();
        var token = GenerateToken(user, roles, expiration);

        return new LoginResponse(token, user.Username, roles, expiration);
    }

    private string GenerateToken(User user, string[] roles, DateTime expiration)
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

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ---- Password hashing (PBKDF2) — same format as DbSeeder ----
    internal static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;
        byte[] salt = Convert.FromBase64String(parts[0]);
        byte[] expected = Convert.FromBase64String(parts[1]);
        byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    internal static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }
}
