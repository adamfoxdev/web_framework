using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BigDataApp.Api.Models;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public List<UserRole> UserRoles { get; set; } = new();

    // Helper (not mapped)
    [NotMapped]
    public List<string> Roles
    {
        get => UserRoles.Select(ur => ur.RoleName).ToList();
        set => UserRoles = value.Select(r => new UserRole { UserId = Id, RoleName = r }).ToList();
    }
}

public class UserRole
{
    public Guid UserId { get; set; }

    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;

    // Navigation
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
