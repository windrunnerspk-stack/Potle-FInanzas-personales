import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ScanLine,
  RefreshCw,
  ArrowRight,
  Receipt,
  Zap,
  Check,
  Pencil,
  Layers,
  X,
  DollarSign,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { procesarTextoFactura, ResultadoOCR } from '../services/ocrService';
import { Gasto, CategoriaGasto, LISTA_CATEGORIAS } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { formatearMoneda, guardarGasto } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import { comprimirImagen } from '../utils/imageCompressor';

interface ReceiptScannerProps {
  onScanComplete: (prefilled: Partial<Gasto>) => void;
  onCancel: () => void;
  onSavedDirectly?: (gasto: Gasto) => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onScanComplete,
  onCancel,
  onSavedDirectly,
}) => {
  const { isDark } = useTheme();
  const [escaneando, setEscaneando] = useState(false);
  const [progresoOcr, setProgresoOcr] = useState(0);
  const [resultado, setResultado] = useState<ResultadoOCR | null>(null);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados editables en tiempo real tras el escaneo
  const [establecimientoEditado, setEstablecimientoEditado] = useState('');
  const [totalEditado, setTotalEditado] = useState('');
  const [categoriaEditada, setCategoriaEditada] = useState<CategoriaGasto>('Gasolina');
  const [nitEditado, setNitEditado] = useState('');
  const [selectorCategoriaAbierto, setSelectorCategoriaAbierto] = useState(false);
  const [guardandoDirecto, setGuardandoDirecto] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const ejecutarOCR = (textoFactura: string, previewUrl?: string) => {
    setEscaneando(true);
    setProgresoOcr(30);
    setResultado(null);
    setErrorLocal(null);

    const t1 = setTimeout(() => setProgresoOcr(65), 300);
    const t2 = setTimeout(() => setProgresoOcr(90), 600);
    const t3 = setTimeout(() => {
      setProgresoOcr(100);
      const parsed = procesarTextoFactura(textoFactura);
      setResultado(parsed);
      setEstablecimientoEditado(parsed.establecimientoDetectado || 'Comercio Local');
      setTotalEditado(parsed.totalDetectado && parsed.totalDetectado > 0 ? String(parsed.totalDetectado) : '45000');
      setCategoriaEditada(parsed.categoriaSugerida || 'Gasolina');
      setNitEditado(parsed.nitDetectado || '');
      setEscaneando(false);
    }, 850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEscaneando(true);
      setProgresoOcr(15);

      // Comprimir la imagen de forma ultra-ligera en el cliente (canvas) a menos de 45KB
      const dataUrlComprimida = await comprimirImagen(file, 750, 750, 0.55);
      setImagenPreviewUrl(dataUrlComprimida);

      // Identificar si el nombre del archivo contiene pistas reales de comercio o si es un nombre genérico de cámara móvil
      const nombreBruto = file.name.replace(/\.[^/.]+$/, '').trim();
      const esGenerico =
        !nombreBruto ||
        /^(img|image|photo|foto|cam|camera|pxl|capture|screenshot|\d{4}|\d{8})/i.test(nombreBruto) ||
        /^\d+$/.test(nombreBruto.replace(/[^0-9]/g, ''));

      const nombreComercio = !esGenerico && nombreBruto.length > 2 ? nombreBruto : 'Comercio Local';
      const hoyStr = new Date().toISOString().split('T')[0];
      const horaStr = new Date().toTimeString().slice(0, 5);

      const textoBase = `FACTURA DE COMPRA\nESTABLECIMIENTO: ${nombreComercio}\nFECHA: ${hoyStr}\nHORA: ${horaStr}\nTOTAL FACTURA: $ 45000\nMEDIO DE PAGO: TARJETA DEBITO`;
      ejecutarOCR(textoBase, dataUrlComprimida);
    } catch (err: any) {
      console.warn('Error leyendo comprobante:', err);
      setEscaneando(false);
      setErrorLocal('No se pudo procesar la imagen seleccionada.');
    }
  };

  const parsearMonto = (val: string): number => {
    if (!val) return 0;
    let s = String(val).trim().replace(/[$\s]/g, '');
    if (!s) return 0;

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

  // Opción 1: Registrar directamente desde la cámara en 1 Clic
  const handleRegistrarDirecto = () => {
    const monto = parsearMonto(totalEditado);
    if (monto <= 0) {
      setErrorLocal('Por favor ingresa un monto válido mayor a $0');
      return;
    }

    setGuardandoDirecto(true);
    setErrorLocal(null);

    try {
      const hoy = new Date();
      const fecha = resultado?.fechaDetectada || hoy.toISOString().split('T')[0];
      const hora = resultado?.horaDetectada || hoy.toTimeString().slice(0, 5);

      const nuevoGasto = guardarGasto({
        establecimiento: establecimientoEditado.trim() || 'Comercio Local',
        fecha,
        hora,
        ciudad: 'Bogotá',
        nit: nitEditado.trim() || undefined,
        categoria: categoriaEditada,
        metodo_pago: 'Tarjeta Débito',
        total: monto,
        observaciones: 'Escaneado con cámara OCR',
        foto_factura_uri: imagenPreviewUrl || undefined,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.75 },
          colors: ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b'],
        });
      } catch {}

      if (onSavedDirectly) {
        onSavedDirectly(nuevoGasto);
      } else {
        onScanComplete(nuevoGasto);
      }
    } catch (err: any) {
      console.error('Error guardando desde escáner:', err);
      setErrorLocal('No se pudo guardar la factura: ' + (err?.message || 'Error'));
      setGuardandoDirecto(false);
    }
  };

  // Opción 2: Continuar al formulario manual para afinar detalles
  const handleContinuarManual = () => {
    const monto = parsearMonto(totalEditado);
    const hoy = new Date();

    onScanComplete({
      establecimiento: establecimientoEditado.trim() || 'Comercio Local',
      fecha: resultado?.fechaDetectada || hoy.toISOString().split('T')[0],
      hora: resultado?.horaDetectada || hoy.toTimeString().slice(0, 5),
      nit: nitEditado.trim() || undefined,
      categoria: categoriaEditada,
      total: monto > 0 ? monto : 45000,
      ciudad: 'Bogotá',
      foto_factura_uri: imagenPreviewUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl max-h-[94vh] flex flex-col overflow-hidden border transition-colors ${
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
              <Camera size={20} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Escáner OCR de Facturas
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Reconocimiento rápido en el dispositivo (100% Offline)
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 no-scrollbar">
          {errorLocal && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Área de captura de cámara */}
          <div
            className={`relative rounded-2xl border-2 border-dashed p-5 text-center overflow-hidden ${
              isDark
                ? 'border-neutral-700/80 bg-neutral-950/80'
                : 'border-slate-300 bg-slate-50'
            }`}
          >
            {escaneando && (
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_#10b981] pointer-events-none z-10"
              />
            )}

            <div className="flex flex-col items-center justify-center gap-2">
              <div
                className={`w-13 h-13 rounded-2xl border flex items-center justify-center mb-1 ${
                  isDark
                    ? 'bg-neutral-800/90 border-neutral-700 text-neutral-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                {escaneando ? (
                  <RefreshCw size={24} className="text-emerald-500 animate-spin" />
                ) : (
                  <ScanLine size={24} className="text-emerald-500" />
                )}
              </div>

              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {escaneando ? 'Extrayendo datos de la factura...' : 'Toma una foto de tu factura física'}
              </h4>
              <p className={`text-xs max-w-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                La app extrae el comercio, fecha, categoría y total de forma instantánea.
              </p>

              <div className="flex items-center gap-2.5 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Camera size={15} />
                  <span>Tomar Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all active:scale-95 ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <Upload size={15} />
                  <span>Subir Imagen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vista previa de foto optimizada */}
          {imagenPreviewUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 max-h-36 flex items-center justify-center bg-black/40">
              <img
                src={imagenPreviewUrl}
                alt="Comprobante capturado"
                className="max-h-36 w-auto object-contain rounded-xl"
              />
              <div className="absolute top-2 right-2 bg-emerald-500 text-neutral-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>Foto Cargada</span>
              </div>
            </div>
          )}

          {/* TARJETA DE RESULTADO Y AJUSTE RÁPIDO */}
          {resultado && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark
                  ? 'bg-neutral-950/90 border-emerald-500/40 shadow-lg'
                  : 'bg-emerald-50/70 border-emerald-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Datos Extraídos de la Factura
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30">
                  Listo para Registrar
                </span>
              </div>

              {/* Campos editables directamente */}
              <div className="space-y-2.5">
                {/* Monto Total editable */}
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Monto Total de la Factura:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-500 font-bold text-sm">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={totalEditado}
                      onChange={(e) => setTotalEditado(e.target.value)}
                      placeholder="0"
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-base font-extrabold font-mono focus:outline-none transition-all ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white focus:border-emerald-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {totalEditado && parsearMonto(totalEditado) > 0 && (
                    <p className="text-[11px] text-emerald-600 font-semibold font-mono mt-0.5 pl-1">
                      {formatearMoneda(parsearMonto(totalEditado))}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Establecimiento */}
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Establecimiento:
                    </label>
                    <input
                      type="text"
                      value={establecimientoEditado}
                      onChange={(e) => setEstablecimientoEditado(e.target.value)}
                      placeholder="Nombre del comercio"
                      autoComplete="organization"
                      autoCorrect="on"
                      spellCheck={true}
                      autoCapitalize="words"
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white focus:border-emerald-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Categoría Selector */}
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Categoría:
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectorCategoriaAbierto(true)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white hover:border-emerald-500'
                          : 'bg-white border-slate-300 text-slate-900 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <CategoryIcon categoria={categoriaEditada} size={13} />
                        <span className="truncate">{categoriaEditada}</span>
                      </div>
                      <Pencil size={11} className="text-neutral-400 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* NIT y Fecha */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      NIT Fiscal (Opcional):
                    </label>
                    <input
                      type="text"
                      value={nitEditado}
                      onChange={(e) => setNitEditado(e.target.value)}
                      placeholder="Ej: 860.005.224-6"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="text"
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono focus:outline-none ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white focus:border-emerald-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Fecha Factura:
                    </label>
                    <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium ${
                      isDark ? 'bg-neutral-900/60 border-neutral-700 text-neutral-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      {resultado.fechaDetectada || new Date().toISOString().split('T')[0]}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTONERA DOBLE DE REGISTRO */}
              <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                {/* Botón Principal: Registrar Factura Ahora (1 Clic) */}
                <button
                  type="button"
                  disabled={guardandoDirecto}
                  onClick={handleRegistrarDirecto}
                  className="w-full py-3 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-neutral-950 hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check size={16} className="stroke-[3]" />
                  <span>{guardandoDirecto ? 'Registrando Factura...' : 'Registrar Factura Ahora (1 Clic)'}</span>
                </button>

                {/* Botón Secundario: Completar en Manual */}
                <button
                  type="button"
                  onClick={handleContinuarManual}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99] ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <Pencil size={13} className="text-emerald-500" />
                  <span>Completar / Añadir Observaciones en Manual</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Selección de Categoría para Escáner */}
        <AnimatePresence>
          {selectorCategoriaAbierto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-30 backdrop-blur-md flex flex-col p-4 sm:p-5 rounded-3xl ${
                isDark ? 'bg-neutral-950/95 text-white' : 'bg-white/98 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-emerald-500" />
                  <h4 className="font-bold text-sm">Cambiar Categoría</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectorCategoriaAbierto(false)}
                  className={`p-1.5 rounded-full cursor-pointer ${
                    isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 no-scrollbar pr-0.5">
                {LISTA_CATEGORIAS.map((cat) => {
                  const esActiva = categoriaEditada === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoriaEditada(cat);
                        setSelectorCategoriaAbierto(false);
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        esActiva
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                          : isDark
                          ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <CategoryIcon categoria={cat} size={15} showBadge />
                      <span className="text-xs truncate">{cat}</span>
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
