/**
 * Design C — Dashboard + Enhanced Table
 * Stats summary cards at top, dark-header table with avatars,
 * inline status toggles, expandable row detail, and a different color scheme.
 */
import { useEffect, useState, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import type { User, Role, CreateUserRequest, UserQuery, PagedResponse } from '../types';

const PAGE_SIZES = [25, 50, 100, 200];
const DEBOUNCE_MS = 350;

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981',
  '#06b6d4', '#3b82f6', '#a855f7', '#14b8a6', '#f59e0b',
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(f: string, l: string) {
  return ((f?.[0] ?? '') + (l?.[0] ?? '')).toUpperCase() || '?';
}

export default function UsersPageDesignC() {
  const [paged, setPaged] = useState<PagedResponse<User> | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState<UserQuery>({
    search: '', role: '', isActive: null, sortBy: 'username', sortDesc: false, page: 1, pageSize: 50,
  });

  const [form, setForm] = useState<CreateUserRequest>({
    username: '', email: '', password: '', firstName: '', lastName: '', roles: ['User'],
  });

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadUsers = useCallback(async (q: UserQuery) => {
    setLoading(true);
    try { setPaged(await userService.getAll(q)); }
    catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  const loadRoles = useCallback(async () => {
    try { setRoles(await roleService.getAll()); } catch { /* */ }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);
  useEffect(() => { loadUsers(query); }, [query, loadUsers]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const updateQuery = (patch: Partial<UserQuery>) =>
    setQuery((p) => ({ ...p, ...patch, page: patch.page ?? 1 }));

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateQuery({ search: v }), DEBOUNCE_MS);
  };

  const handleSort = (col: string) => {
    setQuery((prev) => ({
      ...prev, sortBy: col, sortDesc: prev.sortBy === col ? !prev.sortDesc : false,
    }));
  };

  const sortIcon = (col: string) =>
    query.sortBy === col ? (query.sortDesc ? ' ▼' : ' ▲') : '';

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const pageIds = paged?.items.map((u) => u.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const togglePage = () => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => n.delete(id));
      else pageIds.forEach((id) => n.add(id));
      return n;
    });
  };

  const handleToggleActive = async (user: User) => {
    try { await userService.update(user.id, { isActive: !user.isActive }); loadUsers(query); }
    catch { setError('Update failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try { await userService.delete(id); flash('Deleted'); loadUsers(query); }
    catch { setError('Delete failed'); }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await userService.create(form);
      setShowCreateForm(false);
      setForm({ username: '', email: '', password: '', firstName: '', lastName: '', roles: ['User'] });
      flash('User created'); loadUsers(query);
    } catch (err) { setError(err instanceof Error ? err.message : 'Create failed'); }
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await userService.update(editingUser.id, {
        email: editingUser.email, firstName: editingUser.firstName,
        lastName: editingUser.lastName, roles: editingUser.roles,
      });
      setEditingUser(null); flash('User updated'); loadUsers(query);
    } catch { setError('Update failed'); }
  };

  const handleBulkEnable = async () => {
    try {
      const r = await userService.bulkSetStatus(Array.from(selected), true);
      flash(`Enabled ${r.affected} users`); setSelected(new Set()); loadUsers(query);
    } catch { setError('Failed'); }
  };

  const handleBulkDisable = async () => {
    try {
      const r = await userService.bulkSetStatus(Array.from(selected), false);
      flash(`Disabled ${r.affected} users`); setSelected(new Set()); loadUsers(query);
    } catch { setError('Failed'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} users?`)) return;
    try {
      const r = await userService.bulkDelete(Array.from(selected));
      flash(`Deleted ${r.affected} users`); setSelected(new Set()); loadUsers(query);
    } catch { setError('Failed'); }
  };

  // Stats computation
  const totalUsers = paged?.totalCount ?? 0;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="dc">
      {/* Title */}
      <div className="dc-header">
        <div>
          <h1 className="dc-title">User Management</h1>
          <p className="dc-subtitle">Manage your organization's users and permissions</p>
        </div>
        <button className="btn dc-btn-create" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? '✕ Cancel' : '+ Create User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary Stats */}
      <div className="dc-stats">
        <div className="dc-stat-card">
          <div className="dc-stat-icon dc-stat-icon-users">👥</div>
          <div className="dc-stat-info">
            <div className="dc-stat-value">{totalUsers.toLocaleString()}</div>
            <div className="dc-stat-label">Total Users</div>
          </div>
        </div>
        <div className="dc-stat-card">
          <div className="dc-stat-icon dc-stat-icon-active">✓</div>
          <div className="dc-stat-info">
            <div className="dc-stat-value">{(paged?.totalCount ?? 0).toLocaleString()}</div>
            <div className="dc-stat-label">Showing</div>
          </div>
        </div>
        <div className="dc-stat-card">
          <div className="dc-stat-icon dc-stat-icon-roles">🔑</div>
          <div className="dc-stat-info">
            <div className="dc-stat-value">{roles.length}</div>
            <div className="dc-stat-label">Roles</div>
          </div>
        </div>
        <div className="dc-stat-card">
          <div className="dc-stat-icon dc-stat-icon-selected">☑</div>
          <div className="dc-stat-info">
            <div className="dc-stat-value">{selected.size}</div>
            <div className="dc-stat-label">Selected</div>
          </div>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="card dc-create-card">
          <h3>Create New User</h3>
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-group"><label>Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
            <div className="form-group"><label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="form-group"><label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="form-group"><label>First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div className="form-group"><label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
            <div className="form-group"><label>Roles</label>
              <div className="checkbox-group">
                {roles.map((r) => (
                  <label key={r.name} className="checkbox-label">
                    <input type="checkbox" checked={form.roles?.includes(r.name) ?? false}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...(form.roles ?? []), r.name]
                          : (form.roles ?? []).filter((x) => x !== r.name);
                        setForm({ ...form, roles: next });
                      }} />
                    <span>{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><button type="submit" className="btn btn-primary">Create</button></div>
          </form>
        </div>
      )}

      {/* Filters & Bulk Toolbar */}
      <div className="dc-toolbar">
        <div className="dc-toolbar-left">
          <div className="dc-search-wrap">
            <span className="dc-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, username..."
              defaultValue={query.search}
              onChange={handleSearchChange}
            />
          </div>
          <select value={query.role ?? ''} onChange={(e) => updateQuery({ role: e.target.value || undefined })}>
            <option value="">All Roles</option>
            {roles.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
          <select
            value={query.isActive === null ? '' : String(query.isActive)}
            onChange={(e) => updateQuery({ isActive: e.target.value === '' ? null : e.target.value === 'true' })}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={query.pageSize} onChange={(e) => updateQuery({ pageSize: Number(e.target.value) })}>
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
          </select>
        </div>
        {selected.size > 0 && (
          <div className="dc-toolbar-right">
            <span className="dc-sel-label">{selected.size} selected:</span>
            <button className="btn btn-sm" onClick={handleBulkEnable}>Enable</button>
            <button className="btn btn-sm" onClick={handleBulkDisable}>Disable</button>
            <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>Delete</button>
            <button className="btn btn-sm btn-outline" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="dc-table-wrap">
        {loading && <div className="table-loading">Loading...</div>}
        <table className="dc-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allPageSelected} onChange={togglePage} /></th>
              <th className="sortable" onClick={() => handleSort('username')}>User{sortIcon('username')}</th>
              <th className="sortable" onClick={() => handleSort('email')}>Email{sortIcon('email')}</th>
              <th>Roles</th>
              <th className="sortable" onClick={() => handleSort('isactive')}>Status{sortIcon('isactive')}</th>
              <th className="sortable" onClick={() => handleSort('createdat')}>Created{sortIcon('createdat')}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged?.items.map((u) => (
              <>
                <tr key={u.id} className={`${selected.has(u.id) ? 'dc-row-selected' : ''}${expandedId === u.id ? ' dc-row-expanded' : ''}`}>
                  <td><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                  <td>
                    <div className="dc-user-cell">
                      <div className="dc-table-avatar" style={{ background: getColor(u.username) }}>
                        {initials(u.firstName, u.lastName)}
                      </div>
                      <div>
                        <div className="dc-user-fullname">{u.firstName} {u.lastName}</div>
                        <div className="dc-user-handle">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="dc-email">{u.email}</td>
                  <td>
                    <div className="role-badges">
                      {u.roles.slice(0, 2).map((r) => (
                        <span key={r} className="dc-role-chip">{r}</span>
                      ))}
                      {u.roles.length > 2 && (
                        <span className="dc-role-chip dc-role-more" title={u.roles.slice(2).join(', ')}>+{u.roles.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      className={`dc-status-toggle ${u.isActive ? 'dc-toggle-on' : 'dc-toggle-off'}`}
                      onClick={() => handleToggleActive(u)}
                      title={u.isActive ? 'Click to disable' : 'Click to enable'}
                    >
                      <span className="dc-toggle-dot" />
                      <span className="dc-toggle-label">{u.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="dc-date">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="dc-actions">
                      <button className="dc-icon-btn" title="Expand" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                        {expandedId === u.id ? '▲' : '▼'}
                      </button>
                      <button className="dc-icon-btn" title="Edit" onClick={() => setEditingUser(u)}>✏️</button>
                      <button className="dc-icon-btn dc-icon-danger" title="Delete" onClick={() => handleDelete(u.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
                {expandedId === u.id && (
                  <tr key={`${u.id}-detail`} className="dc-detail-row">
                    <td colSpan={7}>
                      <div className="dc-expanded-detail">
                        <div className="dc-detail-grid">
                          <div className="dc-detail-item">
                            <span className="dc-detail-label">User ID</span>
                            <span className="dc-detail-val dc-mono">{u.id}</span>
                          </div>
                          <div className="dc-detail-item">
                            <span className="dc-detail-label">Email</span>
                            <span className="dc-detail-val">{u.email}</span>
                          </div>
                          <div className="dc-detail-item">
                            <span className="dc-detail-label">Created</span>
                            <span className="dc-detail-val">{formatDate(u.createdAt)}</span>
                          </div>
                          <div className="dc-detail-item">
                            <span className="dc-detail-label">All Roles</span>
                            <span className="dc-detail-val">
                              {u.roles.map((r) => (
                                <span key={r} className="dc-role-chip" style={{ marginRight: 4 }}>{r}</span>
                              ))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {paged && paged.items.length === 0 && (
              <tr><td colSpan={7} className="empty-row">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paged && paged.totalPages > 1 && (
        <div className="dc-pagination">
          <span className="dc-page-info">
            Showing {((paged.page - 1) * paged.pageSize) + 1}–{Math.min(paged.page * paged.pageSize, paged.totalCount)} of {paged.totalCount.toLocaleString()}
          </span>
          <div className="dc-page-btns">
            <button disabled={paged.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: 1 }))}>&laquo;</button>
            <button disabled={paged.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}>&lsaquo;</button>
            <span className="dc-page-num">Page {paged.page}</span>
            <button disabled={paged.page >= paged.totalPages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}>&rsaquo;</button>
            <button disabled={paged.page >= paged.totalPages}
              onClick={() => setQuery((q) => ({ ...q, page: paged.totalPages }))}>&raquo;</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="card modal-card dc-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dc-modal-header">
              <div className="dc-table-avatar" style={{ background: getColor(editingUser.username), width: 40, height: 40, fontSize: '0.9rem' }}>
                {initials(editingUser.firstName, editingUser.lastName)}
              </div>
              <h3>Edit {editingUser.firstName} {editingUser.lastName}</h3>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="form-group"><label>Email</label>
                <input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} /></div>
              <div className="form-group"><label>First Name</label>
                <input value={editingUser.firstName} onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })} /></div>
              <div className="form-group"><label>Last Name</label>
                <input value={editingUser.lastName} onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })} /></div>
              <div className="form-group">
                <label>Roles</label>
                <div className="checkbox-group">
                  {roles.map((r) => (
                    <label key={r.name} className="checkbox-label">
                      <input type="checkbox" checked={editingUser.roles.includes(r.name)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...editingUser.roles, r.name]
                            : editingUser.roles.filter((x) => x !== r.name);
                          setEditingUser({ ...editingUser, roles: next });
                        }} />
                      <span>{r.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
