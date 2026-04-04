import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/TaskFlowDashboardPage";
import "./index.css";

const AppLoader = ({ label }) => (
  <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
    <div className="rounded-[32px] border border-[var(--line)] bg-white/90 px-10 py-12 text-center shadow-[0_30px_90px_rgba(44,53,70,0.12)]">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--accent)]" />
      <p className="mt-4 text-sm font-medium text-[var(--muted)]">{label}</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoader label="Loading your workspace..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route path="/" element={<Navigate to="/app" replace />} />
    <Route path="*" element={<Navigate to="/app" replace />} />
  </Routes>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] shadow-lg",
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
