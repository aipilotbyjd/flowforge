import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import WorkflowList from '../pages/Workflows/WorkflowList';
import WorkflowDetail from '../pages/Workflows/WorkflowDetail';
import Profile from '../pages/Profile/Profile';
import Settings from '../pages/Settings/Settings';
import NotFound from '../pages/NotFound/NotFound';
import Nodes from '../pages/Nodes/Nodes';
import ExecutionHistory from '../pages/ExecutionHistory/ExecutionHistory';
import Triggers from '../pages/Triggers/Triggers';
import Templates from '../pages/Templates/Templates';
import Credentials from '../pages/Credentials/Credentials';
import { CircularProgress, Box } from '@mui/material';

// Protected Route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirects to dashboard if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Workflows */}
        <Route path="workflows" element={<WorkflowList />} />
        <Route path="workflows/:id" element={<WorkflowDetail />} />
        
        {/* Nodes */}
        <Route path="nodes" element={<Nodes />} />
        
        {/* Templates */}
        <Route path="templates" element={<Templates />} />
        
        {/* Triggers */}
        <Route path="triggers" element={<Triggers />} />
        
        {/* Execution History */}
        <Route path="executions" element={<ExecutionHistory />} />
        
        {/* Credentials */}
        <Route path="credentials" element={<Credentials />} />
        
        {/* User */}
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
