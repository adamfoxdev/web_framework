using BigDataApp.Api.Models;
using BigDataApp.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BigDataApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValidationController : ControllerBase
{
    private readonly IValidationEngine _validationEngine;

    public ValidationController(IValidationEngine validationEngine)
    {
        _validationEngine = validationEngine;
    }

    /// <summary>
    /// Validate data against configured rules with field-level, cross-field, and duplicate detection
    /// </summary>
    [HttpPost("validate")]
    public IActionResult ValidateData([FromBody] ValidateDataRequest request)
    {
        // TODO: In production, fetch actual rules from database
        // For now, using example rules filtered to only fields in the data
        var allRules = GetExampleRules();
        
        // Get all field names from the data
        var dataFieldNames = request.Rows.Count > 0 
            ? new HashSet<string>(request.Rows[0].Keys)
            : new HashSet<string>();
        
        // Filter rules to only include fields that exist in the data
        var rules = allRules.Where(r => dataFieldNames.Contains(r.FieldName)).ToList();

        try
        {
            var report = _validationEngine.ValidateData(request, rules);

            return Ok(new
            {
                success = true,
                report = new
                {
                    id = report.Id,
                    dataSourceName = report.DataSourceName,
                    executedAt = report.ExecutedAt,
                    summary = new
                    {
                        totalRows = report.TotalRows,
                        validRows = report.ValidRows,
                        invalidRows = report.InvalidRows,
                        validityPercentage = report.ValidityPercentage,
                        duplicateCount = report.DuplicateCount
                    },
                    results = report.RowResults.Where(r => !r.IsValid).Take(100),
                    errorSummary = report.ErrorSummary,
                    profile = report.Profile != null ? new
                    {
                        id = report.Profile.Id,
                        dataSourceName = report.Profile.DataSourceName,
                        profiledAt = report.Profile.ProfiledAt,
                        totalRows = report.Profile.TotalRows,
                        totalFields = report.Profile.TotalFields,
                        fieldProfiles = report.Profile.FieldProfiles.Values.Select(fp => new
                        {
                            fieldName = fp.FieldName,
                            fieldType = fp.FieldType,
                            completeness = 100 - fp.NullPercentage,
                            uniqueness = fp.UniquenessPercentage,
                            nullCount = fp.NullCount,
                            uniqueValues = fp.UniqueValues,
                            minValue = fp.MinValue?.ToString(),
                            maxValue = fp.MaxValue?.ToString(),
                            average = fp.Average,
                            stdDeviation = fp.StdDeviation,
                            topValues = fp.TopValues?.Select(entry => new { value = entry.Value, frequency = entry.Frequency }).ToList()
                        }).ToList(),
                        potentialIssues = report.Profile.PotentialIssues
                    } : null
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get data profile (statistics) for a dataset
    /// </summary>
    [HttpPost("profile")]
    public IActionResult ProfileData([FromBody] ValidateDataRequest request)
    {
        try
        {
            var profile = _validationEngine.ProfileData(request.DataSourceName, request.Rows);

            return Ok(new
            {
                success = true,
                profile = new
                {
                    id = profile.Id,
                    dataSourceName = profile.DataSourceName,
                    profiledAt = profile.ProfiledAt,
                    totalRows = profile.TotalRows,
                    totalFields = profile.TotalFields,
                    fieldProfiles = profile.FieldProfiles.Values.Select(fp => new
                    {
                        fieldName = fp.FieldName,
                        fieldType = fp.FieldType,
                        completeness = 100 - fp.NullPercentage,
                        uniqueness = fp.UniquenessPercentage,
                        nullCount = fp.NullCount,
                        uniqueValues = fp.UniqueValues,
                        minValue = fp.MinValue?.ToString(),
                        maxValue = fp.MaxValue?.ToString(),
                        average = fp.Average,
                        stdDeviation = fp.StdDeviation,
                        topValues = fp.TopValues?.Select(entry => new { value = entry.Value, frequency = entry.Frequency }).ToList()
                    }),
                    potentialIssues = profile.PotentialIssues
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Detect duplicate records in data
    /// </summary>
    [HttpPost("detect-duplicates")]
    public IActionResult DetectDuplicates([FromBody] ValidateDataRequest request)
    {
        try
        {
            var duplicates = _validationEngine.DetectDuplicates(
                request.Rows,
                request.DuplicateCheckFields);

            return Ok(new
            {
                success = true,
                duplicatesFound = duplicates.Count,
                details = duplicates.Select(d => new
                {
                    rowNumber = d.rowIndex + 1,
                    duplicateOfRow = d.duplicateIndex + 1,
                    checkFields = d.fields,
                    values = request.Rows[d.rowIndex]
                        .Where(kv => d.fields.Contains(kv.Key))
                        .ToDictionary(kv => kv.Key, kv => kv.Value)
                })
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Generate auto-correction suggestions for failed validations
    /// </summary>
    [HttpPost("suggest-corrections")]
    public IActionResult SuggestCorrections([FromBody] ValidateDataRequest request)
    {
        try
        {
            var allRules = GetExampleRules();
            
            // Get all field names from the data
            var dataFieldNames = request.Rows.Count > 0 
                ? new HashSet<string>(request.Rows[0].Keys)
                : new HashSet<string>();
            
            // Filter rules to only include fields that exist in the data
            var rules = allRules.Where(r => dataFieldNames.Contains(r.FieldName)).ToList();
            
            var report = _validationEngine.ValidateData(request, rules);
            var failedRows = report.RowResults.Where(r => !r.IsValid).ToList();
            var suggestions = _validationEngine.GenerateCorrections(failedRows, request.Rows);

            return Ok(new
            {
                success = true,
                suggestionsCount = suggestions.Count,
                suggestions = suggestions.GroupBy(s => s.RowNumber).Select(g => new
                {
                    rowNumber = g.Key,
                    corrections = g.Select(s => new
                    {
                        fieldName = s.FieldName,
                        currentValue = s.CurrentValue,
                        suggestedValue = s.SuggestedValue,
                        reason = s.Reason,
                        confidence = s.Confidence
                    })
                })
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get example validation rules (TODO: load from database)
    /// </summary>
    private List<ValidationRule> GetExampleRules()
    {
        return new List<ValidationRule>
        {
            new(
                Id: Guid.NewGuid(),
                WorkspaceId: Guid.Empty,
                Name: "Email Format",
                Description: "Validate email field format",
                Priority: 10,
                FieldName: "Email",
                FieldType: DataType.Email,
                Operator: ValidationOperator.IsEmail,
                OperatorValue: null,
                ErrorMessage: "Invalid email format",
                IsActive: true,
                CanAutoCorrect: false,
                AutoCorrectAction: null,
                CreatedAt: DateTime.UtcNow,
                LastModifiedAt: null,
                CreatedBy: "system"
            ),
            new(
                Id: Guid.NewGuid(),
                WorkspaceId: Guid.Empty,
                Name: "Name Required",
                Description: "Name field is required",
                Priority: 9,
                FieldName: "Name",
                FieldType: DataType.String,
                Operator: ValidationOperator.IsNotNull,
                OperatorValue: null,
                ErrorMessage: "Name is required",
                IsActive: true,
                CanAutoCorrect: false,
                AutoCorrectAction: null,
                CreatedAt: DateTime.UtcNow,
                LastModifiedAt: null,
                CreatedBy: "system"
            ),
            new(
                Id: Guid.NewGuid(),
                WorkspaceId: Guid.Empty,
                Name: "Phone Number Format",
                Description: "Validate phone number format",
                Priority: 8,
                FieldName: "Phone",
                FieldType: DataType.PhoneNumber,
                Operator: ValidationOperator.IsPhoneNumber,
                OperatorValue: null,
                ErrorMessage: "Invalid phone number",
                IsActive: true,
                CanAutoCorrect: false,
                AutoCorrectAction: null,
                CreatedAt: DateTime.UtcNow,
                LastModifiedAt: null,
                CreatedBy: "system"
            )
        };
    }
}
