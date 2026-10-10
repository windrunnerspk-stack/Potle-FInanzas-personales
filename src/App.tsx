/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { Gasto, UsuarioConfig } from './types/finance';
import {
  obtenerGastos,
  obtenerConfiguracion,
  guardarConfiguracion,
  esUsuarioAdmin,
  sincronizarConCuentaGoogle
} from './services/storageService';
import {
  auth,
  onAuthStateChanged,
  logoutUser,
  loginWithGoogle,
  getCachedUser
} from './services/firebase';
import { MobileFrame } from './components/MobileFrame';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseCalendar } from './components/ExpenseCalendar';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ManualExpenseForm } from './components/ManualExpenseForm';
import { ReceiptScanner } from './components/ReceiptScanner';
import { SyncSheetModal } from './components/SyncSheetModal';
import { SettingsModal } from './components/SettingsModal';
import { PremiumProModal } from './components/PremiumProModal';
import { AuthWelcomeScreen, AppUserLike } from './components/AuthWelcomeScreen';
import { ExportTutorialModal } from './components/ExportTutorialModal';
import { CurrencySelectModal } from './components/CurrencySelectModal';
import { AuraLogo } from './components/AuraLogo';
import { useTheme } from './context/ThemeContext';
import { Crown, Lock, Cloud, RefreshCw, Sparkles, Smartphone } from 'lucide-react';

export type AppUser = User | AppUserLike;

export default function App() {
  const { isDark } = useTheme();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [config, setConfig] = useState<UsuarioConfig>(obtenerConfiguracion());
  const [activeTab, setActiveTab] = useState<'gastos' | 'calendar' | 'analytics' | 'sync' | 'widgets'>('gastos');
  const [mostrarExportTutorial, setMostrarExportTutorial] = useState(false);

  // Estado de Autenticación Real de Google y Modo Invitado
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    if (auth.currentUser) return auth.currentUser;
    const cached = getCachedUser();
    if (cached && cached.email) {
      return { uid: cached.uid, email: cached.email, displayName: cached.email.split('@')[0] };
    }
    return null;
  });
  const [esInvitado, setEsInvitado] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aura_modo_invitado') === 'true';
    } catch {
      return false;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [sincronizandoGoogle, setSincronizandoGoogle] = useState(false);
  const [mostrarAuthManual, setMostrarAuthManual] = useState(false);

  // Modales secundarios
  const [mostrarSettings, setMostrarSettings] = useState(false);
  const [mostrarPremiumModal, setMostrarPremiumModal] = useState(false);
  const [mostrarFormGasto, setMostrarFormGasto] = useState(false);
  const [valoresInicialesForm, setValoresInicialesForm] = useState<Partial<Gasto> | undefined>(undefined);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarSyncModal, setMostrarSyncModal] = useState(false);
  const [pestañaSyncModal, setPestañaSyncModal] = useState<'importar' | 'sheet' | 'email'>('importar');

  const recargarDatos = () => {
    const lista = obtenerGastos();
    setGastos(lista);
    const conf = obtenerConfiguracion();
    setConfig(conf);
  };

  // Escuchador de Autenticación Firebase en Tiempo Real
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setAuthReady(true);
    }, 1800);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setEsInvitado(false);
        try {
          localStorage.removeItem('aura_modo_invitado');
        } catch {}

        // Sincronizar automáticamente en la nube con su cuenta de Google
        setSincronizandoGoogle(true);
        try {
          const syncRes = await sincronizarConCuentaGoogle();
          if (syncRes.gastos) {
            setGastos(syncRes.gastos);
          }
        } catch (e) {
          console.warn('Sync on auth note:', e);
        } finally {
          setSincronizandoGoogle(false);
        }

        // Si el usuario es el admin o tiene correo, actualizar configuración
        if (user.email) {
          const conf = guardarConfiguracion({ email: user.email, modo: 'sincronizado' });
          setConfig(conf);
        }
      } else {
        const cached = getCachedUser();
        if (cached && cached.email) {
          setCurrentUser({ uid: cached.uid, email: cached.email, displayName: cached.email.split('@')[0] });
          setEsInvitado(false);
        }
      }
      setAuthReady(true);
      clearTimeout(fallbackTimer);
    });

    recargarDatos();
    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

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

  const handleOpenImportSheet = (tab: 'importar' | 'sheet' | 'email' = 'importar') => {
    setPestañaSyncModal(tab);
    setMostrarSyncModal(true);
  };

  const pendientesSync = gastos.filter((g) => !g.sincronizado).length;
  const esAdmin = esUsuarioAdmin(currentUser?.email || config.email);

  // 1. PANTALLA DE CARGA INICIAL (Espera de Firebase Auth)
  if (!authReady) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif] ${isDark ? 'bg-[#090d16]' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-3">
          <AuraLogo size={50} withGlow={true} />
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
            <RefreshCw size={14} className="animate-spin" />
            <span>Iniciando Aura Finanzas...</span>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario abrió manualmente conectar con Google desde Ajustes
  if (mostrarAuthManual) {
    return (
      <AuthWelcomeScreen
        onGoogleSuccess={async (user) => {
          setCurrentUser(user);
          setEsInvitado(false);
          setMostrarAuthManual(false);
          try {
            localStorage.removeItem('aura_modo_invitado');
          } catch {}
          if (user.email) {
            const conf = guardarConfiguracion({ email: user.email, modo: 'sincronizado' });
            setConfig(conf);
          }
          try {
            const syncRes = await sincronizarConCuentaGoogle();
            if (syncRes.gastos) {
              setGastos(syncRes.gastos);
            }
          } catch (e) {
            console.warn('Sync note:', e);
          }
          recargarDatos();
        }}
        onGuestSelected={() => {
          setMostrarAuthManual(false);
        }}
      />
    );
  }

  // 3. SELECCIÓN DE MONEDA (Solo si es la primera apertura y aún no se completó)
  if (!config.onboarding_completado) {
    return (
      <CurrencySelectModal
        config={config}
        userEmail={currentUser?.email}
        onComplete={(nuevaConf) => {
          setConfig(nuevaConf);
          recargarDatos();
        }}
      />
    );
  }

  // 4. PANTALLA PRINCIPAL DE LA APLICACIÓN
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
        {/* Barra superior de estado de sincronización y cuenta */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs px-1">
          {/* Indicador de Facturas y Estado Cloud */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {gastos.length === 0 ? 'Sin facturas aún' : `${gastos.length} comprobantes`}
              </span>
            </div>

            {/* Estado de almacenamiento local en el teléfono */}
            <button
              type="button"
              onClick={() => setMostrarExportTutorial(true)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="Tus datos se guardan de forma privada en el almacenamiento local de este teléfono. Toca para ver el tutorial de exportación."
            >
              <Smartphone size={12} className="text-emerald-500" />
              <span>Guardado en Teléfono (Local)</span>
            </button>
          </div>

          {/* Estado de Cuenta / Rango */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarPremiumModal(true)}
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                esAdmin
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-neutral-800/90 border border-neutral-700/80 text-amber-400/90 hover:border-amber-500/40 hover:text-amber-300'
              }`}
            >
              {esAdmin ? <Crown size={12} className="text-amber-500 fill-amber-500" /> : <Sparkles size={11} className="text-amber-400" />}
              <span>{esAdmin ? 'Admin Master' : 'Conviértete en Admin Master (Pronto)'}</span>
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
            onOpenExportTutorial={() => setMostrarExportTutorial(true)}
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

      {/* Modales de la aplicación */}
      <AnimatePresence>
        {mostrarSettings && (
          <SettingsModal
            config={config}
            currentUser={currentUser}
            esInvitado={esInvitado}
            onClose={() => setMostrarSettings(false)}
            onConfigUpdated={(nuevaConf) => setConfig(nuevaConf)}
            onDataReset={recargarDatos}
            onOpenSyncSheets={() => handleOpenImportSheet('sheet')}
            onOpenPremium={() => setMostrarPremiumModal(true)}
            onOpenExportTutorial={() => setMostrarExportTutorial(true)}
            onConectarGoogle={() => {
              setMostrarSettings(false);
              setMostrarAuthManual(true);
            }}
            onCerrarSesion={async () => {
              await logoutUser();
              setCurrentUser(null);
              setEsInvitado(false);
              try {
                localStorage.removeItem('aura_modo_invitado');
              } catch {}
              setMostrarAuthManual(true);
            }}
            onSincronizarAhora={async () => {
              await sincronizarConCuentaGoogle();
              recargarDatos();
            }}
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
            onSavedDirectly={() => {
              setMostrarScanner(false);
              recargarDatos();
            }}
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

        {mostrarExportTutorial && (
          <ExportTutorialModal
            isOpen={mostrarExportTutorial}
            onClose={() => setMostrarExportTutorial(false)}
            gastos={gastos}
            config={config}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
