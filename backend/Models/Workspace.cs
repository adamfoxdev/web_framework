namespace BigDataApp.Api.Models;

public class Workspace
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Color { get; set; } = "#4f46e5";       // hex color for UI
    public string Icon { get; set; } = "📁";              // emoji icon
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<string> Members { get; set; } = new();     // usernames with access
    public bool IsDefault { get; set; } = false;
}
