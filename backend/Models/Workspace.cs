using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BigDataApp.Api.Models;

public class Workspace
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Color { get; set; } = "#4f46e5";

    [MaxLength(10)]
    public string Icon { get; set; } = "📁";

    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDefault { get; set; } = false;

    // Navigation — members stored as child table
    public List<WorkspaceMember> WorkspaceMembers { get; set; } = new();

    [NotMapped]
    public List<string> Members
    {
        get => WorkspaceMembers.Select(m => m.Username).ToList();
        set => WorkspaceMembers = value.Select(u => new WorkspaceMember { WorkspaceId = Id, Username = u }).ToList();
    }

    // Navigation — child entities
    public List<DataProject> Projects { get; set; } = new();
    public List<SavedQuery> Queries { get; set; } = new();
}

public class WorkspaceMember
{
    public Guid WorkspaceId { get; set; }

    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    public Workspace Workspace { get; set; } = null!;
}
