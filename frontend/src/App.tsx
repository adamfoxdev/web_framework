import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersDesignSwitcher from './pages/UsersDesignSwitcher';
import RolesPage from './pages/RolesPage';
import QueriesPage from './pages/QueriesPage';
import DataProjectsPage from './pages/DataProjectsPage';
import WorkspacesPage from './pages/WorkspacesPage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import RecordProcessingPage from './pages/RecordProcessingPage';
import ReportsPage from './pages/ReportsPage';
import ERDDesignerPage from './pages/ERDDesignerPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Layout>
              <UsersDesignSwitcher />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/roles"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Layout>
              <RolesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/queries"
        element={
          <ProtectedRoute>
            <Layout>
              <QueriesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Layout>
              <DataProjectsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspaces"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkspacesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Layout>
              <AdvancedSearchPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/processing"
        element={
          <ProtectedRoute>
            <Layout>
              <RecordProcessingPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/erd"
        element={
          <ProtectedRoute>
            <Layout>
              <ERDDesignerPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
