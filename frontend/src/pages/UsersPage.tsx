import { useEffect, useState, type FormEvent } from 'react';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import type { User, Role, CreateUserRequest } from '../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  // Create form state
  const [form, setForm] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roles: ['User'],
  });

  const loadData = async () => {
    try {
      const [u, r] = await Promise.all([userService.getAll(), roleService.getAll()]);
      setUsers(u);
      setRoles(r);
    } catch {
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await userService.create(form);
      setShowCreateForm(false);
      setForm({ username: '', email: '', password: '', firstName: '', lastName: '', roles: ['User'] });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await userService.update(user.id, { isActive: !user.isActive });
      await loadData();
    } catch {
      setError('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.delete(id);
      await loadData();
    } catch {
      setError('Delete failed');
    }
  };

  const handleRoleToggle = async (userId: string, roleName: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        await userService.removeRole(userId, roleName);
      } else {
        await userService.assignRole(userId, roleName);
      }
      await loadData();
    } catch {
      setError('Role update failed');
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
      await loadData();
    } catch {
      setError('Update failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
              <div className="checkbox-group">
                {roles.map((r) => (
                  <label key={r.name} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.roles?.includes(r.name) ?? false}
                      onChange={(e) => {
                        const selected = form.roles ?? [];
                        setForm({
                          ...form,
                          roles: e.target.checked
                            ? [...selected, r.name]
                            : selected.filter((x) => x !== r.name),
                        });
                      }}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
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
                <div className="checkbox-group">
                  {roles.map((r) => (
                    <label key={r.name} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editingUser.roles.includes(r.name)}
                        onChange={(e) => {
                          setEditingUser({
                            ...editingUser,
                            roles: e.target.checked
                              ? [...editingUser.roles, r.name]
                              : editingUser.roles.filter((x) => x !== r.name),
                          });
                        }}
                      />
                      {r.name}
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

      {/* Users Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>
                  <div className="role-badges">
                    {roles.map((r) => {
                      const hasIt = u.roles.includes(r.name);
                      return (
                        <span
                          key={r.name}
                          className={`badge badge-toggle ${hasIt ? 'badge-active' : 'badge-inactive'}`}
                          onClick={() => handleRoleToggle(u.id, r.name, hasIt)}
                          title={`Click to ${hasIt ? 'remove' : 'assign'} ${r.name}`}
                        >
                          {r.name}
                        </span>
                      );
                    })}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
