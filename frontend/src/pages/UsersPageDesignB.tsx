/**
 * Design B — Split Panel (Master-Detail)
 * Left sidebar with compact user list, right panel shows selected user details.
 * Sidebar supports search/scroll; detail panel has inline editing.
 */
import { useEffect, useState, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import type { User, Role, CreateUserRequest, UserQuery, PagedResponse } from '../types';

const DEBOUNCE_MS = 350;

const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
  '#0891b2', '#4f46e5', '#c026d3', '#059669', '#d97706',
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(f: string, l: string) {
  return ((f?.[0] ?? '') + (l?.[0] ?? '')).toUpperCase() || '?';
}

export default function UsersPageDesignB() {
  const [paged, setPaged] = useState<PagedResponse<User> | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [query, setQuery] = useState<UserQuery>({
    search: '', role: '', isActive: null, sortBy: 'username', sortDesc: false, page: 1, pageSize: 50,
  });

  const [createForm, setCreateForm] = useState<CreateUserRequest>({
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

  const selectUser = (u: User) => {
    setSelectedUser(u);
    setEditing(false);
    setEditForm(null);
    setShowCreate(false);
  };

  const startEdit = () => {
    if (!selectedUser) return;
    setEditForm({ ...selectedUser });
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setEditForm(null); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      await userService.update(editForm.id, {
        email: editForm.email, firstName: editForm.firstName,
        lastName: editForm.lastName, roles: editForm.roles,
      });
      flash('User updated');
      setEditing(false);
      setEditForm(null);
      const refreshed = await userService.getAll(query);
      setPaged(refreshed);
      const updated = refreshed.items.find((u) => u.id === editForm.id);
      if (updated) setSelectedUser(updated);
    } catch { setError('Update failed'); }
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    try {
      await userService.update(selectedUser.id, { isActive: !selectedUser.isActive });
      flash(selectedUser.isActive ? 'User disabled' : 'User enabled');
      const refreshed = await userService.getAll(query);
      setPaged(refreshed);
      const updated = refreshed.items.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    } catch { setError('Update failed'); }
  };

  const handleDelete = async () => {
    if (!selectedUser || !confirm(`Delete ${selectedUser.username}?`)) return;
    try {
      await userService.delete(selectedUser.id);
      flash('User deleted');
      setSelectedUser(null);
      loadUsers(query);
    } catch { setError('Delete failed'); }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await userService.create(createForm);
      setCreateForm({ username: '', email: '', password: '', firstName: '', lastName: '', roles: ['User'] });
      setShowCreate(false);
      flash('User created');
      loadUsers(query);
      setSelectedUser(created);
    } catch (err) { setError(err instanceof Error ? err.message : 'Create failed'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="db">
      {/* Top bar */}
      <div className="db-topbar">
        <h1 className="db-title">User Management</h1>
        {paged && <span className="db-count">{paged.totalCount.toLocaleString()} users</span>}
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
          onClick={() => { setShowCreate(!showCreate); setSelectedUser(null); setEditing(false); }}>
          {showCreate ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="db-split">
        {/* LEFT: User List Sidebar */}
        <div className="db-sidebar">
          <div className="db-sidebar-search">
            <input
              type="text"
              placeholder="Search users..."
              defaultValue={query.search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="db-sidebar-filters">
            <select value={query.role ?? ''} onChange={(e) => updateQuery({ role: e.target.value || undefined })}>
              <option value="">All Roles</option>
              {roles.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
            <select
              value={query.isActive === null ? '' : String(query.isActive)}
              onChange={(e) => updateQuery({ isActive: e.target.value === '' ? null : e.target.value === 'true' })}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="db-user-list">
            {loading && <div className="db-list-loading">Loading...</div>}
            {paged?.items.map((u) => (
              <div
                key={u.id}
                className={`db-user-item${selectedUser?.id === u.id ? ' db-user-item-active' : ''}${!u.isActive ? ' db-user-item-disabled' : ''}`}
                onClick={() => selectUser(u)}
              >
                <div className="db-mini-avatar" style={{ background: getColor(u.username) }}>
                  {initials(u.firstName, u.lastName)}
                </div>
                <div className="db-user-item-info">
                  <div className="db-user-item-name">{u.firstName} {u.lastName}</div>
                  <div className="db-user-item-meta">@{u.username}</div>
                </div>
                <div className={`db-status-dot ${u.isActive ? 'db-dot-active' : 'db-dot-inactive'}`} />
              </div>
            ))}
            {paged && paged.items.length === 0 && (
              <div className="db-list-empty">No users found</div>
            )}
          </div>

          {/* Sidebar pagination */}
          {paged && paged.totalPages > 1 && (
            <div className="db-sidebar-pagination">
              <button disabled={paged.page <= 1}
                onClick={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}>‹</button>
              <span>{paged.page} / {paged.totalPages.toLocaleString()}</span>
              <button disabled={paged.page >= paged.totalPages}
                onClick={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}>›</button>
            </div>
          )}
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="db-detail">
          {showCreate ? (
            <div className="db-detail-content">
              <h2>Create New User</h2>
              <form onSubmit={handleCreate} className="db-form">
                <div className="form-group"><label>Username</label>
                  <input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} required /></div>
                <div className="form-group"><label>Email</label>
                  <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required /></div>
                <div className="form-group"><label>Password</label>
                  <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required /></div>
                <div className="db-form-row">
                  <div className="form-group"><label>First Name</label>
                    <input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} required /></div>
                  <div className="form-group"><label>Last Name</label>
                    <input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} required /></div>
                </div>
                <div className="form-group">
                  <label>Roles</label>
                  <div className="checkbox-group">
                    {roles.map((r) => (
                      <label key={r.name} className="checkbox-label">
                        <input type="checkbox" checked={createForm.roles?.includes(r.name) ?? false}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...(createForm.roles ?? []), r.name]
                              : (createForm.roles ?? []).filter((x) => x !== r.name);
                            setCreateForm({ ...createForm, roles: next });
                          }} />
                        <span>{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Create User</button>
              </form>
            </div>
          ) : selectedUser ? (
            <div className="db-detail-content">
              {/* Profile header */}
              <div className="db-profile-header">
                <div className="db-big-avatar" style={{ background: getColor(selectedUser.username) }}>
                  {initials(selectedUser.firstName, selectedUser.lastName)}
                </div>
                <div>
                  <h2 className="db-profile-name">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <div className="db-profile-username">@{selectedUser.username}</div>
                </div>
                <span className={`status ${selectedUser.isActive ? 'status-active' : 'status-inactive'}`} style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Action bar */}
              <div className="db-action-bar">
                {!editing && <button className="btn btn-sm btn-primary" onClick={startEdit}>Edit</button>}
                <button className="btn btn-sm btn-outline" onClick={handleToggleActive}>
                  {selectedUser.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
              </div>

              {/* Detail fields */}
              {editing && editForm ? (
                <form onSubmit={handleSave} className="db-form">
                  <div className="db-form-row">
                    <div className="form-group"><label>First Name</label>
                      <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
                    <div className="form-group"><label>Last Name</label>
                      <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Email</label>
                    <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                  <div className="form-group">
                    <label>Roles</label>
                    <div className="checkbox-group">
                      {roles.map((r) => (
                        <label key={r.name} className="checkbox-label">
                          <input type="checkbox" checked={editForm.roles.includes(r.name)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...editForm.roles, r.name]
                                : editForm.roles.filter((x) => x !== r.name);
                              setEditForm({ ...editForm, roles: next });
                            }} />
                          <span>{r.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="btn-group">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="db-detail-fields">
                  <div className="db-field">
                    <div className="db-field-label">Email</div>
                    <div className="db-field-value">{selectedUser.email}</div>
                  </div>
                  <div className="db-field">
                    <div className="db-field-label">Username</div>
                    <div className="db-field-value">@{selectedUser.username}</div>
                  </div>
                  <div className="db-field">
                    <div className="db-field-label">Created</div>
                    <div className="db-field-value">{formatDate(selectedUser.createdAt)}</div>
                  </div>
                  <div className="db-field">
                    <div className="db-field-label">Roles</div>
                    <div className="db-field-value">
                      <div className="role-badges">
                        {selectedUser.roles.map((r) => (
                          <span key={r} className="badge badge-active">{r}</span>
                        ))}
                        {selectedUser.roles.length === 0 && <span className="text-muted">No roles assigned</span>}
                      </div>
                    </div>
                  </div>
                  <div className="db-field">
                    <div className="db-field-label">User ID</div>
                    <div className="db-field-value db-mono">{selectedUser.id}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="db-detail-empty">
              <div className="db-detail-empty-icon">👤</div>
              <p>Select a user from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
