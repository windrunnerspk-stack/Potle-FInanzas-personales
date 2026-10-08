import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, AlertTriangle, CheckCircle2, X, Trash2 } from 'lucide-react';
import { reiniciarDatosACero, obtenerGastos } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCompletado: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onResetCompletado,
}) => {
  const { isDark } = useTheme();
  const [confirmando, setConfirmando] = useState(false);
  const [reiniciado, setReiniciado] = useState(false);
  const totalActual = obtenerGastos().length;

  if (!isOpen) return null;

  const handleEjecutarReset = () => {
    reiniciarDatosACero();
    setReiniciado(true);
    setTimeout(() => {
      onResetCompletado();
      onClose();
      setReiniciado(false);
      setConfirmando(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-xl transition-colors ${
            isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <X size={18} />
        </button>

        {reiniciado ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-bold text-base">¡Listo! Datos reiniciados a cero</h3>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              La app está limpia y lista para que registres tus propias facturas reales.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Reiniciar aplicación a 0</h3>
                <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Empezar de cero sin datos de prueba
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-black/30 border-rose-500/30 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <p className="leading-relaxed text-[11px]">
                  Esto eliminará las <strong>{totalActual} facturas de ejemplo</strong> guardadas y dejará la aplicación completamente vacía lista para tu uso diario.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  isDark ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarReset}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 size={14} />
                <span>Borrar y Empezar a 0</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
