import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, TrendingUp, Calendar,
  Users, Target, PiggyBank, Settings, LogOut, Wallet
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gastos',    icon: CreditCard,      label: 'Gastos' },
  { to: '/ingresos',  icon: TrendingUp,      label: 'Ingresos' },
  { to: '/facturas',  icon: Calendar,        label: 'Facturas' },
  { to: '/deudas',    icon: Users,           label: 'Deudas' },
  { to: '/metas',     icon: Target,          label: 'Metas' },
  { to: '/ahorro',    icon: PiggyBank,       label: 'Ahorro' },
  { to: '/ajustes',   icon: Settings,        label: 'Ajustes' },
];

export function Sidebar() {
  const { usuario, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">Economía</p>
          <p className="text-xs text-slate-400">del Hogar</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario */}
      {usuario && (
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar nombre={usuario.nombre} color={usuario.avatarColor} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{usuario.nombre}</p>
              <p className="text-xs text-slate-400 truncate">{usuario.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
