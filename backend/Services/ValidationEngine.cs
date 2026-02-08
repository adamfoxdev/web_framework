using System.Text.RegularExpressions;
using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IValidationEngine
{
    ValidationReport ValidateData(
        ValidateDataRequest request,
        List<ValidationRule> rules);

    DataProfile ProfileData(
        string dataSourceName,
        List<Dictionary<string, object?>> rows);

    List<(int rowIndex, int duplicateIndex, string[] fields)> DetectDuplicates(
        List<Dictionary<string, object?>> rows,
        string[]? checkFields = null);

    List<AutoCorrectionSuggestion> GenerateCorrections(
        List<ValidationRowResult> failedRows,
        List<Dictionary<string, object?>> originalData);
}

public class ValidationEngine : IValidationEngine
{
    public ValidationReport ValidateData(
        ValidateDataRequest request,
        List<ValidationRule> rules)
    {
        var report = new ValidationReport(
            Id: Guid.NewGuid(),
            WorkspaceId: Guid.Empty, // Will be set by caller
            DataSourceName: request.DataSourceName,
            ExecutedAt: DateTime.UtcNow,
            TotalRows: request.Rows.Count,
            ValidRows: 0,
            InvalidRows: 0,
            ValidityPercentage: 0,
            RowResults: new(),
            ErrorSummary: new(),
            DuplicateFields: new(),
            DuplicateCount: 0,
            Profile: null
        );

        // Validate each row
        var rowResults = new List<ValidationRowResult>();
        var duplicates = request.DetectDuplicates
            ? DetectDuplicates(request.Rows, request.DuplicateCheckFields)
            : new();

        var errorSummary = new Dictionary<string, int>();

        for (int i = 0; i < request.Rows.Count; i++)
        {
            var row = request.Rows[i];
            var fieldResults = new List<ValidationFieldResult>();
            var crossFieldErrors = new List<string>();

            // Field-level validation
            foreach (var rule in rules.Where(r => r.IsActive).OrderByDescending(r => r.Priority))
            {
                var fieldResult = ValidateField(row, rule);
                fieldResults.Add(fieldResult);

                if (!fieldResult.IsValid)
                {
                    if (!errorSummary.ContainsKey(fieldResult.FieldName))
                        errorSummary[fieldResult.FieldName] = 0;
                    errorSummary[fieldResult.FieldName]++;
                }
            }

            // Cross-field validation
            crossFieldErrors.AddRange(ValidateCrossFields(row, rules));

            // Check for duplicates
            var duplicateMatch = duplicates.FirstOrDefault(d => d.rowIndex == i);
            var hasDuplicate = duplicateMatch != default;
            var duplicateRowNumber = hasDuplicate ? duplicateMatch.duplicateIndex + 1 : (int?)null;

            var rowResult = new ValidationRowResult(
                RowNumber: i + 1,
                RowId: $"Row_{i + 1}",
                IsValid: fieldResults.All(f => f.IsValid) && crossFieldErrors.Count == 0 && !hasDuplicate,
                FieldResults: fieldResults,
                CrossFieldErrors: crossFieldErrors,
                HasDuplicate: hasDuplicate,
                DuplicateRowNumber: duplicateRowNumber
            );

            rowResults.Add(rowResult);

            if (rowResult.IsValid)
                report = report with { ValidRows = report.ValidRows + 1 };
            else
                report = report with { InvalidRows = report.InvalidRows + 1 };
        }

        // Generate data profile if requested
        DataProfile? profile = null;
        if (request.GenerateProfile)
        {
            profile = ProfileData(request.DataSourceName, request.Rows);
        }

        var validityPercent = report.TotalRows > 0 ? (report.ValidRows / (double)report.TotalRows) * 100 : 0;

        return report with
        {
            RowResults = rowResults,
            InvalidRows = report.TotalRows - report.ValidRows,
            ValidityPercentage = validityPercent,
            ErrorSummary = errorSummary,
            DuplicateCount = duplicates.Count,
            Profile = profile
        };
    }

    private ValidationFieldResult ValidateField(
        Dictionary<string, object?> row,
        ValidationRule rule)
    {
        if (!row.TryGetValue(rule.FieldName, out var value))
        {
            return new ValidationFieldResult(
                FieldName: rule.FieldName,
                Value: null,
                IsValid: rule.Operator == ValidationOperator.IsNull,
                ErrorMessage: $"Field '{rule.FieldName}' not found in data",
                Suggestion: null,
                FailedRule: rule.Operator
            );
        }

        var (isValid, errorMsg, suggestion) = ValidateValue(value, rule);

        return new ValidationFieldResult(
            FieldName: rule.FieldName,
            Value: value,
            IsValid: isValid,
            ErrorMessage: errorMsg,
            Suggestion: suggestion,
            FailedRule: isValid ? null : rule.Operator
        );
    }

    private (bool isValid, string? errorMsg, string? suggestion) ValidateValue(
        object? value,
        ValidationRule rule)
    {
        // Handle null values
        if (value is null || (value is string s && string.IsNullOrWhiteSpace(s)))
        {
            if (rule.Operator == ValidationOperator.IsNull)
                return (true, null, null);

            return (false,
                rule.ErrorMessage ?? $"Required field '{rule.FieldName}' is empty",
                "Provide a value for this required field");
        }

        return rule.Operator switch
        {
            ValidationOperator.IsNotNull => (true, null, null),

            ValidationOperator.Equals =>
                (value.ToString() == rule.OperatorValue,
                    value.ToString() != rule.OperatorValue ? $"Expected '{rule.OperatorValue}'" : null,
                    value.ToString() != rule.OperatorValue ? $"Change to '{rule.OperatorValue}'" : null),

            ValidationOperator.NotEquals =>
                (value.ToString() != rule.OperatorValue, null, null),

            ValidationOperator.Contains =>
                (value.ToString()!.Contains(rule.OperatorValue!),
                    !value.ToString()!.Contains(rule.OperatorValue!) ? $"Must contain '{rule.OperatorValue}'" : null,
                    null),

            ValidationOperator.StartsWith =>
                (value.ToString()!.StartsWith(rule.OperatorValue!),
                    !value.ToString()!.StartsWith(rule.OperatorValue!) ? $"Must start with '{rule.OperatorValue}'" : null,
                    null),

            ValidationOperator.EndsWith =>
                (value.ToString()!.EndsWith(rule.OperatorValue!),
                    !value.ToString()!.EndsWith(rule.OperatorValue!) ? $"Must end with '{rule.OperatorValue}'" : null,
                    null),

            ValidationOperator.IsEmail =>
                ValidateEmail(value.ToString()!),

            ValidationOperator.IsPhoneNumber =>
                ValidatePhoneNumber(value.ToString()!),

            ValidationOperator.IsUrl =>
                ValidateUrl(value.ToString()!),

            ValidationOperator.MinLength =>
                (int.TryParse(rule.OperatorValue, out var minLen) && value.ToString()!.Length >= minLen,
                    int.TryParse(rule.OperatorValue, out var ml) && value.ToString()!.Length < ml ? $"Minimum {ml} characters required" : null,
                    null),

            ValidationOperator.MaxLength =>
                (int.TryParse(rule.OperatorValue, out var maxLen) && value.ToString()!.Length <= maxLen,
                    int.TryParse(rule.OperatorValue, out var ml) && value.ToString()!.Length > ml ? $"Maximum {ml} characters allowed" : null,
                    null),

            ValidationOperator.GreaterThan =>
                ValidateNumericComparison(value, rule.OperatorValue!, ">"),

            ValidationOperator.LessThan =>
                ValidateNumericComparison(value, rule.OperatorValue!, "<"),

            ValidationOperator.GreaterThanOrEqual =>
                ValidateNumericComparison(value, rule.OperatorValue!, ">="),

            ValidationOperator.LessThanOrEqual =>
                ValidateNumericComparison(value, rule.OperatorValue!, "<="),

            ValidationOperator.Between =>
                ValidateBetween(value, rule.OperatorValue!),

            ValidationOperator.In =>
                (rule.OperatorValue!.Split(',').Contains(value.ToString()),
                    !rule.OperatorValue.Split(',').Contains(value.ToString()) ? $"Must be one of: {rule.OperatorValue}" : null,
                    null),

            ValidationOperator.Matches =>
                (Regex.IsMatch(value.ToString()!, rule.OperatorValue!),
                    !Regex.IsMatch(value.ToString()!, rule.OperatorValue!) ? $"Format doesn't match pattern" : null,
                    null),

            _ => (true, null, null)
        };
    }

    private (bool, string?, string?) ValidateEmail(string value)
    {
        var isValid = Regex.IsMatch(value,
            @"^[^\s@]+@[^\s@]+\.[^\s@]+$",
            RegexOptions.IgnoreCase);
        return (isValid,
            !isValid ? "Invalid email format" : null,
            null);
    }

    private (bool, string?, string?) ValidatePhoneNumber(string value)
    {
        var isValid = Regex.IsMatch(value,
            @"^\+?[1-9]\d{1,14}$");
        return (isValid,
            !isValid ? "Invalid phone number format" : null,
            null);
    }

    private (bool, string?, string?) ValidateUrl(string value)
    {
        var isValid = Uri.TryCreate(value, UriKind.Absolute, out _);
        return (isValid,
            !isValid ? "Invalid URL format" : null,
            null);
    }

    private (bool, string?, string?) ValidateNumericComparison(
        object? value,
        string compareValue,
        string op)
    {
        if (!decimal.TryParse(value?.ToString(), out var val) ||
            !decimal.TryParse(compareValue, out var compareVal))
            return (false, "Invalid numeric value", null);

        var isValid = op switch
        {
            ">" => val > compareVal,
            "<" => val < compareVal,
            ">=" => val >= compareVal,
            "<=" => val <= compareVal,
            _ => false
        };

        return (isValid,
            !isValid ? $"Value must be {op} {compareValue}" : null,
            null);
    }

    private (bool, string?, string?) ValidateBetween(object? value, string range)
    {
        var parts = range.Split(',');
        if (parts.Length != 2 ||
            !decimal.TryParse(parts[0], out var min) ||
            !decimal.TryParse(parts[1], out var max) ||
            !decimal.TryParse(value?.ToString(), out var val))
            return (false, "Invalid range format", null);

        var isValid = val >= min && val <= max;
        return (isValid,
            !isValid ? $"Value must be between {min} and {max}" : null,
            null);
    }

    private List<string> ValidateCrossFields(
        Dictionary<string, object?> row,
        List<ValidationRule> rules)
    {
        var errors = new List<string>();

        // Example: StartDate < EndDate validation
        if (row.TryGetValue("StartDate", out var startObj) &&
            row.TryGetValue("EndDate", out var endObj))
        {
            if (DateTime.TryParse(startObj?.ToString(), out var start) &&
                DateTime.TryParse(endObj?.ToString(), out var end))
            {
                if (start >= end)
                    errors.Add("StartDate must be before EndDate");
            }
        }

        // Add more cross-field validations as needed

        return errors;
    }

    public List<(int rowIndex, int duplicateIndex, string[] fields)> DetectDuplicates(
        List<Dictionary<string, object?>> rows,
        string[]? checkFields = null)
    {
        var duplicates = new List<(int, int, string[])>();
        var seen = new HashSet<string>();

        checkFields ??= rows.FirstOrDefault()?.Keys.ToArray() ?? Array.Empty<string>();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var key = string.Join("|", checkFields
                .Select(f => row.TryGetValue(f, out var v) ? v?.ToString() ?? "NULL" : "MISSING"));

            if (seen.Contains(key))
            {
                // Find the original
                for (int j = 0; j < i; j++)
                {
                    var prevRow = rows[j];
                    var prevKey = string.Join("|", checkFields
                        .Select(f => prevRow.TryGetValue(f, out var v) ? v?.ToString() ?? "NULL" : "MISSING"));
                    if (prevKey == key)
                    {
                        duplicates.Add((i, j, checkFields));
                        break;
                    }
                }
            }
            seen.Add(key);
        }

        return duplicates;
    }

    public DataProfile ProfileData(
        string dataSourceName,
        List<Dictionary<string, object?>> rows)
    {
        if (rows.Count == 0)
            return new DataProfile(
                Id: Guid.NewGuid(),
                WorkspaceId: Guid.Empty,
                DataSourceName: dataSourceName,
                ProfiledAt: DateTime.UtcNow,
                TotalRows: 0,
                TotalFields: 0,
                FieldProfiles: new(),
                PotentialIssues: new()
            );

        var fieldProfiles = new Dictionary<string, FieldProfile>();
        var issues = new List<string>();
        var firstRow = rows.First();

        foreach (var fieldName in firstRow.Keys)
        {
            var values = rows.Select(r => r.TryGetValue(fieldName, out var v) ? v : null).ToList();
            var nullCount = values.Count(v => v is null || (v is string s && string.IsNullOrWhiteSpace(s)));
            var nonNullValues = values.Where(v => v is not null && (v is not string s || !string.IsNullOrWhiteSpace(s))).ToList();
            var uniqueValues = nonNullValues.Distinct().Count();
            var nullPercent = (nullCount / (double)rows.Count) * 100;
            var uniquePercent = (uniqueValues / (double)rows.Count) * 100;

            // Determine field type
            var sampleValue = nonNullValues.FirstOrDefault();
            var fieldType = DetermineFieldType(sampleValue);

            // Get statistics for numeric fields
            double? average = null;
            double? stdDev = null;
            object? minValue = null;
            object? maxValue = null;

            if (fieldType == DataType.Decimal || fieldType == DataType.Integer)
            {
                var numericValues = nonNullValues
                    .Where(v => decimal.TryParse(v?.ToString(), out _))
                    .Select(v => decimal.Parse(v!.ToString()!))
                    .ToList();

                if (numericValues.Count > 0)
                {
                    average = (double)numericValues.Average();
                    minValue = numericValues.Min();
                    maxValue = numericValues.Max();
                    var variance = numericValues.Average(x => Math.Pow((double)(x - (decimal)average), 2));
                    stdDev = Math.Sqrt(variance);
                }
            }

            // Top 10 values frequency
            var topValues = nonNullValues
                .GroupBy(v => v)
                .OrderByDescending(g => g.Count())
                .Take(10)
                .Select(g => new TopValueEntry(
                    Value: g.Key?.ToString() ?? "(null)",
                    Frequency: g.Count()
                ))
                .ToList();

            // Flag potential issues
            if (nullPercent > 50)
                issues.Add($"Field '{fieldName}' has {nullPercent:F1}% null values");
            if (uniquePercent > 95)
                issues.Add($"Field '{fieldName}' has very high cardinality ({uniquePercent:F1}% unique)");
            if (uniquePercent < 5 && fieldType != DataType.Boolean)
                issues.Add($"Field '{fieldName}' has very low cardinality ({uniquePercent:F1}% unique)");

            fieldProfiles[fieldName] = new FieldProfile(
                FieldName: fieldName,
                FieldType: fieldType,
                TotalCount: rows.Count,
                NullCount: nullCount,
                NullPercentage: nullPercent,
                UniqueValues: uniqueValues,
                UniquenessPercentage: uniquePercent,
                MinValue: minValue,
                MaxValue: maxValue,
                Average: average,
                StdDeviation: stdDev,
                TopValues: topValues.Any() ? topValues : null
            );
        }

        return new DataProfile(
            Id: Guid.NewGuid(),
            WorkspaceId: Guid.Empty,
            DataSourceName: dataSourceName,
            ProfiledAt: DateTime.UtcNow,
            TotalRows: rows.Count,
            TotalFields: fieldProfiles.Count,
            FieldProfiles: fieldProfiles,
            PotentialIssues: issues
        );
    }

    private DataType DetermineFieldType(object? value)
    {
        if (value is null) return DataType.String;
        var strValue = value.ToString()!;

        if (bool.TryParse(strValue, out _)) return DataType.Boolean;
        if (int.TryParse(strValue, out _)) return DataType.Integer;
        if (decimal.TryParse(strValue, out _)) return DataType.Decimal;
        if (DateTime.TryParse(strValue, out _)) return DataType.DateTime;
        if (Regex.IsMatch(strValue, @"^[^\s@]+@[^\s@]+\.[^\s@]+$")) return DataType.Email;
        if (Uri.TryCreate(strValue, UriKind.Absolute, out _)) return DataType.Url;

        return DataType.String;
    }

    public List<AutoCorrectionSuggestion> GenerateCorrections(
        List<ValidationRowResult> failedRows,
        List<Dictionary<string, object?>> originalData)
    {
        var suggestions = new List<AutoCorrectionSuggestion>();

        foreach (var rowResult in failedRows.Where(r => !r.IsValid))
        {
            var originalRow = originalData.ElementAtOrDefault(rowResult.RowNumber - 1);
            if (originalRow is null) continue;

            foreach (var fieldResult in rowResult.FieldResults.Where(f => !f.IsValid && f.Suggestion is not null))
            {
                suggestions.Add(new AutoCorrectionSuggestion(
                    RowNumber: rowResult.RowNumber,
                    FieldName: fieldResult.FieldName,
                    CurrentValue: fieldResult.Value,
                    SuggestedValue: GenerateSuggestedValue(fieldResult),
                    Reason: fieldResult.ErrorMessage ?? "Failed validation",
                    Confidence: 0.8
                ));
            }
        }

        return suggestions;
    }

    private object? GenerateSuggestedValue(ValidationFieldResult fieldResult)
    {
        // Generate correction based on the failed rule
        return fieldResult.FailedRule switch
        {
            ValidationOperator.MinLength => fieldResult.Value?.ToString()?.PadRight(0),
            ValidationOperator.MaxLength => fieldResult.Value?.ToString()?.Substring(0, 10),
            ValidationOperator.GreaterThan => fieldResult.Value,
            _ => fieldResult.Value
        };
    }
}
