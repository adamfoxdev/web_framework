import { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import type { Report, ReportSearchParams, PagedResponse } from '../types';
import { BarChart3, FileText, Layers, Database, Users, ChevronRight, Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export default function ReportsPage() {
  const { activeWorkspace } = useWorkspace();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    reportService.getAll({ workspaceId: activeWorkspace?.id, pageSize: 50 })
      .then(res => setReports(res.items))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <BarChart3 size={28} color="#2563eb" />
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Reports</h1>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}>
          <Plus size={16} style={{ marginRight: 6 }} /> New Report
        </button>
      </div>
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
                <Layers size={13} /> {r.tags.join(', ')}
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
