import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar }  from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages publiques
import { AccueilPage }   from './pages/public/AccueilPage';
import { RecherchePage } from './pages/public/RecherchePage';
import { CartePage }     from './pages/public/CartePage';
import { GardesPage }    from './pages/public/GardesPage';

// Pages dashboard
import { LoginPage }      from './pages/dashboard/LoginPage';
import { DashboardPage }  from './pages/dashboard/DashboardPage';
import { StocksPage }     from './pages/dashboard/StocksPage';
import { GardesDashboardPage, StatsPage } from './pages/dashboard/GardesStatsPage';

// Layout public
const PublicLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

// Layout dashboard avec sidebar
const DashboardLayout = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="flex-1 bg-gray-50 overflow-auto">
      <Outlet />
    </main>
  </div>
);

// Route protégée — redirige vers /login si non connecté
const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-sm text-gray-400">Chargement…</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Route publique — redirige vers /dashboard si déjà connecté
const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

const AppRoutes = () => (
  <Routes>
    {/* ---- Routes publiques ---- */}
    <Route element={<PublicLayout />}>
      <Route path="/"         element={<AccueilPage />} />
      <Route path="/recherche" element={<RecherchePage />} />
      <Route path="/carte"    element={<CartePage />} />
      <Route path="/gardes"   element={<GardesPage />} />
    </Route>

    {/* ---- Login (redirige si déjà connecté) ---- */}
    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>

    {/* ---- Dashboard privé ---- */}
    <Route element={<PrivateRoute />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard"         element={<DashboardPage />} />
        <Route path="/dashboard/stocks"  element={<StocksPage />} />
        <Route path="/dashboard/gardes"  element={<GardesDashboardPage />} />
        <Route path="/dashboard/stats"   element={<StatsPage />} />
      </Route>
    </Route>

    {/* ---- 404 ---- */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
