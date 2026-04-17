import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, TrendingUp, Target, Settings } from 'lucide-react';

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Inicio' },
  { to: '/gastos',   icon: CreditCard,      label: 'Gastos' },
  { to: '/ingresos', icon: TrendingUp,      label: 'Ingresos' },
  { to: '/metas',    icon: Target,          label: 'Metas' },
  { to: '/ajustes',  icon: Settings,        label: 'Ajustes' },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-100 z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
