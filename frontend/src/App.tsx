import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { GastosPage } from './pages/Gastos/GastosPage';
import { IngresosPage } from './pages/Ingresos/IngresosPage';
import { FacturasPage } from './pages/Facturas/FacturasPage';
import { DeudasPage } from './pages/Deudas/DeudasPage';
import { MetasPage } from './pages/Metas/MetasPage';
import { AjustesPage } from './pages/Ajustes/AjustesPage';
import { PageLoader } from './components/ui/LoadingSpinner';

function AppRoutes() {
  const { usuario, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/gastos" element={<GastosPage />} />
        <Route path="/ingresos" element={<IngresosPage />} />
        <Route path="/facturas" element={<FacturasPage />} />
        <Route path="/deudas" element={<DeudasPage />} />
        <Route path="/metas" element={<MetasPage />} />
        <Route path="/ajustes" element={<AjustesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
