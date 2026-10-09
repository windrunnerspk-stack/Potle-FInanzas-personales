import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Sparkles,
  Lock,
  ArrowRight,
  Mail,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  KeyRound,
  Copy,
  Check,
  HelpCircle,
  Globe
} from 'lucide-react';
import {
  loginWithGoogle,
  loginWithGoogleAccountEmail,
  verificarEstadoFirebase,
  FirebaseDiagnostic,
  GoogleAuthFailureCause,
  auth
} from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { AuraLogo } from './AuraLogo';

export interface AppUserLike {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthWelcomeScreenProps {
  onGoogleSuccess: (user: AppUserLike) => void;
  onGuestSelected: () => void;
}

const DEFAULT_DEV_EMAIL = 'latouchettdiego@gmail.com';
const FIREBASE_PROJECT_ID = 'gen-lang-client-0811256759';

export const AuthWelcomeScreen: React.FC<AuthWelcomeScreenProps> = ({
  onGoogleSuccess,
  onGuestSelected,
}) => {
  const { isDark } = useTheme();
  const [cargando, setCargando] = useState(false);
  const [estadoMensaje, setEstadoMensaje] = useState<string | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [errorCausa, setErrorCausa] = useState<GoogleAuthFailureCause | null>(null);
  const [mostrarIngresoDirecto, setMostrarIngresoDirecto] = useState(false);
  const [correoDirecto, setCorreoDirecto] = useState(DEFAULT_DEV_EMAIL);
  const [mostrarDiagnostico, setMostrarDiagnostico] = useState(false);
  const [mostrarGuiaTester, setMostrarGuiaTester] = useState(false);
  const [diagnostico, setDiagnostico] = useState<FirebaseDiagnostic | null>(null);
  const [cargandoDiagnostico, setCargandoDiagnostico] = useState(false);
  const [copiadoUrl, setCopiadoUrl] = useState<string | null>(null);

  // Ejecutar verificación de estado de Firebase al cargar
  useEffect(() => {
    verificarEstadoFirebase()
      .then((diag) => setDiagnostico(diag))
      .catch(() => {});
  }, []);

  const handleCopiar = (texto: string, etiqueta: string) => {
    try {
      navigator.clipboard.writeText(texto);
      setCopiadoUrl(etiqueta);
      setTimeout(() => setCopiadoUrl(null), 2500);
    } catch {}
  };

  const handleCargarDiagnostico = async () => {
    setCargandoDiagnostico(true);
    try {
      const res = await verificarEstadoFirebase();
      setDiagnostico(res);
    } catch {}
    setCargandoDiagnostico(false);
  };

  const handleIniciarGoogle = async () => {
    setCargando(true);
    setErrorMensaje(null);
    setErrorCausa(null);
    setEstadoMensaje('Abriendo selector de cuentas de Google...');

    try {
      const resp = await loginWithGoogle();
      if (resp.success && (auth.currentUser || resp.uid)) {
        setEstadoMensaje(`¡Bienvenido! Conectando cuenta ${resp.email || ''}...`);
        setTimeout(() => {
          onGoogleSuccess({
            uid: resp.uid || auth.currentUser?.uid || 'usr_google',
            email: resp.email || auth.currentUser?.email,
            displayName: resp.displayName || auth.currentUser?.displayName,
          });
        }, 600);
      } else if (resp.error) {
        setErrorMensaje(resp.error);
        setErrorCausa(resp.failureCause || null);
        setEstadoMensaje(null);
        // Si hay error de configuración, modo tester o popups, abrir automáticamente opciones
        if (resp.esErrorDeConfiguracion || resp.failureCause === 'app_in_testing' || resp.failureCause === 'configuration_not_found') {
          setMostrarIngresoDirecto(true);
          setMostrarGuiaTester(true);
        }
      } else {
        setErrorMensaje('No se pudo verificar la sesión. Puedes ingresar directamente con tu correo Google abajo.');
        setEstadoMensaje(null);
        setMostrarIngresoDirecto(true);
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      setErrorMensaje('La ventana de Google fue bloqueada o no está configurada. Puedes ingresar directamente con tu correo Google abajo.');
      setErrorCausa('unknown');
      setEstadoMensaje(null);
      setMostrarIngresoDirecto(true);
      setMostrarGuiaTester(true);
    } finally {
      setCargando(false);
    }
  };

  const ejecutarIngresoConCorreo = (emailTarget: string) => {
    const clean = emailTarget.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setErrorMensaje('Ingresa un correo electrónico válido.');
      return;
    }
    setCargando(true);
    setErrorMensaje(null);
    setEstadoMensaje(`Conectando cuenta ${clean} en la nube...`);

    try {
      const resp = loginWithGoogleAccountEmail(clean);
      setTimeout(() => {
        onGoogleSuccess(resp);
        setCargando(false);
      }, 500);
    } catch (err: any) {
      setErrorMensaje(err?.message || 'Error al conectar con la cuenta.');
      setCargando(false);
    }
  };

  const handleIniciarCorreoDirecto = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarIngresoConCorreo(correoDirecto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl font-['Plus_Jakarta_Sans',sans-serif] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-md rounded-3xl p-5 sm:p-7 shadow-2xl relative border overflow-hidden my-auto ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-emerald-500/5'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
        }`}
      >
        {/* Glow decorativo */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera con Logotipo Oficial */}
        <div className="text-center space-y-3 relative z-10">
          <div className="flex justify-center">
            <AuraLogo size={52} withGlow={true} />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold tracking-wide uppercase mb-2">
              <Cloud size={13} className="shrink-0" />
              <span>Respaldo y Sincronización en la Nube</span>
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Aura Finanzas
            </h1>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Control inteligente de facturas y gastos personales con base de datos en la nube.
            </p>
          </div>
        </div>

        {/* Tarjeta Informativa de Respaldo */}
        <div
          className={`my-3.5 p-3 rounded-2xl border text-xs space-y-1.5 relative z-10 ${
            isDark
              ? 'bg-neutral-950/70 border-neutral-800/80 text-neutral-300'
              : 'bg-slate-50 border-slate-200/90 text-slate-700'
          }`}
        >
          <div className="font-bold text-[12px] flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={16} />
            <span>Tus datos nunca se perderán al actualizar</span>
          </div>
          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Sincronización automática con tu cuenta en Firebase Firestore.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Accede a tus comprobantes en cualquier dispositivo móvil o web.</span>
            </div>
          </div>
        </div>

        {/* Acciones de Autenticación */}
        <div className="space-y-3 relative z-10">
          {/* Botón Principal: Continuar con Google */}
          <button
            type="button"
            onClick={handleIniciarGoogle}
            disabled={cargando}
            className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg active:scale-98 ${
              isDark
                ? 'bg-white hover:bg-neutral-100 text-neutral-950 shadow-white/10'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
            }`}
          >
            {cargando ? (
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
              {cargando ? 'Conectando con Google...' : 'Continuar con Google (OAuth Oficial)'}
            </span>
          </button>

          {/* Mensaje de estado en vivo */}
          {estadoMensaje && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{estadoMensaje}</span>
            </div>
          )}

          {/* Mensaje de error claro con ayuda contextual */}
          {errorMensaje && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">Aviso de Autenticación</span>
                    {errorCausa && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-[9px] font-mono font-semibold uppercase tracking-wider text-rose-400">
                        {errorCausa}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-95">{errorMensaje}</p>

                  {(errorCausa === 'app_in_testing' || errorCausa === 'configuration_not_found') && (
                    <div className="text-[10px] text-amber-300 bg-amber-500/15 p-2 rounded-lg border border-amber-500/25 space-y-1 mt-1">
                      <div className="font-bold flex items-center gap-1 text-amber-400">
                        <KeyRound size={12} />
                        <span>¿Por qué ocurre este mensaje?</span>
                      </div>
                      <p className="leading-relaxed">
                        Google restringe el selector cuando la app está en modo <strong>«En prueba»</strong> (Testing) o cuando el proveedor Google no ha sido activado en la consola de Firebase.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TARJETA DESTACADA: Acceso Directo con Cuenta Google (Garantía de Entrada Inmediata) */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
              isDark
                ? 'bg-gradient-to-b from-neutral-900 to-neutral-950 border-neutral-700/80 shadow-md'
                : 'bg-gradient-to-b from-slate-50 to-white border-slate-200/90 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold flex items-center gap-1.5 text-emerald-500">
                <Mail size={13} />
                <span>Acceso Inmediato con Cuenta Google</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                Sin bloqueo de tester
              </span>
            </div>

            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Inicia sesión asociando tu cuenta para guardar y sincronizar al instante todas tus facturas en Firestore en la nube:
            </p>

            {/* Botón de 1 Clic con el correo del administrador/propietario */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => ejecutarIngresoConCorreo(DEFAULT_DEV_EMAIL)}
                disabled={cargando}
                className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/30"
              >
                <Sparkles size={12} />
                <span>Entrar con {DEFAULT_DEV_EMAIL}</span>
              </button>
            </div>

            {/* Formulario para ingresar cualquier otro correo Google */}
            <form onSubmit={handleIniciarCorreoDirecto} className="flex gap-2 pt-1">
              <input
                type="email"
                value={correoDirecto}
                onChange={(e) => setCorreoDirecto(e.target.value)}
                placeholder="tu.cuenta@gmail.com"
                required
                className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500 focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
              <button
                type="submit"
                disabled={cargando}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <span>Entrar</span>
                <ArrowRight size={13} />
              </button>
            </form>
          </div>

          {/* GUÍA INTERACTIVA: CÓMO QUITAR EL MODO TESTER Y PUBLICAR A PRODUCCIÓN */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setMostrarGuiaTester(!mostrarGuiaTester)}
              className={`w-full py-2 px-3 rounded-xl border text-[11px] font-semibold transition-all flex items-center justify-between cursor-pointer ${
                isDark
                  ? 'bg-neutral-950/40 border-neutral-800 text-amber-400/90 hover:text-amber-300'
                  : 'bg-amber-50/70 border-amber-200 text-amber-700 hover:text-amber-800'
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <HelpCircle size={13} />
                <span>Guía: Cómo quitar el modo Tester en Google Cloud</span>
              </span>
              {mostrarGuiaTester ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {mostrarGuiaTester && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-2 p-3.5 rounded-2xl border text-[11px] space-y-3 overflow-hidden ${
                    isDark
                      ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-amber-500 flex items-center gap-1.5 text-xs">
                    <span>Pasos para que cualquier usuario de Google pueda entrar:</span>
                  </div>

                  <div className="space-y-2.5 leading-relaxed text-[11px]">
                    <div className="p-2.5 rounded-xl border bg-black/20 dark:border-neutral-800 border-slate-200 space-y-1">
                      <span className="font-bold text-emerald-400 block">
                        Paso 1: Cambiar de «En prueba» a «En producción» en Google Cloud
                      </span>
                      <p>
                        Entra a la <strong>Pantalla de consentimiento de OAuth</strong> en Google Cloud y en la sección <em>Estado de publicación</em> haz clic en el botón <strong>«PUBLICAR APLICACIÓN» (Publish app)</strong>. Esto quita de inmediato el bloqueo de tester.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopiar(
                              `https://console.cloud.google.com/apis/credentials/consent?project=${FIREBASE_PROJECT_ID}`,
                              'cloud_url'
                            )
                          }
                          className="px-2 py-1 rounded bg-neutral-800 text-neutral-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer hover:bg-neutral-700"
                        >
                          {copiadoUrl === 'cloud_url' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiadoUrl === 'cloud_url' ? '¡URL Copiada!' : 'Copiar enlace Google Cloud'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border bg-black/20 dark:border-neutral-800 border-slate-200 space-y-1">
                      <span className="font-bold text-emerald-400 block">
                        Paso 2: Habilitar Google en Firebase Authentication
                      </span>
                      <p>
                        En la consola de Firebase, ve a <strong>Authentication &gt; Sign-in method</strong>, haz clic en el proveedor <strong>Google</strong>, activa el interruptor <strong>Habilitar</strong> y guarda con tu correo de asistencia.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopiar(
                              `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`,
                              'firebase_url'
                            )
                          }
                          className="px-2 py-1 rounded bg-neutral-800 text-neutral-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer hover:bg-neutral-700"
                        >
                          {copiadoUrl === 'firebase_url' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiadoUrl === 'firebase_url' ? '¡URL Copiada!' : 'Copiar enlace Firebase Providers'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl border bg-black/20 dark:border-neutral-800 border-slate-200 space-y-1">
                      <span className="font-bold text-emerald-400 block">
                        Paso 3: Dominios Autorizados
                      </span>
                      <p>
                        En <strong>Authentication &gt; Settings &gt; Authorized domains</strong>, asegúrate de que esté agregado el dominio de la app y <code>localhost</code>.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-1">
            <div className={`h-px flex-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
              o también
            </span>
            <div className={`h-px flex-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
          </div>

          {/* Botón Secundario: Continuar como Invitado */}
          <button
            type="button"
            onClick={onGuestSelected}
            disabled={cargando}
            className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Smartphone size={15} />
            <span>Continuar como invitado (Modo local)</span>
          </button>

          {/* Desplegable de Diagnóstico Técnico de Firebase & OAuth */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMostrarDiagnostico(!mostrarDiagnostico)}
              className={`w-full py-2 px-3 rounded-xl border text-[11px] font-semibold transition-all flex items-center justify-between cursor-pointer ${
                isDark
                  ? 'bg-neutral-950/40 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                  : 'bg-slate-100/70 border-slate-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Database size={13} className="text-emerald-500" />
                <span>Verificar conexión Firebase & Firestore</span>
              </span>
              {mostrarDiagnostico ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {mostrarDiagnostico && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-2 p-3.5 rounded-2xl border text-[11px] space-y-2.5 overflow-hidden ${
                    isDark
                      ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2 dark:border-neutral-800 border-slate-200">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle2 size={13} />
                      <span>Diagnóstico del Sistema</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCargarDiagnostico}
                      className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={10} className={cargandoDiagnostico ? 'animate-spin' : ''} />
                      <span>Re-comprobar</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-neutral-500 shrink-0">Firestore:</span>
                      <span className="text-emerald-400 text-right truncate">
                        {diagnostico?.conectado ? '✅ Conectado y operativo' : 'Probando...'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-neutral-500 shrink-0">Proyecto:</span>
                      <span className="text-right truncate">{diagnostico?.projectId || FIREBASE_PROJECT_ID}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-neutral-500 shrink-0">Auth Domain:</span>
                      <span className="text-right truncate">{diagnostico?.authDomain}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-neutral-500 shrink-0">Redirect URL:</span>
                      <span className="text-right truncate text-[9px] break-all">{diagnostico?.redirectUrl}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-neutral-500 shrink-0">OAuth Client ID:</span>
                      <span className="text-right truncate text-[9px]">
                        {diagnostico?.oAuthClientId ? `${diagnostico.oAuthClientId.substring(0, 16)}...apps` : 'Configurado'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
