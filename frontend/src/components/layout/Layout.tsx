import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Modal } from '../ui/Modal';
import { GastoForm } from '../../pages/Gastos/GastoForm';
import { apiClient } from '../../services/api';
import { PWAInstallBanner } from '../ui/PWAInstallBanner';

interface UsuarioInfo { id: string; nombre: string; avatarColor: string; }

export function Layout() {
  const [showFab, setShowFab] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioInfo[]>([]);

  const abrirFab = async () => {
    if (usuarios.length === 0) {
      const data = await apiClient.get<UsuarioInfo[]>('/auth/usuarios');
      setUsuarios(data);
    }
    setShowFab(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-20 lg:pb-0 lg:ml-64">
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
          <PWAInstallBanner />
          <Outlet />
        </div>
      </main>

      <BottomNav />

      {/* FAB — solo móvil */}
      <button
        onClick={abrirFab}
        className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center transition-all active:scale-95"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Añadir gasto rápido"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Modal open={showFab} onClose={() => setShowFab(false)} title="Gasto rápido">
        <GastoForm
          gasto={null}
          usuarios={usuarios}
          onSuccess={() => setShowFab(false)}
          onCancel={() => setShowFab(false)}
        />
      </Modal>
    </div>
  );
}
