import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Smartphone,
  RefreshCw,
  Columns
} from 'lucide-react';
import { Gasto, UsuarioConfig } from '../types/finance';
import {
  descargarGastosCSV,
  exportarGastosParaGoogleSheetsTSV,
  marcarExportacionRealizada,
} from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

interface ExportTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  gastos: Gasto[];
  config: UsuarioConfig;
}

export const ExportTutorialModal: React.FC<ExportTutorialModalProps> = ({
  isOpen,
  onClose,
  gastos,
  config,
}) => {
  const { isDark } = useTheme();
  const [pasoActivo, setPasoActivo] = useState<number>(1);
  const [copiadoTSV, setCopiadoTSV] = useState(false);
  const [descargaRealizada, setDescargaRealizada] = useState(false);

  if (!isOpen) return null;

  const handleDescargar = () => {
    descargarGastosCSV(gastos);
    marcarExportacionRealizada();
    setDescargaRealizada(true);
    setTimeout(() => setDescargaRealizada(false), 3500);
  };

  const handleCopiarTSV = () => {
    const tsv = exportarGastosParaGoogleSheetsTSV(gastos);
    navigator.clipboard.writeText(tsv);
    marcarExportacionRealizada();
    setCopiadoTSV(true);
    setTimeout(() => setCopiadoTSV(false), 3000);
  };

  const columnasOficiales = [
    '1. ID',
    '2. Fecha',
    '3. Hora',
    '4. Establecimiento',
    '5. NIT',
    '6. Ciudad',
    '7. Categoría',
    '8. Subcategoría',
    '9. Método de pago',
    '10. Subtotal',
    '11. IVA',
    '12. Descuento',
    '13. Propina',
    '14. Total',
    '15. Observaciones',
    '16. Imagen (Drive)',
    '17. Fecha de registro',
    '18. MesAño',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border transition-colors ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera del Tutorial */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Tutorial de Respaldo y Exportación</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Cada 15 días
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Formato oficial de 18 columnas compatible con Google Sheets & Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Notificación informativa del modo local */}
        <div
          className={`px-5 py-2.5 border-b text-xs flex items-center justify-between gap-3 ${
            isDark ? 'bg-neutral-950/60 border-neutral-800 text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Smartphone size={15} className="text-emerald-500 shrink-0" />
            <span>Tus datos están guardados en la <strong>memoria local de tu teléfono</strong>.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-500 font-bold shrink-0">
            {gastos.length} {gastos.length === 1 ? 'comprobante' : 'comprobantes'}
          </span>
        </div>

        {/* Contenido con pestañas de pasos */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Navegación rápida de pasos */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-neutral-950/40 border border-neutral-800/80 text-xs font-semibold">
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                onClick={() => setPasoActivo(p)}
                className={`py-1.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  pasoActivo === p
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                    : isDark
                    ? 'text-neutral-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Paso {p}</span>
              </button>
            ))}
          </div>

          {/* PASO 1: Descargar archivo oficial con 18 columnas */}
          {pasoActivo === 1 && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm">Descarga tu archivo con las 18 columnas oficiales</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                    El archivo se descargará con la estructura oficial exacta que requiere Google Sheets y esta app para una reimportación perfecta.
                  </p>
                </div>
              </div>

              {/* Visualización de las 18 columnas */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
                  <div className="flex items-center gap-1.5">
                    <Columns size={14} />
                    <span>Estructura Oficial Incorporada (18 Columnas):</span>
                  </div>
                  <span className="text-[10px] opacity-75">Orden estandarizado</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto no-scrollbar pt-1">
                  {columnasOficiales.map((col) => (
                    <span
                      key={col}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700/80 text-neutral-300'
                          : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                      }`}
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botonera de descarga y copia */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDescargar}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Download size={16} className="stroke-[2.5]" />
                  <span>Descargar Archivo Oficial (.CSV con 18 columnas)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopiarTSV}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <Copy size={14} className="text-emerald-500" />
                  <span>O copiar datos al portapapeles (para pegar con Ctrl+V)</span>
                </button>

                {descargaRealizada && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 size={16} />
                    <span>¡Archivo descargado con éxito en tu teléfono! Ahora continúa al Paso 2.</span>
                  </div>
                )}

                {copiadoTSV && (
                  <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 size={16} />
                    <span>¡18 columnas copiadas al portapapeles! Listo para pegar en Google Sheets.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: Abrir Google Sheets */}
          {pasoActivo === 2 && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm">Abre tu hoja de Google Sheets en tu dispositivo o PC</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                    Abre la hoja donde llevas el registro mensual o crea una nueva hoja en tu cuenta de Google Drive.
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500">Opciones de acceso rápido:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={
                      config.google_sheets_id
                        ? `https://docs.google.com/spreadsheets/d/${config.google_sheets_id}/edit`
                        : 'https://sheets.new'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
                  >
                    <ExternalLink size={14} />
                    <span>{config.google_sheets_id ? 'Abrir Mi Hoja Vinculada' : 'Crear Hoja Nueva (sheets.new)'}</span>
                  </a>

                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    <span>Google Drive</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Sobrescribir la hoja de cálculo */}
          {pasoActivo === 3 && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm">Sobrescribe la hoja para actualizar tus datos</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                    Para que no haya facturas duplicadas, sobrescribe la hoja de cálculo con el nuevo archivo:
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 text-xs leading-relaxed ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800 text-neutral-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-emerald-500">
                  <CheckCircle2 size={16} />
                  <span>Pasos en Google Sheets:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 pl-1">
                  <li>
                    Haz clic en el menú superior <strong>Archivo</strong> &gt; <strong>Importar</strong>.
                  </li>
                  <li>
                    Ve a la pestaña <strong>Subir</strong> y selecciona el archivo <code>.csv</code> que acabas de descargar.
                  </li>
                  <li>
                    En la ventana emergente, selecciona: <strong>"Reemplazar la hoja actual"</strong>.
                  </li>
                  <li>
                    Haz clic en <strong>"Importar datos"</strong>. ¡Tu hoja quedará 100% actualizada con tus comprobantes y sumas exactas!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* PASO 4: Respaldo en caso de formatear o cambiar de teléfono */}
          {pasoActivo === 4 && (
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-sm">¿Cambiaste de teléfono o lo formateaste? Reimporta en 1 Clic</h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                    Gracias al orden estricto de 18 columnas, recuperar tus datos es automático:
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 text-xs ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800 text-neutral-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-emerald-500">
                  <ShieldCheck size={18} />
                  <span>Métodos de Reimportación Disponibles:</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
                    <strong>1. Pegar Celdas:</strong> Abre tu Google Sheet, presiona Ctrl+A y Ctrl+C, luego en Aura Finanzas vas a "Importar Hoja" y tocas "Pegar Celdas".
                  </div>
                  <div className="p-2.5 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
                    <strong>2. Subir Archivo:</strong> Selecciona el archivo <code>.csv</code> guardado en Google Drive o tu correo.
                  </div>
                  <div className="p-2.5 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
                    <strong>3. Enlace Público:</strong> Pega el enlace de tu Google Sheet y la aplicación extraerá tus comprobantes automáticamente.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie con controles de navegación y confirmación */}
        <div
          className={`px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
            isDark ? 'border-neutral-800 bg-neutral-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {pasoActivo > 1 && (
              <button
                type="button"
                onClick={() => setPasoActivo(pasoActivo - 1)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                  isDark ? 'border-neutral-700 bg-neutral-800 text-neutral-200' : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                Anterior
              </button>
            )}

            {pasoActivo < 4 ? (
              <button
                type="button"
                onClick={() => setPasoActivo(pasoActivo + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-400"
              >
                <span>Siguiente Paso</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  marcarExportacionRealizada();
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-400"
              >
                <CheckCircle2 size={14} />
                <span>Listo, Marcar como Respaldado</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDescargar}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer ${
                isDark
                  ? 'border-neutral-700 bg-neutral-900 text-emerald-400 hover:bg-neutral-800'
                  : 'border-slate-300 bg-white text-emerald-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              <Download size={13} />
              <span>Descargar CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
