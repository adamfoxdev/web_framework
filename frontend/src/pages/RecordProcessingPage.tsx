import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import { useWorkspace } from '../context/WorkspaceContext';
import type {
  DataProject,
  DataProjectDetail,
  DatasetRecord,
  DataColumnInfo,
  FormField,
  ColumnFieldMapping,
  ProcessRecordResponse,
  ProcessingSessionSummary,
} from '../types';

type Step = 'setup' | 'mapping' | 'processing' | 'summary';
type ProcessMode = 'auto-feed' | 'cherry-pick';

export default function RecordProcessingPage() {
  const { activeWorkspace } = useWorkspace();

  // Setup state
  const [projects, setProjects] = useState<DataProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDetail, setProjectDetail] = useState<DataProjectDetail | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [mode, setMode] = useState<ProcessMode>('auto-feed');

  // Data state
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [columns, setColumns] = useState<DataColumnInfo[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [mappings, setMappings] = useState<ColumnFieldMapping[]>([]);

  // Processing state
  const [step, setStep] = useState<Step>('setup');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [cherryQueue, setCherryQueue] = useState<number[]>([]);
  const [cherryIdx, setCherryIdx] = useState(0);
  const [submissions, setSubmissions] = useState<ProcessRecordResponse[]>([]);
  const [summary, setSummary] = useState<ProcessingSessionSummary | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recordPage, setRecordPage] = useState(1);

  // Load projects
  useEffect(() => {
    projectService.search({ pageSize: 100, workspaceId: activeWorkspace?.id })
      .then(r => setProjects(r.items))
      .catch(() => {});
  }, [activeWorkspace]);

  // Load project detail when project selected
  useEffect(() => {
    if (!selectedProjectId) { setProjectDetail(null); return; }
    projectService.getById(selectedProjectId).then(setProjectDetail).catch(() => {});
    setSelectedDatasetId('');
    setSelectedFormId('');
  }, [selectedProjectId]);

  const selectedDataset = projectDetail?.datasets.find(d => d.id === selectedDatasetId) || null;
  const selectedForm = projectDetail?.forms.find(f => f.id === selectedFormId) || null;

  // Auto-generate mappings when dataset + form selected
  useEffect(() => {
    if (!selectedDataset || !selectedForm) { setMappings([]); return; }
    const autoMappings: ColumnFieldMapping[] = [];
    for (const field of selectedForm.fields) {
      const matchCol = selectedDataset.columns.find(c =>
        c.name.toLowerCase() === field.name.toLowerCase() ||
        c.name.toLowerCase().replace(/_/g, '') === field.name.toLowerCase().replace(/_/g, '')
      );
      if (matchCol) {
        autoMappings.push({ columnName: matchCol.name, fieldName: field.name });
      }
    }
    setMappings(autoMappings);
  }, [selectedDataset, selectedForm]);

  // Load records
  const loadRecords = useCallback(async (page = 1) => {
    if (!selectedProjectId || !selectedDatasetId) return;
    setLoading(true);
    try {
      const data = await projectService.getRecords(selectedProjectId, selectedDatasetId, page, 50);
      setRecords(data.records);
      setColumns(data.columns);
      setTotalRecords(data.totalRecords);
      setRecordPage(page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedDatasetId]);

  // Prefill form from a record using mappings
  const prefillForm = useCallback((record: DatasetRecord) => {
    const vals: Record<string, string> = {};
    if (selectedForm) {
      for (const field of selectedForm.fields) {
        const mapping = mappings.find(m => m.fieldName === field.name);
        if (mapping && record.values[mapping.columnName] !== undefined) {
          vals[field.name] = record.values[mapping.columnName];
        } else {
          vals[field.name] = field.defaultValue || '';
        }
      }
    }
    setFormValues(vals);
  }, [mappings, selectedForm]);

  // Start processing
  const startProcessing = async () => {
    setError('');
    await loadRecords(1);
    setStep('processing');
    setCurrentIndex(0);
    setCherryIdx(0);
    setSubmissions([]);
  };

  // When entering processing step or changing index, prefill form
  useEffect(() => {
    if (step !== 'processing') return;
    let record: DatasetRecord | undefined;
    if (mode === 'auto-feed') {
      record = records[currentIndex];
    } else {
      const rowIdx = cherryQueue[cherryIdx];
      record = records.find(r => r.rowIndex === rowIdx);
    }
    if (record) prefillForm(record);
  }, [step, currentIndex, cherryIdx, records, mode, cherryQueue, prefillForm]);

  const getCurrentRecord = (): DatasetRecord | undefined => {
    if (mode === 'auto-feed') return records[currentIndex];
    const rowIdx = cherryQueue[cherryIdx];
    return records.find(r => r.rowIndex === rowIdx);
  };

  const submitRecord = async (status: string) => {
    const record = getCurrentRecord();
    if (!record || !selectedDatasetId || !selectedFormId) return;

    setSubmitting(true);
    try {
      const result = await projectService.submitRecord(selectedProjectId, {
        datasetId: selectedDatasetId,
        formId: selectedFormId,
        rowIndex: record.rowIndex,
        mappings,
        values: { ...formValues, _status: status },
      });
      setSubmissions(prev => [...prev, result]);

      // Advance to next record
      if (mode === 'auto-feed') {
        if (currentIndex < records.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Try loading next page
          if (records.length > 0 && records[records.length - 1].rowIndex < totalRecords - 1) {
            await loadRecords(recordPage + 1);
            setCurrentIndex(0);
          } else {
            // Done
            await loadSummary();
          }
        }
      } else {
        if (cherryIdx < cherryQueue.length - 1) {
          setCherryIdx(prev => prev + 1);
        } else {
          await loadSummary();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const loadSummary = async () => {
    try {
      const s = await projectService.getProcessingSummary(selectedProjectId, selectedDatasetId, selectedFormId);
      setSummary(s);
      setStep('summary');
    } catch {
      setStep('summary');
    }
  };

  const toggleRow = (rowIndex: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex); else next.add(rowIndex);
      return next;
    });
  };

  const selectAllRows = () => {
    if (selectedRows.size === records.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(records.map(r => r.rowIndex)));
    }
  };

  const startCherryPick = () => {
    const queue = Array.from(selectedRows).sort((a, b) => a - b);
    setCherryQueue(queue);
    setCherryIdx(0);
    setStep('processing');
    setSubmissions([]);
  };

  const goToMapping = async () => {
    if (!selectedDatasetId) return;
    await loadRecords(1);
    setStep('mapping');
  };

  const canProceedToMapping = selectedProjectId && selectedDatasetId && selectedFormId;

  const progressCount = mode === 'auto-feed'
    ? submissions.length
    : submissions.length;
  const progressTotal = mode === 'auto-feed'
    ? totalRecords
    : cherryQueue.length;

  return (
    <div className="rp-container">
      {/* Header */}
      <div className="rp-header">
        <h1 className="rp-title">⚙ Record Processing</h1>
        <p className="rp-subtitle">
          Process dataset records using a form template — auto-feed sequentially or cherry-pick specific records
        </p>
      </div>

      {/* Step indicator */}
      <div className="rp-steps">
        {(['setup', 'mapping', 'processing', 'summary'] as Step[]).map((s, i) => (
          <div key={s} className={`rp-step ${step === s ? 'active' : ''} ${
            (['setup', 'mapping', 'processing', 'summary'].indexOf(step) > i) ? 'done' : ''
          }`}>
            <span className="rp-step-num">{i + 1}</span>
            <span className="rp-step-label">{s === 'setup' ? 'Setup' : s === 'mapping' ? 'Mapping' : s === 'processing' ? 'Process' : 'Summary'}</span>
          </div>
        ))}
      </div>

      {error && <div className="rp-error">⚠ {error} <button onClick={() => setError('')}>×</button></div>}

      {/* ===== STEP 1: SETUP ===== */}
      {step === 'setup' && (
        <div className="rp-setup">
          <div className="rp-setup-grid">
            {/* Project selector */}
            <div className="rp-field">
              <label>Project</label>
              <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                <option value="">Select a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                ))}
              </select>
            </div>

            {/* Dataset selector */}
            <div className="rp-field">
              <label>Dataset</label>
              <select value={selectedDatasetId} onChange={e => setSelectedDatasetId(e.target.value)} disabled={!projectDetail}>
                <option value="">Select a dataset...</option>
                {projectDetail?.datasets.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.columns.length} cols, {d.recordCount.toLocaleString()} records)</option>
                ))}
              </select>
            </div>

            {/* Form selector */}
            <div className="rp-field">
              <label>Form Template</label>
              <select value={selectedFormId} onChange={e => setSelectedFormId(e.target.value)} disabled={!projectDetail}>
                <option value="">Select a form...</option>
                {projectDetail?.forms.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.fields.length} fields, {f.status})</option>
                ))}
              </select>
            </div>

            {/* Mode selector */}
            <div className="rp-field">
              <label>Processing Mode</label>
              <div className="rp-mode-toggle">
                <button
                  className={`rp-mode-btn ${mode === 'auto-feed' ? 'active' : ''}`}
                  onClick={() => setMode('auto-feed')}
                >
                  <span className="rp-mode-icon">🔄</span>
                  <div>
                    <strong>Auto Feed</strong>
                    <small>Process records sequentially</small>
                  </div>
                </button>
                <button
                  className={`rp-mode-btn ${mode === 'cherry-pick' ? 'active' : ''}`}
                  onClick={() => setMode('cherry-pick')}
                >
                  <span className="rp-mode-icon">🎯</span>
                  <div>
                    <strong>Cherry Pick</strong>
                    <small>Select specific records</small>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Preview cards */}
          {selectedDataset && selectedForm && (
            <div className="rp-preview-row">
              <div className="rp-preview-card">
                <h4>📊 {selectedDataset.name}</h4>
                <div className="rp-preview-meta">
                  <span>{selectedDataset.columns.length} columns</span>
                  <span>{selectedDataset.recordCount.toLocaleString()} records</span>
                  <span>{selectedDataset.format}</span>
                </div>
                <div className="rp-preview-cols">
                  {selectedDataset.columns.map(c => (
                    <span key={c.name} className="rp-col-chip">{c.name} <small>({c.dataType})</small></span>
                  ))}
                </div>
              </div>
              <div className="rp-preview-arrow">→</div>
              <div className="rp-preview-card">
                <h4>📝 {selectedForm.name}</h4>
                <div className="rp-preview-meta">
                  <span>{selectedForm.fields.length} fields</span>
                  <span>{selectedForm.status}</span>
                  <span>{selectedForm.submissionCount} submissions</span>
                </div>
                <div className="rp-preview-cols">
                  {selectedForm.fields.map(f => (
                    <span key={f.name} className="rp-col-chip">{f.label} <small>({f.fieldType})</small></span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rp-setup-actions">
            <button className="btn btn-primary" disabled={!canProceedToMapping} onClick={goToMapping}>
              Continue to Mapping →
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: MAPPING ===== */}
      {step === 'mapping' && selectedDataset && selectedForm && (
        <div className="rp-mapping">
          <h2 className="rp-section-title">Column → Field Mapping</h2>
          <p className="rp-section-desc">
            Map dataset columns to form fields. Auto-matched columns are highlighted.
          </p>

          <div className="rp-mapping-table">
            <div className="rp-mapping-header">
              <span>Form Field</span>
              <span>Mapped Column</span>
              <span>Sample Values</span>
            </div>
            {selectedForm.fields.map(field => {
              const mapping = mappings.find(m => m.fieldName === field.name);
              return (
                <div key={field.name} className={`rp-mapping-row ${mapping ? 'mapped' : ''}`}>
                  <div className="rp-mapping-field">
                    <strong>{field.label}</strong>
                    <small>{field.name} ({field.fieldType}){field.required && ' *'}</small>
                  </div>
                  <div className="rp-mapping-select">
                    <select
                      value={mapping?.columnName || ''}
                      onChange={e => {
                        const col = e.target.value;
                        setMappings(prev => {
                          const filtered = prev.filter(m => m.fieldName !== field.name);
                          if (col) filtered.push({ columnName: col, fieldName: field.name });
                          return filtered;
                        });
                      }}
                    >
                      <option value="">— Not mapped —</option>
                      {selectedDataset.columns.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.dataType})</option>
                      ))}
                    </select>
                  </div>
                  <div className="rp-mapping-sample">
                    {mapping && records.length > 0 && (
                      <span>{records.slice(0, 3).map(r => r.values[mapping.columnName]).join(', ')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rp-mapping-actions">
            <button className="btn btn-outline" onClick={() => setStep('setup')}>← Back</button>
            {mode === 'cherry-pick' ? (
              <button className="btn btn-primary" onClick={() => {
                setSelectedRows(new Set());
                setStep('processing');
              }}>
                Continue to Cherry Pick →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={startProcessing}>
                Start Auto-Feed →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== STEP 3A: CHERRY-PICK TABLE ===== */}
      {step === 'processing' && mode === 'cherry-pick' && cherryQueue.length === 0 && (
        <div className="rp-cherry">
          <h2 className="rp-section-title">🎯 Select Records to Process</h2>
          <p className="rp-section-desc">
            Choose specific records from the dataset. Selected: <strong>{selectedRows.size}</strong>
          </p>

          {loading ? (
            <div className="rp-loading"><div className="rp-spinner" /> Loading records...</div>
          ) : (
            <>
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" checked={selectedRows.size === records.length && records.length > 0} onChange={selectAllRows} />
                      </th>
                      <th>#</th>
                      {columns.map(c => <th key={c.name}>{c.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr
                        key={r.rowIndex}
                        className={selectedRows.has(r.rowIndex) ? 'selected' : ''}
                        onClick={() => toggleRow(r.rowIndex)}
                      >
                        <td><input type="checkbox" checked={selectedRows.has(r.rowIndex)} onChange={() => toggleRow(r.rowIndex)} /></td>
                        <td className="rp-row-idx">{r.rowIndex + 1}</td>
                        {columns.map(c => <td key={c.name}>{r.values[c.name]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for cherry pick table */}
              <div className="rp-table-footer">
                <span>Showing {records.length} of {totalRecords} records</span>
                <div className="rp-table-pages">
                  <button disabled={recordPage <= 1} onClick={() => loadRecords(recordPage - 1)}>← Prev</button>
                  <span>Page {recordPage} / {Math.ceil(totalRecords / 50)}</span>
                  <button disabled={recordPage >= Math.ceil(totalRecords / 50)} onClick={() => loadRecords(recordPage + 1)}>Next →</button>
                </div>
              </div>

              <div className="rp-cherry-actions">
                <button className="btn btn-outline" onClick={() => setStep('mapping')}>← Back</button>
                <button className="btn btn-primary" disabled={selectedRows.size === 0} onClick={startCherryPick}>
                  Process {selectedRows.size} Record{selectedRows.size !== 1 ? 's' : ''} →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== STEP 3B: FORM PROCESSING ===== */}
      {step === 'processing' && (mode === 'auto-feed' || (mode === 'cherry-pick' && cherryQueue.length > 0)) && (
        <div className="rp-process">
          {/* Progress bar */}
          <div className="rp-progress">
            <div className="rp-progress-info">
              <span className="rp-progress-label">
                {mode === 'auto-feed' ? '🔄 Auto-Feed' : '🎯 Cherry Pick'} — Record {progressCount + 1} of {progressTotal}
              </span>
              <span className="rp-progress-pct">{progressTotal > 0 ? Math.round((progressCount / progressTotal) * 100) : 0}%</span>
            </div>
            <div className="rp-progress-bar">
              <div className="rp-progress-fill" style={{ width: `${progressTotal > 0 ? (progressCount / progressTotal) * 100 : 0}%` }} />
            </div>
            <div className="rp-progress-stats">
              <span className="rp-stat rp-stat-approved">✓ {submissions.filter(s => s.status === 'Approved').length}</span>
              <span className="rp-stat rp-stat-rejected">✗ {submissions.filter(s => s.status === 'Rejected').length}</span>
              <span className="rp-stat rp-stat-flagged">⚑ {submissions.filter(s => s.status === 'Flagged').length}</span>
              <span className="rp-stat rp-stat-skipped">⏭ {submissions.filter(s => s.status === 'Skipped').length}</span>
            </div>
          </div>

          <div className="rp-process-layout">
            {/* Original record data */}
            <div className="rp-original">
              <h3 className="rp-panel-title">📊 Original Record Data</h3>
              <div className="rp-original-grid">
                {getCurrentRecord() && columns.map(c => (
                  <div key={c.name} className="rp-original-item">
                    <span className="rp-original-label">{c.name}</span>
                    <span className="rp-original-value">{getCurrentRecord()!.values[c.name]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="rp-form-panel">
              <h3 className="rp-panel-title">📝 {selectedForm?.name}</h3>
              <div className="rp-form-fields">
                {selectedForm?.fields.map(field => (
                  <FormFieldInput
                    key={field.name}
                    field={field}
                    value={formValues[field.name] || ''}
                    onChange={val => setFormValues(prev => ({ ...prev, [field.name]: val }))}
                    isMapped={!!mappings.find(m => m.fieldName === field.name)}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="rp-form-actions">
                <button className="rp-action-btn rp-btn-approve" disabled={submitting} onClick={() => submitRecord('Approved')}>
                  ✓ Approve
                </button>
                <button className="rp-action-btn rp-btn-reject" disabled={submitting} onClick={() => submitRecord('Rejected')}>
                  ✗ Reject
                </button>
                <button className="rp-action-btn rp-btn-flag" disabled={submitting} onClick={() => submitRecord('Flagged')}>
                  ⚑ Flag
                </button>
                <button className="rp-action-btn rp-btn-skip" disabled={submitting} onClick={() => submitRecord('Skipped')}>
                  ⏭ Skip
                </button>
              </div>
              <div className="rp-form-secondary">
                <button className="btn btn-outline" onClick={loadSummary}>
                  Finish &amp; View Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 4: SUMMARY ===== */}
      {step === 'summary' && (
        <div className="rp-summary">
          <h2 className="rp-section-title">📋 Processing Summary</h2>

          <div className="rp-summary-cards">
            <div className="rp-summary-card rp-sc-total">
              <span className="rp-sc-number">{summary?.processedCount ?? submissions.length}</span>
              <span className="rp-sc-label">Processed</span>
            </div>
            <div className="rp-summary-card rp-sc-approved">
              <span className="rp-sc-number">{summary?.approvedCount ?? submissions.filter(s => s.status === 'Approved').length}</span>
              <span className="rp-sc-label">Approved</span>
            </div>
            <div className="rp-summary-card rp-sc-rejected">
              <span className="rp-sc-number">{summary?.rejectedCount ?? submissions.filter(s => s.status === 'Rejected').length}</span>
              <span className="rp-sc-label">Rejected</span>
            </div>
            <div className="rp-summary-card rp-sc-flagged">
              <span className="rp-sc-number">{summary?.flaggedCount ?? submissions.filter(s => s.status === 'Flagged').length}</span>
              <span className="rp-sc-label">Flagged</span>
            </div>
            <div className="rp-summary-card rp-sc-skipped">
              <span className="rp-sc-number">{summary?.skippedCount ?? submissions.filter(s => s.status === 'Skipped').length}</span>
              <span className="rp-sc-label">Skipped</span>
            </div>
          </div>

          {/* Submission log */}
          {(summary?.submissions ?? submissions).length > 0 && (
            <div className="rp-log">
              <h3>Submission Log</h3>
              <div className="rp-log-table-wrap">
                <table className="rp-table rp-log-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Status</th>
                      <th>Processed By</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary?.submissions ?? submissions).map((s, i) => (
                      <tr key={i}>
                        <td>#{s.rowIndex + 1}</td>
                        <td>
                          <span className={`rp-status-badge rp-sb-${s.status.toLowerCase()}`}>{s.status}</span>
                        </td>
                        <td>{s.processedBy}</td>
                        <td>{new Date(s.processedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rp-summary-actions">
            <button className="btn btn-primary" onClick={() => {
              setStep('setup');
              setSubmissions([]);
              setSummary(null);
              setSelectedRows(new Set());
              setCherryQueue([]);
            }}>
              Start New Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Form Field Input component ===== */
function FormFieldInput({
  field,
  value,
  onChange,
  isMapped,
}: {
  field: FormField;
  value: string;
  onChange: (val: string) => void;
  isMapped: boolean;
}) {
  const wrapClass = `rp-field-wrap ${isMapped ? 'rp-field-mapped' : ''}`;

  return (
    <div className={wrapClass}>
      <label>
        {field.label}
        {field.required && <span className="rp-required">*</span>}
        {isMapped && <span className="rp-mapped-badge">mapped</span>}
      </label>
      {field.fieldType === 'select' && field.options ? (
        <select value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.fieldType === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      ) : field.fieldType === 'checkbox' ? (
        <label className="rp-checkbox-label">
          <input type="checkbox" checked={value === 'true'} onChange={e => onChange(e.target.checked ? 'true' : 'false')} />
          {field.label}
        </label>
      ) : (
        <input
          type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : field.fieldType === 'email' ? 'email' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
    </div>
  );
}
