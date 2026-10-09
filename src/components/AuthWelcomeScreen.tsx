import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Cloud,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { loginWithGoogle, auth } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { AuraLogo } from './AuraLogo';
import { User } from 'firebase/auth';

interface AuthWelcomeScreenProps {
  onGoogleSuccess: (user: User) => void;
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

  const handleIniciarGoogle = async () => {
    setCargando(true);
    setErrorMensaje(null);
    setEstadoMensaje('Abriendo selector de cuentas de Google...');

    try {
      const resp = await loginWithGoogle();
      if (resp.success && auth.currentUser) {
        setEstadoMensaje(`¡Bienvenido! Conectando cuenta ${resp.email || ''}...`);
        setTimeout(() => {
          onGoogleSuccess(auth.currentUser!);
        }, 600);
      } else if (resp.error) {
        setErrorMensaje(resp.error);
        setEstadoMensaje(null);
      } else {
        setErrorMensaje('No se pudo verificar la sesión. Intenta nuevamente o continúa como invitado.');
        setEstadoMensaje(null);
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMensaje('Error de conexión con Google. Revisa tu conexión o continúa como invitado.');
      setEstadoMensaje(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative border overflow-hidden ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-emerald-500/5'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
        }`}
      >
        {/* Glow de fondo decorativo */}
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

        {/* Tarjeta Informativa de Sincronización */}
        <div
          className={`my-5 p-4 rounded-2xl border text-xs space-y-2.5 relative z-10 ${
            isDark
              ? 'bg-neutral-950/70 border-neutral-800/80 text-neutral-300'
              : 'bg-slate-50 border-slate-200/90 text-slate-700'
          }`}
        >
          <div className="font-bold text-[12px] flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={16} />
            <span>Tus datos nunca se perderán al actualizar</span>
          </div>
          <div className="space-y-1.5 text-[11px] leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Guarda automáticamente cada factura en tu cuenta privada de Google.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Recupera todos tus datos al abrir la app en otro teléfono o reinstalar.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Protección total: Solo tú tienes acceso a tus comprobantes.</span>
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

          {/* Mensaje de error claro */}
          {errorMensaje && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">No se pudo iniciar sesión</span>
                <p className="text-[11px] opacity-90">{errorMensaje}</p>
              </div>
            </div>
          )}

          {/* Divisor estético */}
          <div className="flex items-center gap-3 my-2">
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

          <p className={`text-[10px] text-center leading-normal pt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
            En modo invitado los datos se guardan únicamente en la memoria de este teléfono. Podrás conectar tu cuenta de Google más adelante desde Ajustes.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
