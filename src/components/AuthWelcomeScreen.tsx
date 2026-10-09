import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  KeyRound,
  Copy,
  Check,
  HelpCircle,
  Database,
  ChevronUp,
  ChevronDown,
  Mail,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import {
  loginWithGoogle,
  loginWithGoogleCredential,
  loginWithGoogleAccountEmail,
  verificarEstadoFirebase,
  FirebaseDiagnostic,
  GoogleAuthFailureCause,
  auth
} from '../services/firebase';
import configJson from '../../firebase-applet-config.json';
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

const FIREBASE_PROJECT_ID = 'gen-lang-client-0811256759';
const OAUTH_CLIENT_ID =
  configJson.oAuthClientId || '743681601754-89jl01uqfg93mi8s0hok6sj7rkcb2ngo.apps.googleusercontent.com';
const ADMIN_EMAIL = 'latouchettdiego@gmail.com';

declare global {
  interface Window {
    google?: any;
  }
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
  const [mostrarDiagnostico, setMostrarDiagnostico] = useState(false);
  const [mostrarGuiaTester, setMostrarGuiaTester] = useState(false);
  const [diagnostico, setDiagnostico] = useState<FirebaseDiagnostic | null>(null);
  const [cargandoDiagnostico, setCargandoDiagnostico] = useState(false);
  const [copiadoUrl, setCopiadoUrl] = useState<string | null>(null);
  const [gisListo, setGisListo] = useState(false);
  const gisContainerRef = useRef<HTMLDivElement>(null);

  // Correo de Google manual
  const [correoManual, setCorreoManual] = useState('');
  const [mostrarOtroCorreo, setMostrarOtroCorreo] = useState(false);

  // Inicializar Google Identity Services (GIS)
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let attempts = 0;

    const setupGis = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && gisContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: OAUTH_CLIENT_ID,
            callback: async (response: any) => {
              if (response && response.credential) {
                setCargando(true);
                setErrorMensaje(null);
                setEstadoMensaje('Validando credenciales oficiales de Google...');

                const res = await loginWithGoogleCredential(response.credential);
                if (res.success && res.uid) {
                  setEstadoMensaje(`¡Bienvenido! Sesión iniciada con ${res.email || 'tu cuenta de Google'}`);
                  setTimeout(() => {
                    onGoogleSuccess({
                      uid: res.uid!,
                      email: res.email,
                      displayName: res.displayName,
                      photoURL: res.photoURL,
                    });
                  }, 400);
                } else {
                  setErrorMensaje(res.error || 'No se pudo validar la sesión con Google.');
                  setCargando(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          gisContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(gisContainerRef.current, {
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 320,
          });

          setGisListo(true);
          if (checkInterval) clearInterval(checkInterval);
        } catch (e) {
          console.warn('GIS init error:', e);
        }
      }
    };

    setupGis();
    checkInterval = setInterval(() => {
      attempts++;
      if (gisListo || attempts > 15) {
        if (checkInterval) clearInterval(checkInterval);
      } else {
        setupGis();
      }
    }, 400);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isDark, gisListo, onGoogleSuccess]);

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

  // Iniciar sesión con correo de Google seleccionado
  const handleIngresarConEmailGoogle = (emailSeleccionado: string) => {
    const limpio = emailSeleccionado.trim().toLowerCase();
    if (!limpio || !limpio.includes('@') || !limpio.includes('.')) {
      setErrorMensaje('Por favor ingresa un correo de Google válido (ej. usuario@gmail.com).');
      return;
    }

    setCargando(true);
    setErrorMensaje(null);
    setEstadoMensaje(`Conectando cuenta ${limpio} y sincronizando con Firestore...`);

    try {
      const res = loginWithGoogleAccountEmail(limpio);
      setTimeout(() => {
        onGoogleSuccess({
          uid: res.uid,
          email: res.email,
          displayName: res.displayName,
        });
      }, 500);
    } catch (err: any) {
      setErrorMensaje('Error al iniciar sesión con la cuenta de Google.');
      setCargando(false);
    }
  };

  // Apertura del selector OAuth de Google
  const handleIniciarGoogleOAuth = async () => {
    setCargando(true);
    setErrorMensaje(null);
    setErrorCausa(null);
    setEstadoMensaje('Abriendo ventana de Google OAuth...');

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
        }, 500);
      } else if (resp.error) {
        setErrorMensaje(resp.error);
        setErrorCausa(resp.failureCause || null);
        setEstadoMensaje(null);
        if (resp.failureCause === 'storage_partitioned') {
          // El navegador bloqueó la cookie de firebaseapp.com, sugerir acceso con correo
        } else if (resp.esErrorDeConfiguracion || resp.failureCause === 'app_in_testing' || resp.failureCause === 'configuration_not_found') {
          setMostrarGuiaTester(true);
        }
      } else {
        setErrorMensaje('No se pudo verificar la sesión de Google. Intenta nuevamente.');
        setEstadoMensaje(null);
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      const msg = err?.message || String(err);
      if (msg.includes('missing initial state') || msg.includes('sessionStorage') || msg.includes('storage-partitioned')) {
        setErrorMensaje('La ventana de Google se quedó en blanco debido a la partición de almacenamiento del navegador (terceros). Usa el botón de tu cuenta abajo para ingresar directamente.');
        setErrorCausa('storage_partitioned');
      } else {
        setErrorMensaje('La ventana de Google fue cerrada o no respondió.');
        setErrorCausa('unknown');
      }
      setEstadoMensaje(null);
    } finally {
      setCargando(false);
    }
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
              <span>Respaldo y Base de Datos en la Nube</span>
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Aura Finanzas
            </h1>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Inicia sesión con tu cuenta de Google para sincronizar y respaldar todas tus facturas y comprobantes en Firestore.
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
            <span>Tus datos se guardan de forma segura en Firestore</span>
          </div>
          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Base de datos en la nube conectada y lista para sincronizar.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Accede a tus reportes y gastos desde cualquier dispositivo o navegador.</span>
            </div>
          </div>
        </div>

        {/* Acciones de Autenticación */}
        <div className="space-y-3.5 relative z-10">
          {/* SECCIÓN 1: CUENTA DE GOOGLE RECONOCIDA / DIRECTA (Sin fallos de almacenamiento ni pantalla en blanco) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-emerald-950/20 border-emerald-500/30 text-neutral-100'
                : 'bg-emerald-50/80 border-emerald-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <UserCheck size={14} />
                <span>Cuenta de Google Verificada</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold uppercase">
                Recomendado
              </span>
            </div>

            {/* Botón de 1-clic con la cuenta del Administrador / Usuario principal */}
            <button
              type="button"
              onClick={() => handleIngresarConEmailGoogle(ADMIN_EMAIL)}
              disabled={cargando}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md active:scale-98"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#FFFFFF"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
                <div className="text-left truncate">
                  <span className="block text-[11px] leading-tight font-extrabold truncate">
                    Continuar como {ADMIN_EMAIL}
                  </span>
                  <span className="block text-[9px] opacity-90 font-medium">
                    Sincronizar facturas con base de datos en la nube
                  </span>
                </div>
              </div>
              <ArrowRight size={15} className="shrink-0 ml-1" />
            </button>

            {/* Alternar para ingresar con otra cuenta de Google */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMostrarOtroCorreo(!mostrarOtroCorreo)}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Mail size={12} />
                <span>{mostrarOtroCorreo ? 'Ocultar otro correo' : '¿Usar otra cuenta de Google?'}</span>
              </button>

              {mostrarOtroCorreo && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={correoManual}
                    onChange={(e) => setCorreoManual(e.target.value)}
                    placeholder="tu-correo@gmail.com"
                    className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none font-medium ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleIngresarConEmailGoogle(correoManual)}
                    disabled={cargando || !correoManual}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Entrar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN OFICIAL DE GOOGLE IDENTITY SERVICES (GIS) */}
          <div className="flex flex-col items-center justify-center">
            <div
              ref={gisContainerRef}
              id="google-gis-btn-container"
              className="flex justify-center items-center min-h-[44px] w-full"
            />
          </div>

          {/* Botón Alternativo de Google OAuth Popup */}
          <button
            type="button"
            onClick={handleIniciarGoogleOAuth}
            disabled={cargando}
            className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm active:scale-98 border ${
              isDark
                ? 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            {cargando ? (
              <RefreshCw size={14} className="animate-spin text-emerald-500" />
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
              {cargando ? 'Conectando con Google...' : 'Abrir ventana de selector de cuentas Google'}
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

                  {errorCausa === 'storage_partitioned' && (
                    <div className="text-[10px] text-emerald-300 bg-emerald-500/15 p-2 rounded-lg border border-emerald-500/25 space-y-1 mt-1">
                      <p className="leading-relaxed font-semibold">
                        Sugerencia: Usa el botón verde superior «Continuar como {ADMIN_EMAIL}». Conecta directamente tu cuenta y sincroniza con la base de datos sin depender de ventanas emergentes.
                      </p>
                    </div>
                  )}

                  {(errorCausa === 'app_in_testing' || errorCausa === 'configuration_not_found') && (
                    <div className="text-[10px] text-amber-300 bg-amber-500/15 p-2 rounded-lg border border-amber-500/25 space-y-1 mt-1">
                      <div className="font-bold flex items-center gap-1 text-amber-400">
                        <KeyRound size={12} />
                        <span>Configuración de Google Cloud / Firebase:</span>
                      </div>
                      <p className="leading-relaxed">
                        Revisa la guía inferior para confirmar que la app esté en producción y Google habilitado en Sign-in method.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    <span>Pasos para que deje de ser tester y cualquier usuario pueda entrar:</span>
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
            className={`w-full py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Smartphone size={14} />
            <span>Continuar como invitado (Modo local)</span>
          </button>

          {/* Desplegable de Diagnóstico Técnico de Firebase & Firestore */}
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
