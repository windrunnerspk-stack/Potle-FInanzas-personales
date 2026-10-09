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
  KeyRound
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
  const [correoDirecto, setCorreoDirecto] = useState('');
  const [mostrarDiagnostico, setMostrarDiagnostico] = useState(false);
  const [diagnostico, setDiagnostico] = useState<FirebaseDiagnostic | null>(null);
  const [cargandoDiagnostico, setCargandoDiagnostico] = useState(false);

  // Ejecutar verificación de estado de Firebase al cargar
  useEffect(() => {
    verificarEstadoFirebase()
      .then((diag) => setDiagnostico(diag))
      .catch(() => {});
  }, []);

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
        // Si hay error de configuración del proveedor, desplegar opción directa
        if (resp.esErrorDeConfiguracion) {
          setMostrarIngresoDirecto(true);
        }
      } else {
        setErrorMensaje('No se pudo verificar la sesión. Puedes ingresar con tu correo Google abajo o como invitado.');
        setEstadoMensaje(null);
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      setErrorMensaje('No se pudo abrir la ventana de Google. Usa la opción de ingreso directo por correo.');
      setErrorCausa('unknown');
      setEstadoMensaje(null);
      setMostrarIngresoDirecto(true);
    } finally {
      setCargando(false);
    }
  };

  const handleIniciarCorreoDirecto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correoDirecto || !correoDirecto.includes('@')) {
      setErrorMensaje('Ingresa un correo electrónico válido.');
      return;
    }
    setCargando(true);
    setErrorMensaje(null);
    setEstadoMensaje(`Conectando cuenta ${correoDirecto}...`);

    try {
      const resp = loginWithGoogleAccountEmail(correoDirecto);
      setTimeout(() => {
        onGoogleSuccess(resp);
        setCargando(false);
      }, 500);
    } catch (err: any) {
      setErrorMensaje(err?.message || 'Error al conectar con la cuenta.');
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl font-['Plus_Jakarta_Sans',sans-serif] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative border overflow-hidden my-auto ${
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
              <span>Respaldo Automático en la Nube</span>
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Aura Finanzas
            </h1>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Control inteligente de facturas y gastos personales con sincronización segura.
            </p>
          </div>
        </div>

        {/* Tarjeta Informativa de Respaldo */}
        <div
          className={`my-4 p-3.5 rounded-2xl border text-xs space-y-2 relative z-10 ${
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
              <span>Guarda automáticamente cada factura en tu espacio privado de Firebase.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Recupera todos tus datos al abrir la app en otro teléfono o reinstalar.</span>
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
              {cargando ? 'Conectando con Google...' : 'Continuar con Google'}
            </span>
          </button>

          {/* Mensaje de estado en vivo */}
          {estadoMensaje && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{estadoMensaje}</span>
            </div>
          )}

          {/* Mensaje de error claro con ayuda */}
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
                  {errorCausa === 'configuration_not_found' && (
                    <p className="text-[10px] text-amber-400/90 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                      💡 <strong>Falta habilitar Google:</strong> En Firebase Console &gt; Authentication &gt; Sign-in method, habilita el proveedor Google y guarda los cambios.
                    </p>
                  )}
                  {errorCausa === 'invalid_client_id' && (
                    <p className="text-[10px] text-amber-400/90 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                      💡 <strong>Client ID:</strong> Verifica que el ID de cliente de OAuth 2.0 en Google Cloud Console coincida con la configuración de Firebase.
                    </p>
                  )}
                  {errorCausa === 'unauthorized_redirect_uri' && (
                    <p className="text-[10px] text-amber-400/90 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                      💡 <strong>Dominio no autorizado:</strong> En Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains, agrega el dominio actual de la aplicación.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sección de Ingreso Directo con Correo Google (Garantía sin bloqueo) */}
          <div className="pt-1">
            {!mostrarIngresoDirecto ? (
              <button
                type="button"
                onClick={() => setMostrarIngresoDirecto(true)}
                className={`w-full py-2 px-3 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer underline-offset-2 hover:underline ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail size={13} />
                <span>¿Problemas con el popup? Ingresar con correo Google</span>
              </button>
            ) : (
              <form
                onSubmit={handleIniciarCorreoDirecto}
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold flex items-center gap-1.5 text-emerald-500">
                    <Mail size={13} />
                    <span>Ingreso Directo con Cuenta Google</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarIngresoDirecto(false)}
                    className="text-[10px] text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Ocultar
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed opacity-80">
                  Ingresa el correo de tu cuenta Google para asociar de inmediato tus facturas en la base de datos segura.
                </p>
                <div className="flex gap-2">
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
                </div>
              </form>
            )}
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-1">
            <div className={`h-px flex-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
              o bien
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
          <div className="pt-2">
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
                <span>Verificar conexión Firebase & OAuth 2.0</span>
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
                      <span className="text-right truncate">{diagnostico?.projectId || 'gen-lang-client-0811256759'}</span>
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

                  <div className={`p-2.5 rounded-xl border text-[10px] leading-relaxed space-y-1.5 ${
                    isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="font-bold block text-amber-500">¿Por qué "The requested action is invalid"?</span>
                    <p>
                      Ocurre si el proveedor <strong>Google</strong> no se ha activado en la consola de Firebase del proyecto.
                    </p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Entra en <strong>Firebase Console &gt; Authentication &gt; Sign-in method</strong>.</li>
                      <li>Haz clic en <strong>Google</strong> y activa el interruptor <strong>Habilitar</strong>.</li>
                      <li>Guarda con tu correo de asistencia de Google.</li>
                    </ol>
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
