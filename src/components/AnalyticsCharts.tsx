import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, BarChart3, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { Gasto, CategoriaGasto, CATEGORIAS_CONFIG } from '../types/finance';
import { formatearMoneda } from '../services/storageService';
import { CategoryIcon } from './CategoryIcon';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsChartsProps {
  gastos: Gasto[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ gastos }) => {
  const { isDark } = useTheme();
  const [periodo, setPeriodo] = useState<'mes' | 'anio'>('mes');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  const hoy = new Date();
  const anioActual = String(hoy.getFullYear());
  const mesActual = `${anioActual}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

  // Filtrar según período
  const gastosPeriodo = useMemo(() => {
    if (periodo === 'mes') {
      return gastos.filter((g) => g.fecha.startsWith(mesActual));
    }
    return gastos.filter((g) => g.fecha.startsWith(anioActual));
  }, [gastos, periodo]);

  // Total global del período
  const totalGlobal = useMemo(() => {
    return gastosPeriodo.reduce((acc, curr) => acc + curr.total, 0);
  }, [gastosPeriodo]);

  // Agrupación por Categorías para el Donut
  const datosCategorias = useMemo(() => {
    const mapa: Record<string, number> = {};
    gastosPeriodo.forEach((g) => {
      mapa[g.categoria] = (mapa[g.categoria] || 0) + g.total;
    });

    return Object.entries(mapa)
      .map(([cat, total]) => ({
        categoria: cat,
        total,
        porcentaje: totalGlobal > 0 ? (total / totalGlobal) * 100 : 0,
        color: CATEGORIAS_CONFIG[cat]?.color || '#94a3b8',
      }))
      .sort((a, b) => b.total - a.total);
  }, [gastosPeriodo, totalGlobal]);

  // Datos de evolución mensual (para el gráfico de barras)
  const evolucionMensual = useMemo(() => {
    const meses = [
      { num: '01', nombre: 'Ene' },
      { num: '02', nombre: 'Feb' },
      { num: '03', nombre: 'Mar' },
      { num: '04', nombre: 'Abr' },
      { num: '05', nombre: 'May' },
      { num: '06', nombre: 'Jun' },
      { num: '07', nombre: 'Jul' },
      { num: '08', nombre: 'Ago' },
      { num: '09', nombre: 'Sep' },
      { num: '10', nombre: 'Oct' },
      { num: '11', nombre: 'Nov' },
      { num: '12', nombre: 'Dic' },
    ];

    let maxMonto = 0;
    const datos = meses.map((m) => {
      const prefijo = `${anioActual}-${m.num}`;
      const totalMes = gastos
        .filter((g) => g.fecha.startsWith(prefijo))
        .reduce((acc, curr) => acc + curr.total, 0);

      if (totalMes > maxMonto) maxMonto = totalMes;

      return {
        ...m,
        total: totalMes,
        esActual: m.num === '10',
      };
    });

    return { datos, maxMonto: maxMonto || 1 };
  }, [gastos]);

  // Generador de segmentos SVG para el Donut
  const donutArcs = useMemo(() => {
    let acumuladoAngulo = 0;
    const radio = 80;
    const grosor = 26;
    const radioInterno = radio - grosor;
    const centro = 100;

    return datosCategorias.map((item) => {
      const angulo = (item.porcentaje / 100) * 360;
      const startAngle = acumuladoAngulo;
      const endAngle = acumuladoAngulo + angulo;
      acumuladoAngulo += angulo;

      const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
          x: cx + r * Math.cos(angleInRadians),
          y: cy + r * Math.sin(angleInRadians),
        };
      };

      const startOuter = polarToCartesian(centro, centro, radio, endAngle);
      const endOuter = polarToCartesian(centro, centro, radio, startAngle);
      const startInner = polarToCartesian(centro, centro, radioInterno, startAngle);
      const endInner = polarToCartesian(centro, centro, radioInterno, endAngle);

      const largeArcFlag = angulo <= 180 ? '0' : '1';

      const d = [
        `M ${startOuter.x} ${startOuter.y}`,
        `A ${radio} ${radio} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
        `L ${startInner.x} ${startInner.y}`,
        `A ${radioInterno} ${radioInterno} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
        'Z',
      ].join(' ');

      return {
        ...item,
        pathD: d,
      };
    });
  }, [datosCategorias]);

  return (
    <div className="space-y-4 pb-20">
      {/* Selector de Período: Mes vs Año */}
      <div
        className={`p-1 rounded-2xl border flex items-center justify-between shadow-xs transition-colors ${
          isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={() => setPeriodo('mes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            periodo === 'mes'
              ? isDark
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
              : isDark
              ? 'text-neutral-400 hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar size={14} />
          <span>Vista de Mes (Octubre)</span>
        </button>

        <button
          onClick={() => setPeriodo('anio')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            periodo === 'anio'
              ? isDark
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
              : isDark
              ? 'text-neutral-400 hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={14} />
          <span>Vista de Año (2026)</span>
        </button>
      </div>

      {/* Tarjeta Donut Chart Central con Total Global */}
      <div
        className={`p-5 rounded-3xl border shadow-sm transition-colors space-y-4 ${
          isDark
            ? 'bg-neutral-900/90 border-neutral-800 text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-emerald-500" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Distribución de Gastos
            </h3>
          </div>
          <span className={`text-[11px] font-mono ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>
            {periodo === 'mes' ? 'Oct 2026' : 'Año 2026'}
          </span>
        </div>

        {/* SVG Donut Chart */}
        <div className="relative flex items-center justify-center py-2">
          {datosCategorias.length === 0 ? (
            <div className={`py-12 text-center text-xs ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>
              No hay gastos registrados en este período
            </div>
          ) : (
            <>
              <svg width="220" height="220" viewBox="0 0 200 200" className="drop-shadow-sm">
                {donutArcs.map((arc) => {
                  const esSeleccionado = categoriaSeleccionada === arc.categoria;
                  return (
                    <path
                      key={arc.categoria}
                      d={arc.pathD}
                      fill={arc.color}
                      opacity={categoriaSeleccionada ? (esSeleccionado ? 1 : 0.35) : 0.9}
                      stroke={isDark ? '#171717' : '#ffffff'}
                      strokeWidth="2.5"
                      className="transition-all cursor-pointer hover:opacity-100"
                      onClick={() =>
                        setCategoriaSeleccionada(
                          categoriaSeleccionada === arc.categoria ? null : arc.categoria
                        )
                      }
                    />
                  );
                })}
              </svg>

              {/* Total en el centro del Donut (cambia a la categoría seleccionada al hacer clic) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold truncate max-w-[140px] ${
                    isDark ? 'text-neutral-400' : 'text-slate-500'
                  }`}
                >
                  {categoriaSeleccionada ? `Total ${categoriaSeleccionada}` : 'Total Global'}
                </span>
                <span
                  className={`text-lg sm:text-xl font-extrabold font-mono tracking-tight mt-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {categoriaSeleccionada
                    ? formatearMoneda(
                        datosCategorias.find((c) => c.categoria === categoriaSeleccionada)?.total || 0
                      )
                    : formatearMoneda(totalGlobal)}
                </span>
                <span
                  className={`text-[10px] font-medium mt-0.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  {categoriaSeleccionada
                    ? `${(
                        datosCategorias.find((c) => c.categoria === categoriaSeleccionada)?.porcentaje || 0
                      ).toFixed(1)}% del período`
                    : `${gastosPeriodo.length} ${gastosPeriodo.length === 1 ? 'factura' : 'facturas'}`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Leyenda Interactiva de Categorías */}
        {datosCategorias.length > 0 && (
          <div
            className={`space-y-1.5 pt-2 border-t ${
              isDark ? 'border-neutral-800' : 'border-slate-100'
            }`}
          >
            <p
              className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              Categorías ({datosCategorias.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {datosCategorias.map((cat) => {
                const esSeleccionada = categoriaSeleccionada === cat.categoria;
                return (
                  <button
                    key={cat.categoria}
                    onClick={() =>
                      setCategoriaSeleccionada(
                        categoriaSeleccionada === cat.categoria ? null : cat.categoria
                      )
                    }
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      esSeleccionada
                        ? isDark
                          ? 'bg-neutral-800 border-emerald-500/80 shadow-sm'
                          : 'bg-emerald-50 border-emerald-400 text-slate-900 shadow-xs'
                        : isDark
                        ? 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                        : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span
                        className={`text-xs font-medium truncate ${
                          isDark ? 'text-neutral-300' : 'text-slate-700'
                        }`}
                      >
                        {cat.categoria}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-1.5 font-mono">
                      <span
                        className={`text-[11px] font-bold block ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {formatearMoneda(cat.total)}
                      </span>
                      <span
                        className={`text-[9px] block ${
                          isDark ? 'text-neutral-400' : 'text-slate-400'
                        }`}
                      >
                        {cat.porcentaje.toFixed(0)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de Evolución Ascendente Mensual (12 Meses) */}
      <div
        className={`p-5 rounded-3xl border shadow-sm transition-colors space-y-4 ${
          isDark
            ? 'bg-neutral-900/90 border-neutral-800 text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-teal-500" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Evolución Anual de Gastos
            </h3>
          </div>
          <span className={`text-[11px] font-mono ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>
            Año 2026
          </span>
        </div>

        {/* Barras Mensuales */}
        <div
          className={`h-44 flex items-end justify-between gap-1 pt-6 pb-2 px-1 border-b ${
            isDark ? 'border-neutral-800' : 'border-slate-100'
          }`}
        >
          {evolucionMensual.datos.map((mes) => {
            const porcentajeAltura =
              mes.total > 0 ? Math.max((mes.total / evolucionMensual.maxMonto) * 100, 6) : 2;

            return (
              <div
                key={mes.num}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
              >
                {/* Tooltip con Monto al pasar el cursor */}
                <div
                  className={`absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono py-0.5 px-1.5 rounded border pointer-events-none whitespace-nowrap z-20 shadow-xs ${
                    isDark
                      ? 'bg-neutral-950 text-white border-neutral-700'
                      : 'bg-slate-900 text-white border-slate-800'
                  }`}
                >
                  {formatearMoneda(mes.total)}
                </div>

                {/* Barra */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${porcentajeAltura}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`w-full max-w-[18px] rounded-t-md transition-all ${
                    mes.esActual
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20'
                      : mes.total > 0
                      ? isDark
                        ? 'bg-neutral-700 group-hover:bg-neutral-500'
                        : 'bg-slate-300 group-hover:bg-slate-400'
                      : isDark
                      ? 'bg-neutral-800/40'
                      : 'bg-slate-100'
                  }`}
                />

                {/* Etiqueta del Mes */}
                <span
                  className={`text-[10px] font-mono mt-1 ${
                    mes.esActual
                      ? isDark
                        ? 'text-emerald-400 font-bold'
                        : 'text-emerald-600 font-bold'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-slate-400'
                  }`}
                >
                  {mes.nombre}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className={`flex items-center justify-between text-xs pt-1 ${
            isDark ? 'text-neutral-400' : 'text-slate-500'
          }`}
        >
          <span>Mes con mayor consumo:</span>
          <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatearMoneda(evolucionMensual.maxMonto)}
          </span>
        </div>
      </div>

      {/* Ranking Detallado de Categorías */}
      <div
        className={`p-5 rounded-3xl border shadow-sm transition-colors space-y-3 ${
          isDark
            ? 'bg-neutral-900/90 border-neutral-800 text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ranking Acumulado por Categoría
          </h4>
          <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>
            Mayor a menor
          </span>
        </div>

        <div className="space-y-2.5">
          {datosCategorias.slice(0, 6).map((item, idx) => (
            <div key={item.categoria} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] w-3 ${
                      isDark ? 'text-neutral-400' : 'text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <CategoryIcon categoria={item.categoria as CategoriaGasto} size={14} />
                  <span
                    className={`font-semibold ${
                      isDark ? 'text-neutral-200' : 'text-slate-800'
                    }`}
                  >
                    {item.categoria}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatearMoneda(item.total)}
                  </span>
                  <span
                    className={`text-[11px] w-9 text-right ${
                      isDark ? 'text-neutral-400' : 'text-slate-400'
                    }`}
                  >
                    {item.porcentaje.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div
                className={`w-full h-1.5 rounded-full overflow-hidden ${
                  isDark ? 'bg-neutral-800' : 'bg-slate-100'
                }`}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.porcentaje}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
