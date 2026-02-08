import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, hasRole, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [wsOpen, setWsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">BigData App</Link>
      </div>

      {/* Workspace Switcher */}
      <div className="ws-switcher" ref={dropdownRef}>
        <button className="ws-switcher-btn" onClick={() => setWsOpen(!wsOpen)}>
          <span className="ws-icon">{activeWorkspace?.icon || '📁'}</span>
          <span className="ws-name">{activeWorkspace?.name || 'Select Workspace'}</span>
          <span className="ws-arrow">{wsOpen ? '▴' : '▾'}</span>
        </button>
        {wsOpen && (
          <div className="ws-dropdown">
            <div className="ws-dropdown-header">Switch Workspace</div>
            {workspaces.map(ws => (
              <button
                key={ws.id}
                className={`ws-dropdown-item ${activeWorkspace?.id === ws.id ? 'active' : ''}`}
                onClick={() => { setActiveWorkspace(ws); setWsOpen(false); }}
              >
                <span className="ws-item-icon">{ws.icon}</span>
                <div className="ws-item-info">
                  <span className="ws-item-name">{ws.name}</span>
                  <span className="ws-item-dept">{ws.department}</span>
                </div>
                <span className="ws-item-color" style={{ background: ws.color }} />
                {activeWorkspace?.id === ws.id && <span className="ws-item-check">✓</span>}
              </button>
            ))}
            <div className="ws-dropdown-footer">
              <button
                className="ws-dropdown-item ws-all-item"
                onClick={() => { setActiveWorkspace(null); setWsOpen(false); }}
              >
                <span className="ws-item-icon">🌐</span>
                <div className="ws-item-info">
                  <span className="ws-item-name">All Workspaces</span>
                  <span className="ws-item-dept">View everything</span>
                </div>
                {!activeWorkspace && <span className="ws-item-check">✓</span>}
              </button>
              <Link to="/workspaces" className="ws-manage-link" onClick={() => setWsOpen(false)}>
                Manage Workspaces
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/search">🔍 Search</Link>
        {hasRole('Admin') && <Link to="/users">Users</Link>}
        {hasRole('Admin') && <Link to="/roles">Roles</Link>}
        <Link to="/queries">Queries</Link>
        <Link to="/projects">Data Projects</Link>
        <Link to="/processing">⚙ Processing</Link>
        <Link to="/workspaces">Workspaces</Link>
      </div>
      <div className="navbar-user">
        <span>
          {user?.firstName} {user?.lastName}
        </span>
        <span className="role-badges">
          {user?.roles.map((r) => (
            <span key={r} className="badge">
              {r}
            </span>
          ))}
        </span>
        <button onClick={handleLogout} className="btn btn-outline">
          Logout
        </button>
      </div>
    </nav>
  );
}
