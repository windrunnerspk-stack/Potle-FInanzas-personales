import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Sparkles,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Coins,
  Check
} from 'lucide-react';
import { ModoOperacion, UsuarioConfig } from '../types/finance';
import { guardarConfiguracion } from '../services/storageService';
import { loginWithGoogle } from '../services/firebase';
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
  const [paso, setPaso] = useState<1 | 2>(1);
  const [moneda, setMoneda] = useState(config.moneda || 'COP');
  const [email, setEmail] = useState(config.email || '');
  const [modo, setModo] = useState<ModoOperacion>(config.modo || 'sincronizado');
  const [iniciandoGoogle, setIniciandoGoogle] = useState(false);
  const [googleSuccess, setGoogleSuccess] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleGoogleSignIn = async () => {
    setIniciandoGoogle(true);
    setErrorMensaje('');
    try {
      const resp = await loginWithGoogle();
      if (resp.success && resp.email) {
        setEmail(resp.email);
        setGoogleSuccess(true);
        setModo('sincronizado');
      } else if (resp.error) {
        setErrorMensaje(resp.error);
      }
    } catch (err: any) {
      setErrorMensaje('No se pudo abrir la ventana de Google. Ingresa tu correo manualmente.');
    } finally {
      setIniciandoGoogle(false);
    }
  };

  const handleFinalizar = (omitirEmail: boolean = false) => {
    let emailFinal = email.trim();
    if (omitirEmail) {
      emailFinal = '';
    } else if (emailFinal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFinal)) {
      setErrorMensaje('Por favor ingresa un correo electrónico válido o presiona "Omitir por ahora"');
      return;
    }

    const updated = guardarConfiguracion({
      moneda,
      email: emailFinal,
      modo: emailFinal ? modo : 'local',
      onboarding_completado: true,
      ultima_sincronizacion: new Date().toISOString(),
    });
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
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
        {/* Cabecera común de bienvenida */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-inherit/20">
          <div className="flex items-center gap-2.5">
            <AuraLogo size={36} withGlow={true} />
            <div>
              <h2 className={`text-base font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Aura Finanzas
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Paso {paso} de 2
                </span>
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {paso === 1 ? 'Configuración de Moneda' : 'Respaldo & Sincronización'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${paso === 1 ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-emerald-600'}`} />
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${paso === 2 ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : isDark ? 'bg-neutral-700' : 'bg-slate-300'}`} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ================= PASO 1: SELECCIONAR MONEDA ================= */}
          {paso === 1 && (
            <motion.div
              key="paso-1"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
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
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[48vh] overflow-y-auto pr-1 no-scrollbar">
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

              <button
                type="button"
                onClick={() => setPaso(2)}
                className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <span>Continuar a Configurar Correo</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ================= PASO 2: CONFIGURA TU CORREO ================= */}
          {paso === 2 && (
            <motion.div
              key="paso-2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Mail size={18} className="text-emerald-500" />
                  <span>Configura tu correo electrónico</span>
                </h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                  Tu correo te permite <strong>respaldar tus facturas</strong>, vincularte directamente con tu <strong>Google Sheet</strong> y sincronizar tus comprobantes de manera segura en la nube para no perder tu información.
                </p>
              </div>

              {/* Opción 1: Iniciar Sesión con Google */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={iniciandoGoogle}
                  className={`w-full py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs ${
                    googleSuccess
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                      : isDark
                      ? 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-white'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
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
                  <span>
                    {iniciandoGoogle
                      ? 'Conectando con Google...'
                      : googleSuccess
                      ? `Conectado como ${email}`
                      : 'Iniciar sesión con Google'}
                  </span>
                  {googleSuccess && <CheckCircle2 size={15} className="text-emerald-500" />}
                </button>

                <div className="flex items-center gap-2 my-2">
                  <div className={`h-px flex-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                    o ingresa tu correo
                  </span>
                  <div className={`h-px flex-1 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                </div>

                {/* Opción 2: Ingresar correo manual */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setGoogleSuccess(false);
                    setErrorMensaje('');
                  }}
                  placeholder="ejemplo@gmail.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                    isDark
                      ? 'bg-neutral-950 text-white placeholder-neutral-500 border-neutral-800 focus:border-emerald-500'
                      : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-emerald-500'
                  }`}
                />
              </div>

              {errorMensaje && (
                <p className="text-rose-500 text-xs">{errorMensaje}</p>
              )}

              {/* Botones de acción solicitados */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleFinalizar(false)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Check size={15} className="stroke-[3]" />
                  <span>Guardar y Comenzar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinalizar(true)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                    isDark
                      ? 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>Omitir por ahora / Decidir después</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className={`text-[11px] font-medium flex items-center gap-1 mx-auto transition-colors cursor-pointer ${
                      isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ArrowLeft size={12} />
                    <span>Volver a cambiar moneda ({moneda})</span>
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
