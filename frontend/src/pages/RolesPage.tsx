import { useEffect, useState, type FormEvent } from 'react';
import { roleService } from '../services/roleService';
import type { Role } from '../types';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadRoles = async () => {
    try {
      setRoles(await roleService.getAll());
    } catch {
      setError('Failed to load roles');
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await roleService.create(name, description);
      setName('');
      setDescription('');
      setShowForm(false);
      await loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleDelete = async (roleName: string) => {
    if (!confirm(`Delete role "${roleName}"?`)) return;
    try {
      await roleService.delete(roleName);
      await loadRoles();
    } catch {
      setError('Delete failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Role Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Role'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Create New Role</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Role Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DataScientist" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role" required />
            </div>
            <button type="submit" className="btn btn-primary">Create Role</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.name}>
                <td><span className="badge badge-lg">{r.name}</span></td>
                <td>{r.description}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
