import {
  useEffect, useState, useCallback, useRef,
  type FormEvent, type ChangeEvent, type KeyboardEvent,
} from 'react';
import Editor from '@monaco-editor/react';
import { queryService } from '../services/queryService';
import { useWorkspace } from '../context/WorkspaceContext';
import type {
  SavedQuery, CreateQueryRequest, UpdateQueryRequest,
  QuerySearchParams, PagedResponse, QueryValidation,
} from '../types';

const PAGE_SIZES = [10, 25, 50];
const DEBOUNCE_MS = 350;

/* ------------------------------------------------------------------ */
/*  SQL keyword lists for syntax highlighting                         */
/* ------------------------------------------------------------------ */

const SQL_KEYWORDS = [
  'SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','FULL','CROSS',
  'ON','AND','OR','NOT','IN','EXISTS','BETWEEN','LIKE','IS','NULL','AS','CASE',
  'WHEN','THEN','ELSE','END','GROUP','BY','ORDER','HAVING','LIMIT','OFFSET',
  'UNION','ALL','DISTINCT','TOP','INSERT','INTO','VALUES','UPDATE','SET',
  'DELETE','CREATE','ALTER','DROP','TABLE','INDEX','VIEW','WITH','OVER',
  'PARTITION','ROWS','RANGE','PRECEDING','FOLLOWING','CURRENT','ROW',
  'COUNT','SUM','AVG','MIN','MAX','COALESCE','NULLIF','CAST','CONVERT',
  'DATEADD','DATEDIFF','GETDATE','FORMAT','YEAR','MONTH','DAY','ROUND',
  'SUBSTRING','LEN','TRIM','UPPER','LOWER','REPLACE','CONCAT',
  'ASC','DESC','EXEC','MERGE','TRUNCATE','DATE_TRUNC',
];

function highlightSQL(sql: string): string {
  // Escape HTML first
  let h = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Strings  (single-quoted)
  h = h.replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>');

  // Numbers
  h = h.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="sql-number">$1</span>');

  // Comments  (-- line)
  h = h.replace(/(--.*)/gm, '<span class="sql-comment">$1</span>');

  // Keywords (case-insensitive, whole-word)
  const kw = SQL_KEYWORDS.join('|');
  h = h.replace(
    new RegExp(`\\b(${kw})\\b`, 'gi'),
    '<span class="sql-keyword">$1</span>',
  );

  return h;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function QueriesPage() {
  const { activeWorkspace } = useWorkspace();
  // -- Data --
  const [paged, setPaged] = useState<PagedResponse<SavedQuery> | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // -- Search params --
  const [params, setParams] = useState<QuerySearchParams>({
    search: '', database: '', tag: '', sortBy: 'updatedat', sortDesc: true, page: 1, pageSize: 25,
  });

  // -- Editor mode --
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [activeQuery, setActiveQuery] = useState<SavedQuery | null>(null);

  // -- Form --
  const [form, setForm] = useState<CreateQueryRequest>({
    name: '', description: '', sqlText: '', database: '', tags: [], isPublic: true,
  });
  const [tagInput, setTagInput] = useState('');

  // -- Validation --
  const [validation, setValidation] = useState<QueryValidation | null>(null);
  const [validating, setValidating] = useState(false);

  // -- Refs --
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ====================== Data Loading ======================

  const loadQueries = useCallback(async (p: QuerySearchParams) => {
    setLoading(true);
    setError('');
    try {
      const searchParams = { ...p, workspaceId: activeWorkspace?.id };
      setPaged(await queryService.search(searchParams));
    } catch { setError('Failed to load queries'); }
    finally { setLoading(false); }
  }, [activeWorkspace]);

  useEffect(() => { loadQueries(params); }, [params, loadQueries]);

  useEffect(() => {
    queryService.getDatabases().then(setDatabases).catch(() => {});
    queryService.getTags().then(setTags).catch(() => {});
  }, []);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const updateParams = (patch: Partial<QuerySearchParams>) =>
    setParams((p) => ({ ...p, ...patch, page: patch.page ?? 1 }));

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateParams({ search: v }), DEBOUNCE_MS);
  };

  // ====================== Navigation ======================

  const goList = () => {
    setMode('list');
    setActiveQuery(null);
    setValidation(null);
    loadQueries(params);
    queryService.getTags().then(setTags).catch(() => {});
  };

  const goCreate = () => {
    setForm({ name: '', description: '', sqlText: '', database: databases[0] ?? '', tags: [], isPublic: true, workspaceId: activeWorkspace?.id });
    setValidation(null);
    setTagInput('');
    setMode('create');
  };

  const goView = (q: SavedQuery) => {
    setActiveQuery(q);
    setValidation(q.lastValidation);
    setMode('view');
  };

  const goEdit = (q: SavedQuery) => {
    setActiveQuery(q);
    setForm({
      name: q.name,
      description: q.description,
      sqlText: q.sqlText,
      database: q.database,
      tags: [...q.tags],
      isPublic: q.isPublic,
    });
    setValidation(q.lastValidation);
    setTagInput('');
    setMode('edit');
  };

  // ====================== CRUD ======================

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = await queryService.create(form);
      flash('Query saved');
      goView(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeQuery) return;
    setError('');
    try {
      const updated = await queryService.update(activeQuery.id, form as UpdateQueryRequest);
      flash('Query updated');
      goView(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this query?')) return;
    try {
      await queryService.delete(id);
      flash('Query deleted');
      goList();
    } catch { setError('Delete failed'); }
  };

  // ====================== Validation ======================

  const handleValidate = async () => {
    const sql = mode === 'view' ? (activeQuery?.sqlText ?? '') : form.sqlText;
    const db = mode === 'view' ? (activeQuery?.database ?? '') : form.database;
    if (!sql.trim()) { setError('Write some SQL first'); return; }
    setValidating(true);
    setError('');
    try {
      const result = await queryService.validate(sql, db);
      setValidation(result);
      if (result.isValid) flash('Validation passed!');
    } catch { setError('Validation request failed'); }
    finally { setValidating(false); }
  };

  // ====================== Tags ======================

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !(form.tags ?? []).includes(t)) {
      setForm({ ...form, tags: [...(form.tags ?? []), t] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: (form.tags ?? []).filter((t) => t !== tag) });
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // ====================== Helpers ======================

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const sortIcon = (col: string) =>
    params.sortBy === col ? (params.sortDesc ? ' ▼' : ' ▲') : '';

  const handleSort = (col: string) => {
    setParams((p) => ({
      ...p, sortBy: col, sortDesc: p.sortBy === col ? !p.sortDesc : true,
    }));
  };

  // ===================== RENDER ============================

  // ---------- LIST VIEW ----------
  if (mode === 'list') {
    return (
      <div className="qr">
        <div className="qr-header">
          <div>
            <h1 className="qr-title">Queries Repository</h1>
            <p className="qr-subtitle">Write, validate, and manage SQL queries</p>
          </div>
          <button className="btn btn-primary" onClick={goCreate}>+ New Query</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Toolbar */}
        <div className="qr-toolbar">
          <div className="qr-search-wrap">
            <span className="qr-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search queries..."
              defaultValue={params.search}
              onChange={handleSearchChange}
            />
          </div>
          <select value={params.database ?? ''} onChange={(e) => updateParams({ database: e.target.value || undefined })}>
            <option value="">All Databases</option>
            {databases.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={params.tag ?? ''} onChange={(e) => updateParams({ tag: e.target.value || undefined })}>
            <option value="">All Tags</option>
            {tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={params.pageSize} onChange={(e) => updateParams({ pageSize: Number(e.target.value) })}>
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
          </select>
        </div>

        {/* Query Cards List */}
        <div className="qr-list">
          {loading && <div className="qr-loading">Loading...</div>}
          {paged?.items.map((q) => (
            <div key={q.id} className="qr-list-card" onClick={() => goView(q)}>
              <div className="qr-list-card-top">
                <div className="qr-list-card-info">
                  <h3 className="qr-list-card-name">{q.name}</h3>
                  <p className="qr-list-card-desc">{q.description}</p>
                </div>
                <div className="qr-list-card-meta">
                  {q.lastValidation && (
                    <span className={`qr-valid-badge ${q.lastValidation.isValid ? 'qr-valid-ok' : 'qr-valid-err'}`}>
                      {q.lastValidation.isValid ? '✓ Valid' : '✕ Invalid'}
                    </span>
                  )}
                  <span className="qr-db-badge">{q.database}</span>
                </div>
              </div>
              <div className="qr-list-card-sql">
                <code>{q.sqlText.length > 200 ? q.sqlText.slice(0, 200) + '...' : q.sqlText}</code>
              </div>
              <div className="qr-list-card-footer">
                <div className="qr-list-card-tags">
                  {q.tags.map((t) => <span key={t} className="qr-tag">{t}</span>)}
                </div>
                <span className="qr-list-card-date">
                  by <strong>{q.createdBy}</strong> · {formatDate(q.updatedAt)}
                </span>
              </div>
            </div>
          ))}
          {paged && paged.items.length === 0 && !loading && (
            <div className="qr-empty">No queries found. Create your first query!</div>
          )}
        </div>

        {/* Pagination */}
        {paged && paged.totalPages > 1 && (
          <div className="qr-pagination">
            <span className="qr-page-info">
              {paged.totalCount} queries · Page {paged.page} of {paged.totalPages}
            </span>
            <div className="qr-page-btns">
              <button disabled={paged.page <= 1} onClick={() => setParams((p) => ({ ...p, page: 1 }))}>&laquo;</button>
              <button disabled={paged.page <= 1} onClick={() => setParams((p) => ({ ...p, page: p.page! - 1 }))}>&lsaquo;</button>
              <button disabled={paged.page >= paged.totalPages} onClick={() => setParams((p) => ({ ...p, page: p.page! + 1 }))}>&rsaquo;</button>
              <button disabled={paged.page >= paged.totalPages} onClick={() => setParams((p) => ({ ...p, page: paged.totalPages }))}>&raquo;</button>
            </div>
          </div>
        )}

        {/* Sortable header legend */}
        <div className="qr-sort-bar">
          Sort by:
          <button className={`qr-sort-btn${params.sortBy === 'name' ? ' active' : ''}`} onClick={() => handleSort('name')}>
            Name{sortIcon('name')}
          </button>
          <button className={`qr-sort-btn${params.sortBy === 'updatedat' ? ' active' : ''}`} onClick={() => handleSort('updatedat')}>
            Updated{sortIcon('updatedat')}
          </button>
          <button className={`qr-sort-btn${params.sortBy === 'createdat' ? ' active' : ''}`} onClick={() => handleSort('createdat')}>
            Created{sortIcon('createdat')}
          </button>
          <button className={`qr-sort-btn${params.sortBy === 'database' ? ' active' : ''}`} onClick={() => handleSort('database')}>
            Database{sortIcon('database')}
          </button>
        </div>
      </div>
    );
  }

  // ---------- VIEW MODE ----------
  if (mode === 'view' && activeQuery) {
    return (
      <div className="qr">
        <div className="qr-header">
          <div>
            <button className="btn btn-outline btn-sm" onClick={goList}>&larr; Back to list</button>
            <h1 className="qr-title" style={{ marginTop: '0.5rem' }}>{activeQuery.name}</h1>
            <p className="qr-subtitle">{activeQuery.description}</p>
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => goEdit(activeQuery)}>Edit</button>
            <button className="btn btn-danger" onClick={() => handleDelete(activeQuery.id)}>Delete</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Meta bar */}
        <div className="qr-meta-bar">
          <span className="qr-db-badge">{activeQuery.database}</span>
          <span className="qr-meta-item">by <strong>{activeQuery.createdBy}</strong></span>
          <span className="qr-meta-item">Created {formatDate(activeQuery.createdAt)}</span>
          <span className="qr-meta-item">Updated {formatDate(activeQuery.updatedAt)}</span>
          {activeQuery.isPublic ? (
            <span className="qr-vis-badge qr-vis-public">Public</span>
          ) : (
            <span className="qr-vis-badge qr-vis-private">Private</span>
          )}
        </div>

        {/* Tags */}
        {activeQuery.tags.length > 0 && (
          <div className="qr-tag-row">
            {activeQuery.tags.map((t) => <span key={t} className="qr-tag">{t}</span>)}
          </div>
        )}

        {/* SQL preview with highlighting */}
        <div className="qr-sql-view">
          <div className="qr-sql-header">
            <span>SQL</span>
            <div className="btn-group">
              <button
                className="btn btn-sm"
                onClick={() => { navigator.clipboard.writeText(activeQuery.sqlText); flash('Copied!'); }}
              >
                Copy
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleValidate} disabled={validating}>
                {validating ? 'Validating...' : 'Validate'}
              </button>
            </div>
          </div>
          <pre className="qr-sql-code">
            <code dangerouslySetInnerHTML={{ __html: highlightSQL(activeQuery.sqlText) }} />
          </pre>
        </div>

        {/* Validation result */}
        {validation && <ValidationPanel validation={validation} />}
      </div>
    );
  }

  // ---------- CREATE / EDIT MODE ----------
  return (
    <div className="qr">
      <div className="qr-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={goList}>&larr; Back to list</button>
          <h1 className="qr-title" style={{ marginTop: '0.5rem' }}>
            {mode === 'create' ? 'New Query' : `Edit: ${activeQuery?.name}`}
          </h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={mode === 'create' ? handleCreate : handleUpdate}>
        <div className="qr-editor-layout">
          {/* Left: metadata */}
          <div className="qr-editor-sidebar">
            <div className="card">
              <h3 className="qr-section-title">Details</h3>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Monthly Revenue Report" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="qr-textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this query do?"
                />
              </div>
              <div className="form-group">
                <label>Database</label>
                <select value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })} required>
                  <option value="">Select database...</option>
                  {databases.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <div className="qr-tag-input-wrap">
                  <input
                    placeholder="Type and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                  />
                </div>
                {(form.tags ?? []).length > 0 && (
                  <div className="qr-tag-row" style={{ marginTop: '0.5rem' }}>
                    {(form.tags ?? []).map((t) => (
                      <span key={t} className="qr-tag qr-tag-removable" onClick={() => removeTag(t)}>
                        {t} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isPublic ?? true}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                  <span>Public (visible to all users)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: SQL editor */}
          <div className="qr-editor-main">
            <div className="qr-sql-editor-card card">
              <div className="qr-sql-header">
                <span>SQL Editor</span>
                <div className="btn-group">
                  <button type="button" className="btn btn-sm" onClick={handleValidate} disabled={validating}>
                    {validating ? 'Validating...' : '✓ Validate'}
                  </button>
                </div>
              </div>
              <div className="qr-editor-wrap" style={{ height: '400px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  defaultLanguage="sql"
                  value={form.sqlText}
                  onChange={(value) => {
                    setForm({ ...form, sqlText: value || '' });
                    setValidation(null);
                  }}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineHeight: 24,
                    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    copyWithSyntaxHighlighting: true,
                    quickSuggestions: { other: true, comments: false, strings: false },
                    suggestOnTriggerCharacters: true,
                  }}
                />
              </div>
            </div>

            {/* Validation result */}
            {validation && <ValidationPanel validation={validation} />}

            {/* Submit */}
            <div className="qr-submit-bar">
              <button type="submit" className="btn btn-primary">
                {mode === 'create' ? 'Save Query' : 'Update Query'}
              </button>
              <button type="button" className="btn btn-outline" onClick={goList}>Cancel</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Validation Panel sub-component                                     */
/* ------------------------------------------------------------------ */

function ValidationPanel({ validation }: { validation: QueryValidation }) {
  return (
    <div className={`qr-validation-panel ${validation.isValid ? 'qr-vp-ok' : 'qr-vp-err'}`}>
      <div className="qr-vp-header">
        <span className="qr-vp-icon">{validation.isValid ? '✓' : '✕'}</span>
        <span className="qr-vp-title">{validation.isValid ? 'Validation Passed' : 'Validation Failed'}</span>
        <span className="qr-vp-time">
          {new Date(validation.validatedAt).toLocaleTimeString()}
        </span>
      </div>
      {validation.errors.length > 0 && (
        <div className="qr-vp-section">
          <strong>Errors</strong>
          <ul>{validation.errors.map((e, i) => <li key={i} className="qr-vp-error">{e}</li>)}</ul>
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="qr-vp-section">
          <strong>Warnings</strong>
          <ul>{validation.warnings.map((w, i) => <li key={i} className="qr-vp-warning">{w}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
