import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TopNav from './components/TopNav';
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
import DataValidationPage from './pages/DataValidationPage';
import DataPipelinesPage from './pages/DataPipelinesPage';
import JobsPage from './pages/JobsPage';
import AlertsPage from './pages/AlertsPage';
import AssetsPage from './pages/AssetsPage';
import CalendarPage from './pages/CalendarPage';
import QueryLabPage from './pages/QueryLabPage';
import LineagePage from './pages/LineagePage';
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

      <Route
        path="/data-validation"
        element={
          <ProtectedRoute>
            <Layout>
              <DataValidationPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/data-pipelines"
        element={
          <ProtectedRoute>
            <Layout>
              <DataPipelinesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <Layout>
              <JobsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Layout>
              <AlertsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <Layout>
              <AssetsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <CalendarPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/querylab"
        element={
          <ProtectedRoute>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
              <TopNav />
              <QueryLabPage />
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/lineage"
        element={
          <ProtectedRoute>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
              <TopNav />
              <LineagePage />
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
