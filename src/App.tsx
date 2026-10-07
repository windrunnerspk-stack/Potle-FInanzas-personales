/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { Gasto, UsuarioConfig } from './types/finance';
import {
  obtenerGastos,
  obtenerConfiguracion,
} from './services/storageService';
import { MobileFrame } from './components/MobileFrame';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseCalendar } from './components/ExpenseCalendar';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ManualExpenseForm } from './components/ManualExpenseForm';
import { ReceiptScanner } from './components/ReceiptScanner';
import { SyncSheetModal } from './components/SyncSheetModal';
import { WidgetPreview } from './components/WidgetPreview';
import { OnboardingModal } from './components/OnboardingModal';
import { DevArchitectureModal } from './components/DevArchitectureModal';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isDark } = useTheme();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [config, setConfig] = useState<UsuarioConfig>(obtenerConfiguracion());
  const [activeTab, setActiveTab] = useState<'gastos' | 'calendar' | 'analytics' | 'sync' | 'widgets'>('gastos');

  // Modales
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [mostrarFormGasto, setMostrarFormGasto] = useState(false);
  const [valoresInicialesForm, setValoresInicialesForm] = useState<Partial<Gasto> | undefined>(undefined);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarSyncModal, setMostrarSyncModal] = useState(false);
  const [mostrarDevHub, setMostrarDevHub] = useState(false);

  // Carga inicial
  useEffect(() => {
    recargarDatos();
    const conf = obtenerConfiguracion();
    setConfig(conf);
    if (!conf.onboarding_completado) {
      setMostrarOnboarding(true);
    }
  }, []);

  const recargarDatos = () => {
    const lista = obtenerGastos();
    setGastos(lista);
    const conf = obtenerConfiguracion();
    setConfig(conf);
  };

  const handleOpenNewExpense = (prefill?: Partial<Gasto>) => {
    setValoresInicialesForm(prefill);
    setMostrarFormGasto(true);
  };

  const handleScanComplete = (prefilled: Partial<Gasto>) => {
    setMostrarScanner(false);
    handleOpenNewExpense(prefilled);
  };

  const handleExpenseSaved = () => {
    setMostrarFormGasto(false);
    setValoresInicialesForm(undefined);
    recargarDatos();
  };

  const pendientesSync = gastos.filter((g) => !g.sincronizado).length;

  const totalMes = gastos
    .filter((g) => g.fecha.startsWith('2026-10'))
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalAnio = gastos
    .filter((g) => g.fecha.startsWith('2026'))
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#07090e]' : 'bg-[#eef2f6]'}`}>
      <MobileFrame
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenScanner={() => setMostrarScanner(true)}
        onOpenDevHub={() => setMostrarDevHub(true)}
        onOpenNewExpense={() => handleOpenNewExpense()}
        pendientesSync={pendientesSync}
      >
        {/* Banner Superior de Estado de Sincronización y Configuración */}
        <div className="mb-3.5 flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Modo:</span>
            <span className={`font-semibold capitalize text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {config.modo === 'sincronizado' ? 'Google Sheets Sync' : 'Local SQLite'}
            </span>
          </div>

          <button
            onClick={() => setMostrarOnboarding(true)}
            className={`text-[11px] transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            Ajustes
          </button>
        </div>

        {/* Tab 1: Mis Gastos & Facturas */}
        {activeTab === 'gastos' && (
          <ExpenseList
            gastos={gastos}
            onOpenNewExpense={() => handleOpenNewExpense()}
            onRefresh={recargarDatos}
          />
        )}

        {/* Tab 2: Calendario Tipo Precios de Vuelo */}
        {activeTab === 'calendar' && (
          <ExpenseCalendar gastos={gastos} />
        )}

        {/* Tab 3: Gráficos Estadísticos */}
        {activeTab === 'analytics' && (
          <AnalyticsCharts gastos={gastos} />
        )}

        {/* Tab 4: Sync con Google Sheets & Widgets */}
        {activeTab === 'sync' && (
          <div className="space-y-4 pb-20">
            {/* Tarjeta de Sincronización Google Sheets */}
            <div
              className={`p-4 rounded-3xl border shadow-sm transition-colors space-y-3 ${
                isDark
                  ? 'bg-neutral-900/90 border-neutral-800 text-white'
                  : 'bg-white border-slate-200/90 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Google Sheets & Correo
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Cola de Fondo Offline-First
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarSyncModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Ver Hoja & Cola
                </button>
              </div>

              <div
                className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  isDark
                    ? 'bg-neutral-950/80 border-neutral-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Facturas pendientes:
                  </span>
                  <span className="font-mono font-bold text-amber-500">{pendientesSync}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Total en SQLite:
                  </span>
                  <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {gastos.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Email de destino:
                  </span>
                  <span className={`truncate max-w-[180px] ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>
                    {config.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Widgets de Pantalla de Inicio */}
            <WidgetPreview
              totalMes={totalMes}
              totalAnio={totalAnio}
              onQuickAdd={() => handleOpenNewExpense()}
              onQuickScan={() => setMostrarScanner(true)}
            />
          </div>
        )}

        {/* Floating Quick Add Button */}
        {activeTab === 'gastos' && (
          <div className="fixed sm:absolute bottom-20 right-6 sm:right-6 z-20">
            <button
              onClick={() => handleOpenNewExpense()}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-neutral-950 font-bold shadow-xl shadow-emerald-500/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              title="Registrar Gasto Manual"
            >
              <Plus size={20} className="stroke-[3]" />
              <span className="text-xs font-extrabold pr-1">Nuevo Gasto</span>
            </button>
          </div>
        )}
      </MobileFrame>

      {/* Modales Interactivos */}
      <AnimatePresence>
        {mostrarOnboarding && (
          <OnboardingModal
            config={config}
            onComplete={(updated) => {
              setConfig(updated);
              setMostrarOnboarding(false);
              recargarDatos();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarFormGasto && (
          <ManualExpenseForm
            initialValues={valoresInicialesForm}
            onClose={() => {
              setMostrarFormGasto(false);
              setValoresInicialesForm(undefined);
            }}
            onSaved={handleExpenseSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarScanner && (
          <ReceiptScanner
            onScanComplete={handleScanComplete}
            onCancel={() => setMostrarScanner(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarSyncModal && (
          <SyncSheetModal
            gastos={gastos}
            config={config}
            onClose={() => setMostrarSyncModal(false)}
            onSynced={recargarDatos}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarDevHub && (
          <DevArchitectureModal onClose={() => setMostrarDevHub(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
