import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  Calendar,
  Clock,
  MapPin,
  Building2,
  FileText,
  DollarSign,
  CreditCard,
  Sparkles,
  ChevronRight,
  Layers,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import {
  Gasto,
  CategoriaGasto,
  MetodoPago,
  LISTA_CATEGORIAS,
  LISTA_METODOS_PAGO,
  CATEGORIAS_CONFIG,
} from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { guardarGasto, actualizarGasto, formatearMoneda } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import { comprimirImagen } from '../utils/imageCompressor';

interface ManualExpenseFormProps {
  initialValues?: Partial<Gasto>;
  onClose: () => void;
  onSaved: (gasto: Gasto) => void;
}

const CIUDADES_FRECUENTES = ['Cúcuta', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena'];
const ESTABLECIMIENTOS_FRECUENTES = [
  { nombre: 'Terpel', nit: '860.005.224-6', cat: 'Gasolina' as CategoriaGasto },
  { nombre: 'Éxito', nit: '890.900.608-9', cat: 'Mercado' as CategoriaGasto },
  { nombre: 'Crepes & Waffles', nit: '860.519.894-3', cat: 'Restaurantes' as CategoriaGasto },
  { nombre: 'Droguería Cruz Verde', nit: '800.149.695-1', cat: 'Salud' as CategoriaGasto },
  { nombre: 'Primax', nit: '860.002.554-4', cat: 'Gasolina' as CategoriaGasto },
  { nombre: 'Oxxo', nit: '900.278.411-2', cat: 'Snacks' as CategoriaGasto },
];

export const ManualExpenseForm: React.FC<ManualExpenseFormProps> = ({
  initialValues,
  onClose,
  onSaved,
}) => {
  const { isDark } = useTheme();
  const ahora = new Date();
  const fechaHoy = ahora.toISOString().split('T')[0];
  const horaActual = ahora.toTimeString().slice(0, 5);

  const [establecimiento, setEstablecimiento] = useState(initialValues?.establecimiento || '');
  const [fecha, setFecha] = useState(initialValues?.fecha || fechaHoy);
  const [hora, setHora] = useState(initialValues?.hora || horaActual);
  const [ciudad, setCiudad] = useState(initialValues?.ciudad || 'Cúcuta');
  const [nit, setNit] = useState(initialValues?.nit || '');
  const [categoria, setCategoria] = useState<CategoriaGasto>(initialValues?.categoria || 'Gasolina');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(initialValues?.metodo_pago || 'Tarjeta Débito');
  const [total, setTotal] = useState<string>(initialValues?.total ? String(initialValues.total) : '');
  const [observaciones, setObservaciones] = useState(initialValues?.observaciones || '');
  const [fotoFacturaUri, setFotoFacturaUri] = useState<string | undefined>(initialValues?.foto_factura_uri);

  const [selectorCategoriaAbierto, setSelectorCategoriaAbierto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.establecimiento !== undefined) setEstablecimiento(initialValues.establecimiento);
      if (initialValues.fecha !== undefined) setFecha(initialValues.fecha);
      if (initialValues.hora !== undefined) setHora(initialValues.hora);
      if (initialValues.ciudad !== undefined) setCiudad(initialValues.ciudad);
      if (initialValues.nit !== undefined) setNit(initialValues.nit);
      if (initialValues.categoria !== undefined) setCategoria(initialValues.categoria);
      if (initialValues.metodo_pago !== undefined) setMetodoPago(initialValues.metodo_pago);
      if (initialValues.total !== undefined && initialValues.total !== null) setTotal(String(initialValues.total));
      if (initialValues.observaciones !== undefined) setObservaciones(initialValues.observaciones);
      if (initialValues.foto_factura_uri !== undefined) setFotoFacturaUri(initialValues.foto_factura_uri);
    }
  }, [initialValues]);

  // Parser robusto para montos en pesos o monedas con separadores de miles y decimales
  const parsearMonto = (val: string): number => {
    if (!val) return 0;
    let s = String(val).trim().replace(/[$\s]/g, '');
    if (!s) return 0;

    // Caso latino: 145.000 o 145.000,50
    if (s.includes('.') && s.includes(',')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (s.includes('.')) {
      const partes = s.split('.');
      if (partes.length > 1 && partes[partes.length - 1].length === 3) {
        s = s.replace(/\./g, '');
      }
    } else if (s.includes(',')) {
      const partes = s.split(',');
      if (partes.length > 1 && partes[partes.length - 1].length === 3) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(/,/g, '.');
      }
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const validar = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!establecimiento.trim()) nuevosErrores.establecimiento = 'El establecimiento es obligatorio';
    if (!fecha) nuevosErrores.fecha = 'La fecha es obligatoria';
    if (!hora) nuevosErrores.hora = 'La hora es obligatoria';
    if (!ciudad.trim()) nuevosErrores.ciudad = 'La ciudad es obligatoria';

    const numTotal = parsearMonto(total);
    if (!total || numTotal <= 0) {
      nuevosErrores.total = 'Ingresa un monto válido mayor a 0';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const esEdicion = Boolean(initialValues?.id);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setErrorBanner(null);

    if (!validar()) {
      setErrorBanner('Por favor revisa los campos requeridos en rojo antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      // Optimizar imagen si viene en base64 para que jamás exceda la cuota de localStorage
      let fotoOptimizada = fotoFacturaUri;
      if (fotoOptimizada && fotoOptimizada.length > 40000 && fotoOptimizada.startsWith('data:image')) {
        try {
          fotoOptimizada = await comprimirImagen(fotoOptimizada, 700, 700, 0.5);
        } catch {
          // Si falla compresión, mantener o quitar para resguardar
        }
      }

      const montoFinal = parsearMonto(total);
      let gastoResultado: Gasto;

      if (esEdicion && initialValues?.id) {
        gastoResultado = actualizarGasto({
          ...(initialValues as Gasto),
          id: initialValues.id,
          establecimiento: establecimiento.trim(),
          fecha,
          hora,
          ciudad: ciudad.trim() || 'Bogotá',
          nit: nit.trim(),
          categoria,
          metodo_pago: metodoPago,
          total: montoFinal,
          observaciones: observaciones.trim() || undefined,
          foto_factura_uri: fotoOptimizada,
        });
      } else {
        gastoResultado = guardarGasto({
          establecimiento: establecimiento.trim(),
          fecha,
          hora,
          ciudad: ciudad.trim() || 'Bogotá',
          nit: nit.trim(),
          categoria,
          metodo_pago: metodoPago,
          total: montoFinal,
          observaciones: observaciones.trim() || undefined,
          foto_factura_uri: fotoOptimizada,
        });
      }

      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b'],
        });
      } catch {}

      onSaved(gastoResultado);
    } catch (err: any) {
      console.error('Error al guardar factura:', err);
      setErrorBanner(`No se pudo registrar la factura: ${err?.message || 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const seleccionarEstablecimientoFrecuente = (item: typeof ESTABLECIMIENTOS_FRECUENTES[0]) => {
    setEstablecimiento(item.nombre);
    setNit(item.nit);
    setCategoria(item.cat);
  };

  const categoriasFiltradas = LISTA_CATEGORIAS.filter((c) =>
    c.toLowerCase().includes(filtroCategoria.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className={`w-full max-w-lg border-t sm:border rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md ${
            isDark
              ? 'bg-neutral-900/90 border-neutral-800/80'
              : 'bg-white/95 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {esEdicion ? 'Editar Factura' : initialValues?.establecimiento ? 'Verificar y Guardar Factura' : 'Nueva Factura de Gasto'}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                {esEdicion ? 'Modifica los datos y montos de esta factura' : 'Validado en local • SQLite Offline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
          {errorBanner && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Monto Total destacado (Hero input) */}
            <div
              className={`p-4 rounded-2xl border transition-all text-center ${
                isDark
                  ? 'bg-neutral-950/70 border-neutral-800/90 focus-within:border-emerald-500/80'
                  : 'bg-slate-50 border-slate-200 focus-within:border-emerald-500'
              }`}
            >
              <label
                className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-neutral-400' : 'text-slate-500'
                }`}
              >
                Monto Total de la Factura
              </label>
              <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                <span className="text-2xl font-bold">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={total}
                  onChange={(e) => {
                    setTotal(e.target.value);
                    if (errores.total) {
                      setErrores((prev) => ({ ...prev, total: '' }));
                    }
                  }}
                  placeholder="0"
                  className={`w-56 text-3xl font-extrabold bg-transparent text-center focus:outline-none font-mono ${
                    isDark ? 'text-white placeholder-neutral-600' : 'text-slate-900 placeholder-slate-300'
                  }`}
                  autoFocus={!initialValues?.total}
                />
              </div>
              {total && parsearMonto(total) > 0 && (
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {formatearMoneda(parsearMonto(total))}
                </p>
              )}
              {errores.total && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> {errores.total}
                </p>
              )}
            </div>

            {/* Selector de Categoría (Modal Trigger) */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Categoría (23 Categorías Oficiales)
              </label>
              <button
                type="button"
                onClick={() => setSelectorCategoriaAbierto(true)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border active:scale-[0.99] transition-all text-left cursor-pointer ${
                  isDark
                    ? 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon categoria={categoria} size={20} showBadge />
                  <div>
                    <span className={`text-sm font-semibold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {categoria}
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Toca para cambiar la categoría
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>
                  <span>Seleccionar</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            </div>

            {/* Establecimiento & Autocomplete */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Establecimiento / Proveedor
                </label>
                <span className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Ej: Terpel, Éxito
                </span>
              </div>
              <div className="relative">
                <Building2 size={16} className={`absolute left-3.5 top-3.5 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={establecimiento}
                  onChange={(e) => setEstablecimiento(e.target.value)}
                  placeholder="Nombre del comercio"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                    isDark
                      ? `bg-neutral-950/70 text-white placeholder-neutral-500 ${
                          errores.establecimiento ? 'border-rose-500' : 'border-neutral-800 focus:border-emerald-500'
                        }`
                      : `bg-slate-50 text-slate-900 placeholder-slate-400 ${
                          errores.establecimiento ? 'border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                        }`
                  }`}
                />
              </div>
              {errores.establecimiento && (
                <p className="text-rose-500 text-xs mt-1">{errores.establecimiento}</p>
              )}

              {/* Chips de frecuentes */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
                <span className={`text-[10px] uppercase font-semibold shrink-0 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  Frecuentes:
                </span>
                {ESTABLECIMIENTOS_FRECUENTES.map((item) => (
                  <button
                    key={item.nombre}
                    type="button"
                    onClick={() => seleccionarEstablecimientoFrecuente(item)}
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border-neutral-700/50'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* NIT / Identificación Tributaria (Opcional) */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                NIT / Documento Fiscal <span className="text-[10px] lowercase text-neutral-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <FileText size={16} className={`absolute left-3.5 top-3.5 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="Ej. 860.005.224-6 (opcional)"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                    isDark
                      ? 'bg-neutral-950/70 text-white placeholder-neutral-500 border-neutral-800 focus:border-emerald-500'
                      : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Fecha y Hora en 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Fecha (YYYY-MM-DD)
                </label>
                <div className="relative">
                  <Calendar size={16} className={`absolute left-3 top-3.5 pointer-events-none ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className={`w-full pl-9 pr-2 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      isDark
                        ? 'bg-neutral-950/70 border-neutral-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Hora (HH:mm)
                </label>
                <div className="relative">
                  <Clock size={16} className={`absolute left-3 top-3.5 pointer-events-none ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className={`w-full pl-9 pr-2 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      isDark
                        ? 'bg-neutral-950/70 border-neutral-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Ciudad y Chips */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Ciudad del Gasto
              </label>
              <div className="relative">
                <MapPin size={16} className={`absolute left-3.5 top-3.5 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Bogotá"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                    isDark
                      ? 'bg-neutral-950/70 border-neutral-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
                {CIUDADES_FRECUENTES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCiudad(c)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      ciudad === c
                        ? isDark
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold'
                        : isDark
                        ? 'bg-neutral-800/60 border-neutral-800 text-neutral-400 hover:text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Método de Pago */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LISTA_METODOS_PAGO.map((metodo) => {
                  const seleccionado = metodoPago === metodo;
                  return (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                        seleccionado
                          ? isDark
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold shadow-xs'
                          : isDark
                          ? 'bg-neutral-950/50 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {metodo}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observaciones (Opcional) */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Observaciones (Opcional)
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas de la factura, personas con quienes se compartió, etc."
                className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 resize-none ${
                  isDark
                    ? 'bg-neutral-950/70 border-neutral-800 text-white placeholder-neutral-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Indicador de Factura Adjunta si vino de OCR */}
            {fotoFacturaUri && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark
                    ? 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-emerald-500" />
                  <span>Factura escaneada con OCR</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  OCR Local OK
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 sm:p-5 border-t backdrop-blur-md flex items-center gap-3 ${
            isDark
              ? 'border-neutral-800/80 bg-neutral-900/90'
              : 'border-slate-200 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors text-center cursor-pointer ${
              isDark
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={() => handleSubmit()}
            className="flex-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Check size={18} className="stroke-[2.5]" />
            <span>{guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Guardar Factura'}</span>
          </button>
        </div>

        {/* Modal de las 23 Categorías */}
        <AnimatePresence>
          {selectorCategoriaAbierto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-30 backdrop-blur-md flex flex-col p-4 sm:p-6 ${
                isDark ? 'bg-neutral-950/95 text-white' : 'bg-white/98 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-emerald-500" />
                  <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Selecciona la Categoría
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectorCategoriaAbierto(false)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${
                    isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                placeholder="Buscar categoría (ej. Gasolina, Restaurante...)"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 mb-3 ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />

              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1 no-scrollbar">
                {categoriasFiltradas.map((cat) => {
                  const esActiva = categoria === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoria(cat);
                        setSelectorCategoriaAbierto(false);
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        esActiva
                          ? isDark
                            ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/50 shadow-xs'
                          : isDark
                          ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs'
                      }`}
                    >
                      <CategoryIcon categoria={cat} size={18} showBadge />
                      <span
                        className={`text-xs font-medium truncate ${
                          esActiva
                            ? isDark
                              ? 'text-white font-bold'
                              : 'text-emerald-800 font-bold'
                            : isDark
                            ? 'text-neutral-300'
                            : 'text-slate-700'
                        }`}
                      >
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
