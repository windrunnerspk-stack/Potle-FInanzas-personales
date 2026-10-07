import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, HardDrive, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { ModoOperacion, UsuarioConfig } from '../types/finance';
import { guardarConfiguracion } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface OnboardingModalProps {
  config: UsuarioConfig;
  onComplete: (updated: UsuarioConfig) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ config, onComplete }) => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState(config.email || '');
  const [modo, setModo] = useState<ModoOperacion>(config.modo || 'sincronizado');
  const [errorEmail, setErrorEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorEmail('Por favor ingresa un correo electrónico válido');
      return;
    }
    setErrorEmail('');

    const updated = guardarConfiguracion({
      email,
      modo,
      onboarding_completado: true,
      ultima_sincronizacion: new Date().toISOString(),
    });
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden relative border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black shadow-md">
              ⚡
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Aura Finance
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Offline First
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Control de Facturas & Gastos
              </p>
            </div>
          </div>

          <p className={`text-sm mt-2 mb-5 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
            Bienvenido. Elige cómo prefieres gestionar tus finanzas y registrar tus comprobantes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all ${
                  isDark
                    ? `bg-neutral-950 text-white placeholder-neutral-500 ${
                        errorEmail ? 'border-rose-500' : 'border-neutral-800 focus:border-emerald-500'
                      }`
                    : `bg-slate-50 text-slate-900 placeholder-slate-400 ${
                        errorEmail ? 'border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                      }`
                }`}
              />
              {errorEmail && <p className="text-rose-500 text-xs mt-1">{errorEmail}</p>}
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Modo de Operación
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {/* Modo Sincronizado */}
                <div
                  onClick={() => setModo('sincronizado')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    modo === 'sincronizado'
                      ? isDark
                        ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs'
                      : isDark
                      ? 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        modo === 'sincronizado'
                          ? 'bg-emerald-500 text-neutral-950'
                          : isDark
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <RefreshCw size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Modo Sincronizado
                        </span>
                        {modo === 'sincronizado' && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        Tus facturas se guardan en el teléfono (SQLite), se respaldan automáticamente en una Hoja de Cálculo de Google (Google Sheets) vinculada y recibes un resumen por correo de cada gasto.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modo Local */}
                <div
                  onClick={() => setModo('local')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    modo === 'local'
                      ? isDark
                        ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs'
                      : isDark
                      ? 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        modo === 'local'
                          ? 'bg-emerald-500 text-neutral-950'
                          : isDark
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <HardDrive size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Modo Local (100% en dispositivo)
                        </span>
                        {modo === 'local' && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        Los datos se almacenan exclusivamente en el dispositivo con SQLite. Cero sincronización en la nube para privacidad total y uso sin internet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de privacidad */}
            <div
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-[11px] ${
                isDark
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong className={isDark ? 'text-neutral-300' : 'text-slate-800'}>
                  Privacidad garantizada:
                </strong>{' '}
                Tu correo sólo se utiliza para identificar tu hoja de cálculo privada y emitir tus resúmenes. No compartimos tus datos.
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>Comenzar</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
