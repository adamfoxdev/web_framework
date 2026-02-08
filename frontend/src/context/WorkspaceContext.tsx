import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { workspaceService } from '../services/workspaceService';
import type { Workspace } from '../types';
import { useAuth } from './AuthContext';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace | null) => void;
  isLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const list = await workspaceService.getMyWorkspaces();
      setWorkspaces(list);

      // Restore previously selected workspace from localStorage
      const savedId = localStorage.getItem('activeWorkspaceId');
      if (savedId) {
        const found = list.find(w => w.id === savedId);
        if (found) {
          setActiveWorkspaceState(found);
          setIsLoading(false);
          return;
        }
      }

      // Default to the workspace marked as default, or first one
      const defaultWs = list.find(w => w.isDefault) || list[0] || null;
      setActiveWorkspaceState(defaultWs);
      if (defaultWs) localStorage.setItem('activeWorkspaceId', defaultWs.id);
    } catch {
      /* ignore */
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const setActiveWorkspace = (ws: Workspace | null) => {
    setActiveWorkspaceState(ws);
    if (ws) {
      localStorage.setItem('activeWorkspaceId', ws.id);
    } else {
      localStorage.removeItem('activeWorkspaceId');
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        isLoading,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
