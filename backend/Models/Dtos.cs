namespace BigDataApp.Api.Models;

// --- Auth DTOs ---

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, string Username, string[] Roles, DateTime Expiration);

// --- User DTOs ---

public record CreateUserRequest(
    string Username,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    List<string>? Roles
);

public record UpdateUserRequest(
    string? Email,
    string? FirstName,
    string? LastName,
    bool? IsActive,
    List<string>? Roles
);

public record UserResponse(
    Guid Id,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive,
    DateTime CreatedAt,
    List<string> Roles
);

// --- Role DTOs ---

public record CreateRoleRequest(string Name, string Description);

public record AssignRoleRequest(Guid UserId, string Role);
