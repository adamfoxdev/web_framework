using System.ComponentModel.DataAnnotations;

namespace BigDataApp.Api.Models;

public class Role
{
    [Key, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    // Navigation
    public List<UserRole> UserRoles { get; set; } = new();
}
