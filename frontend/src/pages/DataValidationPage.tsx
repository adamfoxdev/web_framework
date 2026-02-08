import { useState } from 'react';
import { AlertCircle, BarChart3, Zap, RefreshCw, Download } from 'lucide-react';
import type { ValidateDataRequest, ValidationReport } from '../types';
import { validationService } from '../services/validationService';

export default function DataValidationPage() {
  const [dataSourceName, setDataSourceName] = useState('Sample Dataset');
  const [rawData, setRawData] = useState('');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'profile' | 'corrections'>('input');
  const [detectDuplicates, setDetectDuplicates] = useState(true);
  const [generateProfile, setGenerateProfile] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const parseData = (data: string) => {
    try {
      setError('');
      // Try JSON first
      if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
        const parsed = JSON.parse(data);
        const parsedRows = Array.isArray(parsed) ? parsed : [parsed];
        setRows(parsedRows);
        return parsedRows;
      }

      // Parse CSV
      const lines = data.trim().split('\n');
      if (lines.length < 2) {
        setError('Data must have at least 1 header row and 1 data row');
        return [];
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const parsedRows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row: Record<string, any> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || null;
        });
        return row;
      });

      setRows(parsedRows);
      return parsedRows;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid data format';
      setError(`Failed to parse data: ${msg}`);
      return [];
    }
  };

  const handleDataChange = (value: string) => {
    setRawData(value);
    parseData(value);
  };

  const handleValidate = async () => {
    if (rows.length === 0) {
      setError('Please provide data to validate');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request: ValidateDataRequest = {
        dataSourceName,
        rows,
        detectDuplicates,
        generateProfile,
        includeAutoCorrections: true,
      };

      const result = await validationService.validateData(request);
      setReport(result.report);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!report) return;
    const rows: (string | number | string[])[][] = [
      ['Row', 'Valid', 'Errors', 'Details'],
      ...report.results.map((r) => [
        r.rowNumber,
        r.isValid ? 'Yes' : 'No',
        r.fieldResults.filter((f) => !f.isValid).length,
        r.fieldResults
          .filter((f) => !f.isValid)
          .map((f) => `${f.fieldName}: ${f.errorMessage}`)
          .join('; '),
      ]),
    ];
    
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell)}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <BarChart3 size={28} color="#2563eb" />
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 0 }}>Data Validation & Profiling</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 0 }}>
          Validate data quality, detect duplicates, profile fields, and get auto-correction suggestions
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0' }}>
        {(['input', 'results', 'profile', 'corrections'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab ? '#2563eb' : 'transparent',
              color: activeTab === tab ? 'white' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 500,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'input' && '📥 Input Data'}
            {tab === 'results' && '✓ Validation Results'}
            {tab === 'profile' && '📊 Data Profile'}
            {tab === 'corrections' && '⚡ Auto-Corrections'}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: 12, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, color: '#991b1b', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 4, display: 'block' }}>
                Data Source Name
              </label>
              <input
                type="text"
                value={dataSourceName}
                onChange={(e) => setDataSourceName(e.target.value)}
                placeholder="e.g., Customer Data, Sales Records"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 4, display: 'block' }}>
                Paste CSV or JSON Data
              </label>
              <textarea
                value={rawData}
                onChange={(e) => handleDataChange(e.target.value)}
                placeholder="Paste CSV (with headers) or JSON array...&#10;URL,Email,Phone&#10;example.com,user@test.com,+1234567890"
                style={{
                  width: '100%',
                  height: 300,
                  padding: 12,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                Loaded: {rows.length} rows, {rows.length > 0 ? Object.keys(rows[0]).length : 0} fields
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 12 }}>Options</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={detectDuplicates}
                    onChange={(e) => setDetectDuplicates(e.target.checked)}
                  />
                  <span>Detect Duplicates</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={generateProfile}
                    onChange={(e) => setGenerateProfile(e.target.checked)}
                  />
                  <span>Generate Data Profile</span>
                </label>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    cursor: 'pointer',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#2563eb',
                    fontWeight: 500,
                  }}
                >
                  {showAdvanced ? '▼' : '▶'} Advanced Options
                </button>

                {showAdvanced && (
                  <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 6, fontSize: 12 }}>
                    <div style={{ color: '#64748b', marginBottom: 8 }}>Additional validation rules can be configured in production</div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleValidate}
              disabled={loading || rows.length === 0}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || rows.length === 0 ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ display: 'inline', marginRight: 8, animation: 'spin 1s linear infinite' }} />
                  Validating...
                </>
              ) : (
                <>
                  <Zap size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Validate Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Total Rows</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>{report.summary.totalRows}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Valid Rows</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{report.summary.validRows}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Invalid Rows</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{report.summary.invalidRows}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Validity</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>{report.summary.validityPercentage.toFixed(1)}%</div>
            </div>
          </div>

          {report.summary.duplicateCount > 0 && (
            <div className="card" style={{ padding: 16, background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontWeight: 600, color: '#92400e' }}>⚠️ {report.summary.duplicateCount} duplicate records detected</div>
            </div>
          )}

          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Invalid Records ({report.results.filter((r) => !r.isValid).length})</span>
              <button
                onClick={exportResults}
                style={{
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <Download size={14} style={{ display: 'inline', marginRight: 6 }} />
                Export CSV
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
              {report.results
                .filter((r) => !r.isValid)
                .slice(0, 50)
                .map((row) => (
                  <div key={row.rowNumber} style={{ padding: 12, border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 6 }}>
                    <div style={{ fontWeight: 600, color: '#991b1b', fontSize: 13, marginBottom: 8 }}>
                      Row {row.rowNumber}
                      {row.hasDuplicate && <span style={{ marginLeft: 8, color: '#f59e0b' }}>🔄 Duplicate of row {row.duplicateRowNumber}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                      {row.fieldResults
                        .filter((f) => !f.isValid)
                        .map((field) => (
                          <div key={field.fieldName} style={{ color: '#7f1d1d' }}>
                            <strong>{field.fieldName}:</strong> {field.errorMessage}
                            {field.suggestion && <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 2 }}>💡 {field.suggestion}</div>}
                          </div>
                        ))}
                      {row.crossFieldErrors.length > 0 && (
                        <div style={{ color: '#b91c1c', marginTop: 4 }}>
                          <strong>Cross-field errors:</strong> {row.crossFieldErrors.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && report?.profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Data Quality Issues</div>
            {report.profile.potentialIssues.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {report.profile.potentialIssues.map((issue) => (
                  <li key={issue} style={{ fontSize: 13, color: '#64748b' }}>
                    ⚠️ {issue}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#16a34a', fontSize: 13 }}>✓ No major data quality issues detected</div>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Field Profiles</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {Object.values(report.profile.fieldProfiles).slice(0, 12).map((field) => (
                <div key={field.fieldName} className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{field.fieldName}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748b' }}>
                    <div>
                      Type: <span style={{ fontWeight: 500, color: '#1e293b' }}>{field.fieldType}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span>Completeness</span>
                        <span style={{ fontWeight: 600 }}>{field.completeness.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: '#2563eb',
                            width: `${field.completeness}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span>Uniqueness</span>
                        <span style={{ fontWeight: 600 }}>{field.uniqueness.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: '#16a34a',
                            width: `${Math.min(field.uniqueness, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    {field.average !== undefined && field.average !== null && (
                      <div>
                        Average: <span style={{ fontWeight: 500 }}>{field.average.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Corrections Tab */}
      {activeTab === 'corrections' && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
          <Zap size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div>Auto-correction suggestions will appear here after validation</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>Review failed validations in the Results tab first</div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
