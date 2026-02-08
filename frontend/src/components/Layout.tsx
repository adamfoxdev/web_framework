import type { ReactNode } from 'react';
import TopNav from './TopNav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="app-content">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}
