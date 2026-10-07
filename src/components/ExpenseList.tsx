import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Calendar as CalendarIcon,
  Filter,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  Clock3,
  X,
  CreditCard,
  Building2,
  Trash2
} from 'lucide-react';
import { Gasto, CategoriaGasto, LISTA_CATEGORIAS } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { formatearMoneda, eliminarGasto } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface ExpenseListProps {
  gastos: Gasto[];
  onOpenNewExpense: () => void;
  onRefresh: () => void;
  onSelectGasto?: (gasto: Gasto) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  gastos,
  onOpenNewExpense,
  onRefresh,
}) => {
  const { isDark } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [detalleGasto, setDetalleGasto] = useState<Gasto | null>(null);

  const mesActualStr = '2026-10';
  const anioActualStr = '2026';

  const { totalMes, totalAnio, gastosMes, gastosAnio, desgloseAnual, rankingCategorias } = useMemo(() => {
    let tMes = 0;
    let tAnio = 0;
    const gMes: Gasto[] = [];
    const gAnio: Gasto[] = [];
    const catAcumAnio: Record<string, number> = {};

    gastos.forEach((g) => {
      if (g.fecha.startsWith(anioActualStr)) {
        tAnio += g.total;
        gAnio.push(g);
        catAcumAnio[g.categoria] = (catAcumAnio[g.categoria] || 0) + g.total;
      }
      if (g.fecha.startsWith(mesActualStr)) {
        tMes += g.total;
        gMes.push(g);
      }
    });

    const ranking = Object.entries(catAcumAnio)
      .map(([cat, total]) => ({
        categoria: cat,
        total,
        porcentaje: tAnio > 0 ? (total / tAnio) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalMes: tMes,
      totalAnio: tAnio,
      gastosMes: gMes,
      gastosAnio: gAnio,
      desgloseAnual: ranking.slice(0, 5),
      rankingCategorias: ranking,
    };
  }, [gastos]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideEstablecimiento = g.establecimiento.toLowerCase().includes(query);
        const coincideNit = g.nit.toLowerCase().includes(query);
        const coincideCiudad = g.ciudad.toLowerCase().includes(query);
        const coincideObs = g.observaciones ? g.observaciones.toLowerCase().includes(query) : false;
        if (!coincideEstablecimiento && !coincideNit && !coincideCiudad && !coincideObs) {
          return false;
        }
      }

      if (categoriaFiltro !== 'TODAS' && g.categoria !== categoriaFiltro) {
        return false;
      }

      if (fechaDesde && g.fecha < fechaDesde) {
        return false;
      }

      if (fechaHasta && g.fecha > fechaHasta) {
        return false;
      }

      return true;
    });
  }, [gastos, busqueda, categoriaFiltro, fechaDesde, fechaHasta]);

  const handleEliminar = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta factura de la base de datos local?')) {
      eliminarGasto(id);
      setDetalleGasto(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Tarjetas de Resumen Mensual & Anual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Resumen Mensual */}
        <div
          className={`p-4 rounded-3xl relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800/90 shadow-xl'
              : 'bg-white border border-slate-200/90 shadow-sm'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span
              className={`flex items-center gap-1.5 uppercase tracking-wider text-[11px] ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              <CalendarIcon size={14} className="text-emerald-500" /> Octubre 2026
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                isDark
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              Mes Activo
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold tracking-tight font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {formatearMoneda(totalMes)}
          </div>
          <div
            className={`mt-2 flex items-center justify-between text-xs pt-2 border-t ${
              isDark
                ? 'border-neutral-800/60 text-neutral-400'
                : 'border-slate-100 text-slate-500'
            }`}
          >
            <span>
              {totalAnio > 0 ? `${((totalMes / totalAnio) * 100).toFixed(1)}% del total del año` : '0%'}
            </span>
            <span className={isDark ? 'text-neutral-500' : 'text-slate-400'}>
              {gastosMes.length} facturas
            </span>
          </div>
        </div>

        {/* Resumen Anual & Desglose porcentual */}
        <div
          className={`p-4 rounded-3xl relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800/90 shadow-xl'
              : 'bg-white border border-slate-200/90 shadow-sm'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span
              className={`flex items-center gap-1.5 uppercase tracking-wider text-[11px] ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              <TrendingDown size={14} className="text-teal-500" /> Acumulado Año 2026
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                isDark
                  ? 'bg-teal-500/10 text-teal-400'
                  : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}
            >
              12 Meses
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold tracking-tight font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {formatearMoneda(totalAnio)}
          </div>

          <div
            className={`mt-2 space-y-1.5 pt-2 border-t ${
              isDark ? 'border-neutral-800/60' : 'border-slate-100'
            }`}
          >
            <div
              className={`flex items-center justify-between text-[11px] ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              <span className={`font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Top Distribución:
              </span>
              <span className={isDark ? 'text-neutral-500' : 'text-slate-400'}>
                {gastosAnio.length} registros
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 w-full h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-neutral-800' : 'bg-slate-100'
              }`}
            >
              {desgloseAnual.map((item, idx) => (
                <div
                  key={item.categoria}
                  className="h-full rounded-sm"
                  style={{
                    width: `${item.porcentaje}%`,
                    backgroundColor:
                      idx === 0 ? '#10b981' : idx === 1 ? '#0ea5e9' : idx === 2 ? '#6366f1' : '#f59e0b',
                  }}
                  title={`${item.categoria}: ${item.porcentaje.toFixed(1)}%`}
                />
              ))}
            </div>
            <div
              className={`flex items-center gap-2 text-[10px] truncate ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              {desgloseAnual.slice(0, 3).map((item) => (
                <span key={item.categoria} className="truncate">
                  {item.categoria}:{' '}
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                    {item.porcentaje.toFixed(0)}%
                  </strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ranking de Categorías */}
      <div
        className={`p-4 rounded-3xl transition-colors ${
          isDark
            ? 'bg-neutral-900/60 border border-neutral-800/80'
            : 'bg-white border border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-neutral-300' : 'text-slate-700'
              }`}
            >
              Ranking de Gastos por Categoría
            </h4>
          </div>
          <span className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
            De mayor a menor
          </span>
        </div>

        <div className="space-y-2">
          {rankingCategorias.slice(0, 4).map((rank, index) => (
            <div
              key={rank.categoria}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-neutral-950/60 border-neutral-800/60 hover:border-neutral-700'
                  : 'bg-slate-50 border-slate-200/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-mono font-bold w-4 text-center ${
                    isDark ? 'text-neutral-500' : 'text-slate-400'
                  }`}
                >
                  #{index + 1}
                </span>
                <CategoryIcon categoria={rank.categoria} size={16} showBadge />
                <div>
                  <span
                    className={`text-xs font-semibold block ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {rank.categoria}
                  </span>
                  <div
                    className={`w-24 h-1.5 rounded-full overflow-hidden mt-1 ${
                      isDark ? 'bg-neutral-800' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(rank.porcentaje, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-bold block font-mono ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {formatearMoneda(rank.total)}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  {rank.porcentaje.toFixed(1)}% del año
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Barra de Búsqueda Interactiva & Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search
            size={18}
            className={`absolute left-3.5 top-3.5 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por establecimiento (ej. 'Terpel'), NIT, ciudad..."
            className={`w-full pl-10 pr-10 py-3 rounded-2xl border text-sm transition-colors focus:outline-none focus:border-emerald-500 ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-xs'
            }`}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className={`absolute right-3.5 top-3.5 cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtros rápidos: Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setCategoriaFiltro('TODAS')}
            className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors cursor-pointer ${
              categoriaFiltro === 'TODAS'
                ? isDark
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                  : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold shadow-xs'
                : isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
          >
            Todas ({gastos.length})
          </button>
          {['Gasolina', 'Mercados', 'Restaurante', 'Vivienda', 'Salud', 'Suscripciones'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(categoriaFiltro === cat ? 'TODAS' : cat)}
              className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                categoriaFiltro === cat
                  ? isDark
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold shadow-xs'
                  : isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
              }`}
            >
              <CategoryIcon categoria={cat} size={12} />
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Lista Cronológica de Facturas / Gastos */}
      <div className="space-y-2">
        <div
          className={`flex items-center justify-between text-xs px-1 ${
            isDark ? 'text-neutral-400' : 'text-slate-500'
          }`}
        >
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            {busqueda ? `Resultados para "${busqueda}"` : 'Historial de Facturas'}
          </span>
          <span>{gastosFiltrados.length} encontrados</span>
        </div>

        {gastosFiltrados.length === 0 ? (
          <div
            className={`p-8 text-center rounded-3xl border ${
              isDark
                ? 'bg-neutral-900/40 border-neutral-800/80'
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            <Building2
              size={32}
              className={`mx-auto mb-2 ${isDark ? 'text-neutral-600' : 'text-slate-400'}`}
            />
            <p
              className={`text-sm font-semibold ${
                isDark ? 'text-neutral-300' : 'text-slate-700'
              }`}
            >
              No se encontraron facturas
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
              Prueba cambiando los filtros o registra una nueva factura.
            </p>
            <button
              onClick={onOpenNewExpense}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              Registrar Gasto Ahora
            </button>
          </div>
        ) : (
          gastosFiltrados.map((gasto) => (
            <motion.div
              key={gasto.id}
              layout
              onClick={() => setDetalleGasto(gasto)}
              className={`p-3.5 rounded-2xl border active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between group ${
                isDark
                  ? 'bg-neutral-900/70 border-neutral-800/70 hover:border-neutral-700/90'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <CategoryIcon categoria={gasto.categoria} size={18} showBadge />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm transition-colors ${
                        isDark
                          ? 'text-white group-hover:text-emerald-400'
                          : 'text-slate-900 group-hover:text-emerald-600'
                      }`}
                    >
                      {gasto.establecimiento}
                    </span>
                    {gasto.sincronizado ? (
                      <span title="Sincronizado con Google Sheets">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      </span>
                    ) : (
                      <span title="Pendiente de sincronizar (Offline)">
                        <Clock3 size={13} className="text-amber-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-2 text-[11px] mt-0.5 ${
                      isDark ? 'text-neutral-400' : 'text-slate-500'
                    }`}
                  >
                    <span className="font-mono">{gasto.fecha}</span>
                    <span>•</span>
                    <span>{gasto.hora}</span>
                    <span>•</span>
                    <span>{gasto.ciudad}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-extrabold block font-mono ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {formatearMoneda(gasto.total)}
                </span>
                <span
                  className={`text-[10px] block ${
                    isDark ? 'text-neutral-400' : 'text-slate-400'
                  }`}
                >
                  {gasto.metodo_pago}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de Detalle de Factura */}
      <AnimatePresence>
        {detalleGasto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border ${
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
                <div className="flex items-center gap-2">
                  <CategoryIcon categoria={detalleGasto.categoria} size={18} showBadge />
                  <div>
                    <h4
                      className={`font-bold text-sm ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {detalleGasto.establecimiento}
                    </h4>
                    <p
                      className={`text-[10px] ${
                        isDark ? 'text-neutral-400' : 'text-slate-400'
                      }`}
                    >
                      ID: {detalleGasto.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetalleGasto(null)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 text-center">
                <span
                  className={`text-xs uppercase tracking-wider font-semibold ${
                    isDark ? 'text-neutral-400' : 'text-slate-500'
                  }`}
                >
                  Total de la Factura
                </span>
                <div
                  className={`text-3xl font-extrabold mt-1 font-mono ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  {formatearMoneda(detalleGasto.total)}
                </div>
              </div>

              <div
                className={`space-y-2 text-xs p-3.5 rounded-2xl border mb-4 ${
                  isDark
                    ? 'bg-neutral-950/70 border-neutral-800/80 text-neutral-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`flex justify-between py-1 border-b ${
                    isDark ? 'border-neutral-800/40' : 'border-slate-200/60'
                  }`}
                >
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    NIT / Doc. Fiscal:
                  </span>
                  <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {detalleGasto.nit}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1 border-b ${
                    isDark ? 'border-neutral-800/40' : 'border-slate-200/60'
                  }`}
                >
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Fecha y Hora:
                  </span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {detalleGasto.fecha} a las {detalleGasto.hora}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1 border-b ${
                    isDark ? 'border-neutral-800/40' : 'border-slate-200/60'
                  }`}
                >
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Ciudad:
                  </span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {detalleGasto.ciudad}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1 border-b ${
                    isDark ? 'border-neutral-800/40' : 'border-slate-200/60'
                  }`}
                >
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Método de Pago:
                  </span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {detalleGasto.metodo_pago}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Estado de Sincronización:
                  </span>
                  <span
                    className={
                      detalleGasto.sincronizado
                        ? 'text-emerald-500 font-semibold'
                        : 'text-amber-500 font-semibold'
                    }
                  >
                    {detalleGasto.sincronizado ? 'Sincronizado' : 'Pendiente (Offline)'}
                  </span>
                </div>
                {detalleGasto.observaciones && (
                  <div
                    className={`pt-2 border-t ${
                      isDark ? 'border-neutral-800/40' : 'border-slate-200/60'
                    }`}
                  >
                    <span
                      className={`block mb-0.5 ${
                        isDark ? 'text-neutral-400' : 'text-slate-500'
                      }`}
                    >
                      Observaciones:
                    </span>
                    <p className={`italic ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      {detalleGasto.observaciones}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEliminar(detalleGasto.id)}
                  className="flex-1 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Eliminar Factura</span>
                </button>
                <button
                  onClick={() => setDetalleGasto(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
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
