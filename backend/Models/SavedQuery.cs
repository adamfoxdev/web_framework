namespace BigDataApp.Api.Models;

public class SavedQuery
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? WorkspaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SqlText { get; set; } = string.Empty;
    public string Database { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<string> Tags { get; set; } = new();
    public bool IsPublic { get; set; } = true;
    public QueryValidationResult? LastValidation { get; set; }
}

public class QueryValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}
