import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  Mail,
  RefreshCw,
  CheckCircle2,
  X
} from 'lucide-react';
import { Gasto, UsuarioConfig } from '../types/finance';
import { sincronizarTodoConGoogleSheets, formatearMoneda } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface SyncSheetModalProps {
  gastos: Gasto[];
  config: UsuarioConfig;
  onClose: () => void;
  onSynced: () => void;
}

export const SyncSheetModal: React.FC<SyncSheetModalProps> = ({
  gastos,
  config,
  onClose,
  onSynced,
}) => {
  const { isDark } = useTheme();
  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [pestaña, setPestaña] = useState<'sheet' | 'email'>('sheet');

  const pendientes = gastos.filter((g) => !g.sincronizado).length;

  const handleSincronizarAhora = () => {
    setSincronizando(true);
    setTimeout(() => {
      const res = sincronizarTodoConGoogleSheets();
      setSincronizando(false);
      setMensajeExito(res.resumen);
      onSynced();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-xl rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Google Sheets & Resúmenes por Correo
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Sincronización en Segundo Plano • Worker Offline-First
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
              isDark
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className={`py-3 px-4 my-3 rounded-2xl border flex items-center justify-between ${
            isDark
              ? 'bg-neutral-950/80 border-neutral-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                Modo Actual:
              </span>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                {config.modo === 'sincronizado' ? 'Sincronizado Activo' : 'Modo Local'}
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              Email vinculado:{' '}
              <strong className={isDark ? 'text-neutral-300' : 'text-slate-800'}>
                {config.email}
              </strong>
            </p>
          </div>

          <button
            onClick={handleSincronizarAhora}
            disabled={sincronizando}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} />
            <span>{sincronizando ? 'Sincronizando...' : `Subir (${pendientes} pendientes)`}</span>
          </button>
        </div>

        {mensajeExito && (
          <div
            className={`mb-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        <div
          className={`flex items-center gap-2 border-b pb-2 ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <button
            onClick={() => setPestaña('sheet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              pestaña === 'sheet'
                ? isDark
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-slate-100 text-slate-900 border border-slate-300 font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Vista Hoja de Cálculo (Google Sheets)</span>
          </button>
          <button
            onClick={() => setPestaña('email')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              pestaña === 'email'
                ? isDark
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-slate-100 text-slate-900 border border-slate-300 font-bold'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail size={14} className="text-cyan-600" />
            <span>Previsualización de Notificación Email</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {pestaña === 'sheet' ? (
            <div className="space-y-2">
              <div
                className={`flex items-center justify-between text-xs px-1 ${
                  isDark ? 'text-neutral-400' : 'text-slate-500'
                }`}
              >
                <span>Tabla de datos sincronizada: Gastos_Personales_2026</span>
                <span className="font-mono text-emerald-600 font-semibold">{gastos.length} filas</span>
              </div>

              <div
                className={`border rounded-2xl overflow-hidden text-xs ${
                  isDark ? 'border-neutral-800 bg-neutral-950' : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`font-mono text-[11px] border-b ${
                          isDark
                            ? 'bg-neutral-800/80 text-neutral-300 border-neutral-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <th className="p-2 border-r border-inherit">A: Fecha</th>
                        <th className="p-2 border-r border-inherit">B: Hora</th>
                        <th className="p-2 border-r border-inherit">C: Establecimiento</th>
                        <th className="p-2 border-r border-inherit">D: NIT</th>
                        <th className="p-2 border-r border-inherit">E: Categoría</th>
                        <th className="p-2 border-r border-inherit">F: Método</th>
                        <th className="p-2 border-r border-inherit">G: Ciudad</th>
                        <th className="p-2 text-right">H: Total</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y font-sans ${
                        isDark ? 'divide-neutral-800' : 'divide-slate-200'
                      }`}
                    >
                      {gastos.slice(0, 7).map((g) => (
                        <tr
                          key={g.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-neutral-900/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className={`p-2 border-r font-mono ${isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-slate-200 text-slate-600'}`}>{g.fecha}</td>
                          <td className={`p-2 border-r font-mono ${isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-slate-200 text-slate-600'}`}>{g.hora}</td>
                          <td className={`p-2 border-r font-medium ${isDark ? 'border-neutral-800/80 text-white' : 'border-slate-200 text-slate-900'}`}>{g.establecimiento}</td>
                          <td className={`p-2 border-r font-mono ${isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-slate-200 text-slate-600'}`}>{g.nit}</td>
                          <td className={`p-2 border-r ${isDark ? 'border-neutral-800/80 text-emerald-400' : 'border-slate-200 text-emerald-700 font-medium'}`}>{g.categoria}</td>
                          <td className={`p-2 border-r ${isDark ? 'border-neutral-800/80 text-neutral-300' : 'border-slate-200 text-slate-700'}`}>{g.metodo_pago}</td>
                          <td className={`p-2 border-r ${isDark ? 'border-neutral-800/80 text-neutral-300' : 'border-slate-200 text-slate-700'}`}>{g.ciudad}</td>
                          <td className={`p-2 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatearMoneda(g.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-3 ${
                isDark
                  ? 'bg-neutral-950 border-neutral-800'
                  : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              <div
                className={`pb-2 border-b space-y-1 ${
                  isDark ? 'border-neutral-800 text-neutral-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                <div>De: <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>notificaciones@aurafinance.app</span></div>
                <div>Para: <span className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'}`}>{config.email}</span></div>
                <div>Asunto: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Resumen de Factura Registrada - Estación Terpel Calle 100 ($145.000 COP)</span></div>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Comprobante de Factura
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-mono text-[10px] font-semibold">
                    Sincronizado a Sheets
                  </span>
                </div>

                <p>
                  Hola, se ha registrado y respaldado exitosamente tu compra en la hoja de cálculo vinculada:
                </p>

                <div
                  className={`p-3 rounded-lg space-y-1.5 font-mono text-[11px] ${
                    isDark ? 'bg-neutral-950' : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Establecimiento:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>Estación Terpel Calle 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>NIT Fiscal:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>860.005.224-6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Fecha y Hora:</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>2026-10-06 08:45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Categoría:</span>
                    <span className="text-emerald-600 font-bold">Gasolina</span>
                  </div>
                  <div
                    className={`flex justify-between border-t pt-1 ${
                      isDark ? 'border-neutral-800' : 'border-slate-200'
                    }`}
                  >
                    <span className={`font-bold ${isDark ? 'text-neutral-300' : 'text-slate-800'}`}>Monto Total:</span>
                    <span className="text-emerald-600 font-bold">$ 145.000 COP</span>
                  </div>
                </div>

                <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Puedes consultar el historial completo en cualquier momento desde tu dispositivo incluso sin internet.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
