import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar — solo escritorio */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0 lg:ml-64">
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — solo móvil */}
      <BottomNav />
    </div>
  );
}
