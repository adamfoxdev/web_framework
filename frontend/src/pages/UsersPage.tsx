import { useEffect, useState, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import type { User, Role, CreateUserRequest, UserQuery, PagedResponse } from '../types';

const PAGE_SIZES = [25, 50, 100, 200];
const DEBOUNCE_MS = 350;

export default function UsersPage() {
  // Data
  const [paged, setPaged] = useState<PagedResponse<User> | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Query state
  const [query, setQuery] = useState<UserQuery>({
    search: '',
    role: '',
    isActive: null,
    sortBy: 'username',
    sortDesc: false,
    page: 1,
    pageSize: 50,
  });

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAllPages, setSelectAllPages] = useState(false);

  // UI toggles
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkRoleModal, setShowBulkRoleModal] = useState<'assign' | 'remove' | null>(null);
  const [bulkRoles, setBulkRoles] = useState<Set<string>>(new Set());
  const [roleSearch, setRoleSearch] = useState('');

  // Create form
  const [form, setForm] = useState<CreateUserRequest>({
    username: '', email: '', password: '', firstName: '', lastName: '', roles: ['User'],
  });

  // Debounce ref
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ---- Data Loading ----

  const loadUsers = useCallback(async (q: UserQuery) => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getAll(q);
      setPaged(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await roleService.getAll());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadUsers(query);
  }, [query, loadUsers]);

  // ---- Helpers ----

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const updateQuery = (patch: Partial<UserQuery>) =>
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateQuery({ search: value }), DEBOUNCE_MS);
  };

  const handleSort = (col: string) => {
    setQuery((prev) => ({
      ...prev,
      sortBy: col,
      sortDesc: prev.sortBy === col ? !prev.sortDesc : false,
    }));
  };

  const sortIcon = (col: string) =>
    query.sortBy === col ? (query.sortDesc ? ' \u25BC' : ' \u25B2') : '';

  // ---- Selection ----

  const pageIds = paged?.items.map((u) => u.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 || selectAllPages;
  const selectionCount = selectAllPages ? (paged?.totalCount ?? 0) : selected.size;

  const toggleOne = (id: string) => {
    setSelectAllPages(false);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelectAllPages(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setSelectAllPages(false);
  };

  // ---- CRUD ----

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await userService.create(form);
      setShowCreateForm(false);
      setForm({ username: '', email: '', password: '', firstName: '', lastName: '', roles: ['User'] });
      flash('User created');
      loadUsers(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await userService.update(editingUser.id, {
        email: editingUser.email,
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        roles: editingUser.roles,
      });
      setEditingUser(null);
      flash('User updated');
      loadUsers(query);
    } catch {
      setError('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await userService.delete(id);
      flash('User deleted');
      loadUsers(query);
    } catch {
      setError('Delete failed');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await userService.update(user.id, { isActive: !user.isActive });
      loadUsers(query);
    } catch {
      setError('Update failed');
    }
  };

  // ---- Bulk Operations ----

  const getSelectedIds = (): string[] => Array.from(selected);

  const handleBulkRoleSubmit = async () => {
    const ids = getSelectedIds();
    const roleList = Array.from(bulkRoles);
    if (ids.length === 0 || roleList.length === 0) return;
    try {
      const result = showBulkRoleModal === 'assign'
        ? await userService.bulkAssignRoles(ids, roleList)
        : await userService.bulkRemoveRoles(ids, roleList);
      flash(`${showBulkRoleModal === 'assign' ? 'Assigned' : 'Removed'} roles for ${result.affected} users`);
      setShowBulkRoleModal(null);
      setBulkRoles(new Set());
      setRoleSearch('');
      clearSelection();
      loadUsers(query);
    } catch {
      setError('Bulk role operation failed');
    }
  };

  const handleBulkEnable = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    try {
      const result = await userService.bulkSetStatus(ids, true);
      flash(`Enabled ${result.affected} users`);
      clearSelection();
      loadUsers(query);
    } catch {
      setError('Bulk enable failed');
    }
  };

  const handleBulkDisable = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    try {
      const result = await userService.bulkSetStatus(ids, false);
      flash(`Disabled ${result.affected} users`);
      clearSelection();
      loadUsers(query);
    } catch {
      setError('Bulk disable failed');
    }
  };

  const handleBulkDelete = async () => {
    const ids = getSelectedIds();
    if (!confirm(`Delete ${ids.length} users? This cannot be undone.`)) return;
    try {
      const result = await userService.bulkDelete(ids);
      flash(`Deleted ${result.affected} users`);
      clearSelection();
      loadUsers(query);
    } catch {
      setError('Bulk delete failed');
    }
  };

  // ---- Filtered roles for pickers ----
  const filteredRoles = roleSearch
    ? roles.filter((r) => r.name.toLowerCase().includes(roleSearch.toLowerCase()))
    : roles;

  // ---- Render ----

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>User Management {paged && <span className="total-count">({paged.totalCount.toLocaleString()} users)</span>}</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters Bar */}
      <div className="card filters-bar">
        <div className="filters-row">
          <div className="filter-group filter-search">
            <input
              type="text"
              placeholder="Search users..."
              defaultValue={query.search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="filter-group">
            <select value={query.role ?? ''} onChange={(e) => updateQuery({ role: e.target.value || undefined })}>
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              value={query.isActive === null ? '' : String(query.isActive)}
              onChange={(e) =>
                updateQuery({ isActive: e.target.value === '' ? null : e.target.value === 'true' })
              }
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="filter-group">
            <select value={query.pageSize} onChange={(e) => updateQuery({ pageSize: Number(e.target.value) })}>
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="bulk-bar">
          <span className="bulk-count">{selectionCount.toLocaleString()} selected</span>
          <button className="btn btn-sm" onClick={() => { setShowBulkRoleModal('assign'); setBulkRoles(new Set()); setRoleSearch(''); }}>
            Assign Roles
          </button>
          <button className="btn btn-sm" onClick={() => { setShowBulkRoleModal('remove'); setBulkRoles(new Set()); setRoleSearch(''); }}>
            Remove Roles
          </button>
          <button className="btn btn-sm" onClick={handleBulkEnable}>Enable</button>
          <button className="btn btn-sm" onClick={handleBulkDisable}>Disable</button>
          <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>Delete</button>
          <button className="btn btn-sm btn-outline" onClick={clearSelection}>Clear</button>
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Create New User</h3>
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-group">
              <label>Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Roles</label>
              <RolePicker roles={roles} selected={new Set(form.roles)} onChange={(s) => setForm({ ...form, roles: Array.from(s) })} />
            </div>
            <button type="submit" className="btn btn-primary">Create User</button>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit User: {editingUser.username}</h3>
            <form onSubmit={handleEditSave}>
              <div className="form-group">
                <label>Email</label>
                <input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input value={editingUser.firstName} onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input value={editingUser.lastName} onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Roles</label>
                <RolePicker
                  roles={roles}
                  selected={new Set(editingUser.roles)}
                  onChange={(s) => setEditingUser({ ...editingUser, roles: Array.from(s) })}
                />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Role Modal */}
      {showBulkRoleModal && (
        <div className="modal-overlay" onClick={() => setShowBulkRoleModal(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{showBulkRoleModal === 'assign' ? 'Assign' : 'Remove'} Roles ({selectionCount} users)</h3>
            <div className="form-group">
              <input
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>
            <div className="role-picker-list">
              {filteredRoles.map((r) => (
                <label key={r.name} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={bulkRoles.has(r.name)}
                    onChange={(e) => {
                      const next = new Set(bulkRoles);
                      e.target.checked ? next.add(r.name) : next.delete(r.name);
                      setBulkRoles(next);
                    }}
                  />
                  <span>{r.name}</span>
                  <span className="role-desc">{r.description}</span>
                </label>
              ))}
            </div>
            <div className="btn-group" style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handleBulkRoleSubmit} disabled={bulkRoles.size === 0}>
                {showBulkRoleModal === 'assign' ? 'Assign' : 'Remove'} {bulkRoles.size} Role{bulkRoles.size !== 1 ? 's' : ''}
              </button>
              <button className="btn btn-outline" onClick={() => setShowBulkRoleModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card table-card">
        {loading && <div className="table-loading">Loading...</div>}
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th className="th-checkbox">
                  <input type="checkbox" checked={allPageSelected} onChange={togglePage} />
                </th>
                <th className="sortable" onClick={() => handleSort('username')}>Username{sortIcon('username')}</th>
                <th className="sortable" onClick={() => handleSort('firstname')}>First Name{sortIcon('firstname')}</th>
                <th className="sortable" onClick={() => handleSort('lastname')}>Last Name{sortIcon('lastname')}</th>
                <th className="sortable" onClick={() => handleSort('email')}>Email{sortIcon('email')}</th>
                <th>Roles</th>
                <th className="sortable" onClick={() => handleSort('isactive')}>Status{sortIcon('isactive')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged?.items.map((u) => (
                <tr key={u.id} className={selected.has(u.id) ? 'row-selected' : ''}>
                  <td className="td-checkbox">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} />
                  </td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.firstName}</td>
                  <td>{u.lastName}</td>
                  <td>{u.email}</td>
                  <td>
                    <div className="role-badges">
                      {u.roles.slice(0, 3).map((r) => (
                        <span key={r} className="badge badge-active">{r}</span>
                      ))}
                      {u.roles.length > 3 && (
                        <span className="badge badge-inactive" title={u.roles.slice(3).join(', ')}>
                          +{u.roles.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status ${u.isActive ? 'status-active' : 'status-inactive'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm" onClick={() => setEditingUser(u)}>Edit</button>
                      <button className="btn btn-sm btn-outline" onClick={() => handleToggleActive(u)}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged && paged.items.length === 0 && (
                <tr><td colSpan={8} className="empty-row">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paged && paged.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-sm"
              disabled={paged.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: 1 }))}
            >
              &laquo;
            </button>
            <button
              className="btn btn-sm"
              disabled={paged.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}
            >
              &lsaquo; Prev
            </button>
            <span className="pagination-info">
              Page {paged.page} of {paged.totalPages.toLocaleString()}
            </span>
            <button
              className="btn btn-sm"
              disabled={paged.page >= paged.totalPages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}
            >
              Next &rsaquo;
            </button>
            <button
              className="btn btn-sm"
              disabled={paged.page >= paged.totalPages}
              onClick={() => setQuery((q) => ({ ...q, page: paged.totalPages }))}
            >
              &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Searchable Role Picker (handles many roles) ----

function RolePicker({
  roles,
  selected,
  onChange,
}: {
  roles: Role[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : roles;

  const toggle = (name: string) => {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    onChange(next);
  };

  return (
    <div className="role-picker">
      {roles.length > 6 && (
        <input
          className="role-picker-search"
          placeholder="Filter roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}
      <div className="role-picker-list">
        {filtered.map((r) => (
          <label key={r.name} className="checkbox-label">
            <input type="checkbox" checked={selected.has(r.name)} onChange={() => toggle(r.name)} />
            <span>{r.name}</span>
          </label>
        ))}
        {filtered.length === 0 && <span className="text-muted">No roles match</span>}
      </div>
      {selected.size > 0 && (
        <div className="role-picker-selected">
          {Array.from(selected).map((r) => (
            <span key={r} className="badge badge-active badge-removable" onClick={() => toggle(r)}>
              {r} &times;
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
