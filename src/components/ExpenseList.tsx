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
  Trash2,
  FileSpreadsheet,
  FileDown,
  AlertTriangle,
  Pencil,
  ChevronLeft,
  Crown,
  Lock,
  History,
  ShieldCheck,
  Download
} from 'lucide-react';
import { Gasto, CategoriaGasto, LISTA_CATEGORIAS, UsuarioConfig } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import {
  formatearMoneda,
  eliminarGasto,
  descargarGastosCSV,
  limpiarGastosCorruptos,
  esUsuarioAdmin,
  reiniciarDatosACero,
  obtenerEstadoRecordatorioExportacion,
  posponerRecordatorioExportacion
} from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface ExpenseListProps {
  gastos: Gasto[];
  config?: UsuarioConfig;
  onOpenNewExpense: (prefill?: Partial<Gasto>) => void;
  onEditGasto?: (gasto: Gasto) => void;
  onRefresh: () => void;
  onSelectGasto?: (gasto: Gasto) => void;
  onOpenImportSheet?: () => void;
  onOpenPremiumModal?: () => void;
  onOpenExportTutorial?: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  gastos,
  config,
  onOpenNewExpense,
  onEditGasto,
  onRefresh,
  onOpenImportSheet,
  onOpenPremiumModal,
  onOpenExportTutorial,
}) => {
  const { isDark } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroOctubreActivo, setFiltroOctubreActivo] = useState(false);
  const [detalleGasto, setDetalleGasto] = useState<Gasto | null>(null);
  const [mensajeDepuracion, setMensajeDepuracion] = useState('');
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);
  const [recordatorioState, setRecordatorioState] = useState(() => obtenerEstadoRecordatorioExportacion());
  const listadoRef = React.useRef<HTMLDivElement>(null);

  // Perfil de Administrador Master (latouchettdiego@gmail.com)
  const esAdmin = esUsuarioAdmin(config?.email);

  // Detección de gastos anómalos de importación previa (ej. 10M en Otros)
  const tieneGastosCorruptos = useMemo(() => {
    return gastos.some(
      (g) =>
        ((g.categoria === 'Otros' || g.categoria === 'Otro') && g.total >= 5000000) ||
        /^\d{4}-\d{2}-\d{2}/.test(g.establecimiento || '')
    );
  }, [gastos]);

  const hoy = new Date();
  const anioActualStr = String(hoy.getFullYear());
  const mesActualStr = `${anioActualStr}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const nombreMesActual = hoy.toLocaleDateString('es-ES', { month: 'long' });
  const nombreMesActualCap = nombreMesActual.charAt(0).toUpperCase() + nombreMesActual.slice(1);

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
      // Filtro especial al clickear el Total Acumulado de Octubre
      if (filtroOctubreActivo && !g.fecha.startsWith(mesActualStr)) {
        return false;
      }

      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideEstablecimiento = g.establecimiento.toLowerCase().includes(query);
        const coincideNit = g.nit ? g.nit.toLowerCase().includes(query) : false;
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
  }, [gastos, busqueda, categoriaFiltro, fechaDesde, fechaHasta, filtroOctubreActivo]);

  // Suma total del conjunto de gastos actualmente filtrado
  const totalFiltrado = useMemo(() => {
    return gastosFiltrados.reduce((acc, g) => acc + g.total, 0);
  }, [gastosFiltrados]);

  // Sumas acumuladas calculadas individualmente para cada categoría
  const { totalesPorCategoria, totalGeneralCategorias, categoriasParaMostrar } = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    let sumaGeneral = 0;

    gastos.forEach((g) => {
      const fechaValida = !filtroOctubreActivo || g.fecha.startsWith(mesActualStr);
      if (fechaValida) {
        if (!map[g.categoria]) {
          map[g.categoria] = { total: 0, count: 0 };
        }
        map[g.categoria].total += g.total;
        map[g.categoria].count += 1;
        sumaGeneral += g.total;
      }
    });

    // Ordenar categorías por mayor gasto acumulado
    const categoriasOrdenadas = Object.keys(map).sort(
      (a, b) => (map[b]?.total || 0) - (map[a]?.total || 0)
    );

    const base = [
      'Mercado',
      'Gasolina',
      'Snacks',
      'Restaurantes',
      'Vivienda',
      'Servicios',
      'Salud',
      'Transporte',
      'Suscripciones',
      'Crypto',
    ];

    const todas = Array.from(new Set([...categoriasOrdenadas, ...base]));

    return {
      totalesPorCategoria: map,
      totalGeneralCategorias: sumaGeneral,
      categoriasParaMostrar: todas,
    };
  }, [gastos, filtroOctubreActivo]);

  const handleToggleFiltroOctubre = () => {
    if (filtroOctubreActivo) {
      setFiltroOctubreActivo(false);
    } else {
      setFiltroOctubreActivo(true);
      setFechaDesde('');
      setFechaHasta('');
      setCategoriaFiltro('TODAS');
      setBusqueda('');
      setTimeout(() => {
        listadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  const handleEliminar = (id: string, gastoCompleto?: Gasto) => {
    eliminarGasto(id, gastoCompleto);
    setDetalleGasto(null);
    onRefresh();
    const nombre = gastoCompleto?.establecimiento || 'Factura';
    setToastMensaje(`${nombre} eliminada correctamente`);
    setTimeout(() => {
      setToastMensaje(null);
    }, 3500);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Mensaje Recordatorio cada 15 días: Recomendación de Exportar Respaldo a Google Sheets */}
      {recordatorioState.debeMostrar && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-3xl border transition-all ${
            isDark
              ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
              : 'bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                <ShieldCheck size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Copia de Seguridad Recomendada (Cada 15 días)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30">
                    Memoria Local
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                  Tus datos se guardan de forma privada en la memoria local de tu teléfono. Te recomendamos descargar tu archivo oficial de 18 columnas y sobrescribir tu hoja de Google Sheets para tener un respaldo seguro si formateas o cambias de equipo.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onOpenExportTutorial}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Download size={13} className="stroke-[2.5]" />
                    <span>Exportar y Ver Tutorial (18 Cols)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      posponerRecordatorioExportacion(15);
                      setRecordatorioState(obtenerEstadoRecordatorioExportacion());
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    Recordar en 15 días
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                posponerRecordatorioExportacion(15);
                setRecordatorioState(obtenerEstadoRecordatorioExportacion());
              }}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Posponer aviso por 15 días"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 1. Tarjetas de Resumen Mensual & Anual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Resumen Mensual / Total Acumulado Octubre (Interactivo y Clickeable, Estilo Limpio Original) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleToggleFiltroOctubre}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleFiltroOctubre();
            }
          }}
          className={`p-4 rounded-3xl relative overflow-hidden transition-all cursor-pointer group select-none active:scale-[0.99] ${
            filtroOctubreActivo
              ? isDark
                ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-emerald-500 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-500/30'
                : 'bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/30'
              : isDark
              ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800/90 hover:border-emerald-500/60 shadow-xl hover:shadow-emerald-500/5'
              : 'bg-white border border-slate-200/90 hover:border-emerald-500/60 shadow-sm hover:shadow-md'
          }`}
          title={`Toca para ver, editar o eliminar los gastos registrados en ${nombreMesActual}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span
              className={`flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              <CalendarIcon size={14} className="text-emerald-500 shrink-0" /> TOTAL ACUMULADO {nombreMesActualCap.toUpperCase()} {anioActualStr}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-colors ${
                filtroOctubreActivo
                  ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                  : isDark
                  ? 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-100'
              }`}
            >
              {filtroOctubreActivo ? `Viendo ${nombreMesActualCap} ✓` : 'Toca para abrir →'}
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
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{gastosMes.length} facturas</span>
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          <div
            className={`mt-2.5 pt-2 border-t text-[11px] font-medium flex items-center justify-between ${
              filtroOctubreActivo
                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : isDark
                ? 'border-neutral-800/40 text-neutral-400 group-hover:text-emerald-400'
                : 'border-slate-100 text-slate-500 group-hover:text-emerald-700'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles size={12} className="shrink-0 text-emerald-500" />
              <span>
                {filtroOctubreActivo
                  ? `Mostrando gastos de ${nombreMesActual} (Toca para ver todos)`
                  : `Toca aquí para ver, editar o eliminar facturas de ${nombreMesActual}`}
              </span>
            </span>
            <span className="text-[10px] font-bold underline shrink-0 ml-1">
              {filtroOctubreActivo ? 'Desactivar' : 'Ver facturas'}
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
              <TrendingDown size={14} className="text-teal-500" /> Acumulado Año {anioActualStr}
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

      {/* 2. Módulo de Función Premium (Exclusivo Admin latouchettdiego@gmail.com / Bloqueado para otros) */}
      <div
        className={`p-4 rounded-3xl border transition-all ${
          esAdmin
            ? 'bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-emerald-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
            : isDark
            ? 'bg-gradient-to-r from-neutral-900/90 via-neutral-900 to-neutral-950 border-neutral-800'
            : 'bg-gradient-to-r from-amber-50/50 via-white to-slate-50 border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                esAdmin
                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm'
                  : isDark
                  ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              {esAdmin ? (
                <Crown size={22} className="stroke-[2.5]" />
              ) : (
                <Lock size={20} className="text-amber-500" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                  {esAdmin ? '👑 Función Premium Master' : '⭐ Conviértete en Admin Master (Pronto)'}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    esAdmin
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  }`}
                >
                  {esAdmin ? 'Modo Administrador' : 'Pronto'}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                {esAdmin
                  ? 'Acceso Ilimitado: Auditoría Tributaria DIAN 2026, Libro Fiscal Diario, Deducciones de Renta y Respaldo Total.'
                  : 'Auditoría Tributaria, Libro Fiscal Oficial y Copias en la Nube. La opción estará habilitada muy pronto.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPremiumModal}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
              esAdmin
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-extrabold shadow-amber-500/20'
                : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30'
            }`}
          >
            {esAdmin ? (
              <>
                <span>Abrir Suite Pro</span>
                <ChevronRight size={14} />
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-amber-500" />
                <span>Pronto</span>
              </>
            )}
          </button>
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className={`absolute left-3.5 top-3.5 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por comercio (ej. 'Terpel'), NIT, ciudad..."
              autoComplete="off"
              autoCorrect="on"
              spellCheck={true}
              autoCapitalize="none"
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

          <button
            onClick={() => {
              if (onOpenExportTutorial) {
                onOpenExportTutorial();
              } else {
                descargarGastosCSV(gastos);
              }
            }}
            className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
              isDark
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:border-emerald-500/50'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs hover:border-emerald-500/50'
            }`}
            title="Exportar archivo oficial de 18 columnas para Google Sheets & Excel con tutorial paso a paso"
          >
            <Download size={16} className="text-emerald-500" />
            <span className="hidden sm:inline">Exportar (18 Cols)</span>
            <span className="sm:hidden text-[11px]">Exportar</span>
          </button>

          {onOpenImportSheet && (
            <button
              onClick={onOpenImportSheet}
              className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-xs'
              }`}
              title="Importar Facturas desde Google Sheets (URL, Pegar o Archivo)"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              <span className="hidden sm:inline">Importar Sheet</span>
              <span className="sm:hidden text-[11px]">Sheet</span>
            </button>
          )}
        </div>

        {/* Filtros rápidos: Categoría con suma acumulada individual */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setCategoriaFiltro('TODAS')}
            className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              categoriaFiltro === 'TODAS'
                ? isDark
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                  : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500/30'
                : isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
          >
            <span>Todas ({gastos.length})</span>
            <span className="font-mono text-[10px] font-bold opacity-80">
              • {formatearMoneda(totalGeneralCategorias)}
            </span>
          </button>

          {categoriasParaMostrar.map((cat) => {
            const info = totalesPorCategoria[cat];
            const tieneGastos = Boolean(info && info.count > 0);
            const monto = info?.total || 0;
            const esActiva = categoriaFiltro === cat;

            return (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(esActiva ? 'TODAS' : cat)}
                className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  esActiva
                    ? isDark
                      ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500/50'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500/40'
                    : isDark
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                }`}
                title={`Filtrar por ${cat} - Total: ${formatearMoneda(monto)}`}
              >
                <CategoryIcon categoria={cat as CategoriaGasto} size={13} />
                <span>{cat}</span>
                {tieneGastos && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      esActiva
                        ? isDark
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : 'bg-emerald-200/90 text-emerald-950'
                        : isDark
                        ? 'bg-neutral-800/80 text-emerald-400'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}
                  >
                    {formatearMoneda(monto)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tarjeta destacada con la suma total al seleccionar cualquier categoría */}
        {categoriaFiltro !== 'TODAS' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-950 border-emerald-500/40 text-white shadow-md'
                : 'bg-gradient-to-r from-emerald-50/90 via-white to-slate-50 border-emerald-400 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CategoryIcon categoria={categoriaFiltro as CategoriaGasto} size={22} showBadge />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Total Acumulado en {categoriaFiltro}
                </span>
                <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-emerald-700 dark:text-emerald-300">
                  {formatearMoneda(totalFiltrado)}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold block text-slate-700 dark:text-neutral-300">
                {gastosFiltrados.length} {gastosFiltrados.length === 1 ? 'factura' : 'facturas'}
              </span>
              <button
                type="button"
                onClick={() => setCategoriaFiltro('TODAS')}
                className="mt-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
              >
                Ver todas las categorías
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Banner de corrección de gastos anómalos si se detectan (ej. 10M en Otros por importación antigua) */}
      {tieneGastosCorruptos && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={20} className="shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Se detectaron registros anómalos de una importación previa (ej. 10M en 'Otros').</p>
              <p className="text-[11px] opacity-80">Puedes depurarlos automáticamente para regularizar tus estadísticas de octubre.</p>
            </div>
          </div>
          <button
            onClick={() => {
              const res = limpiarGastosCorruptos();
              setMensajeDepuracion(`¡Se corrigieron ${res.eliminados} registros atípicos con éxito! Tus estadísticas han vuelto a la normalidad.`);
              setTimeout(() => setMensajeDepuracion(''), 4000);
              onRefresh();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-extrabold text-xs hover:brightness-110 cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center shadow-sm"
          >
            Limpiar y Corregir Gastos
          </button>
        </div>
      )}

      {mensajeDepuracion && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{mensajeDepuracion}</span>
        </div>
      )}

      {/* 4. Lista Cronológica de Facturas / Gastos */}
      <div ref={listadoRef} className="space-y-2 scroll-mt-6">
        {filtroOctubreActivo && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CalendarIcon size={16} className="shrink-0 text-emerald-500" />
              <div>
                <span className="font-bold">Mostrando Gastos de {nombreMesActualCap} {anioActualStr}: </span>
                <span>{gastosFiltrados.length} facturas encontradas. Puedes <strong>editar</strong> o <strong>eliminar</strong> cada comprobante.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFiltroOctubreActivo(false)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Ver todas
            </button>
          </div>
        )}

        <div
          className={`flex items-center justify-between text-xs px-1 ${
            isDark ? 'text-neutral-400' : 'text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {filtroOctubreActivo
                ? `Facturas de ${nombreMesActualCap} ${anioActualStr}`
                : busqueda
                ? `Resultados para "${busqueda}"`
                : categoriaFiltro !== 'TODAS'
                ? `Categoría: ${categoriaFiltro}`
                : 'Historial de Facturas'}
            </span>
            <span className="font-mono text-emerald-500 font-bold">({gastosFiltrados.length} encontrados)</span>
          </div>

          {/* Suma total acumulada del conjunto filtrado */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-neutral-400 text-[11px]">Total:</span>
            <span
              className={`font-extrabold px-2 py-0.5 rounded-lg ${
                isDark
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {formatearMoneda(totalFiltrado)}
            </span>
          </div>
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
              {filtroOctubreActivo
                ? 'No hay gastos registrados en este período.'
                : 'Aún no tienes gastos registrados. Toca abajo para añadir tu primer comprobante.'}
            </p>
            <button
              onClick={() => onOpenNewExpense()}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              + Registrar Primer Gasto
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

              <div className="flex items-center gap-2">
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

                {/* Botón Editar Factura */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditGasto) {
                      onEditGasto(gasto);
                    } else {
                      onOpenNewExpense(gasto);
                    }
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? 'text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title="Editar esta factura"
                >
                  <Pencil size={15} />
                </button>

                {/* Botón Eliminar Factura */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminar(gasto.id, gasto);
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? 'text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10'
                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                  title="Eliminar esta factura"
                >
                  <Trash2 size={15} />
                </button>
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
              className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border max-h-[92vh] overflow-y-auto no-scrollbar ${
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
                    {detalleGasto.nit || 'No especificado'}
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

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const g = detalleGasto;
                    setDetalleGasto(null);
                    if (onEditGasto) {
                      onEditGasto(g);
                    } else {
                      onOpenNewExpense(g);
                    }
                  }}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Pencil size={15} />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEliminar(detalleGasto.id, detalleGasto)}
                  className="flex-1 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Eliminar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetalleGasto(null)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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

      {/* Notificación flotante Toast para confirmar borrado o acción */}
      <AnimatePresence>
        {toastMensaje && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900/95 text-white text-xs font-semibold shadow-2xl border border-neutral-700/80 flex items-center gap-2 backdrop-blur-md"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMensaje}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
