import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeWorkspace, workspaces } = useWorkspace();

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Welcome, {user?.firstName} {user?.lastName}</h2>
        <p>You are logged in as <strong>{user?.username}</strong></p>
        <div style={{ marginTop: '1rem' }}>
          <strong>Your roles:</strong>
          <div className="role-badges" style={{ marginTop: '0.5rem' }}>
            {user?.roles.map((r) => (
              <span key={r} className="badge badge-lg">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Active Workspace Banner */}
      {activeWorkspace && (
        <div className="ws-banner" style={{ borderLeftColor: activeWorkspace.color }}>
          <span className="ws-banner-icon">{activeWorkspace.icon}</span>
          <div className="ws-banner-info">
            <h3>{activeWorkspace.name}</h3>
            <p>{activeWorkspace.description}</p>
          </div>
          <div className="ws-banner-stats">
            <div className="ws-banner-stat">
              <span className="ws-banner-num">{activeWorkspace.projectCount}</span>
              <span>Projects</span>
            </div>
            <div className="ws-banner-stat">
              <span className="ws-banner-num">{activeWorkspace.queryCount}</span>
              <span>Queries</span>
            </div>
            <div className="ws-banner-stat">
              <span className="ws-banner-num">{activeWorkspace.members.length}</span>
              <span>Members</span>
            </div>
          </div>
        </div>
      )}
      {!activeWorkspace && (
        <div className="ws-banner ws-banner-all">
          <span className="ws-banner-icon">🌐</span>
          <div className="ws-banner-info">
            <h3>All Workspaces</h3>
            <p>Viewing data across all {workspaces.length} workspaces</p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="card stat-card">
          <h3>Data Pipelines</h3>
          <p className="stat-value">12</p>
          <p className="stat-label">Active</p>
        </div>
        <div className="card stat-card">
          <h3>Datasets</h3>
          <p className="stat-value">156</p>
          <p className="stat-label">Available</p>
        </div>
        <div className="card stat-card">
          <h3>Jobs</h3>
          <p className="stat-value">8</p>
          <p className="stat-label">Running</p>
        </div>
        <div className="card stat-card">
          <h3>Alerts</h3>
          <p className="stat-value">3</p>
          <p className="stat-label">Pending</p>
        </div>
      </div>
    </div>
  );
}
