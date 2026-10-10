import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  CreditCard,
  MapPin,
  Clock,
  Building2,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Gasto, CategoriaGasto } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { formatearMoneda } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface ExpenseCalendarProps {
  gastos: Gasto[];
  onSelectGasto?: (gasto: Gasto) => void;
}

export const ExpenseCalendar: React.FC<ExpenseCalendarProps> = ({ gastos }) => {
  const { isDark } = useTheme();
  const fechaActual = new Date();
  const [anio, setAnio] = useState(fechaActual.getFullYear());
  const [mes, setMes] = useState(fechaActual.getMonth()); // 0-indexed
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Agrupar gastos por fecha YYYY-MM-DD
  const { gastosPorFecha, maxGastoDia, totalMesCalendario } = useMemo(() => {
    const mapa: Record<string, { total: number; tickets: Gasto[] }> = {};
    let max = 0;
    let totalMes = 0;

    const mesStr = String(mes + 1).padStart(2, '0');
    const prefijoMes = `${anio}-${mesStr}`;

    gastos.forEach((g) => {
      if (!mapa[g.fecha]) {
        mapa[g.fecha] = { total: 0, tickets: [] };
      }
      mapa[g.fecha].total += g.total;
      mapa[g.fecha].tickets.push(g);

      if (g.fecha.startsWith(prefijoMes)) {
        totalMes += g.total;
        if (mapa[g.fecha].total > max) {
          max = mapa[g.fecha].total;
        }
      }
    });

    return { gastosPorFecha: mapa, maxGastoDia: max, totalMesCalendario: totalMes };
  }, [gastos, mes, anio]);

  // Generar cuadrícula del calendario
  const celdasCalendario = useMemo(() => {
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);

    let diaInicioSemana = primerDiaMes.getDay() - 1;
    if (diaInicioSemana === -1) diaInicioSemana = 6;

    const totalDias = ultimoDiaMes.getDate();
    const celdas: { dia: number; fechaStr: string; esDelMes: boolean }[] = [];

    for (let i = 0; i < diaInicioSemana; i++) {
      celdas.push({ dia: 0, fechaStr: '', esDelMes: false });
    }

    for (let d = 1; d <= totalDias; d++) {
      const dStr = String(d).padStart(2, '0');
      const mStr = String(mes + 1).padStart(2, '0');
      const fechaStr = `${anio}-${mStr}-${dStr}`;
      celdas.push({ dia: d, fechaStr, esDelMes: true });
    }

    return celdas;
  }, [anio, mes]);

  const mesAnterior = () => {
    if (mes === 0) {
      setMes(11);
      setAnio((prev) => prev - 1);
    } else {
      setMes((prev) => prev - 1);
    }
  };

  const mesSiguiente = () => {
    if (mes === 11) {
      setMes(0);
      setAnio((prev) => prev + 1);
    } else {
      setMes((prev) => prev + 1);
    }
  };

  const ticketsDiaSeleccionado = diaSeleccionado
    ? gastosPorFecha[diaSeleccionado]?.tickets || []
    : [];

  const totalDiaSeleccionado = diaSeleccionado
    ? gastosPorFecha[diaSeleccionado]?.total || 0
    : 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Header del Calendario y Métricas */}
      <div
        className={`p-4 rounded-3xl border transition-colors ${
          isDark
            ? 'bg-neutral-900/90 border-neutral-800 shadow-xl'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={mesAnterior}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <h3
              className={`font-bold text-sm sm:text-base capitalize ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {nombresMeses[mes]} {anio}
            </h3>
            <button
              onClick={mesSiguiente}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="text-right">
            <span
              className={`text-[10px] uppercase font-semibold block ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              Total en {nombresMeses[mes]}
            </span>
            <span
              className={`text-sm sm:text-base font-extrabold font-mono ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              {formatearMoneda(totalMesCalendario)}
            </span>
          </div>
        </div>

        {/* Leyenda de escala de gastos estilo vuelos */}
        <div
          className={`flex items-center justify-between text-[10px] px-2 py-1.5 rounded-xl border mb-3 ${
            isDark
              ? 'bg-neutral-950/70 border-neutral-800/80 text-neutral-400'
              : 'bg-slate-50 border-slate-200/80 text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1 font-medium">
            <Sparkles size={11} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
            Mapa de Calor de Facturas
          </span>
          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-neutral-500' : 'text-slate-400'}>Bajo</span>
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500/60" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 border border-emerald-400" />
            <span className={isDark ? 'text-neutral-500' : 'text-slate-400'}>Alto</span>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {diasSemana.map((d) => (
            <span
              key={d}
              className={`text-[11px] font-semibold py-1 ${
                isDark ? 'text-neutral-400' : 'text-slate-400'
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Cuadrícula de Días tipo Tarifas de Vuelo */}
        <div className="grid grid-cols-7 gap-1">
          {celdasCalendario.map((celda, idx) => {
            if (!celda.esDelMes) {
              return <div key={`empty-${idx}`} className="h-16 rounded-xl opacity-0" />;
            }

            const dataDia = gastosPorFecha[celda.fechaStr];
            const tieneGastos = Boolean(dataDia && dataDia.total > 0);
            const ratioGasto = tieneGastos && maxGastoDia > 0 ? dataDia.total / maxGastoDia : 0;

            let bgEstilo = isDark
              ? 'bg-neutral-950/40 border-neutral-800/60 text-neutral-400'
              : 'bg-slate-50/70 border-slate-200/60 text-slate-500';

            if (tieneGastos) {
              if (ratioGasto > 0.6) {
                bgEstilo = isDark
                  ? 'bg-emerald-950/50 border-emerald-500/70 text-white shadow-sm'
                  : 'bg-emerald-50 border-emerald-400 text-slate-900 shadow-xs';
              } else if (ratioGasto > 0.25) {
                bgEstilo = isDark
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-neutral-100'
                  : 'bg-emerald-50/70 border-emerald-300 text-slate-800 shadow-xs';
              } else {
                bgEstilo = isDark
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                  : 'bg-white border-slate-200 text-slate-800 shadow-xs';
              }
            }

            return (
              <motion.button
                key={celda.fechaStr}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (tieneGastos) setDiaSeleccionado(celda.fechaStr);
                }}
                disabled={!tieneGastos}
                className={`h-16 rounded-xl border p-1 flex flex-col justify-between items-center transition-all ${
                  tieneGastos
                    ? 'cursor-pointer hover:border-emerald-500'
                    : 'cursor-default opacity-60'
                } ${bgEstilo}`}
              >
                <span className="text-[11px] font-bold self-start pl-0.5">{celda.dia}</span>

                {tieneGastos ? (
                  <div className="w-full text-center">
                    <span
                      className={`text-[9px] font-mono font-bold block truncate leading-tight ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    >
                      {dataDia.total < 100000
                        ? `$${(dataDia.total / 1000).toFixed(0)}k`
                        : `$${(dataDia.total / 1000).toFixed(0)}k`}
                    </span>
                    <span
                      className={`text-[8px] block -mt-0.5 ${
                        isDark ? 'text-neutral-400' : 'text-slate-400'
                      }`}
                    >
                      {dataDia.tickets.length} {dataDia.tickets.length === 1 ? 'factura' : 'facturas'}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`text-[8px] block ${
                      isDark ? 'text-neutral-600' : 'text-slate-300'
                    }`}
                  >
                    -
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Modal / Bottom Sheet con el detalle de facturas del día seleccionado */}
      <AnimatePresence>
        {diaSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col shadow-2xl border overflow-hidden ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isDark ? 'border-neutral-800 bg-neutral-900' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <h4
                      className={`font-bold text-sm ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Facturas del {diaSeleccionado}
                    </h4>
                    <p
                      className={`text-[11px] font-mono ${
                        isDark ? 'text-neutral-400' : 'text-slate-500'
                      }`}
                    >
                      Subtotal del día:{' '}
                      <strong className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                        {formatearMoneda(totalDiaSeleccionado)}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDiaSeleccionado(null)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lista de facturas de ese día */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {ticketsDiaSeleccionado.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isDark
                        ? 'bg-neutral-950/70 border-neutral-800/80'
                        : 'bg-slate-50 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon categoria={t.categoria} size={16} showBadge />
                      <div>
                        <span
                          className={`text-xs font-bold block ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {t.establecimiento}
                        </span>
                        <div
                          className={`flex items-center gap-2 text-[10px] mt-0.5 ${
                            isDark ? 'text-neutral-400' : 'text-slate-500'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={10} /> {t.hora}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {t.ciudad}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-extrabold block font-mono ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {formatearMoneda(t.total)}
                      </span>
                      <span
                        className={`text-[9px] ${
                          isDark ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        {t.metodo_pago}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={`p-3 border-t text-center ${
                  isDark ? 'border-neutral-800 bg-neutral-900' : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  onClick={() => setDiaSeleccionado(null)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
