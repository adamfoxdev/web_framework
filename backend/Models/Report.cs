using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BigDataApp.Api.Models;

public class Report
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? WorkspaceId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Type { get; set; } = "Table"; // Table, Chart, Summary, Dashboard

    [Required, MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Published, Archived

    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string QuerySql { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Schedule { get; set; } = "Manual"; // Manual, Daily, Weekly, Monthly

    public DateTime? LastRunAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(WorkspaceId))]
    public Workspace? Workspace { get; set; }

    public List<ReportTag> ReportTags { get; set; } = new();

    // Helper (not mapped)
    [NotMapped]
    public List<string> Tags
    {
        get => ReportTags.Select(t => t.Tag).ToList();
        set => ReportTags = value.Select(t => new ReportTag { ReportId = Id, Tag = t }).ToList();
    }
}

public class ReportTag
{
    public Guid ReportId { get; set; }

    [MaxLength(100)]
    public string Tag { get; set; } = string.Empty;

    // Navigation
    public Report Report { get; set; } = null!;
}
