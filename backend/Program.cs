using System.Text;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Mock services (swap for real implementations later)
builder.Services.AddSingleton<IUserService, MockUserService>();
builder.Services.AddSingleton<IRoleService, MockRoleService>();
builder.Services.AddSingleton<IAuthService, JwtAuthService>();
builder.Services.AddSingleton<MockQueryService>();
builder.Services.AddSingleton<IQueryService>(sp => sp.GetRequiredService<MockQueryService>());
builder.Services.AddSingleton<MockDataProjectService>();
builder.Services.AddSingleton<IDataProjectService>(sp => sp.GetRequiredService<MockDataProjectService>());
builder.Services.AddSingleton<MockWorkspaceService>();
builder.Services.AddSingleton<IWorkspaceService>(sp => sp.GetRequiredService<MockWorkspaceService>());

// JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// CORS — allow React dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ---------- Cross-service wiring for workspace-aware seed data ----------
{
    var wsSvc = app.Services.GetRequiredService<MockWorkspaceService>();
    var projSvc = app.Services.GetRequiredService<MockDataProjectService>();
    var querySvc = app.Services.GetRequiredService<MockQueryService>();

    var wsIds = wsSvc.GetWorkspaceIds();
    projSvc.SeedWithWorkspaces(wsIds);
    querySvc.SeedWithWorkspaces(wsIds);

    wsSvc.SetProjectService(projSvc);
    wsSvc.SetQueryService(querySvc);
}

// ---------- Middleware ----------

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
