/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Gasto, UsuarioConfig } from './types/finance';
import {
  obtenerGastos,
  obtenerConfiguracion,
  esUsuarioAdmin
} from './services/storageService';
import { MobileFrame } from './components/MobileFrame';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseCalendar } from './components/ExpenseCalendar';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ManualExpenseForm } from './components/ManualExpenseForm';
import { ReceiptScanner } from './components/ReceiptScanner';
import { SyncSheetModal } from './components/SyncSheetModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { PremiumProModal } from './components/PremiumProModal';
import { useTheme } from './context/ThemeContext';
import { Crown, Lock } from 'lucide-react';

export default function App() {
  const { isDark } = useTheme();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [config, setConfig] = useState<UsuarioConfig>(obtenerConfiguracion());
  const [activeTab, setActiveTab] = useState<'gastos' | 'calendar' | 'analytics' | 'sync' | 'widgets'>('gastos');

  // Modales
  const [mostrarSettings, setMostrarSettings] = useState(false);
  const [mostrarPremiumModal, setMostrarPremiumModal] = useState(false);
  const [mostrarFormGasto, setMostrarFormGasto] = useState(false);
  const [valoresInicialesForm, setValoresInicialesForm] = useState<Partial<Gasto> | undefined>(undefined);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarSyncModal, setMostrarSyncModal] = useState(false);
  const [pestañaSyncModal, setPestañaSyncModal] = useState<'importar' | 'sheet' | 'email'>('importar');

  const handleOpenImportSheet = (tab: 'importar' | 'sheet' | 'email' = 'importar') => {
    setPestañaSyncModal(tab);
    setMostrarSyncModal(true);
  };

  // Carga inicial
  useEffect(() => {
    recargarDatos();
    const conf = obtenerConfiguracion();
    setConfig(conf);
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
  const esAdmin = esUsuarioAdmin(config.email);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#090d16]' : 'bg-slate-50'}`}>
      <MobileFrame
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenScanner={() => setMostrarScanner(true)}
        onOpenNewExpense={() => handleOpenNewExpense()}
        onOpenSettings={() => setMostrarSettings(true)}
        onOpenPremium={() => setMostrarPremiumModal(true)}
        esAdmin={esAdmin}
        pendientesSync={pendientesSync}
      >
        {/* Barra sutil de estado y acceso a la tuerca */}
        <div className="mb-3 flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              {gastos.length === 0 ? 'Sin facturas aún (Listo para registrar)' : `${gastos.length} comprobantes`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarPremiumModal(true)}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                esAdmin
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:border-amber-500/40 hover:text-amber-400'
              }`}
            >
              {esAdmin ? <Crown size={12} className="text-amber-500" /> : <Lock size={11} className="text-amber-500" />}
              <span>{esAdmin ? 'Admin Master' : 'Aura Pro'}</span>
            </button>

            <button
              onClick={() => setMostrarSettings(true)}
              className={`text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Ajustes</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Mis Gastos & Facturas */}
        {activeTab === 'gastos' && (
          <ExpenseList
            gastos={gastos}
            config={config}
            onOpenNewExpense={(prefill) => handleOpenNewExpense(prefill)}
            onEditGasto={(gasto) => handleOpenNewExpense(gasto)}
            onRefresh={recargarDatos}
            onOpenImportSheet={() => handleOpenImportSheet('importar')}
            onOpenPremiumModal={() => setMostrarPremiumModal(true)}
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

        {/* Tab 4: Sync con Google Sheets */}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Google Sheets & Nube
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    {pendientesSync > 0
                      ? `${pendientesSync} cambios pendientes de subida`
                      : 'Todos tus comprobantes están sincronizados'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenImportSheet('sheet')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Abrir Configuración</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </MobileFrame>

      {/* Modales */}
      <AnimatePresence>
        {mostrarSettings && (
          <SettingsModal
            config={config}
            onClose={() => setMostrarSettings(false)}
            onConfigUpdated={(nuevaConf) => setConfig(nuevaConf)}
            onDataReset={recargarDatos}
            onOpenSyncSheets={() => handleOpenImportSheet('sheet')}
            onOpenPremium={() => setMostrarPremiumModal(true)}
          />
        )}

        {mostrarPremiumModal && (
          <PremiumProModal
            isOpen={mostrarPremiumModal}
            onClose={() => setMostrarPremiumModal(false)}
            config={config}
            gastos={gastos}
            onConfigUpdated={(nuevaConf) => {
              setConfig(nuevaConf);
              recargarDatos();
            }}
          />
        )}

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

        {mostrarScanner && (
          <ReceiptScanner
            onCancel={() => setMostrarScanner(false)}
            onScanComplete={handleScanComplete}
          />
        )}

        {mostrarSyncModal && (
          <SyncSheetModal
            gastos={gastos}
            config={config}
            pestañaInicial={pestañaSyncModal}
            onClose={() => setMostrarSyncModal(false)}
            onSynced={() => recargarDatos()}
          />
        )}

        {!config.onboarding_completado && (
          <OnboardingModal
            config={config}
            onComplete={(nuevaConf) => {
              setConfig(nuevaConf);
              recargarDatos();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
