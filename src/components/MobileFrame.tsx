import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wifi,
  BatteryCharging,
  Maximize2,
  Terminal,
  RefreshCw,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: 'gastos' | 'calendar' | 'analytics' | 'sync' | 'widgets';
  onTabChange: (tab: 'gastos' | 'calendar' | 'analytics' | 'sync' | 'widgets') => void;
  onOpenScanner: () => void;
  onOpenDevHub: () => void;
  onOpenNewExpense: () => void;
  pendientesSync: number;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenDevHub,
  onOpenNewExpense,
  pendientesSync,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [plataforma, setPlataforma] = useState<'android' | 'ios' | 'fullscreen'>('android');
  const [horaLocal, setHoraLocal] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHoraLocal(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col items-center justify-start p-2 sm:p-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${
        isDark ? 'bg-[#07090e] text-neutral-100' : 'bg-[#eef2f6] text-slate-800'
      }`}
    >
      {/* Top Bar de Control del Simulador & Arquitectura */}
      <header className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <h1
              className={`text-base sm:text-lg font-extrabold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Aura Finance
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                React Native
              </span>
            </h1>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              Gestor de Gastos y Facturas • 100% Offline con SQLite
            </p>
          </div>
        </div>

        {/* Acciones de Desarrollador, Selector de Tema & Plataforma */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Botón Selector de Tema: Blanco (Principal) vs Negro */}
          <button
            onClick={toggleTheme}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
              isDark
                ? 'bg-neutral-900 border-neutral-700 text-amber-300 hover:text-white hover:bg-neutral-800'
                : 'bg-white border-slate-300/80 text-slate-800 hover:text-slate-950 hover:bg-slate-50'
            }`}
            title="Alternar entre tema blanco (principal) y negro"
          >
            {isDark ? (
              <>
                <Sun size={14} className="text-amber-400" />
                <span>Modo Blanco</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-slate-700" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>

          {/* Botón Centro de Arquitectura */}
          <button
            onClick={onOpenDevHub}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
              isDark
                ? 'bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border-cyan-500/30'
                : 'bg-white hover:bg-slate-50 text-cyan-700 border-cyan-500/30'
            }`}
          >
            <Terminal size={14} className="text-cyan-500" />
            <span className="hidden sm:inline">Código &</span> Esquema SQL
          </button>

          {/* Selector de Marco Móvil */}
          <div
            className={`flex items-center p-1 rounded-xl border text-xs shadow-xs ${
              isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-slate-200'
            }`}
          >
            <button
              onClick={() => setPlataforma('android')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                plataforma === 'android'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-sm'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Android
            </button>
            <button
              onClick={() => setPlataforma('ios')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                plataforma === 'ios'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-sm'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              iOS
            </button>
            <button
              onClick={() => setPlataforma('fullscreen')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                plataforma === 'fullscreen'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-sm'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista Completa"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Chasis Móvil Nativo */}
      <div
        className={`w-full transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-b from-[#10141f] via-[#0b0e17] to-[#070910] text-[#f1f5f9]'
            : 'bg-white text-slate-900'
        } ${
          plataforma === 'fullscreen'
            ? `max-w-3xl rounded-3xl border ${
                isDark ? 'border-white/10 shadow-2xl' : 'border-slate-300 shadow-xl'
              } p-2`
            : `max-w-[425px] rounded-[48px] ${
                isDark
                  ? 'border-[10px] sm:border-[12px] border-neutral-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(16,185,129,0.12)]'
                  : 'border-[10px] sm:border-[12px] border-slate-300/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.14),0_0_40px_rgba(16,185,129,0.06)]'
              } relative overflow-hidden`
        }`}
      >
        {/* Status Bar Nativa */}
        {plataforma !== 'fullscreen' && (
          <div
            className={`pt-3 px-6 pb-2 flex items-center justify-between text-xs font-mono z-30 relative backdrop-blur-md ${
              isDark ? 'bg-black/40 text-neutral-300' : 'bg-slate-100/70 text-slate-700'
            }`}
          >
            <span className="font-bold text-[12px]">{horaLocal}</span>

            {/* Notch / Dynamic Island / Cámara perforada */}
            {plataforma === 'ios' ? (
              <div
                className={`w-28 h-5 rounded-full border flex items-center justify-center gap-2 px-2 shadow-inner ${
                  isDark ? 'bg-black border-neutral-800' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-700" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
            ) : (
              <div
                className={`w-3.5 h-3.5 rounded-full border shadow-inner ${
                  isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-slate-400/80 border-slate-300'
                }`}
              />
            )}

            <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              <span className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                5G
              </span>
              <Wifi size={13} />
              <BatteryCharging size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
            </div>
          </div>
        )}

        {/* In-App Header */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b sticky top-0 z-20 backdrop-blur-md ${
            isDark
              ? 'bg-black/30 border-white/5'
              : 'bg-white/80 border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold text-xs">
              A
            </div>
            <div>
              <h2
                className={`text-xs sm:text-sm font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Aura Finanzas
              </h2>
              <span className={`text-[10px] font-medium block -mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Facturas & Gastos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenNewExpense}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Gasto</span>
            </button>
          </div>
        </div>

        {/* Viewport de la App con scroll interno */}
        <main
          className={`min-h-[640px] max-h-[78vh] overflow-y-auto px-4 pt-3 pb-24 relative no-scrollbar ${
            isDark ? 'bg-transparent' : 'bg-slate-50/60'
          }`}
        >
          {children}
        </main>

        {/* Bottom Tab Bar Nativo Flotante */}
        <nav
          className={`absolute bottom-0 left-0 right-0 z-30 backdrop-blur-2xl border-t px-3 pt-2 pb-5 ${
            isDark
              ? 'bg-black/85 border-white/10'
              : 'bg-white/95 border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]'
          }`}
        >
          <div className="flex items-center justify-around relative">
            {/* Tab 1: Mis Gastos */}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
              <span className="text-[10px]">Gastos</span>
            </button>

            {/* Tab 2: Calendario Precios */}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4"/>
                <path d="M16 2v4"/>
                <rect width="18" height="18" x="3" y="4" rx="2"/>
                <path d="M3 10h18"/>
              </svg>
              <span className="text-[10px]">Calendario</span>
            </button>

            {/* Botón Central Flotante: Escáner OCR */}
            <div className="-mt-7">
              <button
                onClick={onOpenScanner}
                className={`w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 ${
                  isDark ? 'border-neutral-950' : 'border-white'
                }`}
                title="Escanear Factura con OCR"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </button>
            </div>

            {/* Tab 3: Gráficos & Análisis */}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                <path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
              <span className="text-[10px]">Gráficos</span>
            </button>

            {/* Tab 4: Sync & Widgets */}
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
              <RefreshCw size={20} />
              <span className="text-[10px]">Sync</span>
              {pendientesSync > 0 && (
                <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          </div>

          {/* Barra de Gestos Nativa (Home Indicator) */}
          <div
            className={`w-32 h-1 rounded-full mx-auto mt-3 ${
              isDark ? 'bg-white/20' : 'bg-slate-300'
            }`}
          />
        </nav>
      </div>
    </div>
  );
};
