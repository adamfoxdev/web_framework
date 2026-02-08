/**
 * Design A — Card / Grid Layout
 * Users rendered as individual cards in a responsive grid.
 * Each card shows initials avatar, role badges, status, and hover actions.
 */
import { useEffect, useState, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import type { User, Role, CreateUserRequest, UserQuery, PagedResponse } from '../types';

const PAGE_SIZES = [24, 48, 96];
const DEBOUNCE_MS = 350;

const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
  '#0891b2', '#4f46e5', '#c026d3', '#059669', '#d97706',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first: string, last: string) {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?';
}

export default function UsersPageDesignA() {
  const [paged, setPaged] = useState<PagedResponse<User> | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [query, setQuery] = useState<UserQuery>({
    search: '', role: '', isActive: null, sortBy: 'username', sortDesc: false, page: 1, pageSize: 24,
  });

  const [form, setForm] = useState<CreateUserRequest>({
    username: '', email: '', password: '', firstName: '', lastName: '', roles: ['User'],
  });

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadUsers = useCallback(async (q: UserQuery) => {
    setLoading(true);
    try {
      setPaged(await userService.getAll(q));
    } catch { setError('Failed to load users'); }
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
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

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} users?`)) return;
    try {
      const r = await userService.bulkDelete(Array.from(selected));
      flash(`Deleted ${r.affected} users`); setSelected(new Set()); loadUsers(query);
    } catch { setError('Bulk delete failed'); }
  };

  return (
    <div className="da">
      {/* Header */}
      <div className="da-header">
        <div>
          <h1 className="da-title">Users</h1>
          {paged && <span className="da-subtitle">{paged.totalCount.toLocaleString()} total users</span>}
        </div>
        <div className="btn-group">
          {selected.size > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              Delete {selected.size} selected
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : '+ New User'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Toolbar */}
      <div className="da-toolbar">
        <input
          type="text"
          className="da-search"
          placeholder="Search users..."
          defaultValue={query.search}
          onChange={handleSearchChange}
        />
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
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} per page</option>)}
        </select>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card da-create-form">
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
            <div><button type="submit" className="btn btn-primary">Create User</button></div>
          </form>
        </div>
      )}

      {/* Cards Grid */}
      <div className="da-grid">
        {loading && <div className="da-loading-overlay">Loading...</div>}
        {paged?.items.map((u) => (
          <div
            key={u.id}
            className={`da-card${selected.has(u.id) ? ' da-card-selected' : ''}${!u.isActive ? ' da-card-inactive' : ''}`}
          >
            {/* Selection checkbox */}
            <input
              type="checkbox"
              className="da-card-check"
              checked={selected.has(u.id)}
              onChange={() => toggleSelect(u.id)}
            />

            {/* Avatar */}
            <div className="da-avatar" style={{ background: getAvatarColor(u.username) }}>
              {getInitials(u.firstName, u.lastName)}
            </div>

            {/* Info */}
            <div className="da-card-name">{u.firstName} {u.lastName}</div>
            <div className="da-card-username">@{u.username}</div>
            <div className="da-card-email">{u.email}</div>

            {/* Status */}
            <span className={`status ${u.isActive ? 'status-active' : 'status-inactive'}`}>
              {u.isActive ? 'Active' : 'Inactive'}
            </span>

            {/* Roles */}
            <div className="da-card-roles">
              {u.roles.slice(0, 3).map((r) => (
                <span key={r} className="badge badge-active">{r}</span>
              ))}
              {u.roles.length > 3 && (
                <span className="badge badge-inactive" title={u.roles.slice(3).join(', ')}>+{u.roles.length - 3}</span>
              )}
            </div>

            {/* Hover Actions */}
            <div className="da-card-actions">
              <button className="btn btn-sm" onClick={() => setEditingUser(u)}>Edit</button>
              <button className="btn btn-sm btn-outline" onClick={() => handleToggleActive(u)}>
                {u.isActive ? 'Disable' : 'Enable'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {paged && paged.items.length === 0 && !loading && (
        <div className="da-empty">No users found matching your criteria.</div>
      )}

      {/* Pagination */}
      {paged && paged.totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-sm" disabled={paged.page <= 1}
            onClick={() => setQuery((q) => ({ ...q, page: 1 }))}>&laquo;</button>
          <button className="btn btn-sm" disabled={paged.page <= 1}
            onClick={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}>&lsaquo; Prev</button>
          <span className="pagination-info">Page {paged.page} of {paged.totalPages.toLocaleString()}</span>
          <button className="btn btn-sm" disabled={paged.page >= paged.totalPages}
            onClick={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}>Next &rsaquo;</button>
          <button className="btn btn-sm" disabled={paged.page >= paged.totalPages}
            onClick={() => setQuery((q) => ({ ...q, page: paged.totalPages }))}>&raquo;</button>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit User: {editingUser.username}</h3>
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
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
