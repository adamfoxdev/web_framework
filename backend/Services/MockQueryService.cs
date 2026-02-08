using System.Text.RegularExpressions;
using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public class MockQueryService : IQueryService
{
    private static readonly List<SavedQuery> _queries = new();
    private static readonly object _lock = new();
    private static bool _seeded = false;

    private static readonly string[] SampleDatabases = {
        "analytics_prod", "analytics_staging", "data_warehouse",
        "reporting_db", "user_events", "metrics_store"
    };

    public MockQueryService() { }

    public void SeedWithWorkspaces(List<Guid> workspaceIds)
    {
        lock (_lock)
        {
            if (_seeded) return;
            _seeded = true;
            SeedQueries(workspaceIds);
        }
    }

    private static void SeedQueries(List<Guid> workspaceIds)
    {
        // workspaceIds: 0=Engineering, 1=Marketing, 2=Finance, 3=DataScience, 4=Operations
        var samples = new (string name, string desc, string sql, string db, string[] tags, string user, int wsIdx)[]
        {
            ("Active Users Last 30 Days",
             "Count of users who logged in within the last 30 days",
             "SELECT COUNT(DISTINCT user_id) AS active_users\nFROM user_events\nWHERE event_type = 'login'\n  AND event_date >= DATEADD(day, -30, GETDATE());",
             "user_events", new[] { "users", "kpi", "monthly" }, "admin", 0),

            ("Revenue by Product Category",
             "Monthly revenue breakdown by product category for the current year",
             "SELECT\n  p.category,\n  MONTH(o.order_date) AS month,\n  SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON o.id = oi.order_id\nJOIN products p ON oi.product_id = p.id\nWHERE YEAR(o.order_date) = YEAR(GETDATE())\nGROUP BY p.category, MONTH(o.order_date)\nORDER BY p.category, month;",
             "data_warehouse", new[] { "revenue", "products", "monthly" }, "admin", 2),

            ("Top 10 Slow Queries",
             "Identify the slowest queries by average execution time",
             "SELECT TOP 10\n  query_hash,\n  query_text,\n  AVG(execution_time_ms) AS avg_time_ms,\n  COUNT(*) AS execution_count\nFROM query_log\nWHERE log_date >= DATEADD(day, -7, GETDATE())\nGROUP BY query_hash, query_text\nORDER BY avg_time_ms DESC;",
             "metrics_store", new[] { "performance", "monitoring" }, "admin", 0),

            ("User Retention Cohort",
             "Weekly cohort retention analysis for new user signups",
             "WITH cohorts AS (\n  SELECT\n    user_id,\n    MIN(DATE_TRUNC('week', signup_date)) AS cohort_week\n  FROM users\n  GROUP BY user_id\n),\nactivity AS (\n  SELECT\n    c.cohort_week,\n    DATEDIFF(week, c.cohort_week, e.event_date) AS week_number,\n    COUNT(DISTINCT e.user_id) AS active_users\n  FROM cohorts c\n  JOIN user_events e ON c.user_id = e.user_id\n  GROUP BY c.cohort_week, DATEDIFF(week, c.cohort_week, e.event_date)\n)\nSELECT * FROM activity\nORDER BY cohort_week, week_number;",
             "analytics_prod", new[] { "retention", "cohort", "users" }, "analyst1", 3),

            ("Data Pipeline Health Check",
             "Check the status and freshness of all data pipeline feeds",
             "SELECT\n  pipeline_name,\n  last_run_status,\n  last_run_at,\n  DATEDIFF(hour, last_run_at, GETDATE()) AS hours_since_last_run,\n  avg_duration_minutes,\n  CASE\n    WHEN DATEDIFF(hour, last_run_at, GETDATE()) > 24 THEN 'STALE'\n    WHEN last_run_status = 'FAILED' THEN 'ERROR'\n    ELSE 'OK'\n  END AS health_status\nFROM pipeline_metadata\nORDER BY last_run_at DESC;",
             "metrics_store", new[] { "pipeline", "monitoring", "health" }, "admin", 4),

            ("Customer Segmentation",
             "Segment customers by purchase frequency and total spend",
             "SELECT\n  customer_id,\n  COUNT(order_id) AS order_count,\n  SUM(total_amount) AS lifetime_spend,\n  CASE\n    WHEN COUNT(order_id) >= 10 AND SUM(total_amount) >= 1000 THEN 'VIP'\n    WHEN COUNT(order_id) >= 5 THEN 'Regular'\n    WHEN COUNT(order_id) >= 2 THEN 'Occasional'\n    ELSE 'One-time'\n  END AS segment\nFROM orders\nGROUP BY customer_id\nORDER BY lifetime_spend DESC;",
             "data_warehouse", new[] { "customers", "segmentation" }, "analyst1", 1),

            ("Daily Active Users Trend",
             "Daily active users over the past 90 days with 7-day moving average",
             "WITH daily AS (\n  SELECT\n    CAST(event_date AS DATE) AS dt,\n    COUNT(DISTINCT user_id) AS dau\n  FROM user_events\n  WHERE event_date >= DATEADD(day, -90, GETDATE())\n  GROUP BY CAST(event_date AS DATE)\n)\nSELECT\n  dt,\n  dau,\n  AVG(dau) OVER (ORDER BY dt ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d\nFROM daily\nORDER BY dt;",
             "analytics_prod", new[] { "users", "kpi", "trend" }, "admin", 3),

            ("Error Rate by Endpoint",
             "API error rate grouped by endpoint for the last 24 hours",
             "SELECT\n  endpoint,\n  COUNT(*) AS total_requests,\n  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS error_count,\n  ROUND(100.0 * SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*), 2) AS error_rate_pct\nFROM api_requests\nWHERE request_time >= DATEADD(hour, -24, GETDATE())\nGROUP BY endpoint\nHAVING COUNT(*) > 10\nORDER BY error_rate_pct DESC;",
             "metrics_store", new[] { "api", "monitoring", "errors" }, "admin", 4),

            ("Inventory Low Stock Alert",
             "Products that are below their reorder threshold",
             "SELECT\n  p.product_name,\n  p.sku,\n  i.quantity_on_hand,\n  i.reorder_threshold,\n  s.supplier_name,\n  s.lead_time_days\nFROM inventory i\nJOIN products p ON i.product_id = p.id\nJOIN suppliers s ON p.supplier_id = s.id\nWHERE i.quantity_on_hand <= i.reorder_threshold\nORDER BY (i.quantity_on_hand * 1.0 / NULLIF(i.reorder_threshold, 0));",
             "data_warehouse", new[] { "inventory", "alerts" }, "admin", 4),

            ("Report: Monthly Summary KPIs",
             "Executive summary KPIs for the monthly business review",
             "SELECT\n  FORMAT(GETDATE(), 'yyyy-MM') AS report_month,\n  (SELECT COUNT(DISTINCT user_id) FROM user_events\n   WHERE event_date >= DATEADD(day, -30, GETDATE())) AS active_users,\n  (SELECT SUM(total_amount) FROM orders\n   WHERE order_date >= DATEADD(day, -30, GETDATE())) AS monthly_revenue,\n  (SELECT COUNT(*) FROM orders\n   WHERE order_date >= DATEADD(day, -30, GETDATE())) AS total_orders,\n  (SELECT AVG(total_amount) FROM orders\n   WHERE order_date >= DATEADD(day, -30, GETDATE())) AS avg_order_value;",
             "reporting_db", new[] { "kpi", "executive", "monthly" }, "admin", 2),
        };

        var rng = new Random(42);
        foreach (var (name, desc, sql, db, tags, user, wsIdx) in samples)
        {
            var created = DateTime.UtcNow.AddDays(-rng.Next(1, 120));
            _queries.Add(new SavedQuery
            {
                Name = name,
                Description = desc,
                SqlText = sql,
                Database = db,
                CreatedBy = user,
                Tags = tags.ToList(),
                IsPublic = true,
                WorkspaceId = workspaceIds.Count > wsIdx ? workspaceIds[wsIdx] : null,
                CreatedAt = created,
                UpdatedAt = created.AddDays(rng.Next(0, 10)),
                LastValidation = new QueryValidationResult
                {
                    IsValid = true,
                    Errors = new(),
                    Warnings = new(),
                    ValidatedAt = created,
                },
            });
        }
    }

    // ---- Mapping ----

    private static QueryResponse ToResponse(SavedQuery q) => new(
        q.Id, q.WorkspaceId, q.Name, q.Description, q.SqlText, q.Database,
        q.CreatedBy, q.CreatedAt, q.UpdatedAt, q.Tags, q.IsPublic,
        q.LastValidation is null ? null : new QueryValidationResponse(
            q.LastValidation.IsValid,
            q.LastValidation.Errors,
            q.LastValidation.Warnings,
            q.LastValidation.ValidatedAt
        )
    );

    // ---- Interface ----

    public PagedResponse<QueryResponse> Search(QuerySearchParams p)
    {
        lock (_lock)
        {
            IEnumerable<SavedQuery> src = _queries;

            if (p.WorkspaceId.HasValue)
                src = src.Where(q => q.WorkspaceId == p.WorkspaceId.Value);

            if (!string.IsNullOrWhiteSpace(p.Search))
            {
                var s = p.Search.ToLower();
                src = src.Where(q =>
                    q.Name.ToLower().Contains(s) ||
                    q.Description.ToLower().Contains(s) ||
                    q.SqlText.ToLower().Contains(s) ||
                    q.Tags.Any(t => t.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(p.Database))
                src = src.Where(q => q.Database.Equals(p.Database, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(p.Tag))
                src = src.Where(q => q.Tags.Any(t => t.Equals(p.Tag, StringComparison.OrdinalIgnoreCase)));

            if (!string.IsNullOrWhiteSpace(p.CreatedBy))
                src = src.Where(q => q.CreatedBy.Equals(p.CreatedBy, StringComparison.OrdinalIgnoreCase));

            src = p.SortBy?.ToLower() switch
            {
                "name" => p.SortDesc ? src.OrderByDescending(q => q.Name) : src.OrderBy(q => q.Name),
                "database" => p.SortDesc ? src.OrderByDescending(q => q.Database) : src.OrderBy(q => q.Database),
                "createdby" => p.SortDesc ? src.OrderByDescending(q => q.CreatedBy) : src.OrderBy(q => q.CreatedBy),
                "createdat" => p.SortDesc ? src.OrderByDescending(q => q.CreatedAt) : src.OrderBy(q => q.CreatedAt),
                _ => p.SortDesc ? src.OrderBy(q => q.UpdatedAt) : src.OrderByDescending(q => q.UpdatedAt), // default newest first
            };

            var total = src.Count();
            var pageSize = Math.Clamp(p.PageSize, 1, 100);
            var page = Math.Max(1, p.Page);
            var totalPages = (int)Math.Ceiling(total / (double)pageSize);

            var items = src.Skip((page - 1) * pageSize).Take(pageSize).Select(ToResponse).ToList();

            return new PagedResponse<QueryResponse>(items, total, page, pageSize, totalPages);
        }
    }

    public QueryResponse? GetById(Guid id)
    {
        lock (_lock)
        {
            var q = _queries.FirstOrDefault(q => q.Id == id);
            return q is null ? null : ToResponse(q);
        }
    }

    public QueryResponse Create(CreateQueryRequest request, string createdBy)
    {
        lock (_lock)
        {
            var q = new SavedQuery
            {
                Name = request.Name,
                Description = request.Description,
                SqlText = request.SqlText,
                Database = request.Database,
                CreatedBy = createdBy,
                Tags = request.Tags ?? new(),
                IsPublic = request.IsPublic,
                WorkspaceId = request.WorkspaceId,
            };
            _queries.Add(q);
            return ToResponse(q);
        }
    }

    public QueryResponse? Update(Guid id, UpdateQueryRequest request)
    {
        lock (_lock)
        {
            var q = _queries.FirstOrDefault(q => q.Id == id);
            if (q is null) return null;

            if (request.Name is not null) q.Name = request.Name;
            if (request.Description is not null) q.Description = request.Description;
            if (request.SqlText is not null)
            {
                q.SqlText = request.SqlText;
                q.LastValidation = null; // invalidate on SQL change
            }
            if (request.Database is not null) q.Database = request.Database;
            if (request.Tags is not null) q.Tags = request.Tags;
            if (request.IsPublic.HasValue) q.IsPublic = request.IsPublic.Value;
            q.UpdatedAt = DateTime.UtcNow;

            return ToResponse(q);
        }
    }

    public bool Delete(Guid id)
    {
        lock (_lock)
        {
            var q = _queries.FirstOrDefault(q => q.Id == id);
            if (q is null) return false;
            _queries.Remove(q);
            return true;
        }
    }

    public QueryValidationResponse Validate(ValidateQueryRequest request)
    {
        var errors = new List<string>();
        var warnings = new List<string>();
        var sql = request.SqlText.Trim();

        // Basic SQL validation rules
        if (string.IsNullOrWhiteSpace(sql))
        {
            errors.Add("SQL text cannot be empty.");
            return new QueryValidationResponse(false, errors, warnings, DateTime.UtcNow);
        }

        // Check for unmatched parentheses
        int opens = sql.Count(c => c == '(');
        int closes = sql.Count(c => c == ')');
        if (opens != closes)
            errors.Add($"Unmatched parentheses: {opens} opening vs {closes} closing.");

        // Check for unclosed string literals
        int quotes = sql.Count(c => c == '\'');
        if (quotes % 2 != 0)
            errors.Add("Unclosed string literal (odd number of single quotes).");

        // Must contain a SQL keyword
        var upperSql = sql.ToUpper();
        var sqlKeywords = new[] { "SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "EXEC", "WITH", "MERGE" };
        if (!sqlKeywords.Any(k => upperSql.Contains(k)))
            errors.Add("SQL must contain a valid statement keyword (SELECT, INSERT, UPDATE, DELETE, etc.).");

        // Warn about dangerous operations
        if (Regex.IsMatch(upperSql, @"\bDROP\b"))
            warnings.Add("Query contains DROP statement — use with caution.");
        if (Regex.IsMatch(upperSql, @"\bDELETE\b") && !Regex.IsMatch(upperSql, @"\bWHERE\b"))
            warnings.Add("DELETE without WHERE clause will affect all rows.");
        if (Regex.IsMatch(upperSql, @"\bUPDATE\b") && !Regex.IsMatch(upperSql, @"\bWHERE\b"))
            warnings.Add("UPDATE without WHERE clause will affect all rows.");
        if (Regex.IsMatch(upperSql, @"\bSELECT\s+\*\b"))
            warnings.Add("Consider specifying columns instead of SELECT *.");
        if (Regex.IsMatch(upperSql, @"\bTRUNCATE\b"))
            warnings.Add("Query contains TRUNCATE — this will remove all data from the table.");

        // Check semicolons (multiple statements)
        var stmts = sql.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (stmts.Length > 1)
            warnings.Add($"Query contains {stmts.Length} statements. Consider splitting into separate saved queries.");

        // Persist validation result on matching query
        lock (_lock)
        {
            var match = _queries.FirstOrDefault(q =>
                q.SqlText.Trim().Equals(sql, StringComparison.OrdinalIgnoreCase) &&
                q.Database.Equals(request.Database, StringComparison.OrdinalIgnoreCase));
            if (match is not null)
            {
                match.LastValidation = new QueryValidationResult
                {
                    IsValid = errors.Count == 0,
                    Errors = errors,
                    Warnings = warnings,
                    ValidatedAt = DateTime.UtcNow,
                };
            }
        }

        return new QueryValidationResponse(errors.Count == 0, errors, warnings, DateTime.UtcNow);
    }

    public IEnumerable<string> GetDatabases() => SampleDatabases;

    public IEnumerable<string> GetTags()
    {
        lock (_lock)
        {
            return _queries.SelectMany(q => q.Tags).Distinct().OrderBy(t => t).ToList();
        }
    }
}
