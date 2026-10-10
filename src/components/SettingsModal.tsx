import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import {
  Settings,
  X,
  Sun,
  Moon,
  RotateCcw,
  Database,
  FileSpreadsheet,
  Check,
  Copy,
  Code2,
  Smartphone,
  Shield,
  Trash2,
  AlertTriangle,
  Crown,
  Lock,
  Cloud,
  LogOut,
  RefreshCw,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { UsuarioConfig } from '../types/finance';
import {
  guardarConfiguracion,
  reiniciarDatosACero,
  esUsuarioAdmin
} from '../services/storageService';
import { SQLITE_SCHEMA_SQL } from '../db/sqliteSchema';
import { AuraLogo } from './AuraLogo';

interface SettingsModalProps {
  config: UsuarioConfig;
  onClose: () => void;
  onConfigUpdated: (config: UsuarioConfig) => void;
  onDataReset: () => void;
  onOpenSyncSheets: () => void;
  onOpenPremium?: () => void;
  currentUser?: { uid: string; email?: string | null; displayName?: string | null } | null;
  esInvitado?: boolean;
  onConectarGoogle?: () => void;
  onCerrarSesion?: () => void;
  onSincronizarAhora?: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onClose,
  onConfigUpdated,
  onDataReset,
  onOpenSyncSheets,
  onOpenPremium,
  currentUser,
  esInvitado,
  onConectarGoogle,
  onCerrarSesion,
  onSincronizarAhora,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState<'general' | 'datos'>('general');
  const [moneda, setMoneda] = useState(config.moneda || 'USD');
  const [email, setEmail] = useState(currentUser?.email || config.email || '');
  const [mostrarConfirmReset, setMostrarConfirmReset] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [sincronizandoNube, setSincronizandoNube] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const monedas = [
    { code: 'USD', symbol: '$', name: 'Dólar (USD)' },
    { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
    { code: 'COP', symbol: '$', name: 'Peso Col. (COP)' },
    { code: 'MXN', symbol: '$', name: 'Peso Mex. (MXN)' },
    { code: 'ARS', symbol: '$', name: 'Peso Arg. (ARS)' },
    { code: 'CLP', symbol: '$', name: 'Peso Chi. (CLP)' },
  ];

  const handleGuardarGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = guardarConfiguracion({
      moneda,
      email: email.trim(),
    });
    onConfigUpdated(updated);
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 2000);
  };

  const handleEjecutarReset = () => {
    reiniciarDatosACero();
    setMostrarConfirmReset(false);
    onDataReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera del Menú Tuerca */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Settings size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Ajustes & Opciones
              </h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Personaliza la aplicación y administra tus datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Pestañas de la Tuerca */}
        <div
          className={`flex border-b px-4 gap-1 text-xs font-semibold ${
            isDark ? 'border-neutral-800 bg-neutral-950/40' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <button
            onClick={() => setTab('general')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'general'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings size={14} />
            <span>General</span>
          </button>
          <button
            onClick={() => setTab('datos')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'datos'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database size={14} />
            <span>Datos & Reset</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {tab === 'general' && (
            <form onSubmit={handleGuardarGeneral} className="space-y-4">
              {/* Selector de Tema */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Apariencia</h3>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      {isDark ? 'Modo Oscuro activado' : 'Modo Claro activado'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-neutral-800 border-neutral-700 text-amber-300 hover:bg-neutral-700'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {isDark ? (
                      <>
                        <Sun size={15} />
                        <span>Cambiar a Claro</span>
                      </>
                    ) : (
                      <>
                        <Moon size={15} />
                        <span>Cambiar a Oscuro</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Selector de Moneda */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}>
                  Moneda Predeterminada
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {monedas.map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => setMoneda(m.code)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        moneda === m.code
                          ? isDark
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-emerald-50 border-emerald-600 text-emerald-700 font-bold'
                          : isDark
                          ? 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{m.code}</div>
                      <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {m.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarjeta de Cuenta de Google & Respaldo en la Nube */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  currentUser
                    ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30'
                    : isDark
                    ? 'bg-neutral-950/60 border-neutral-800'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        currentUser
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-amber-500/20 text-amber-500'
                      }`}
                    >
                      <Cloud size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">
                        {currentUser ? 'Cuenta de Google Conectada' : 'Modo Invitado (Sin Respaldo)'}
                      </span>
                      <span className={`text-[11px] truncate block max-w-[200px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {currentUser ? currentUser.email : 'Tus datos solo residen en este dispositivo'}
                      </span>
                    </div>
                  </div>

                  {currentUser ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
                      En la Nube ✓
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 shrink-0">
                      Local
                    </span>
                  )}
                </div>

                {/* Acciones de Cuenta */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-inherit/20">
                  {currentUser ? (
                    <>
                      <button
                        type="button"
                        disabled={sincronizandoNube}
                        onClick={async () => {
                          if (onSincronizarAhora) {
                            setSincronizandoNube(true);
                            setSyncFeedback(null);
                            try {
                              await onSincronizarAhora();
                              setSyncFeedback('¡Facturas sincronizadas con Google!');
                              setTimeout(() => setSyncFeedback(null), 3500);
                            } catch {
                              setSyncFeedback('Error al sincronizar.');
                            } finally {
                              setSincronizandoNube(false);
                            }
                          }
                        }}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30"
                      >
                        <RefreshCw size={13} className={sincronizandoNube ? 'animate-spin' : ''} />
                        <span>{sincronizandoNube ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                      </button>

                      {onCerrarSesion && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('¿Cerrar sesión de Google?')) {
                              onCerrarSesion();
                              onClose();
                            }
                          }}
                          className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                        >
                          <LogOut size={13} />
                          <span>Cerrar Sesión</span>
                        </button>
                      )}
                    </>
                  ) : (
                    onConectarGoogle && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onConectarGoogle();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Cloud size={14} />
                        <span>Conectar Cuenta de Google y Respaldar Facturas</span>
                      </button>
                    )
                  )}
                </div>

                {syncFeedback && (
                  <p className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>{syncFeedback}</span>
                  </p>
                )}
              </div>

              {/* Correo Electrónico & Estado Premium */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}>
                  Correo del Usuario
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                    isDark
                      ? 'bg-neutral-950 border-neutral-800 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Tarjeta Informativa de Estado Premium */}
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                  esUsuarioAdmin(email)
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : isDark
                    ? 'bg-neutral-950/40 border-neutral-800 text-neutral-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {esUsuarioAdmin(email) ? (
                    <Crown size={18} className="text-amber-500 shrink-0" />
                  ) : (
                    <Lock size={16} className="text-amber-500 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{esUsuarioAdmin(email) ? '👑 Administrador Master Pro' : '⭐ Conviértete en Admin Master (Pronto)'}</span>
                    </div>
                    <div className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      {esUsuarioAdmin(email)
                        ? 'Acceso desbloqueado de por vida a la Suite Tributaria DIAN y Libro Fiscal.'
                        : 'Próximamente disponible con herramientas contables y tributarias avanzadas.'}
                    </div>
                  </div>
                </div>

                {onOpenPremium && (
                  <button
                    type="button"
                    onClick={onOpenPremium}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs border border-amber-500/30 shrink-0 cursor-pointer transition-colors"
                  >
                    {esUsuarioAdmin(email) ? 'Abrir Pro' : 'Pronto'}
                  </button>
                )}
              </div>

              {/* Botón Guardar */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Guardar Preferencias
                </button>
                {guardadoExito && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Check size={14} /> Guardado
                  </span>
                )}
              </div>
            </form>
          )}

          {tab === 'datos' && (
            <div className="space-y-4">
              {/* Tarjeta de Reseteo a 0 */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                    <RotateCcw size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-rose-500">
                      Reiniciar todo a 0
                    </h3>
                    <p className={`text-xs mt-0.5 leading-relaxed ${
                      isDark ? 'text-neutral-300' : 'text-slate-600'
                    }`}>
                      Borra todas las facturas y comprobantes precargados de prueba para dejar la app vacía y empezar a registrar tus gastos reales.
                    </p>

                    {!mostrarConfirmReset ? (
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmReset(true)}
                        className="mt-3 px-3.5 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm hover:bg-rose-600"
                      >
                        <Trash2 size={13} />
                        <span>Vaciar datos y empezar a 0</span>
                      </button>
                    ) : (
                      <div className="mt-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                          <AlertTriangle size={14} />
                          <span>¿Confirmas que deseas borrar todos los comprobantes?</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleEjecutarReset}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs active:scale-95 cursor-pointer"
                          >
                            Sí, reiniciar a 0
                          </button>
                          <button
                            type="button"
                            onClick={() => setMostrarConfirmReset(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tarjeta Google Sheets */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-neutral-950/50 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Google Sheets & Backup</h3>
                      <p className={`text-xs mt-0.5 leading-relaxed ${
                        isDark ? 'text-neutral-400' : 'text-slate-500'
                      }`}>
                        Sincroniza tus registros con una hoja de cálculo o importa comprobantes anteriores.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSyncSheets();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-emerald-500/25"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Abrir panel de Google Sheets</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
