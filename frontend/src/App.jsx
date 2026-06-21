import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Entry pages are imported synchronously to guarantee immediate render on startup
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Lazy load interior authenticated pages to optimize initial bundle size and LCP times
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Goals = lazy(() => import('./pages/Goals'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Education = lazy(() => import('./pages/Education'));
const Admin = lazy(() => import('./pages/Admin'));
const OffsetMarketplace = lazy(() => import('./pages/OffsetMarketplace'));
const NewsHub = lazy(() => import('./pages/NewsHub'));

// Loading spinner fallback for lazy-loaded components
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-dark-950">
    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Protected Layout: Mounts Sidebar and provides scrollable content block
const MainLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-dark-50 dark:bg-dark-950 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

// Route Guard: Ensures user is authenticated
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Route Guard: Ensures user is Admin
const AdminRoute = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Landing Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/education" element={<Education />} />
            <Route path="/offsets" element={<OffsetMarketplace />} />
            <Route path="/news" element={<NewsHub />} />
            
            {/* Admin Restricted Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
