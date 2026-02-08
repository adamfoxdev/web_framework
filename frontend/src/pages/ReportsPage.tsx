import { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import type { Report, CreateReportRequest } from '../types';
import { BarChart3, FileText, Layers, ChevronRight, Plus, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export default function ReportsPage() {
  const { activeWorkspace } = useWorkspace();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState<Partial<CreateReportRequest>>({
    name: '',
    description: '',
    type: 'Table',
    schedule: 'Manual',
    querySql: '',
  });

  useEffect(() => {
    loadReports();
  }, [activeWorkspace]);

  const loadReports = () => {
    setLoading(true);
    setError('');
    reportService.getAll({ workspaceId: activeWorkspace?.id, pageSize: 50 })
      .then(res => setReports(res.items))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setCreateError('Report name is required');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    try {
      await reportService.create({
        name: formData.name,
        description: formData.description || '',
        type: formData.type || 'Table',
        querySql: formData.querySql || '',
        schedule: formData.schedule || 'Manual',
        workspaceId: activeWorkspace?.id,
      });
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', type: 'Table', schedule: 'Manual', querySql: '' });
      loadReports();
    } catch {
      setCreateError('Failed to create report');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <BarChart3 size={28} color="#2563eb" />
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Reports</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateDialog(true)} style={{ marginLeft: 'auto' }}>
          <Plus size={16} style={{ marginRight: 6 }} /> New Report
        </button>
      </div>

      {showCreateDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Create New Report</h2>
              <button onClick={() => setShowCreateDialog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {createError && <div className="alert alert-error">{createError}</div>}

            <form onSubmit={handleCreateReport}>
              <div className="form-group">
                <label htmlFor="name">Report Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Q1 Sales Report"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this report about?"
                  rows={3}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Report Type</label>
                <select
                  id="type"
                  value={formData.type || 'Table'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Table">Table</option>
                  <option value="Chart">Chart</option>
                  <option value="Dashboard">Dashboard</option>
                  <option value="Summary">Summary</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="schedule">Schedule</label>
                <select
                  id="schedule"
                  value={formData.schedule || 'Manual'}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                >
                  <option value="Manual">Manual</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="querySql">Query (Optional)</label>
                <textarea
                  id="querySql"
                  value={formData.querySql || ''}
                  onChange={(e) => setFormData({ ...formData, querySql: e.target.value })}
                  placeholder="SELECT * FROM..."
                  rows={4}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn" onClick={() => setShowCreateDialog(false)} disabled={createLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {reports.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', borderLeft: '5px solid #2563eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</span>
                <span className="badge" style={{ marginLeft: 8 }}>{r.type}</span>
                <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', marginLeft: 8 }}>{r.status}</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{r.description}</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#94a3b8', alignItems: 'center' }}>
                <Layers size={13} /> {r.tags?.join(', ') || '—'}
                <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Created by {r.createdBy} &middot; {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          {reports.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#94a3b8', padding: 40, textAlign: 'center' }}>No reports found.</div>}
        </div>
      )}
    </div>
  );
}
