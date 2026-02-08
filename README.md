# BigDataApp

A full-stack data management platform built with ASP.NET Core and React. Features workspace-based organization, data project management, dataset governance, saved queries, form-based record processing, and role-based access control.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Backend  | .NET 10, ASP.NET Core Web API, Entity Framework Core 10 |
| Database | SQL Server LocalDB                              |
| Auth     | JWT Bearer tokens, PBKDF2 password hashing      |
| Frontend | React 19, TypeScript 5.9, Vite 7, React Router 6 |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [SQL Server LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) — included with Visual Studio or installable standalone via the SQL Server Express installer

Verify LocalDB is available:

```powershell
sqllocaldb info
```

If `MSSQLLocalDB` is not listed, create it:

```powershell
sqllocaldb create MSSQLLocalDB
sqllocaldb start MSSQLLocalDB
```

## Project Structure

```
web_framework/
├── backend/                      # ASP.NET Core Web API
│   ├── Controllers/              # API endpoints
│   ├── Data/                     # EF Core DbContext & seeder
│   │   ├── AppDbContext.cs       # Database context with entity config
│   │   └── DbSeeder.cs          # Seed data (users, roles, workspaces, etc.)
│   ├── Models/                   # Domain entities & DTOs
│   │   ├── DataProject.cs        # Projects, Datasets, Forms, Quality Rules
│   │   ├── Dtos.cs               # Request/response DTOs
│   │   ├── Role.cs
│   │   ├── SavedQuery.cs
│   │   ├── User.cs
│   │   └── Workspace.cs
│   ├── Services/                 # Business logic
│   │   ├── Ef*Service.cs         # EF Core implementations
│   │   ├── I*Service.cs          # Service interfaces
│   │   └── JwtAuthService.cs     # Authentication service
│   ├── Program.cs                # App configuration & DI setup
│   └── appsettings.json          # Connection string & JWT config
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/           # Shared UI components
│   │   ├── context/              # React contexts (Auth, Workspace)
│   │   ├── pages/                # Page components
│   │   ├── services/             # API client services
│   │   ├── types.ts              # TypeScript type definitions
│   │   └── App.tsx               # Routes & app shell
│   ├── package.json
│   └── vite.config.ts
└── web_framework.sln
```

## Getting Started

### 1. Start the Backend

```powershell
cd backend
dotnet run
```

On first run the app will:
1. Create the `BigDataApp` database in LocalDB via `EnsureCreated()`
2. Seed it with sample data (roles, users, workspaces, projects, datasets, queries)

The API will be available at **http://localhost:5239**.

### 2. Start the Frontend

```powershell
cd frontend
npm install
npm run dev
```

The dev server starts at **http://localhost:5173** and proxies `/api` requests to the backend.

### 3. Log In

Use any of the seeded accounts:

| Username | Password       | Roles               |
| -------- | -------------- | -------------------- |
| admin    | Admin123!      | Admin, Analyst       |
| jsmith   | Analyst123!    | Analyst              |
| mjones   | Viewer123!     | Viewer               |
| bwilson  | Engineer123!   | DataEngineer, Viewer |
| lchen    | Analyst123!    | Analyst, Viewer      |

## API Overview

All endpoints (except `/api/auth/login`) require a JWT token in the `Authorization: Bearer <token>` header.

| Route Prefix             | Description                                |
| ------------------------ | ------------------------------------------ |
| `POST /api/auth/login`   | Authenticate & receive JWT                 |
| `GET /api/auth/me`       | Current user profile                       |
| `/api/users`             | User management (CRUD, bulk ops)           |
| `/api/roles`             | Role management                            |
| `/api/workspaces`        | Workspace management & member assignment   |
| `/api/projects`          | Data projects, datasets, forms, quality rules |
| `/api/queries`           | Saved SQL queries                          |
| `/api/search`            | Cross-entity search                        |

### Quick Test

```powershell
# Login
$body = '{"username":"admin","password":"Admin123!"}'
$auth = Invoke-RestMethod -Uri http://localhost:5239/api/auth/login -Method Post -Body $body -ContentType "application/json"

# Authenticated request
$headers = @{ Authorization = "Bearer $($auth.token)" }
Invoke-RestMethod -Uri http://localhost:5239/api/roles -Headers $headers
```

## Database

### Connection String

Configured in `backend/appsettings.json`:

```
Server=(localdb)\MSSQLLocalDB;Database=BigDataApp;Trusted_Connection=True;...
```

### Schema Initialization

The app uses `EnsureCreated()` on startup — no migrations needed for initial setup. The schema is generated directly from the EF Core model configuration in `AppDbContext.OnModelCreating`.

### Using Migrations (optional)

If you want to evolve the schema with migrations instead:

```powershell
cd backend

# Remove EnsureCreated() from Program.cs first, then:
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Reset the Database

```powershell
# Drop and recreate
sqllocaldb stop MSSQLLocalDB
sqllocaldb delete MSSQLLocalDB
sqllocaldb create MSSQLLocalDB
sqllocaldb start MSSQLLocalDB
# Restart the app — it will recreate & reseed
```

Or from SQL:

```sql
-- Connect to (localdb)\MSSQLLocalDB via SSMS or Azure Data Studio
DROP DATABASE BigDataApp;
```

### EF Core Design Patterns

| Pattern | Used For |
| ------- | -------- |
| JSON columns (`*Json` properties) | Complex nested objects (dataset columns, governance metadata, form fields) |
| Child entity tables | Simple string lists needing relational queries (UserRoles, WorkspaceMembers, QueryTags) |
| `[NotMapped]` computed properties | Convenience getters that deserialize JSON or project from child collections |

## Configuration

### JWT Settings (`appsettings.json`)

```json
{
  "Jwt": {
    "Key": "BigDataApp-SuperSecret-Key-That-Is-At-Least-32-Bytes!",
    "Issuer": "BigDataApp",
    "Audience": "BigDataApp"
  }
}
```

> **Note:** Replace the JWT key with a secure value for any non-local deployment.

### Frontend Proxy (`vite.config.ts`)

The Vite dev server proxies `/api` to `http://localhost:5000`. If your backend runs on a different port, update the `target` in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5239', // match your backend port
    changeOrigin: true,
  },
},
```

## Build for Production

### Backend

```powershell
cd backend
dotnet publish -c Release -o ./publish
```

### Frontend

```powershell
cd frontend
npm run build
# Output in dist/
```

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| `Cannot connect to LocalDB` | Run `sqllocaldb start MSSQLLocalDB` |
| `Login failed for user` | Ensure `Trusted_Connection=True` and you're running under a Windows account with LocalDB access |
| `Port 5239 in use` | Change the port in `backend/Properties/launchSettings.json` |
| `CORS errors in browser` | The backend configures a permissive CORS policy for development. Check `Program.cs` if issues arise |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then retry |
