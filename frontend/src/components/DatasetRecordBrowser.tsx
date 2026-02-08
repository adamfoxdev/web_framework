import { useState, useEffect, useCallback, useRef } from 'react';
import { projectService } from '../services/projectService';
import type { DatasetRecordsResponse, DatasetRecord, DataColumnInfo } from '../types';

interface Props {
  projectId: string;
  datasetId: string;
  datasetName: string;
  onClose: () => void;
}

export default function DatasetRecordBrowser({ projectId, datasetId, datasetName, onClose }: Props) {
  // Data state
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [columns, setColumns] = useState<DataColumnInfo[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);

  // Search / filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Selection
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Import modal
  const [showImport, setShowImport] = useState(false);
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; errors: string[] } | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Fetch Records ----------
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res: DatasetRecordsResponse = await projectService.browseRecords(projectId, datasetId, page, pageSize);
      setRecords(res.records);
      setColumns(res.columns);
      setTotalRecords(res.totalRecords);
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId, datasetId, page, pageSize]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ---------- Filtered & Sorted Records ----------
  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return Object.values(r.values).some(v => v.toLowerCase().includes(lower));
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortCol) return 0;
    const va = a.values[sortCol] || '';
    const vb = b.values[sortCol] || '';
    const cmp = va.localeCompare(vb, undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.ceil(totalRecords / pageSize);

  // ---------- Selection ----------
  const toggleSelect = (rowIndex: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === sortedRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedRecords.map(r => r.rowIndex)));
    }
  };

  // ---------- Sort ----------
  const handleSort = (colName: string) => {
    if (sortCol === colName) setSortAsc(!sortAsc);
    else { setSortCol(colName); setSortAsc(true); }
  };

  // ---------- Import ----------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') setImportFormat('json');
    else setImportFormat('csv');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportData(ev.target?.result as string || '');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!importData.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await projectService.importRecords(projectId, datasetId, {
        format: importFormat,
        data: importData,
      });
      setImportResult({ importedCount: res.importedCount, errors: res.errors });
      if (res.importedCount > 0) {
        fetchRecords();
      }
    } catch {
      setImportResult({ importedCount: 0, errors: ['Import failed. Please check your data format.'] });
    }
    setImporting(false);
  };

  const closeImport = () => {
    setShowImport(false);
    setImportData('');
    setImportResult(null);
  };

  // ---------- Export ----------
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const res = await projectService.exportRecords(projectId, datasetId, format);
      // Trigger download
      const blob = new Blob([res.data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${res.datasetName.replace(/\s+/g, '_')}_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setExporting(false);
  };

  // ---------- Delete Selected ----------
  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Delete ${selectedRows.size} selected record(s)?`)) return;
    try {
      await projectService.deleteRecords(projectId, datasetId, {
        rowIndices: Array.from(selectedRows),
      });
      setSelectedRows(new Set());
      fetchRecords();
    } catch { /* ignore */ }
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="rb-overlay">
      <div className="rb-modal">
        {/* Header */}
        <div className="rb-header">
          <div className="rb-header-left">
            <h2>📊 {datasetName}</h2>
            <span className="rb-record-count">{totalRecords.toLocaleString()} records</span>
          </div>
          <button className="rb-close" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar */}
        <div className="rb-toolbar">
          <input
            className="rb-search"
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="rb-toolbar-actions">
            <button className="btn btn-outline btn-sm" onClick={() => setShowImport(true)}>
              📥 Import
            </button>
            <div className="rb-export-group">
              <button className="btn btn-outline btn-sm" onClick={() => handleExport('csv')} disabled={exporting}>
                📤 CSV
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => handleExport('json')} disabled={exporting}>
                📤 JSON
              </button>
            </div>
            {selectedRows.size > 0 && (
              <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
                🗑 Delete ({selectedRows.size})
              </button>
            )}
          </div>
        </div>

        {/* Page size selector */}
        <div className="rb-controls">
          <label>
            Rows per page:
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <span className="rb-showing">
            Showing {Math.min((page - 1) * pageSize + 1, totalRecords)}–{Math.min(page * pageSize, totalRecords)} of {totalRecords.toLocaleString()}
          </span>
        </div>

        {/* Records Table */}
        {loading ? (
          <div className="rb-loading">Loading records...</div>
        ) : columns.length === 0 ? (
          <div className="rb-empty">
            <p>No columns defined for this dataset.</p>
            <p>Import data to auto-detect columns, or define columns in the dataset editor.</p>
          </div>
        ) : (
          <div className="rb-table-wrap">
            <table className="rb-table">
              <thead>
                <tr>
                  <th className="rb-th-select">
                    <input
                      type="checkbox"
                      checked={sortedRecords.length > 0 && selectedRows.size === sortedRecords.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="rb-th-row">#</th>
                  {columns.map(col => (
                    <th
                      key={col.name}
                      className="rb-th-sortable"
                      onClick={() => handleSort(col.name)}
                    >
                      <span className="rb-th-name">{col.name}</span>
                      <span className="rb-th-type">{col.dataType}</span>
                      {sortCol === col.name && (
                        <span className="rb-sort-indicator">{sortAsc ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRecords.length === 0 ? (
                  <tr><td colSpan={columns.length + 2} className="rb-no-results">No records match your search.</td></tr>
                ) : (
                  sortedRecords.map(record => (
                    <tr
                      key={record.rowIndex}
                      className={selectedRows.has(record.rowIndex) ? 'rb-row-selected' : ''}
                    >
                      <td className="rb-td-select">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(record.rowIndex)}
                          onChange={() => toggleSelect(record.rowIndex)}
                        />
                      </td>
                      <td className="rb-td-row">{record.rowIndex + 1}</td>
                      {columns.map(col => (
                        <td key={col.name} className="rb-td-value">
                          {record.values[col.name] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="rb-pagination">
            <button disabled={page === 1} onClick={() => setPage(1)}>⟪</button>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="rb-page-info">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟫</button>
          </div>
        )}

        {/* Import Modal */}
        {showImport && (
          <div className="rb-import-overlay">
            <div className="rb-import-modal">
              <div className="rb-import-header">
                <h3>Import Records</h3>
                <button className="rb-close" onClick={closeImport}>✕</button>
              </div>

              <div className="rb-import-body">
                <div className="rb-import-format">
                  <label>Format:</label>
                  <select value={importFormat} onChange={e => setImportFormat(e.target.value as 'csv' | 'json')}>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                <div className="rb-import-file">
                  <label>Upload file:</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="rb-import-paste">
                  <label>Or paste data directly:</label>
                  <textarea
                    className="rb-import-textarea"
                    rows={10}
                    value={importData}
                    onChange={e => setImportData(e.target.value)}
                    placeholder={importFormat === 'csv'
                      ? 'name,email,department\nAlice,alice@corp.com,Engineering\nBob,bob@corp.com,Marketing'
                      : '[{"name":"Alice","email":"alice@corp.com"},{"name":"Bob","email":"bob@corp.com"}]'
                    }
                  />
                </div>

                {importResult && (
                  <div className={`rb-import-result ${importResult.errors.length > 0 ? 'rb-import-has-errors' : 'rb-import-success'}`}>
                    {importResult.importedCount > 0 && (
                      <p className="rb-import-ok">✓ Successfully imported {importResult.importedCount} record(s)</p>
                    )}
                    {importResult.errors.length > 0 && (
                      <div className="rb-import-errors">
                        <p>Errors:</p>
                        <ul>
                          {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rb-import-footer">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleImport}
                  disabled={importing || !importData.trim()}
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={closeImport}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
