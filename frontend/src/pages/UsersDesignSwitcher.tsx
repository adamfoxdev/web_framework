/**
 * UsersDesignSwitcher
 * Wrapper that renders a tab bar to switch between
 * the original and three alternative user management designs.
 */
import { useState } from 'react';
import UsersPage from './UsersPage';
import UsersPageDesignA from './UsersPageDesignA';
import UsersPageDesignB from './UsersPageDesignB';
import UsersPageDesignC from './UsersPageDesignC';

const DESIGNS = [
  { key: 'current', label: 'Current — Table', desc: 'Full-featured table with bulk actions bar' },
  { key: 'a',       label: 'Design A — Cards', desc: 'Responsive card grid with avatars' },
  { key: 'b',       label: 'Design B — Split Panel', desc: 'Master-detail sidebar layout' },
  { key: 'c',       label: 'Design C — Dashboard', desc: 'Stats dashboard + enhanced table' },
] as const;

type DesignKey = typeof DESIGNS[number]['key'];

export default function UsersDesignSwitcher() {
  const [active, setActive] = useState<DesignKey>('current');

  return (
    <div>
      {/* Design Picker */}
      <div className="ds-bar">
        <span className="ds-label">Design Preview:</span>
        {DESIGNS.map((d) => (
          <button
            key={d.key}
            className={`ds-tab${active === d.key ? ' ds-tab-active' : ''}`}
            onClick={() => setActive(d.key)}
            title={d.desc}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Active Design */}
      {active === 'current' && <UsersPage />}
      {active === 'a' && <UsersPageDesignA />}
      {active === 'b' && <UsersPageDesignB />}
      {active === 'c' && <UsersPageDesignC />}
    </div>
  );
}
