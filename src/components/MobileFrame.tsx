import React from 'react';
import { Plus, Settings, Crown, User as UserIcon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AuraLogo } from './AuraLogo';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: 'gastos' | 'calendar' | 'analytics' | 'sync' | 'widgets';
  onTabChange: (tab: 'gastos' | 'calendar' | 'analytics' | 'sync' | 'widgets') => void;
  onOpenScanner: () => void;
  onOpenNewExpense: () => void;
  onOpenSettings: () => void;
  onOpenPremium?: () => void;
  pendientesSync: number;
  esAdmin?: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenNewExpense,
  onOpenSettings,
  onOpenPremium,
  pendientesSync,
  esAdmin = false,
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] ${
        isDark ? 'bg-[#090d16] text-neutral-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Barra superior de la aplicación con Safe Area para barra de estado Android (reloj, batería, notch) */}
      <header
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1.75rem)' }}
        className={`sticky top-0 z-30 w-full px-4 pb-3 flex items-center justify-between border-b backdrop-blur-xl transition-colors ${
          isDark
            ? 'bg-[#090d16]/95 border-white/10'
            : 'bg-white/95 border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <AuraLogo size={32} withGlow={true} />
          <div>
            <h1
              className={`text-base font-extrabold tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Aura Finanzas
            </h1>
            <span
              className={`text-[10px] font-medium block mt-0.5 ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              Facturas & Control de Gastos
            </span>
          </div>
        </div>

        {/* Acciones principales de cabecera: Botón Perfil / Admin, Botón Gasto y la Tuerca de Ajustes */}
        <div className="flex items-center gap-2">
          {/* Botón Admin Master / Usuario */}
          {onOpenPremium && (
            <button
              onClick={onOpenPremium}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ${
                esAdmin
                  ? 'bg-gradient-to-r from-amber-500/15 to-amber-600/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25'
                  : isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs'
              }`}
              title={esAdmin ? 'Aura Pro: Administrador Master' : 'Perfil de Usuario'}
            >
              {esAdmin ? (
                <>
                  <Crown size={14} className="text-amber-500 fill-amber-500" />
                  <span className="hidden sm:inline">Admin Master</span>
                </>
              ) : (
                <>
                  <UserIcon size={14} className="text-neutral-400" />
                  <span className="hidden sm:inline">Usuario</span>
                </>
              )}
            </button>
          )}

          {/* Botón Nuevo Gasto */}
          <button
            onClick={onOpenNewExpense}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>Gasto</span>
          </button>

          {/* Tuerca de Ajustes & Opciones (Settings) */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
            title="Ajustes y opciones de la app"
            aria-label="Ajustes"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Contenedor principal que se acopla al 100% de la pantalla del celular sin marcos falsos */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 sm:px-6 pt-3 pb-24">
        {children}
      </main>

      {/* Barra de Navegación Inferior Móvil (Bottom Navigation Bar) */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl border-t px-3 pt-2 pb-safe transition-colors ${
          isDark
            ? 'bg-[#090d16]/95 border-white/10'
            : 'bg-white/95 border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-around relative pb-2 sm:pb-3">
          {/* Tab 1: Gastos */}
          <button
            onClick={() => onTabChange('gastos')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'gastos'
                ? isDark
                  ? 'text-emerald-400 scale-105 font-bold'
                  : 'text-emerald-600 scale-105 font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-neutral-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-[11px]">Gastos</span>
          </button>

          {/* Tab 2: Calendario */}
          <button
            onClick={() => onTabChange('calendar')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? isDark
                  ? 'text-emerald-400 scale-105 font-bold'
                  : 'text-emerald-600 scale-105 font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-neutral-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" />
            </svg>
            <span className="text-[11px]">Calendario</span>
          </button>

          {/* Botón Central: Escáner OCR de Facturas */}
          <div className="-mt-7">
            <button
              onClick={onOpenScanner}
              className={`w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 ${
                isDark ? 'border-[#090d16]' : 'border-white'
              }`}
              title="Escanear Factura con OCR"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          </div>

          {/* Tab 3: Gráficos */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? isDark
                  ? 'text-emerald-400 scale-105 font-bold'
                  : 'text-emerald-600 scale-105 font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-neutral-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            <span className="text-[11px]">Gráficos</span>
          </button>

          {/* Tab 4: Sync & Hojas de Cálculo */}
          <button
            onClick={() => onTabChange('sync')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'sync'
                ? isDark
                  ? 'text-emerald-400 scale-105 font-bold'
                  : 'text-emerald-600 scale-105 font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-neutral-200'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            <span className="text-[11px]">Sync</span>
            {pendientesSync > 0 && (
              <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};
