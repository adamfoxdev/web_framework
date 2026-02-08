using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BigDataApp.Api.Models;

public class SavedQuery
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? WorkspaceId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public string SqlText { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Database { get; set; } = string.Empty;

    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsPublic { get; set; } = true;

    // Validation stored as JSON
    public bool? ValidationIsValid { get; set; }
    public string? ValidationErrorsJson { get; set; }   // JSON array
    public string? ValidationWarningsJson { get; set; }  // JSON array
    public DateTime? ValidationValidatedAt { get; set; }

    // Navigation
    public List<QueryTag> QueryTags { get; set; } = new();
    public Workspace? Workspace { get; set; }

    [NotMapped]
    public List<string> Tags
    {
        get => QueryTags.Select(t => t.Tag).ToList();
        set => QueryTags = value.Select(t => new QueryTag { QueryId = Id, Tag = t }).ToList();
    }

    [NotMapped]
    public QueryValidationResult? LastValidation
    {
        get => ValidationIsValid.HasValue
            ? new QueryValidationResult
            {
                IsValid = ValidationIsValid.Value,
                Errors = DeserializeList(ValidationErrorsJson),
                Warnings = DeserializeList(ValidationWarningsJson),
                ValidatedAt = ValidationValidatedAt ?? DateTime.UtcNow
            }
            : null;
        set
        {
            if (value is null)
            {
                ValidationIsValid = null;
                ValidationErrorsJson = null;
                ValidationWarningsJson = null;
                ValidationValidatedAt = null;
            }
            else
            {
                ValidationIsValid = value.IsValid;
                ValidationErrorsJson = System.Text.Json.JsonSerializer.Serialize(value.Errors);
                ValidationWarningsJson = System.Text.Json.JsonSerializer.Serialize(value.Warnings);
                ValidationValidatedAt = value.ValidatedAt;
            }
        }
    }

    private static List<string> DeserializeList(string? json) =>
        string.IsNullOrEmpty(json) ? new() : System.Text.Json.JsonSerializer.Deserialize<List<string>>(json) ?? new();
}

public class QueryTag
{
    public Guid QueryId { get; set; }

    [MaxLength(100)]
    public string Tag { get; set; } = string.Empty;

    public SavedQuery Query { get; set; } = null!;
}

public class QueryValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}
