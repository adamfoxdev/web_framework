import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, hasRole, logout } = useAuth();
  const navigate = useNavigate();

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
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        {hasRole('Admin') && <Link to="/users">Users</Link>}
        {hasRole('Admin') && <Link to="/roles">Roles</Link>}
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
