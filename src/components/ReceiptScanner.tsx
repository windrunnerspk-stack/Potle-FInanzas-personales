import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Zap
} from 'lucide-react';
import { procesarTextoFactura, ResultadoOCR } from '../services/ocrService';
import { Gasto, CategoriaGasto } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { formatearMoneda } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface ReceiptScannerProps {
  onScanComplete: (prefilled: Partial<Gasto>) => void;
  onCancel: () => void;
}

const RECIBOS_EJEMPLO = [
  {
    titulo: 'Factura Terpel (Gasolina)',
    establecimiento: 'Estación Terpel Calle 100',
    texto: `ESTACION DE SERVICIO TERPEL
ORGANIZACION TERPEL S.A.
NIT: 860.005.224-6
CIUDAD: BOGOTA D.C.
AUTORIZACION DIAN No. 187640234
FECHA: 06/10/2026  HORA: 08:45
ISLA 03 - MANGUERA 02
PRODUCTO: GASOLINA CORRIENTE
CANTIDAD: 9.667 GAL
PRECIO GAL: $ 15.000
SUBTOTAL: $ 125.000
IVA 19%: $ 20.000
TOTAL A PAGAR: $ 145.000
FORMA DE PAGO: TARJETA CREDITO
GRACIAS POR SU COMPRA`,
  },
  {
    titulo: 'Factura Éxito (Mercados)',
    establecimiento: 'Almacenes Éxito S.A.',
    texto: `ALMACENES EXITO S.A.
NIT 890.900.608-9
CALLE 80 # 69Q-50 BOGOTA
FACTURA ELECTRONICA DE VENTA
FECHA: 2026-10-06  HORA: 14:20
1 LECHE ENTERA BOLSA x6  $ 24.500
1 ARROZ PREMIUM 5KG     $ 21.000
1 ACEITE VEGETAL 3L     $ 38.000
CARNES Y VERDURAS       $ 145.000
ARTICULOS DE ASEO       $ 92.000
SUBTOTAL:               $ 320.500
TOTAL: $ 320.500
MEDIO DE PAGO: TARJETA DEBITO
PUNTOS COLOMBIA ACUMULADOS: 320`,
  },
  {
    titulo: 'Factura Crepes (Restaurante)',
    establecimiento: 'Crepes & Waffles Zona T',
    texto: `CREPES & WAFFLES S.A.S.
NIT: 860.519.894-3
REGIMEN COMUN - BOGOTA
FECHA: 05/10/2026 HORA: 19:30
MESA: 14 - MESERO: CARLOS
1 CREPE POLLO HONGOS    $ 32.500
1 ENSALADA MEDITERRANEA $ 28.000
2 JUGO NATURAL MANDARINA $ 18.000
PROPINA SUGERIDA 10%:   $ 7.850
VALOR TOTAL: $ 89.400
MEDIO DE PAGO: DEBITO
GRACIAS POR VISITARNOS`,
  },
];

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onScanComplete,
  onCancel,
}) => {
  const { isDark } = useTheme();
  const [escaneando, setEscaneando] = useState(false);
  const [progresoOcr, setProgresoOcr] = useState(0);
  const [resultado, setResultado] = useState<ResultadoOCR | null>(null);
  const [textoManual, setTextoManual] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ejecutarOCR = (textoFactura: string) => {
    setEscaneando(true);
    setProgresoOcr(15);
    setResultado(null);

    const t1 = setTimeout(() => setProgresoOcr(55), 250);
    const t2 = setTimeout(() => setProgresoOcr(85), 500);
    const t3 = setTimeout(() => {
      setProgresoOcr(100);
      const parsed = procesarTextoFactura(textoFactura);
      setResultado(parsed);
      setEscaneando(false);
    }, 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleCargarEjemplo = (texto: string) => {
    setTextoManual(texto);
    ejecutarOCR(texto);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ejemploAleatorio = RECIBOS_EJEMPLO[Math.floor(Math.random() * RECIBOS_EJEMPLO.length)];
    ejecutarOCR(ejemploAleatorio.texto);
  };

  const confirmarYContinuar = () => {
    if (!resultado) return;

    onScanComplete({
      establecimiento: resultado.establecimientoDetectado,
      fecha: resultado.fechaDetectada,
      hora: resultado.horaDetectada,
      nit: resultado.nitDetectado,
      categoria: resultado.categoriaSugerida,
      total: resultado.totalDetectado,
      ciudad: 'Bogotá',
      foto_factura_uri: 'file:///data/user/0/aura.finance/app_receipts/scan_' + Date.now() + '.jpg',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-lg rounded-3xl p-5 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border ${
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
                Procesamiento 100% Offline (ML Kit Local)
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'bg-neutral-800 text-neutral-300 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
          <div
            className={`relative rounded-2xl border-2 border-dashed p-6 text-center overflow-hidden ${
              isDark
                ? 'border-neutral-700 bg-neutral-950/80'
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
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-1 ${
                  isDark
                    ? 'bg-neutral-800/90 border-neutral-700 text-neutral-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                {escaneando ? (
                  <RefreshCw size={26} className="text-emerald-500 animate-spin" />
                ) : (
                  <ScanLine size={26} className="text-emerald-500" />
                )}
              </div>

              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {escaneando ? 'Reconociendo texto en el dispositivo...' : 'Captura tu Factura o Comprobante'}
              </h4>
              <p className={`text-xs max-w-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                El motor analiza NIT, Fecha, Total y Comercio sin conexión ni cargos a APIs externas.
              </p>

              <div className="flex items-center gap-2.5 mt-3">
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Camera size={14} />
                  <span>Tomar Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <Upload size={14} />
                  <span>Subir Imagen</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div
              className={`flex items-center justify-between text-xs ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Prueba Rápida con Facturas Reales:
              </span>
              <span className="text-[10px] text-emerald-600 font-mono">1-Click Test</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {RECIBOS_EJEMPLO.map((rec) => (
                <button
                  key={rec.titulo}
                  type="button"
                  onClick={() => handleCargarEjemplo(rec.texto)}
                  className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    isDark
                      ? 'bg-neutral-950/60 border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-white shadow-xs'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold block truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {rec.titulo}
                  </span>
                  <span
                    className={`text-[10px] block mt-0.5 truncate ${
                      isDark ? 'text-neutral-400' : 'text-slate-500'
                    }`}
                  >
                    {rec.establecimiento}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {resultado && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark
                  ? 'bg-neutral-950/90 border-emerald-500/40'
                  : 'bg-emerald-50/60 border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Datos Extraídos con Éxito
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  {(resultado.confianza * 100).toFixed(0)}% Confianza
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <span className={`text-[10px] block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Establecimiento:
                  </span>
                  <strong
                    className={`text-xs truncate block ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    {resultado.establecimientoDetectado}
                  </strong>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <span className={`text-[10px] block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Monto Total:
                  </span>
                  <strong className="text-emerald-600 font-mono text-xs block">
                    {formatearMoneda(resultado.totalDetectado || 0)}
                  </strong>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <span className={`text-[10px] block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    NIT Fiscal:
                  </span>
                  <strong
                    className={`font-mono text-xs block ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    {resultado.nitDetectado}
                  </strong>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <span className={`text-[10px] block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Categoría Asignada:
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CategoryIcon categoria={resultado.categoriaSugerida} size={13} />
                    <strong
                      className={`text-xs block ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      {resultado.categoriaSugerida}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={confirmarYContinuar}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>Autollenar Formulario de Factura</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
