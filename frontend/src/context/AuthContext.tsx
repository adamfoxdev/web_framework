import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { LoginRequest, User } from '../types';
import { userService } from '../services/userService';

interface AuthState {
  token: string | null;
  user: User | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(!!token);

  useEffect(() => {
    if (token) {
      userService
        .getMe()
        .then((u) => {
          setUser(u);
          setRoles(u.roles);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const login = async (data: LoginRequest) => {
    const res = await authService.login(data);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setRoles(res.roles);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRoles([]);
  };

  const hasRole = (role: string) =>
    roles.some((r) => r.toLowerCase() === role.toLowerCase());

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
