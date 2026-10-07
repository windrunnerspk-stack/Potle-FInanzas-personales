import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Plus, Smartphone, FileText } from 'lucide-react';
import { formatearMoneda } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface WidgetPreviewProps {
  totalMes: number;
  totalAnio: number;
  onQuickAdd: () => void;
  onQuickScan: () => void;
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  totalMes,
  onQuickAdd,
  onQuickScan,
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`p-4 rounded-3xl border shadow-sm transition-colors space-y-4 ${
        isDark
          ? 'bg-neutral-900/90 border-neutral-800 text-white'
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Widgets Android (Material You)
          </h4>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
          Android Nativo
        </span>
      </div>

      <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
        Acceso ultra-rápido directo desde tu pantalla de inicio sin abrir la app para registrar facturas al instante.
      </p>

      {/* Galería de Widgets interactivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Widget 1: Resumen de Gasto Mensual + Acciones */}
        <div
          className={`p-4 border transition-all relative overflow-hidden rounded-[26px] ${
            isDark
              ? 'bg-[#181924] border-neutral-800 shadow-lg text-white'
              : 'bg-slate-50 border-slate-200 shadow-sm text-slate-900'
          }`}
        >
          <div
            className={`flex items-center justify-between text-[11px] font-semibold mb-2 ${
              isDark ? 'text-neutral-400' : 'text-slate-500'
            }`}
          >
            <span
              className={`flex items-center gap-1.5 font-bold ${
                isDark ? 'text-neutral-200' : 'text-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-emerald-500'}`} />
              Aura Finanzas
            </span>
            <span className="font-mono text-[10px]">Octubre 2026</span>
          </div>

          <div
            className={`text-xl font-extrabold font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {formatearMoneda(totalMes)}
          </div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Total acumulado del mes
          </p>

          <div
            className={`flex items-center gap-2 mt-4 pt-3 border-t ${
              isDark ? 'border-neutral-800' : 'border-slate-200'
            }`}
          >
            <button
              onClick={onQuickScan}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                isDark
                  ? 'bg-neutral-100 hover:bg-white text-neutral-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <Camera size={13} />
              <span>Escanear</span>
            </button>
            <button
              onClick={onQuickAdd}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Plus size={13} />
              <span>Factura</span>
            </button>
          </div>
        </div>

        {/* Widget 2: Acciones Rápidas */}
        <div
          className={`p-4 border transition-all flex flex-col justify-between rounded-[26px] ${
            isDark
              ? 'bg-neutral-950 border-neutral-800 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              Atajos Rápidos Android
            </span>
            <h5 className={`text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Registrar en 3 segundos
            </h5>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              Guarda comprobantes de Gasolina, Mercado o Almuerzo sin demoras.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={onQuickScan}
              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center group cursor-pointer active:scale-95 transition-all ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-neutral-800 text-neutral-200'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <Camera size={16} />
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Escanear
              </span>
            </button>

            <button
              onClick={onQuickAdd}
              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center group cursor-pointer active:scale-95 transition-all ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-neutral-800 text-neutral-200'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <Plus size={16} />
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Nueva Factura
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
