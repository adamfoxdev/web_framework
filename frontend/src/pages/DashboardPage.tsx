import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

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
