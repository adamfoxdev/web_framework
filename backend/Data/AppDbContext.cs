using BigDataApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BigDataApp.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<SavedQuery> SavedQueries => Set<SavedQuery>();
    public DbSet<QueryTag> QueryTags => Set<QueryTag>();
    public DbSet<DataProject> DataProjects => Set<DataProject>();
    public DbSet<Dataset> Datasets => Set<Dataset>();
    public DbSet<DataForm> DataForms => Set<DataForm>();
    public DbSet<DataQualityRule> DataQualityRules => Set<DataQualityRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ---- User ----
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
            e.Ignore(u => u.Roles); // computed from UserRoles
        });

        // ---- Role ----
        modelBuilder.Entity<Role>(e =>
        {
            e.HasKey(r => r.Name);
        });

        // ---- UserRole (join table) ----
        modelBuilder.Entity<UserRole>(e =>
        {
            e.HasKey(ur => new { ur.UserId, ur.RoleName });
            e.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleName)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- Workspace ----
        modelBuilder.Entity<Workspace>(e =>
        {
            e.Ignore(w => w.Members);
        });

        // ---- WorkspaceMember ----
        modelBuilder.Entity<WorkspaceMember>(e =>
        {
            e.HasKey(m => new { m.WorkspaceId, m.Username });
            e.HasOne(m => m.Workspace)
                .WithMany(w => w.WorkspaceMembers)
                .HasForeignKey(m => m.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- SavedQuery ----
        modelBuilder.Entity<SavedQuery>(e =>
        {
            e.Ignore(q => q.Tags);
            e.Ignore(q => q.LastValidation);
            e.HasOne(q => q.Workspace)
                .WithMany(w => w.Queries)
                .HasForeignKey(q => q.WorkspaceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ---- QueryTag ----
        modelBuilder.Entity<QueryTag>(e =>
        {
            e.HasKey(t => new { t.QueryId, t.Tag });
            e.HasOne(t => t.Query)
                .WithMany(q => q.QueryTags)
                .HasForeignKey(t => t.QueryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- DataProject ----
        modelBuilder.Entity<DataProject>(e =>
        {
            e.Ignore(p => p.Tags);
            e.HasOne(p => p.Workspace)
                .WithMany(w => w.Projects)
                .HasForeignKey(p => p.WorkspaceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ---- Dataset ----
        modelBuilder.Entity<Dataset>(e =>
        {
            e.Ignore(d => d.Columns);
            e.Ignore(d => d.Governance);
            e.Ignore(d => d.CustomMetadata);
            e.HasOne(d => d.Project)
                .WithMany(p => p.Datasets)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- DataForm ----
        modelBuilder.Entity<DataForm>(e =>
        {
            e.Ignore(f => f.Fields);
            e.HasOne(f => f.Project)
                .WithMany(p => p.Forms)
                .HasForeignKey(f => f.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- DataQualityRule ----
        modelBuilder.Entity<DataQualityRule>(e =>
        {
            e.HasOne(r => r.Project)
                .WithMany(p => p.QualityRules)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
