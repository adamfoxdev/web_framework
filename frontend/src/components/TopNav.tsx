import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, Bell, Settings, HelpCircle, Home, Zap,
  Database, FileText, Shield, Activity, Layers, GitBranch,
  ArrowRight, Clock, Users, BarChart3, Briefcase, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

/* ---------- mega-menu definitions ---------- */
const megaMenus: Record<string, {
  sections: { title: string; items: { label: string; to: string }[] }[];
  featured: { title: string; desc: string; icon: React.ElementType; to: string };
}> = {
  Explore: {
    sections: [
      {
        title: 'Data & Analytics',
        items: [
          { label: 'Data Projects', to: '/projects' },
          { label: 'Saved Queries', to: '/queries' },
          { label: 'Advanced Search', to: '/search' },
          { label: 'Reports', to: '/reports' },
        ],
      },
      {
        title: 'Process & Monitor',
        items: [
          { label: 'Record Processing', to: '/processing' },
          { label: 'Data Quality', to: '/projects' },
        ],
      },
    ],
    featured: { 
      title: 'Data Projects', 
      desc: 'Browse datasets, forms & quality rules',
      icon: Database, 
      to: '/projects' 
    },
  },
  Manage: {
    sections: [
      {
        title: 'Administration',
        items: [
          { label: 'Users', to: '/users' },
          { label: 'Roles', to: '/roles' },
          { label: 'Workspaces', to: '/workspaces' },
        ],
      },
      {
        title: 'Organization',
        items: [
          { label: 'Teams & Access', to: '/users' },
          { label: 'Audit & Security', to: '/roles' },
        ],
      },
    ],
    featured: { 
      title: 'Workspace Manager',
      desc: 'Organize teams and data access',
      icon: Layers,
      to: '/workspaces'
    },
  },
};

/* ---------- quick-search recent items ---------- */
const recentSearchItems = [
  { name: 'Data Projects', type: 'Page', to: '/projects' },
  { name: 'Queries', type: 'Page', to: '/queries' },
  { name: 'Reports', type: 'Analytics', to: '/reports' },
  { name: 'Users', type: 'Admin', to: '/users' },
  { name: 'Workspaces', type: 'Admin', to: '/workspaces' },
];

export default function TopNav() {
  const { user, hasRole, logout } = useAuth();
  const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wsOpen, setWsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<HTMLDivElement>(null);

  const handleWorkspaceChange = (workspace: typeof activeWorkspace) => {
    setActiveWorkspace(workspace);
    setWsOpen(false);
  };

  /* close mega menus on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenu(null);
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* keyboard shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??';

  const filtered = recentSearchItems.filter(
    r => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* ----- TOP NAVIGATION BAR ----- */}
      <nav ref={menuRef} className="topnav-enterprise">
        {/* Logo & Brand */}
        <Link to="/" className="topnav-logo-section" onClick={() => setActiveMenu(null)}>
          <div className="topnav-logo-icon">
            <Zap size={16} color="white" />
          </div>
          <span className="topnav-logo-text">BigData App</span>
        </Link>

        {/* Main Navigation Items */}
        <div className="topnav-nav-items">
          <Link
            to="/"
            className={`topnav-nav-item ${location.pathname === '/' && !activeMenu ? 'active' : ''}`}
            onClick={() => setActiveMenu(null)}
          >
            <Home size={14} /> Home
          </Link>

          {Object.entries(megaMenus).map(([key]) => {
            /* hide Manage menu if not admin */
            if (key === 'Manage' && !hasRole('Admin')) return null;
            return (
              <div
                key={key}
                className={`topnav-nav-item topnav-nav-item-dropdown ${activeMenu === key ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === key ? null : key)}
              >
                {key}
                <ChevronDown size={13} style={{ 
                  transition: 'transform 0.2s',
                  transform: activeMenu === key ? 'rotate(180deg)' : 'rotate(0)'
                }} />
              </div>
            );
          })}
        </div>

        {/* Right Side Controls */}
        <div className="topnav-right-section">
          {/* Workspace Switcher */}
          <div className="topnav-ws-switcher" ref={wsRef}>
            <button 
              className="topnav-ws-btn"
              onClick={() => setWsOpen(!wsOpen)}
              title={`Current workspace: ${activeWorkspace?.name || 'All Workspaces'}`}
            >
              <span className="topnav-ws-icon">{activeWorkspace?.icon || '🌐'}</span>
              <span className="topnav-ws-name">{activeWorkspace?.name || 'All Workspaces'}</span>
              <ChevronDown 
                size={13} 
                style={{ 
                  transition: 'transform 0.2s',
                  transform: wsOpen ? 'rotate(180deg)' : 'rotate(0)'
                }} 
              />
            </button>
            
            {wsOpen && (
              <div className="topnav-ws-dropdown">
                <div className="topnav-ws-dropdown-header">Switch Workspace</div>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    className={`topnav-ws-dropdown-item ${activeWorkspace?.id === ws.id ? 'active' : ''}`}
                    onClick={() => handleWorkspaceChange(ws)}
                  >
                    <span className="topnav-ws-dropdown-icon">{ws.icon}</span>
                    <div className="topnav-ws-dropdown-info">
                      <span className="topnav-ws-dropdown-name">{ws.name}</span>
                      <span className="topnav-ws-dropdown-dept">{ws.department}</span>
                    </div>
                    <span className="topnav-ws-dropdown-color" style={{ background: ws.color }} />
                    {activeWorkspace?.id === ws.id && <span className="topnav-ws-dropdown-check">✓</span>}
                  </button>
                ))}
                <div className="topnav-ws-dropdown-footer">
                  <button
                    className={`topnav-ws-dropdown-item topnav-ws-all-item ${!activeWorkspace ? 'active' : ''}`}
                    onClick={() => handleWorkspaceChange(null)}
                  >
                    <span className="topnav-ws-dropdown-icon">🌐</span>
                    <div className="topnav-ws-dropdown-info">
                      <span className="topnav-ws-dropdown-name">All Workspaces</span>
                      <span className="topnav-ws-dropdown-dept">View everything</span>
                    </div>
                    {!activeWorkspace && <span className="topnav-ws-dropdown-check">✓</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="topnav-search-box" onClick={() => setSearchOpen(true)}>
            <Search size={14} />
            <span>Search anything...</span>
            <span className="topnav-kbd">⌘K</span>
          </div>

          <div className="topnav-divider" />

          {/* Help, Notifications, Settings */}
          <HelpCircle size={18} color="#94a3b8" style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
            onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')} />
          
          <div style={{ position: 'relative' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
            <Bell size={18} color="#94a3b8" style={{ cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s' }} />
            <div className="topnav-notif-dot" />
          </div>

          <Settings size={18} color="#94a3b8" style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')} />

          {/* User Avatar */}
          <div className="topnav-avatar" title={`${user?.firstName} ${user?.lastName}`}>
            {initials}
          </div>

          {/* Logout Button */}
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Mega Menu Dropdown */}
        {activeMenu && megaMenus[activeMenu] && (
          <div className="mega-menu-dropdown">
            <div className="mega-menu-container">
              {megaMenus[activeMenu].sections.map((section, si) => (
                <div key={si} className="mega-menu-section">
                  <div className="mega-menu-section-title">{section.title}</div>
                  {section.items.map((item, ii) => (
                    <Link 
                      key={ii} 
                      to={item.to} 
                      className="mega-menu-link"
                      onClick={() => setActiveMenu(null)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="mega-menu-featured">
                {(() => { 
                  const Icon = megaMenus[activeMenu].featured.icon;
                  return (
                    <div className="mega-menu-featured-icon">
                      <Icon size={20} color="#2563eb" />
                    </div>
                  );
                })()}
                <div className="mega-menu-featured-title">{megaMenus[activeMenu].featured.title}</div>
                <div className="mega-menu-featured-desc">{megaMenus[activeMenu].featured.desc}</div>
                <Link 
                  to={megaMenus[activeMenu].featured.to} 
                  className="mega-menu-featured-link"
                  onClick={() => setActiveMenu(null)}
                >
                  Explore <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ----- COMMAND PALETTE / SEARCH ----- */}
      {searchOpen && (
        <div className="cmd-search-modal" onClick={() => setSearchOpen(false)}>
          <div className="cmd-box" onClick={e => e.stopPropagation()}>
            {/* Search Input */}
            <div className="cmd-search-input-row">
              <Search size={18} color="#94a3b8" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search pipelines, tables, reports..."
                className="cmd-search-input"
              />
              <button className="cmd-close-btn" onClick={() => setSearchOpen(false)}>ESC</button>
            </div>

            {/* Results */}
            <div className="cmd-results-list">
              <div className="cmd-results-header">Recent</div>
              {filtered.map((item, i) => (
                <div
                  key={i}
                  className="cmd-result-item"
                  onClick={() => { navigate(item.to); setSearchOpen(false); setSearchQuery(''); }}
                >
                  <Clock size={14} color="#94a3b8" />
                  <span className="cmd-result-name">{item.name}</span>
                  <span className="cmd-result-badge">{item.type}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="cmd-no-results">No results found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
