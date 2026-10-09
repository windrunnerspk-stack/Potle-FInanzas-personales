import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, Check, ArrowRight, UserCheck } from 'lucide-react';
import { UsuarioConfig } from '../types/finance';
import { guardarConfiguracion } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import { AuraLogo } from './AuraLogo';

interface CurrencySelectModalProps {
  config: UsuarioConfig;
  userEmail?: string | null;
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

export const CurrencySelectModal: React.FC<CurrencySelectModalProps> = ({
  config,
  userEmail,
  onComplete,
}) => {
  const { isDark } = useTheme();
  const [moneda, setMoneda] = useState(config.moneda || 'COP');

  const handleGuardar = () => {
    const updated = guardarConfiguracion({
      moneda,
      onboarding_completado: true,
      ultima_sincronizacion: new Date().toISOString(),
    });
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative border overflow-hidden ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-inherit/20">
          <AuraLogo size={36} withGlow={true} />
          <div>
            <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Configuración Inicial
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              Paso final antes de entrar a la aplicación
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Coins size={18} className="text-emerald-500" />
              <span>Selecciona tu moneda principal</span>
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
              Define la divisa en la que se registrarán tus facturas y se calcularán tus balances y reportes.
            </p>
            {userEmail && (
              <div className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <UserCheck size={13} />
                <span>Conectado como {userEmail}</span>
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

          <button
            type="button"
            onClick={handleGuardar}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <span>Guardar y Entrar a Aura Finanzas</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
