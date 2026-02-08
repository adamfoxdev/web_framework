import { useState, useEffect, useCallback } from 'react';
import { workspaceService } from '../services/workspaceService';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Workspace, PagedResponse, WorkspaceSearchParams } from '../types';

type View = 'list' | 'create';

const ICONS = ['📁', '⚙️', '📣', '💰', '🔬', '🏭', '📊', '🔒', '🌐', '🎯', '📈', '🗂️', '💼', '🛠️', '🎨'];
const COLORS = ['#4f46e5', '#ec4899', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#dc2626', '#ca8a04', '#4338ca', '#059669'];

export default function WorkspacesPage() {
  const { activeWorkspace, setActiveWorkspace, refreshWorkspaces } = useWorkspace();
  const [view, setView] = useState<View>('list');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [params, setParams] = useState<WorkspaceSearchParams>({ page: 1, pageSize: 25, sortBy: 'name' });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);

  // create / edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', department: '', color: '#4f46e5', icon: '📁', members: '' });

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res: PagedResponse<Workspace> = await workspaceService.search(params);
      setWorkspaces(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  }, [params]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  useEffect(() => {
    const t = setTimeout(() => setParams(p => ({ ...p, search: searchInput || undefined, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const members = form.members.split(',').map(m => m.trim()).filter(Boolean);
    try {
      if (editingId) {
        await workspaceService.update(editingId, {
          name: form.name, description: form.description,
          department: form.department, color: form.color, icon: form.icon,
          members: members.length > 0 ? members : undefined,
        });
      } else {
        await workspaceService.create({
          name: form.name, description: form.description,
          department: form.department, color: form.color, icon: form.icon,
          members: members.length > 0 ? members : undefined,
        });
      }
      setView('list');
      resetForm();
      fetchWorkspaces();
      refreshWorkspaces();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workspace? Projects and queries will be unlinked.')) return;
    await workspaceService.delete(id);
    fetchWorkspaces();
    refreshWorkspaces();
  };

  const startEdit = (ws: Workspace) => {
    setEditingId(ws.id);
    setForm({
      name: ws.name, description: ws.description,
      department: ws.department, color: ws.color, icon: ws.icon,
      members: ws.members.join(', '),
    });
    setView('create');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', description: '', department: '', color: '#4f46e5', icon: '📁', members: '' });
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString();

  // -------- CREATE / EDIT VIEW --------
  if (view === 'create') {
    return (
      <div className="ws-page">
        <div className="ws-page-header">
          <button className="btn btn-outline" onClick={() => { setView('list'); resetForm(); }}>← Back</button>
          <h1>{editingId ? 'Edit Workspace' : 'New Workspace'}</h1>
        </div>
        <div className="ws-form-card">
          <label>Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Marketing Analytics" />

          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the workspace purpose..." />

          <label>Department</label>
          <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Engineering, Finance, Marketing" />

          <label>Icon</label>
          <div className="ws-icon-picker">
            {ICONS.map(icon => (
              <button key={icon} className={`ws-icon-opt ${form.icon === icon ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, icon }))}>
                {icon}
              </button>
            ))}
          </div>

          <label>Color</label>
          <div className="ws-color-picker">
            {COLORS.map(c => (
              <button key={c} className={`ws-color-opt ${form.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
            ))}
          </div>

          <label>Members (comma-separated usernames)</label>
          <input type="text" value={form.members} onChange={e => setForm(f => ({ ...f, members: e.target.value }))} placeholder="admin, jdoe, analyst1" />

          <div className="ws-form-actions">
            <button className="btn btn-primary" onClick={handleCreate}>{editingId ? 'Save Changes' : 'Create Workspace'}</button>
            <button className="btn btn-outline" onClick={() => { setView('list'); resetForm(); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // -------- LIST VIEW --------
  return (
    <div className="ws-page">
      <div className="ws-page-header">
        <h1>Workspaces</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setView('create'); }}>+ New Workspace</button>
      </div>

      <div className="ws-toolbar">
        <input
          className="ws-search"
          type="text"
          placeholder="Search workspaces..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>

      {loading && <div className="ws-loading">Loading...</div>}

      <div className="ws-grid">
        {workspaces.map(ws => (
          <div key={ws.id} className={`ws-card ${activeWorkspace?.id === ws.id ? 'ws-card-active' : ''}`}>
            <div className="ws-card-header" style={{ borderTopColor: ws.color }}>
              <div className="ws-card-icon-wrap" style={{ background: ws.color + '18' }}>
                <span className="ws-card-icon">{ws.icon}</span>
              </div>
              <div className="ws-card-title-wrap">
                <h3>{ws.name}</h3>
                <span className="ws-card-dept">{ws.department}</span>
              </div>
              {ws.isDefault && <span className="ws-default-badge">Default</span>}
            </div>
            <p className="ws-card-desc">{ws.description}</p>
            <div className="ws-card-stats">
              <div className="ws-stat">
                <span className="ws-stat-num">{ws.projectCount}</span>
                <span className="ws-stat-label">Projects</span>
              </div>
              <div className="ws-stat">
                <span className="ws-stat-num">{ws.queryCount}</span>
                <span className="ws-stat-label">Queries</span>
              </div>
              <div className="ws-stat">
                <span className="ws-stat-num">{ws.members.length}</span>
                <span className="ws-stat-label">Members</span>
              </div>
            </div>
            <div className="ws-card-members">
              {ws.members.slice(0, 3).map(m => (
                <span key={m} className="ws-member-chip">{m}</span>
              ))}
              {ws.members.length > 3 && <span className="ws-member-chip ws-member-more">+{ws.members.length - 3}</span>}
            </div>
            <div className="ws-card-footer">
              <span className="ws-card-date">Updated {formatDate(ws.updatedAt)}</span>
              <div className="ws-card-actions">
                <button className="btn btn-outline btn-xs" onClick={() => { setActiveWorkspace(ws); }}>
                  {activeWorkspace?.id === ws.id ? '✓ Active' : 'Switch'}
                </button>
                <button className="btn btn-outline btn-xs" onClick={() => startEdit(ws)}>Edit</button>
                <button className="btn btn-danger btn-xs" onClick={() => handleDelete(ws.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workspaces.length === 0 && !loading && <div className="ws-empty">No workspaces found.</div>}

      {totalPages > 1 && (
        <div className="ws-pagination">
          <button disabled={params.page === 1} onClick={() => setParams(p => ({ ...p, page: (p.page || 1) - 1 }))}>← Prev</button>
          <span>Page {params.page} of {totalPages} ({totalCount} workspaces)</span>
          <button disabled={params.page === totalPages} onClick={() => setParams(p => ({ ...p, page: (p.page || 1) + 1 }))}>Next →</button>
        </div>
      )}
    </div>
  );
}
