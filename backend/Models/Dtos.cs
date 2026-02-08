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

// --- Paginated Response ---

public record PagedResponse<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record UserQuery(
    string? Search = null,
    string? Role = null,
    bool? IsActive = null,
    string SortBy = "username",
    bool SortDesc = false,
    int Page = 1,
    int PageSize = 50
);

// --- Bulk Operation DTOs ---

public record BulkRoleRequest(List<Guid> UserIds, List<string> Roles);

public record BulkStatusRequest(List<Guid> UserIds, bool IsActive);

public record BulkDeleteRequest(List<Guid> UserIds);

public record BulkOperationResult(int Affected, int Total);

// --- Role DTOs ---

public record CreateRoleRequest(string Name, string Description);

public record AssignRoleRequest(Guid UserId, string Role);
