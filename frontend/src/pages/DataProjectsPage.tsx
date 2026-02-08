import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import { useWorkspace } from '../context/WorkspaceContext';
import DatasetRecordBrowser from '../components/DatasetRecordBrowser';
import type {
  DataProject,
  DataProjectDetail,
  Dataset,
  DataColumnInfo,
  DatasetGovernance,
  CustomMetadataField,
  DataForm,
  FormField,
  DataQualityRule,
  ProjectSearchParams,
  PagedResponse,
} from '../types';

type View = 'list' | 'detail' | 'create';
type Tab = 'datasets' | 'forms' | 'quality';

export default function DataProjectsPage() {
  const { activeWorkspace } = useWorkspace();
  // ---------- state ----------
  const [view, setView] = useState<View>('list');
  const [projects, setProjects] = useState<DataProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [params, setParams] = useState<ProjectSearchParams>({ page: 1, pageSize: 25, sortBy: 'updatedat', sortDesc: true });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);

  // detail
  const [detail, setDetail] = useState<DataProjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('datasets');

  // create / edit project
  const [editProject, setEditProject] = useState<{ name: string; description: string; tags: string[]; status: string }>({ name: '', description: '', tags: [], status: 'Draft' });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // dataset create
  const [showDatasetForm, setShowDatasetForm] = useState(false);
  const [newDataset, setNewDataset] = useState({ name: '', description: '', source: '', format: 'CSV' });
  // form create
  const [showFormForm, setShowFormForm] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '' });
  // quality rule create
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', description: '', ruleType: 'completeness', column: '', expression: '', severity: 'error' });

  // expanded rows
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);
  const [expandedForm, setExpandedForm] = useState<string | null>(null);

  // editing existing items
  const [editingDatasetId, setEditingDatasetId] = useState<string | null>(null);
  const [editDataset, setEditDataset] = useState<{ name: string; description: string; source: string; format: string; status: string; columns: DataColumnInfo[]; governance: DatasetGovernance; customMetadata: CustomMetadataField[] }>({ name: '', description: '', source: '', format: 'CSV', status: 'Active', columns: [], governance: { dataOwner: '', dataSteward: '', classification: 'Internal', sensitivityLevel: 'Low', containsPii: false, containsPhi: false, retentionPolicy: '', dataDomain: '', updateFrequency: '', qualityScore: undefined, lineageInfo: '', complianceFrameworks: [] }, customMetadata: [] });
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ name: string; description: string; status: string; fields: FormField[] }>({ name: '', description: '', status: 'Draft', fields: [] });
  const [previewingFormId, setPreviewingFormId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRule, setEditRule] = useState({ name: '', description: '', ruleType: 'completeness', column: '', expression: '', severity: 'error', isActive: true });
  const [complianceFwInput, setComplianceFwInput] = useState('');

  // record browser
  const [browsingDataset, setBrowsingDataset] = useState<{ id: string; name: string } | null>(null);

  // ---------- fetch ----------
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = { ...params, workspaceId: activeWorkspace?.id };
      const res: PagedResponse<DataProject> = await projectService.search(searchParams);
      setProjects(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  }, [params, activeWorkspace]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setParams(p => ({ ...p, search: searchInput || undefined, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await projectService.getById(id);
      setDetail(res);
      setActiveTab('datasets');
      setView('detail');
    } catch { /* ignore */ }
    setLoading(false);
  };

  const refreshDetail = async () => {
    if (!detail) return;
    try {
      const res = await projectService.getById(detail.id);
      setDetail(res);
    } catch { /* ignore */ }
  };

  // ---------- project CRUD ----------
  const handleCreateProject = async () => {
    if (!editProject.name.trim()) return;
    try {
      if (editingProjectId) {
        await projectService.update(editingProjectId, { name: editProject.name, description: editProject.description, tags: editProject.tags, status: editProject.status });
      } else {
        await projectService.create({ name: editProject.name, description: editProject.description, tags: editProject.tags, workspaceId: activeWorkspace?.id });
      }
      setView('list');
      setEditProject({ name: '', description: '', tags: [], status: 'Draft' });
      setEditingProjectId(null);
      fetchProjects();
    } catch { /* ignore */ }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its data?')) return;
    await projectService.delete(id);
    if (view === 'detail') { setView('list'); setDetail(null); }
    fetchProjects();
  };

  const startEdit = () => {
    if (!detail) return;
    setEditProject({ name: detail.name, description: detail.description, tags: [...detail.tags], status: detail.status });
    setEditingProjectId(detail.id);
    setView('create');
  };

  // ---------- dataset CRUD ----------
  const handleCreateDataset = async () => {
    if (!detail || !newDataset.name.trim()) return;
    await projectService.createDataset(detail.id, { name: newDataset.name, description: newDataset.description, source: newDataset.source, format: newDataset.format });
    setNewDataset({ name: '', description: '', source: '', format: 'CSV' });
    setShowDatasetForm(false);
    refreshDetail();
  };

  const handleDeleteDataset = async (dsId: string) => {
    if (!detail || !confirm('Delete this dataset?')) return;
    await projectService.deleteDataset(detail.id, dsId);
    refreshDetail();
  };

  const startEditDataset = (ds: Dataset) => {
    setEditingDatasetId(ds.id);
    setEditDataset({
      name: ds.name, description: ds.description, source: ds.source, format: ds.format, status: ds.status,
      columns: ds.columns.map(c => ({ ...c })),
      governance: ds.governance ? { ...ds.governance, complianceFrameworks: [...(ds.governance.complianceFrameworks || [])] } : { dataOwner: '', dataSteward: '', classification: 'Internal', sensitivityLevel: 'Low', containsPii: false, containsPhi: false, retentionPolicy: '', dataDomain: '', updateFrequency: '', qualityScore: undefined, lineageInfo: '', complianceFrameworks: [] },
      customMetadata: (ds.customMetadata || []).map(m => ({ ...m }))
    });
    setExpandedDataset(ds.id);
  };

  const handleSaveDataset = async () => {
    if (!detail || !editingDatasetId) return;
    await projectService.updateDataset(detail.id, editingDatasetId, {
      name: editDataset.name, description: editDataset.description,
      source: editDataset.source, format: editDataset.format, status: editDataset.status,
      columns: editDataset.columns,
      governance: editDataset.governance,
      customMetadata: editDataset.customMetadata
    });
    setEditingDatasetId(null);
    refreshDetail();
  };

  // column editing helpers
  const addColumn = () => {
    setEditDataset(d => ({ ...d, columns: [...d.columns, { name: '', dataType: 'string', nullable: true, description: '' }] }));
  };
  const removeColumn = (idx: number) => {
    setEditDataset(d => ({ ...d, columns: d.columns.filter((_, i) => i !== idx) }));
  };
  const updateColumn = (idx: number, field: keyof DataColumnInfo, value: string | boolean) => {
    setEditDataset(d => ({ ...d, columns: d.columns.map((c, i) => i === idx ? { ...c, [field]: value } : c) }));
  };
  const moveColumn = (idx: number, dir: -1 | 1) => {
    setEditDataset(d => {
      const cols = [...d.columns];
      const target = idx + dir;
      if (target < 0 || target >= cols.length) return d;
      [cols[idx], cols[target]] = [cols[target], cols[idx]];
      return { ...d, columns: cols };
    });
  };

  // governance helpers
  const updateGovernance = (field: keyof DatasetGovernance, value: unknown) => {
    setEditDataset(d => ({ ...d, governance: { ...d.governance, [field]: value } }));
  };
  const addComplianceFramework = (fw: string) => {
    if (!fw.trim()) return;
    setEditDataset(d => ({
      ...d,
      governance: { ...d.governance, complianceFrameworks: [...d.governance.complianceFrameworks, fw.trim()] }
    }));
  };
  const removeComplianceFramework = (idx: number) => {
    setEditDataset(d => ({
      ...d,
      governance: { ...d.governance, complianceFrameworks: d.governance.complianceFrameworks.filter((_, i) => i !== idx) }
    }));
  };

  // custom metadata helpers
  const addCustomField = () => {
    setEditDataset(d => ({ ...d, customMetadata: [...d.customMetadata, { key: '', value: '', fieldType: 'text' }] }));
  };
  const removeCustomField = (idx: number) => {
    setEditDataset(d => ({ ...d, customMetadata: d.customMetadata.filter((_, i) => i !== idx) }));
  };
  const updateCustomField = (idx: number, field: keyof CustomMetadataField, value: string) => {
    setEditDataset(d => ({ ...d, customMetadata: d.customMetadata.map((m, i) => i === idx ? { ...m, [field]: value } : m) }));
  };

  // ---------- form CRUD ----------
  const handleCreateForm = async () => {
    if (!detail || !newForm.name.trim()) return;
    await projectService.createForm(detail.id, { name: newForm.name, description: newForm.description });
    setNewForm({ name: '', description: '' });
    setShowFormForm(false);
    refreshDetail();
  };

  const handleDeleteForm = async (fId: string) => {
    if (!detail || !confirm('Delete this form?')) return;
    await projectService.deleteForm(detail.id, fId);
    refreshDetail();
  };

  const startEditForm = (f: DataForm) => {
    setEditingFormId(f.id);
    setEditFormData({ name: f.name, description: f.description, status: f.status, fields: f.fields.map(fld => ({ ...fld, options: fld.options ? [...fld.options] : undefined })) });
    setExpandedForm(f.id);
    setPreviewingFormId(null);
  };

  const handleSaveForm = async () => {
    if (!detail || !editingFormId) return;
    await projectService.updateForm(detail.id, editingFormId, {
      name: editFormData.name, description: editFormData.description, status: editFormData.status,
      fields: editFormData.fields
    });
    setEditingFormId(null);
    setPreviewingFormId(null);
    refreshDetail();
  };

  // field editing helpers
  const addField = () => {
    setEditFormData(d => ({ ...d, fields: [...d.fields, { name: '', label: '', fieldType: 'text', required: false }] }));
  };
  const removeField = (idx: number) => {
    setEditFormData(d => ({ ...d, fields: d.fields.filter((_, i) => i !== idx) }));
  };
  const updateField = (idx: number, field: keyof FormField, value: unknown) => {
    setEditFormData(d => ({ ...d, fields: d.fields.map((f, i) => i === idx ? { ...f, [field]: value } : f) }));
  };
  const moveField = (idx: number, dir: -1 | 1) => {
    setEditFormData(d => {
      const flds = [...d.fields];
      const target = idx + dir;
      if (target < 0 || target >= flds.length) return d;
      [flds[idx], flds[target]] = [flds[target], flds[idx]];
      return { ...d, fields: flds };
    });
  };

  // ---------- quality rule CRUD ----------
  const handleCreateRule = async () => {
    if (!detail || !newRule.name.trim()) return;
    await projectService.createQualityRule(detail.id, {
      name: newRule.name, description: newRule.description, ruleType: newRule.ruleType,
      column: newRule.column || undefined, expression: newRule.expression, severity: newRule.severity
    });
    setNewRule({ name: '', description: '', ruleType: 'completeness', column: '', expression: '', severity: 'error' });
    setShowRuleForm(false);
    refreshDetail();
  };

  const handleDeleteRule = async (rId: string) => {
    if (!detail || !confirm('Delete this quality rule?')) return;
    await projectService.deleteQualityRule(detail.id, rId);
    refreshDetail();
  };

  const startEditRule = (r: DataQualityRule) => {
    setEditingRuleId(r.id);
    setEditRule({ name: r.name, description: r.description, ruleType: r.ruleType, column: r.column || '', expression: r.expression, severity: r.severity, isActive: r.isActive });
  };

  const handleSaveRule = async () => {
    if (!detail || !editingRuleId) return;
    await projectService.updateQualityRule(detail.id, editingRuleId, {
      name: editRule.name, description: editRule.description, ruleType: editRule.ruleType,
      column: editRule.column || undefined, expression: editRule.expression,
      severity: editRule.severity, isActive: editRule.isActive
    });
    setEditingRuleId(null);
    refreshDetail();
  };

  const handleRunCheck = async (rId: string) => {
    if (!detail) return;
    await projectService.runQualityCheck(detail.id, rId);
    refreshDetail();
  };

  // ---------- helpers ----------
  const formatBytes = (b: number): string => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatNumber = (n: number): string => n.toLocaleString();
  const formatDate = (s: string): string => new Date(s).toLocaleDateString();
  const formatDateTime = (s: string): string => new Date(s).toLocaleString();

  const statusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'active': return 'dp-status-active';
      case 'draft': return 'dp-status-draft';
      case 'archived': return 'dp-status-archived';
      case 'published': return 'dp-status-active';
      case 'stale': return 'dp-status-stale';
      case 'processing': return 'dp-status-processing';
      case 'error': return 'dp-status-error';
      default: return '';
    }
  };

  const resultColor = (r?: string) => {
    if (!r) return '';
    if (r === 'pass') return 'dp-result-pass';
    if (r === 'fail') return 'dp-result-fail';
    return 'dp-result-error';
  };

  const severityIcon = (s: string) => {
    if (s === 'error') return '🔴';
    if (s === 'warning') return '🟡';
    return '🔵';
  };

  // ================================================================
  // RENDER
  // ================================================================

  // -------- LIST VIEW --------
  if (view === 'list') {
    return (
      <div className="dp-page">
        <div className="dp-header">
          <h1>Data Projects</h1>
          <button className="btn btn-primary" onClick={() => { setEditProject({ name: '', description: '', tags: [], status: 'Draft' }); setEditingProjectId(null); setView('create'); }}>+ New Project</button>
        </div>

        {/* toolbar */}
        <div className="dp-toolbar">
          <input
            className="dp-search"
            type="text"
            placeholder="Search projects..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <select className="dp-filter" value={params.status || ''} onChange={e => setParams(p => ({ ...p, status: e.target.value || undefined, page: 1 }))}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
          <div className="dp-sort">
            {['updatedat', 'name', 'createdat', 'status'].map(s => (
              <button
                key={s}
                className={`dp-sort-btn ${params.sortBy === s ? 'active' : ''}`}
                onClick={() => setParams(p => ({ ...p, sortBy: s, sortDesc: p.sortBy === s ? !p.sortDesc : true }))}
              >
                {s === 'updatedat' ? 'Updated' : s === 'createdat' ? 'Created' : s.charAt(0).toUpperCase() + s.slice(1)}
                {params.sortBy === s && (params.sortDesc ? ' ↓' : ' ↑')}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="dp-loading">Loading...</div>}

        {/* project cards */}
        <div className="dp-grid">
          {projects.map(p => (
            <div key={p.id} className="dp-card" onClick={() => openDetail(p.id)}>
              <div className="dp-card-head">
                <h3>{p.name}</h3>
                <span className={`dp-badge ${statusColor(p.status)}`}>{p.status}</span>
              </div>
              <p className="dp-card-desc">{p.description}</p>
              <div className="dp-card-tags">
                {p.tags.map(t => <span key={t} className="dp-tag">{t}</span>)}
              </div>
              <div className="dp-card-stats">
                <span title="Datasets">📊 {p.datasetCount}</span>
                <span title="Forms">📝 {p.formCount}</span>
                <span title="Quality Rules">✅ {p.qualityRuleCount}</span>
              </div>
              <div className="dp-card-meta">
                <span>by {p.createdBy}</span>
                <span>Updated {formatDate(p.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && !loading && <div className="dp-empty">No projects found.</div>}

        {/* pagination */}
        {totalPages > 1 && (
          <div className="dp-pagination">
            <button disabled={params.page === 1} onClick={() => setParams(p => ({ ...p, page: (p.page || 1) - 1 }))}>← Prev</button>
            <span>Page {params.page} of {totalPages} ({totalCount} projects)</span>
            <button disabled={params.page === totalPages} onClick={() => setParams(p => ({ ...p, page: (p.page || 1) + 1 }))}>Next →</button>
          </div>
        )}
      </div>
    );
  }

  // -------- CREATE / EDIT VIEW --------
  if (view === 'create') {
    return (
      <div className="dp-page">
        <div className="dp-header">
          <button className="btn btn-outline" onClick={() => { setView(editingProjectId ? 'detail' : 'list'); setEditingProjectId(null); }}>← Back</button>
          <h1>{editingProjectId ? 'Edit Project' : 'New Project'}</h1>
        </div>
        <div className="dp-form-card">
          <label>Name</label>
          <input type="text" value={editProject.name} onChange={e => setEditProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" />

          <label>Description</label>
          <textarea rows={3} value={editProject.description} onChange={e => setEditProject(p => ({ ...p, description: e.target.value }))} placeholder="Describe the project..." />

          {editingProjectId && (
            <>
              <label>Status</label>
              <select value={editProject.status} onChange={e => setEditProject(p => ({ ...p, status: e.target.value }))}>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </>
          )}

          <label>Tags</label>
          <div className="dp-tag-input-wrap">
            <div className="dp-tag-list">
              {editProject.tags.map((t, i) => (
                <span key={i} className="dp-tag dp-tag-removable" onClick={() => setEditProject(p => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))}>
                  {t} ×
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  const t = tagInput.trim().replace(/,/g, '');
                  if (t && !editProject.tags.includes(t)) setEditProject(p => ({ ...p, tags: [...p.tags, t] }));
                  setTagInput('');
                }
              }}
              placeholder="Add tag (Enter)"
            />
          </div>

          <div className="dp-form-actions">
            <button className="btn btn-primary" onClick={handleCreateProject}>{editingProjectId ? 'Save Changes' : 'Create Project'}</button>
            <button className="btn btn-outline" onClick={() => { setView(editingProjectId ? 'detail' : 'list'); setEditingProjectId(null); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // -------- DETAIL VIEW --------
  if (!detail) return null;

  return (
    <div className="dp-page">
      {/* header */}
      <div className="dp-header">
        <button className="btn btn-outline" onClick={() => { setView('list'); setDetail(null); }}>← Back</button>
        <div className="dp-detail-title">
          <h1>{detail.name}</h1>
          <span className={`dp-badge ${statusColor(detail.status)}`}>{detail.status}</span>
        </div>
        <div className="dp-detail-actions">
          <button className="btn btn-outline" onClick={startEdit}>Edit</button>
          <button className="btn btn-danger" onClick={() => handleDeleteProject(detail.id)}>Delete</button>
        </div>
      </div>

      <p className="dp-detail-desc">{detail.description}</p>
      <div className="dp-detail-meta">
        <span>Created by <strong>{detail.createdBy}</strong></span>
        <span>Created {formatDate(detail.createdAt)}</span>
        <span>Updated {formatDateTime(detail.updatedAt)}</span>
        {detail.tags.map(t => <span key={t} className="dp-tag">{t}</span>)}
      </div>

      {/* summary cards */}
      <div className="dp-summary-row">
        <div className={`dp-summary-card ${activeTab === 'datasets' ? 'active' : ''}`} onClick={() => setActiveTab('datasets')}>
          <div className="dp-summary-num">{detail.datasets.length}</div>
          <div className="dp-summary-label">Datasets</div>
        </div>
        <div className={`dp-summary-card ${activeTab === 'forms' ? 'active' : ''}`} onClick={() => setActiveTab('forms')}>
          <div className="dp-summary-num">{detail.forms.length}</div>
          <div className="dp-summary-label">Forms</div>
        </div>
        <div className={`dp-summary-card ${activeTab === 'quality' ? 'active' : ''}`} onClick={() => setActiveTab('quality')}>
          <div className="dp-summary-num">{detail.qualityRules.length}</div>
          <div className="dp-summary-label">Quality Rules</div>
        </div>
      </div>

      {/* ============ DATASETS TAB ============ */}
      {activeTab === 'datasets' && (
        <div className="dp-section">
          <div className="dp-section-head">
            <h2>Datasets</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDatasetForm(!showDatasetForm)}>
              {showDatasetForm ? 'Cancel' : '+ Add Dataset'}
            </button>
          </div>

          {showDatasetForm && (
            <div className="dp-inline-form">
              <input type="text" placeholder="Dataset name" value={newDataset.name} onChange={e => setNewDataset(d => ({ ...d, name: e.target.value }))} />
              <input type="text" placeholder="Description" value={newDataset.description} onChange={e => setNewDataset(d => ({ ...d, description: e.target.value }))} />
              <input type="text" placeholder="Source (e.g. s3://bucket/path)" value={newDataset.source} onChange={e => setNewDataset(d => ({ ...d, source: e.target.value }))} />
              <select value={newDataset.format} onChange={e => setNewDataset(d => ({ ...d, format: e.target.value }))}>
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
                <option value="Parquet">Parquet</option>
                <option value="SQL">SQL</option>
                <option value="API">API</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleCreateDataset}>Create</button>
            </div>
          )}

          {detail.datasets.length === 0 && <div className="dp-empty-section">No datasets yet. Add one to get started.</div>}

          {detail.datasets.map((ds: Dataset) => (
            <div key={ds.id} className="dp-item-card">
              <div className="dp-item-head" onClick={() => setExpandedDataset(expandedDataset === ds.id ? null : ds.id)}>
                <div className="dp-item-left">
                  <span className="dp-item-expand">{expandedDataset === ds.id ? '▾' : '▸'}</span>
                  <strong>{ds.name}</strong>
                  <span className={`dp-badge-sm ${statusColor(ds.status)}`}>{ds.status}</span>
                  <span className="dp-badge-sm dp-badge-format">{ds.format}</span>
                </div>
                <div className="dp-item-right">
                  <span title="Records">{formatNumber(ds.recordCount)} rows</span>
                  <span title="Size">{formatBytes(ds.sizeBytes)}</span>
                  <span title="Columns">{ds.columns.length} cols</span>
                  <button className="btn btn-outline btn-xs" onClick={e => { e.stopPropagation(); setBrowsingDataset({ id: ds.id, name: ds.name }); }} title="Browse Records">📊</button>
                  <button className="btn btn-outline btn-xs" onClick={e => { e.stopPropagation(); startEditDataset(ds); }} title="Edit">✎</button>
                  <button className="btn btn-danger btn-xs" onClick={e => { e.stopPropagation(); handleDeleteDataset(ds.id); }}>×</button>
                </div>
              </div>
              {expandedDataset === ds.id && (
                <div className="dp-item-detail">
                  {editingDatasetId === ds.id ? (
                    <div className="dp-edit-form">
                      <div className="dp-edit-row">
                        <label>Name</label>
                        <input type="text" value={editDataset.name} onChange={e => setEditDataset(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="dp-edit-row">
                        <label>Description</label>
                        <textarea rows={2} value={editDataset.description} onChange={e => setEditDataset(d => ({ ...d, description: e.target.value }))} />
                      </div>
                      <div className="dp-edit-row">
                        <label>Source</label>
                        <input type="text" value={editDataset.source} onChange={e => setEditDataset(d => ({ ...d, source: e.target.value }))} />
                      </div>
                      <div className="dp-edit-row-inline">
                        <div className="dp-edit-row">
                          <label>Format</label>
                          <select value={editDataset.format} onChange={e => setEditDataset(d => ({ ...d, format: e.target.value }))}>
                            <option value="CSV">CSV</option>
                            <option value="JSON">JSON</option>
                            <option value="Parquet">Parquet</option>
                            <option value="SQL">SQL</option>
                            <option value="API">API</option>
                          </select>
                        </div>
                        <div className="dp-edit-row">
                          <label>Status</label>
                          <select value={editDataset.status} onChange={e => setEditDataset(d => ({ ...d, status: e.target.value }))}>
                            <option value="Active">Active</option>
                            <option value="Stale">Stale</option>
                            <option value="Processing">Processing</option>
                            <option value="Error">Error</option>
                          </select>
                        </div>
                      </div>

                      {/* Column Editor */}
                      <div className="dp-col-editor">
                        <div className="dp-col-editor-header">
                          <label>Columns ({editDataset.columns.length})</label>
                          <button className="btn btn-outline btn-xs" onClick={addColumn}>+ Add Column</button>
                        </div>
                        {editDataset.columns.length === 0 && (
                          <div className="dp-col-empty">No columns defined. Click "Add Column" to start.</div>
                        )}
                        {editDataset.columns.length > 0 && (
                          <table className="dp-col-edit-table">
                            <thead>
                              <tr>
                                <th className="dp-col-th-order"></th>
                                <th>Name</th>
                                <th>Type</th>
                                <th className="dp-col-th-null">Nullable</th>
                                <th>Description</th>
                                <th className="dp-col-th-actions"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {editDataset.columns.map((col, idx) => (
                                <tr key={idx}>
                                  <td className="dp-col-order-cell">
                                    <button className="dp-col-move" onClick={() => moveColumn(idx, -1)} disabled={idx === 0} title="Move up">▲</button>
                                    <button className="dp-col-move" onClick={() => moveColumn(idx, 1)} disabled={idx === editDataset.columns.length - 1} title="Move down">▼</button>
                                  </td>
                                  <td>
                                    <input type="text" className="dp-col-input" value={col.name} placeholder="column_name"
                                      onChange={e => updateColumn(idx, 'name', e.target.value)} />
                                  </td>
                                  <td>
                                    <select className="dp-col-select" value={col.dataType} onChange={e => updateColumn(idx, 'dataType', e.target.value)}>
                                      <option value="string">string</option>
                                      <option value="int">int</option>
                                      <option value="float">float</option>
                                      <option value="bool">bool</option>
                                      <option value="date">date</option>
                                      <option value="datetime">datetime</option>
                                      <option value="json">json</option>
                                    </select>
                                  </td>
                                  <td className="dp-col-null-cell">
                                    <input type="checkbox" checked={col.nullable} onChange={e => updateColumn(idx, 'nullable', e.target.checked)} />
                                  </td>
                                  <td>
                                    <input type="text" className="dp-col-input dp-col-desc-input" value={col.description} placeholder="Description..."
                                      onChange={e => updateColumn(idx, 'description', e.target.value)} />
                                  </td>
                                  <td className="dp-col-actions-cell">
                                    <button className="btn btn-danger btn-xs" onClick={() => removeColumn(idx)} title="Remove column">×</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Governance Metadata Editor */}
                      <div className="dp-gov-editor">
                        <div className="dp-gov-editor-header">
                          <label>Data Governance</label>
                        </div>
                        <div className="dp-gov-grid">
                          <div className="dp-gov-field">
                            <label>Data Owner</label>
                            <input type="text" value={editDataset.governance.dataOwner} placeholder="Team or person responsible"
                              onChange={e => updateGovernance('dataOwner', e.target.value)} />
                          </div>
                          <div className="dp-gov-field">
                            <label>Data Steward</label>
                            <input type="text" value={editDataset.governance.dataSteward} placeholder="Quality manager"
                              onChange={e => updateGovernance('dataSteward', e.target.value)} />
                          </div>
                          <div className="dp-gov-field">
                            <label>Classification</label>
                            <select value={editDataset.governance.classification} onChange={e => updateGovernance('classification', e.target.value)}>
                              <option value="Public">Public</option>
                              <option value="Internal">Internal</option>
                              <option value="Confidential">Confidential</option>
                              <option value="Restricted">Restricted</option>
                            </select>
                          </div>
                          <div className="dp-gov-field">
                            <label>Sensitivity Level</label>
                            <select value={editDataset.governance.sensitivityLevel} onChange={e => updateGovernance('sensitivityLevel', e.target.value)}>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                          <div className="dp-gov-field">
                            <label>Data Domain</label>
                            <input type="text" value={editDataset.governance.dataDomain} placeholder="e.g. Customer, Financial"
                              onChange={e => updateGovernance('dataDomain', e.target.value)} />
                          </div>
                          <div className="dp-gov-field">
                            <label>Update Frequency</label>
                            <select value={editDataset.governance.updateFrequency} onChange={e => updateGovernance('updateFrequency', e.target.value)}>
                              <option value="">— Select —</option>
                              <option value="Real-time">Real-time</option>
                              <option value="Hourly">Hourly</option>
                              <option value="Daily">Daily</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Annually">Annually</option>
                              <option value="Ad-hoc">Ad-hoc</option>
                            </select>
                          </div>
                          <div className="dp-gov-field">
                            <label>Retention Policy</label>
                            <input type="text" value={editDataset.governance.retentionPolicy} placeholder="e.g. 7 years, 90 days"
                              onChange={e => updateGovernance('retentionPolicy', e.target.value)} />
                          </div>
                          <div className="dp-gov-field">
                            <label>Quality Score</label>
                            <input type="number" min="0" max="100" step="0.1"
                              value={editDataset.governance.qualityScore ?? ''} placeholder="0–100"
                              onChange={e => updateGovernance('qualityScore', e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </div>
                          <div className="dp-gov-field dp-gov-wide">
                            <label>Lineage / Data Flow</label>
                            <input type="text" value={editDataset.governance.lineageInfo} placeholder="Source → Processing → Destination"
                              onChange={e => updateGovernance('lineageInfo', e.target.value)} />
                          </div>
                          <div className="dp-gov-checks">
                            <label className="dp-gov-check">
                              <input type="checkbox" checked={editDataset.governance.containsPii} onChange={e => updateGovernance('containsPii', e.target.checked)} />
                              Contains PII
                            </label>
                            <label className="dp-gov-check">
                              <input type="checkbox" checked={editDataset.governance.containsPhi} onChange={e => updateGovernance('containsPhi', e.target.checked)} />
                              Contains PHI
                            </label>
                          </div>
                          <div className="dp-gov-field dp-gov-wide">
                            <label>Compliance Frameworks</label>
                            <div className="dp-gov-tags-wrap">
                              <div className="dp-gov-tags">
                                {editDataset.governance.complianceFrameworks.map((fw, i) => (
                                  <span key={i} className="dp-gov-tag" onClick={() => removeComplianceFramework(i)}>{fw} ×</span>
                                ))}
                              </div>
                              <input type="text" value={complianceFwInput} placeholder="Add framework (Enter)"
                                onChange={e => setComplianceFwInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addComplianceFramework(complianceFwInput); setComplianceFwInput(''); } }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Custom Metadata Editor */}
                      <div className="dp-custom-meta-editor">
                        <div className="dp-custom-meta-header">
                          <label>Custom Metadata ({editDataset.customMetadata.length})</label>
                          <button className="btn btn-outline btn-xs" onClick={addCustomField}>+ Add Field</button>
                        </div>
                        {editDataset.customMetadata.length === 0 && (
                          <div className="dp-custom-meta-empty">No custom metadata. Click "Add Field" to define your own.</div>
                        )}
                        {editDataset.customMetadata.length > 0 && (
                          <table className="dp-custom-meta-table">
                            <thead>
                              <tr><th>Key</th><th>Value</th><th>Type</th><th className="dp-cm-th-actions"></th></tr>
                            </thead>
                            <tbody>
                              {editDataset.customMetadata.map((m, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <input type="text" className="dp-cm-input" value={m.key} placeholder="Field name"
                                      onChange={e => updateCustomField(idx, 'key', e.target.value)} />
                                  </td>
                                  <td>
                                    <input type="text" className="dp-cm-input" value={m.value} placeholder="Value"
                                      onChange={e => updateCustomField(idx, 'value', e.target.value)} />
                                  </td>
                                  <td>
                                    <select className="dp-cm-select" value={m.fieldType} onChange={e => updateCustomField(idx, 'fieldType', e.target.value)}>
                                      <option value="text">text</option>
                                      <option value="number">number</option>
                                      <option value="date">date</option>
                                      <option value="boolean">boolean</option>
                                      <option value="url">url</option>
                                      <option value="email">email</option>
                                    </select>
                                  </td>
                                  <td className="dp-cm-actions-cell">
                                    <button className="btn btn-danger btn-xs" onClick={() => removeCustomField(idx)} title="Remove">×</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div className="dp-edit-actions">
                        <button className="btn btn-primary btn-sm" onClick={handleSaveDataset}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingDatasetId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                  <>
                  <p>{ds.description}</p>
                  <div className="dp-dataset-meta">
                    <span>Source: <code>{ds.source}</code></span>
                    <span>Last Refreshed: {formatDateTime(ds.lastRefreshed)}</span>
                  </div>

                  {/* Governance Metadata Display */}
                  {ds.governance && (ds.governance.dataOwner || ds.governance.dataSteward || ds.governance.classification !== 'Internal' || ds.governance.containsPii || ds.governance.containsPhi || ds.governance.dataDomain || ds.governance.retentionPolicy) && (
                    <div className="dp-gov-display">
                      <h4 className="dp-gov-display-title">Data Governance</h4>
                      <div className="dp-gov-display-grid">
                        {ds.governance.dataOwner && <div className="dp-gov-display-item"><span className="dp-gov-display-label">Owner</span><span>{ds.governance.dataOwner}</span></div>}
                        {ds.governance.dataSteward && <div className="dp-gov-display-item"><span className="dp-gov-display-label">Steward</span><span>{ds.governance.dataSteward}</span></div>}
                        <div className="dp-gov-display-item">
                          <span className="dp-gov-display-label">Classification</span>
                          <span className={`dp-gov-class dp-gov-class-${ds.governance.classification.toLowerCase()}`}>{ds.governance.classification}</span>
                        </div>
                        <div className="dp-gov-display-item">
                          <span className="dp-gov-display-label">Sensitivity</span>
                          <span className={`dp-gov-sens dp-gov-sens-${ds.governance.sensitivityLevel.toLowerCase()}`}>{ds.governance.sensitivityLevel}</span>
                        </div>
                        {ds.governance.dataDomain && <div className="dp-gov-display-item"><span className="dp-gov-display-label">Domain</span><span>{ds.governance.dataDomain}</span></div>}
                        {ds.governance.updateFrequency && <div className="dp-gov-display-item"><span className="dp-gov-display-label">Update Freq.</span><span>{ds.governance.updateFrequency}</span></div>}
                        {ds.governance.retentionPolicy && <div className="dp-gov-display-item"><span className="dp-gov-display-label">Retention</span><span>{ds.governance.retentionPolicy}</span></div>}
                        {ds.governance.qualityScore != null && (
                          <div className="dp-gov-display-item">
                            <span className="dp-gov-display-label">Quality</span>
                            <span className={`dp-gov-quality ${ds.governance.qualityScore >= 95 ? 'dp-gov-quality-good' : ds.governance.qualityScore >= 80 ? 'dp-gov-quality-ok' : 'dp-gov-quality-poor'}`}>{ds.governance.qualityScore.toFixed(1)}%</span>
                          </div>
                        )}
                        {(ds.governance.containsPii || ds.governance.containsPhi) && (
                          <div className="dp-gov-display-item">
                            <span className="dp-gov-display-label">Flags</span>
                            <span className="dp-gov-flags">
                              {ds.governance.containsPii && <span className="dp-gov-flag dp-gov-flag-pii">PII</span>}
                              {ds.governance.containsPhi && <span className="dp-gov-flag dp-gov-flag-phi">PHI</span>}
                            </span>
                          </div>
                        )}
                        {ds.governance.lineageInfo && (
                          <div className="dp-gov-display-item dp-gov-display-wide">
                            <span className="dp-gov-display-label">Lineage</span>
                            <span>{ds.governance.lineageInfo}</span>
                          </div>
                        )}
                        {ds.governance.complianceFrameworks?.length > 0 && (
                          <div className="dp-gov-display-item dp-gov-display-wide">
                            <span className="dp-gov-display-label">Compliance</span>
                            <span className="dp-gov-fw-tags">{ds.governance.complianceFrameworks.map((fw, i) => <span key={i} className="dp-gov-fw-tag">{fw}</span>)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Metadata Display */}
                  {ds.customMetadata?.length > 0 && (
                    <div className="dp-custom-meta-display">
                      <h4 className="dp-custom-meta-display-title">Custom Metadata</h4>
                      <table className="dp-custom-meta-view-table">
                        <thead>
                          <tr><th>Field</th><th>Value</th><th>Type</th></tr>
                        </thead>
                        <tbody>
                          {ds.customMetadata.map((m, i) => (
                            <tr key={i}>
                              <td><strong>{m.key}</strong></td>
                              <td>{m.fieldType === 'url' ? <a href={m.value} target="_blank" rel="noopener noreferrer">{m.value}</a> : m.fieldType === 'boolean' ? (m.value === 'true' ? '✓ Yes' : '✗ No') : m.value}</td>
                              <td><span className="dp-type-badge">{m.fieldType}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {ds.columns.length > 0 && (
                    <table className="dp-column-table">
                      <thead>
                        <tr><th>Column</th><th>Type</th><th>Nullable</th><th>Description</th></tr>
                      </thead>
                      <tbody>
                        {ds.columns.map((c, i) => (
                          <tr key={i}>
                            <td><code>{c.name}</code></td>
                            <td><span className="dp-type-badge">{c.dataType}</span></td>
                            <td>{c.nullable ? 'Yes' : 'No'}</td>
                            <td>{c.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============ FORMS TAB ============ */}
      {activeTab === 'forms' && (
        <div className="dp-section">
          <div className="dp-section-head">
            <h2>Forms</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowFormForm(!showFormForm)}>
              {showFormForm ? 'Cancel' : '+ Add Form'}
            </button>
          </div>

          {showFormForm && (
            <div className="dp-inline-form">
              <input type="text" placeholder="Form name" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
              <input type="text" placeholder="Description" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
              <button className="btn btn-primary btn-sm" onClick={handleCreateForm}>Create</button>
            </div>
          )}

          {detail.forms.length === 0 && <div className="dp-empty-section">No forms yet. Add one to get started.</div>}

          {detail.forms.map((f: DataForm) => (
            <div key={f.id} className="dp-item-card">
              <div className="dp-item-head" onClick={() => setExpandedForm(expandedForm === f.id ? null : f.id)}>
                <div className="dp-item-left">
                  <span className="dp-item-expand">{expandedForm === f.id ? '▾' : '▸'}</span>
                  <strong>{f.name}</strong>
                  <span className={`dp-badge-sm ${statusColor(f.status)}`}>{f.status}</span>
                </div>
                <div className="dp-item-right">
                  <span title="Fields">{f.fields.length} fields</span>
                  <span title="Submissions">{formatNumber(f.submissionCount)} submissions</span>
                  <button className="btn btn-outline btn-xs" onClick={e => { e.stopPropagation(); startEditForm(f); }} title="Edit">✎</button>
                  <button className="btn btn-danger btn-xs" onClick={e => { e.stopPropagation(); handleDeleteForm(f.id); }}>×</button>
                </div>
              </div>
              {expandedForm === f.id && (
                <div className="dp-item-detail">
                  {editingFormId === f.id ? (
                    <div className="dp-edit-form">
                      <div className="dp-edit-row">
                        <label>Name</label>
                        <input type="text" value={editFormData.name} onChange={e => setEditFormData(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="dp-edit-row">
                        <label>Description</label>
                        <textarea rows={2} value={editFormData.description} onChange={e => setEditFormData(d => ({ ...d, description: e.target.value }))} />
                      </div>
                      <div className="dp-edit-row">
                        <label>Status</label>
                        <select value={editFormData.status} onChange={e => setEditFormData(d => ({ ...d, status: e.target.value }))}>
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>

                      {/* Field Editor */}
                      <div className="dp-field-editor">
                        <div className="dp-field-editor-header">
                          <label>Fields ({editFormData.fields.length})</label>
                          <div className="dp-field-editor-actions">
                            <button className="btn btn-outline btn-xs" onClick={() => setPreviewingFormId(previewingFormId === f.id ? null : f.id)}>
                              {previewingFormId === f.id ? '✕ Close Preview' : '👁 Preview'}
                            </button>
                            <button className="btn btn-outline btn-xs" onClick={addField}>+ Add Field</button>
                          </div>
                        </div>
                        {editFormData.fields.length === 0 && (
                          <div className="dp-field-empty">No fields defined. Click "Add Field" to build your form.</div>
                        )}
                        {editFormData.fields.length > 0 && (
                          <table className="dp-field-edit-table">
                            <thead>
                              <tr>
                                <th className="dp-fld-th-order"></th>
                                <th>Name</th>
                                <th>Label</th>
                                <th>Type</th>
                                <th className="dp-fld-th-req">Req</th>
                                <th>Placeholder</th>
                                <th>Default</th>
                                <th>Options</th>
                                <th className="dp-fld-th-actions"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {editFormData.fields.map((fld, idx) => (
                                <tr key={idx}>
                                  <td className="dp-fld-order-cell">
                                    <button className="dp-fld-move" onClick={() => moveField(idx, -1)} disabled={idx === 0} title="Move up">▲</button>
                                    <button className="dp-fld-move" onClick={() => moveField(idx, 1)} disabled={idx === editFormData.fields.length - 1} title="Move down">▼</button>
                                  </td>
                                  <td>
                                    <input type="text" className="dp-fld-input" value={fld.name} placeholder="field_name"
                                      onChange={e => updateField(idx, 'name', e.target.value)} />
                                  </td>
                                  <td>
                                    <input type="text" className="dp-fld-input" value={fld.label} placeholder="Field Label"
                                      onChange={e => updateField(idx, 'label', e.target.value)} />
                                  </td>
                                  <td>
                                    <select className="dp-fld-select" value={fld.fieldType} onChange={e => updateField(idx, 'fieldType', e.target.value)}>
                                      <option value="text">text</option>
                                      <option value="number">number</option>
                                      <option value="date">date</option>
                                      <option value="select">select</option>
                                      <option value="checkbox">checkbox</option>
                                      <option value="textarea">textarea</option>
                                      <option value="email">email</option>
                                    </select>
                                  </td>
                                  <td className="dp-fld-req-cell">
                                    <input type="checkbox" checked={fld.required} onChange={e => updateField(idx, 'required', e.target.checked)} />
                                  </td>
                                  <td>
                                    <input type="text" className="dp-fld-input dp-fld-sm" value={fld.placeholder || ''} placeholder="Placeholder..."
                                      onChange={e => updateField(idx, 'placeholder', e.target.value || undefined)} />
                                  </td>
                                  <td>
                                    <input type="text" className="dp-fld-input dp-fld-sm" value={fld.defaultValue || ''} placeholder="Default"
                                      onChange={e => updateField(idx, 'defaultValue', e.target.value || undefined)} />
                                  </td>
                                  <td>
                                    {fld.fieldType === 'select' ? (
                                      <input type="text" className="dp-fld-input dp-fld-opts" value={(fld.options || []).join(', ')} placeholder="opt1, opt2, opt3"
                                        onChange={e => updateField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                                    ) : (
                                      <span className="dp-fld-na">—</span>
                                    )}
                                  </td>
                                  <td className="dp-fld-actions-cell">
                                    <button className="btn btn-danger btn-xs" onClick={() => removeField(idx)} title="Remove field">×</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Form Preview */}
                      {previewingFormId === f.id && (
                        <div className="dp-form-preview">
                          <div className="dp-form-preview-header">
                            <h4>{editFormData.name || 'Untitled Form'}</h4>
                            <p>{editFormData.description}</p>
                          </div>
                          <div className="dp-form-preview-body">
                            {editFormData.fields.length === 0 && (
                              <div className="dp-field-empty">Add fields above to see the form preview.</div>
                            )}
                            {editFormData.fields.map((fld, idx) => (
                              <div key={idx} className="dp-preview-field">
                                <label className="dp-preview-label">
                                  {fld.label || fld.name || `Field ${idx + 1}`}
                                  {fld.required && <span className="dp-preview-req">*</span>}
                                </label>
                                {fld.fieldType === 'textarea' ? (
                                  <textarea className="dp-preview-input" placeholder={fld.placeholder || ''} defaultValue={fld.defaultValue || ''} rows={3} readOnly />
                                ) : fld.fieldType === 'select' ? (
                                  <select className="dp-preview-input" defaultValue={fld.defaultValue || ''} disabled>
                                    <option value="">{fld.placeholder || '— Select —'}</option>
                                    {(fld.options || []).map((opt, oi) => (
                                      <option key={oi} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : fld.fieldType === 'checkbox' ? (
                                  <label className="dp-preview-checkbox">
                                    <input type="checkbox" defaultChecked={fld.defaultValue === 'true'} disabled />
                                    <span>{fld.placeholder || fld.label || fld.name}</span>
                                  </label>
                                ) : (
                                  <input className="dp-preview-input" type={fld.fieldType === 'number' ? 'number' : fld.fieldType === 'date' ? 'date' : fld.fieldType === 'email' ? 'email' : 'text'}
                                    placeholder={fld.placeholder || ''} defaultValue={fld.defaultValue || ''} readOnly />
                                )}
                              </div>
                            ))}
                            {editFormData.fields.length > 0 && (
                              <div className="dp-preview-submit">
                                <button className="btn btn-primary btn-sm" disabled>Submit</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="dp-edit-actions">
                        <button className="btn btn-primary btn-sm" onClick={handleSaveForm}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditingFormId(null); setPreviewingFormId(null); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                  <>
                  <p>{f.description}</p>
                  {f.fields.length > 0 && (
                    <>
                    <div className="dp-form-view-actions">
                      <button className="btn btn-outline btn-xs" onClick={() => setPreviewingFormId(previewingFormId === f.id ? null : f.id)}>
                        {previewingFormId === f.id ? '✕ Close Preview' : '👁 Preview Form'}
                      </button>
                    </div>
                    <table className="dp-column-table">
                      <thead>
                        <tr><th>Field</th><th>Label</th><th>Type</th><th>Required</th><th>Options</th></tr>
                      </thead>
                      <tbody>
                        {f.fields.map((fld, i) => (
                          <tr key={i}>
                            <td><code>{fld.name}</code></td>
                            <td>{fld.label}</td>
                            <td><span className="dp-type-badge">{fld.fieldType}</span></td>
                            <td>{fld.required ? '✓' : ''}</td>
                            <td>{fld.options?.join(', ') || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </>
                  )}

                  {/* Preview in view mode */}
                  {previewingFormId === f.id && (
                    <div className="dp-form-preview">
                      <div className="dp-form-preview-header">
                        <h4>{f.name}</h4>
                        <p>{f.description}</p>
                      </div>
                      <div className="dp-form-preview-body">
                        {f.fields.map((fld, idx) => (
                          <div key={idx} className="dp-preview-field">
                            <label className="dp-preview-label">
                              {fld.label || fld.name}
                              {fld.required && <span className="dp-preview-req">*</span>}
                            </label>
                            {fld.fieldType === 'textarea' ? (
                              <textarea className="dp-preview-input" placeholder={fld.placeholder || ''} defaultValue={fld.defaultValue || ''} rows={3} readOnly />
                            ) : fld.fieldType === 'select' ? (
                              <select className="dp-preview-input" defaultValue={fld.defaultValue || ''} disabled>
                                <option value="">{fld.placeholder || '— Select —'}</option>
                                {(fld.options || []).map((opt, oi) => (
                                  <option key={oi} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : fld.fieldType === 'checkbox' ? (
                              <label className="dp-preview-checkbox">
                                <input type="checkbox" defaultChecked={fld.defaultValue === 'true'} disabled />
                                <span>{fld.placeholder || fld.label || fld.name}</span>
                              </label>
                            ) : (
                              <input className="dp-preview-input" type={fld.fieldType === 'number' ? 'number' : fld.fieldType === 'date' ? 'date' : fld.fieldType === 'email' ? 'email' : 'text'}
                                placeholder={fld.placeholder || ''} defaultValue={fld.defaultValue || ''} readOnly />
                            )}
                          </div>
                        ))}
                        {f.fields.length > 0 && (
                          <div className="dp-preview-submit">
                            <button className="btn btn-primary btn-sm" disabled>Submit</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="dp-form-meta">
                    <span>Created: {formatDate(f.createdAt)}</span>
                    <span>Updated: {formatDateTime(f.updatedAt)}</span>
                  </div>
                  </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============ QUALITY TAB ============ */}
      {activeTab === 'quality' && (
        <div className="dp-section">
          <div className="dp-section-head">
            <h2>Data Quality Rules</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowRuleForm(!showRuleForm)}>
              {showRuleForm ? 'Cancel' : '+ Add Rule'}
            </button>
          </div>

          {showRuleForm && (
            <div className="dp-inline-form dp-rule-form">
              <input type="text" placeholder="Rule name" value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} />
              <input type="text" placeholder="Description" value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} />
              <select value={newRule.ruleType} onChange={e => setNewRule(r => ({ ...r, ruleType: e.target.value }))}>
                <option value="completeness">Completeness</option>
                <option value="accuracy">Accuracy</option>
                <option value="consistency">Consistency</option>
                <option value="timeliness">Timeliness</option>
                <option value="uniqueness">Uniqueness</option>
                <option value="validity">Validity</option>
              </select>
              <input type="text" placeholder="Column (optional)" value={newRule.column} onChange={e => setNewRule(r => ({ ...r, column: e.target.value }))} />
              <input type="text" placeholder="Expression (e.g. NOT NULL, > 0)" value={newRule.expression} onChange={e => setNewRule(r => ({ ...r, expression: e.target.value }))} />
              <select value={newRule.severity} onChange={e => setNewRule(r => ({ ...r, severity: e.target.value }))}>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleCreateRule}>Create</button>
            </div>
          )}

          {detail.qualityRules.length === 0 && <div className="dp-empty-section">No quality rules yet. Add one to get started.</div>}

          {/* quality summary */}
          {detail.qualityRules.length > 0 && (
            <div className="dp-quality-summary">
              <div className="dp-qs-item dp-qs-pass">
                <span className="dp-qs-num">{detail.qualityRules.filter(r => r.lastResult === 'pass').length}</span>
                <span>Passing</span>
              </div>
              <div className="dp-qs-item dp-qs-fail">
                <span className="dp-qs-num">{detail.qualityRules.filter(r => r.lastResult === 'fail').length}</span>
                <span>Failing</span>
              </div>
              <div className="dp-qs-item dp-qs-norun">
                <span className="dp-qs-num">{detail.qualityRules.filter(r => !r.lastResult).length}</span>
                <span>Not Run</span>
              </div>
            </div>
          )}

          {detail.qualityRules.map((r: DataQualityRule) => (
            <div key={r.id} className={`dp-rule-card ${!r.isActive ? 'dp-rule-disabled' : ''}`}>
              <div className="dp-rule-top">
                <div className="dp-rule-left">
                  <span className="dp-rule-severity">{severityIcon(r.severity)}</span>
                  <strong>{r.name}</strong>
                  <span className="dp-badge-sm dp-badge-ruletype">{r.ruleType}</span>
                  {!r.isActive && <span className="dp-badge-sm dp-status-archived">Disabled</span>}
                </div>
                <div className="dp-rule-right">
                  {r.passRate !== undefined && r.passRate !== null && (
                    <span className={`dp-pass-rate ${resultColor(r.lastResult)}`}>
                      {r.passRate.toFixed(1)}%
                    </span>
                  )}
                  <span className={`dp-result-badge ${resultColor(r.lastResult)}`}>
                    {r.lastResult || 'Not run'}
                  </span>
                  <button className="btn btn-outline btn-xs" onClick={() => handleRunCheck(r.id)} title="Run check">▶ Run</button>
                  <button className="btn btn-outline btn-xs" onClick={() => startEditRule(r)} title="Edit">✎</button>
                  <button className="btn btn-danger btn-xs" onClick={() => handleDeleteRule(r.id)}>×</button>
                </div>
              </div>
              {editingRuleId === r.id ? (
                <div className="dp-rule-body">
                  <div className="dp-edit-form">
                    <div className="dp-edit-row-inline">
                      <div className="dp-edit-row" style={{ flex: 2 }}>
                        <label>Name</label>
                        <input type="text" value={editRule.name} onChange={e => setEditRule(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="dp-edit-row" style={{ flex: 1 }}>
                        <label>Severity</label>
                        <select value={editRule.severity} onChange={e => setEditRule(d => ({ ...d, severity: e.target.value }))}>
                          <option value="error">Error</option>
                          <option value="warning">Warning</option>
                          <option value="info">Info</option>
                        </select>
                      </div>
                    </div>
                    <div className="dp-edit-row">
                      <label>Description</label>
                      <textarea rows={2} value={editRule.description} onChange={e => setEditRule(d => ({ ...d, description: e.target.value }))} />
                    </div>
                    <div className="dp-edit-row-inline">
                      <div className="dp-edit-row" style={{ flex: 1 }}>
                        <label>Rule Type</label>
                        <select value={editRule.ruleType} onChange={e => setEditRule(d => ({ ...d, ruleType: e.target.value }))}>
                          <option value="completeness">Completeness</option>
                          <option value="accuracy">Accuracy</option>
                          <option value="consistency">Consistency</option>
                          <option value="timeliness">Timeliness</option>
                          <option value="uniqueness">Uniqueness</option>
                          <option value="validity">Validity</option>
                        </select>
                      </div>
                      <div className="dp-edit-row" style={{ flex: 1 }}>
                        <label>Column</label>
                        <input type="text" value={editRule.column} onChange={e => setEditRule(d => ({ ...d, column: e.target.value }))} placeholder="(optional)" />
                      </div>
                    </div>
                    <div className="dp-edit-row">
                      <label>Expression</label>
                      <input type="text" value={editRule.expression} onChange={e => setEditRule(d => ({ ...d, expression: e.target.value }))} />
                    </div>
                    <div className="dp-edit-row">
                      <label className="dp-checkbox-label">
                        <input type="checkbox" checked={editRule.isActive} onChange={e => setEditRule(d => ({ ...d, isActive: e.target.checked }))} />
                        Active
                      </label>
                    </div>
                    <div className="dp-edit-actions">
                      <button className="btn btn-primary btn-sm" onClick={handleSaveRule}>Save</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditingRuleId(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="dp-rule-body">
                <p>{r.description}</p>
                <div className="dp-rule-meta">
                  {r.column && <span>Column: <code>{r.column}</code></span>}
                  <span>Expression: <code>{r.expression}</code></span>
                  {r.lastRunAt && <span>Last run: {formatDateTime(r.lastRunAt)}</span>}
                </div>
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Record Browser Modal */}
      {browsingDataset && detail && (
        <DatasetRecordBrowser
          projectId={detail.id}
          datasetId={browsingDataset.id}
          datasetName={browsingDataset.name}
          onClose={() => { setBrowsingDataset(null); refreshDetail(); }}
        />
      )}
    </div>
  );
}
