import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Coins,
  Check,
  UserCheck,
  Smartphone,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ModoOperacion, UsuarioConfig } from '../types/finance';
import { guardarConfiguracion, obtenerGastos } from '../services/storageService';
import { loginWithGoogle, sincronizarTodoConGoogle } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { AuraLogo } from './AuraLogo';

interface OnboardingModalProps {
  config: UsuarioConfig;
  onComplete: (updated: UsuarioConfig) => void;
}

const MONEDAS_DISPONIBLES = [
  { codigo: 'COP', nombre: 'Peso Colombiano', simbolo: '$', bandera: '🇨🇴' },
  { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$', bandera: '🇺🇸' },
  { codigo: 'EUR', nombre: 'Euro', simbolo: '€', bandera: '🇪🇺' },
  { codigo: 'MXN', nombre: 'Peso Mexicano', simbolo: '$', bandera: '🇲🇽' },
  { codigo: 'CLP', nombre: 'Peso Chileno', simbolo: '$', bandera: '🇨🇱' },
  { codigo: 'PEN', nombre: 'Sol Peruano', simbolo: 'S/', bandera: '🇵🇪' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ config, onComplete }) => {
  const { isDark } = useTheme();
  // Paso 1: Inicio de Sesión con Google (Obligatorio como primera pantalla)
  // Paso 2: Selección de Moneda Principal
  const [paso, setPaso] = useState<1 | 2>(1);
  const [moneda, setMoneda] = useState(config.moneda || 'COP');
  const [email, setEmail] = useState(config.email || '');
  const [modo, setModo] = useState<ModoOperacion>(config.modo || 'sincronizado');
  const [iniciandoGoogle, setIniciandoGoogle] = useState(false);
  const [googleSuccess, setGoogleSuccess] = useState(false);
  const [mensajeSincronizacion, setMensajeSincronizacion] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleGoogleSignIn = async () => {
    setIniciandoGoogle(true);
    setErrorMensaje('');
    setMensajeSincronizacion('Abriendo ventana de inicio de sesión de Google...');

    try {
      const resp = await loginWithGoogle();
      if (resp.success && resp.email) {
        setEmail(resp.email);
        setGoogleSuccess(true);
        setModo('sincronizado');
        setMensajeSincronizacion('¡Sesión verificada! Sincronizando y guardando tus facturas en la nube de Google...');

        // Guardar configuración inicial con el correo de Google
        const nuevaConfig: UsuarioConfig = {
          ...config,
          email: resp.email,
          modo: 'sincronizado',
          moneda,
        };

        // Sincronizar automáticamente todos los gastos locales con la cuenta de Google
        try {
          const gastosLocales = obtenerGastos();
          const resultadoSync = await sincronizarTodoConGoogle(gastosLocales, nuevaConfig);
          if (resultadoSync.totalSubidos > 0 || resultadoSync.totalDescargados > 0) {
            setMensajeSincronizacion(`✓ ${resultadoSync.totalSubidos} facturas respaldadas en tu cuenta de Google.`);
          } else {
            setMensajeSincronizacion('✓ Cuenta de Google conectada y respaldada en tiempo real.');
          }
        } catch (syncErr) {
          console.warn('Sync note during onboarding:', syncErr);
        }

        // Transición automática al paso 2 (moneda) después de un momento
        setTimeout(() => {
          setPaso(2);
        }, 1200);
      } else if (resp.error) {
        setErrorMensaje(resp.error);
        setMensajeSincronizacion('');
      }
    } catch (err: any) {
      console.warn('Login error:', err);
      setErrorMensaje('No se pudo completar el inicio de sesión. Puedes reintentar o entrar como invitado.');
      setMensajeSincronizacion('');
    } finally {
      setIniciandoGoogle(false);
    }
  };

  const handleContinuarComoInvitado = () => {
    setEmail('');
    setModo('local');
    setGoogleSuccess(false);
    setPaso(2);
  };

  const handleFinalizar = () => {
    const updated = guardarConfiguracion({
      moneda,
      email: email.trim(),
      modo,
      onboarding_completado: true,
      ultima_sincronizacion: new Date().toISOString(),
    });
    // Marcar sesión iniciada para evitar volver a bloquear en esta instalación
    try {
      localStorage.setItem('aura_sesion_activa_v2', 'true');
    } catch {}
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden relative border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera común */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-inherit/20">
          <div className="flex items-center gap-2.5">
            <AuraLogo size={36} withGlow={true} />
            <div>
              <h2 className={`text-base font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Aura Finanzas
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Paso {paso} de 2
                </span>
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {paso === 1 ? '1. Inicio de Sesión' : '2. Selección de Moneda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                paso === 1 ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-emerald-600'
              }`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                paso === 2 ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : isDark ? 'bg-neutral-700' : 'bg-slate-300'
              }`}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ================= PASO 1: INICIO DE SESIÓN CON GOOGLE (PRIMERA PANTALLA) ================= */}
          {paso === 1 && (
            <motion.div
              key="paso-1-auth"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="space-y-4"
            >
              {/* Tarjeta de presentación */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark
                    ? 'bg-gradient-to-br from-emerald-500/10 via-neutral-950 to-neutral-900 border-emerald-500/20'
                    : 'bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Cloud size={16} />
                  <span>Respaldo Automático en tu Cuenta</span>
                </div>
                <h3 className={`text-base font-extrabold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Inicia sesión con Google para no perder tus datos
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                  Tus comprobantes, balances y categorías se guardarán <strong>directa y automáticamente con tu usuario de Google</strong>. Podrás actualizar la app o cambiar de teléfono sin perder nada.
                </p>
              </div>

              {/* Botón Principal: Continuar con Google */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={iniciandoGoogle}
                  className={`w-full py-3.5 px-4 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-98 ${
                    googleSuccess
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : isDark
                      ? 'bg-white hover:bg-neutral-100 text-neutral-900 border-white hover:shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 hover:shadow-lg'
                  }`}
                >
                  {iniciandoGoogle ? (
                    <RefreshCw size={18} className="animate-spin text-emerald-500" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>
                    {iniciandoGoogle
                      ? 'Conectando con Google...'
                      : googleSuccess
                      ? `Conectado como ${email}`
                      : 'Iniciar Sesión con Google'}
                  </span>
                  {googleSuccess && <CheckCircle2 size={16} className="text-emerald-500" />}
                </button>

                {mensajeSincronizacion && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{mensajeSincronizacion}</span>
                  </div>
                )}

                {errorMensaje && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMensaje}</span>
                  </div>
                )}
              </div>

              {/* Divisor */}
              <div className="flex items-center gap-2 my-1">
                <div className={`h-px flex-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  o bien
                </span>
                <div className={`h-px flex-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
              </div>

              {/* Botón Secundario: Entrar como Invitado */}
              <div>
                <button
                  type="button"
                  onClick={handleContinuarComoInvitado}
                  className={`w-full py-3 px-4 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-neutral-950/70 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Smartphone size={15} />
                  <span>Continuar como invitado (Modo local)</span>
                </button>
                <p className={`text-[10px] text-center mt-1.5 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Nota: En modo invitado tus datos se guardan solo en este teléfono. Puedes conectar Google en cualquier momento desde Ajustes.
                </p>
              </div>
            </motion.div>
          )}

          {/* ================= PASO 2: SELECCIONAR MONEDA PRINCIPAL ================= */}
          {paso === 2 && (
            <motion.div
              key="paso-2-moneda"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Coins size={18} className="text-emerald-500" />
                  <span>Selecciona tu moneda principal</span>
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                  Define la divisa en la que se registrarán tus facturas y se calcularán tus balances y presupuestos.
                </p>
                {email && (
                  <div className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <UserCheck size={13} />
                    <span>Conectado como {email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto pr-1 no-scrollbar">
                {MONEDAS_DISPONIBLES.map((m) => (
                  <button
                    key={m.codigo}
                    type="button"
                    onClick={() => setMoneda(m.codigo)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      moneda === m.codigo
                        ? isDark
                          ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs'
                          : 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs'
                        : isDark
                        ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{m.bandera}</span>
                      {moneda === m.codigo ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-neutral-950">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      ) : (
                        <span className={`text-xs font-mono font-bold ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                          {m.simbolo}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className={`font-mono text-sm font-extrabold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {m.codigo}
                      </span>
                      <span className={`text-[11px] block truncate ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {m.nombre}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Botón final */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleFinalizar}
                  className="w-full py-3.5 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Check size={15} className="stroke-[3]" />
                  <span>Guardar y Entrar a Aura Finanzas</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className={`text-[11px] font-medium flex items-center gap-1 mx-auto transition-colors cursor-pointer ${
                      isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ArrowLeft size={12} />
                    <span>Volver a Inicio de Sesión</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
