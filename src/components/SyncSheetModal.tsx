import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  FileSpreadsheet,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Link as LinkIcon,
  ClipboardPaste,
  FileCheck,
  X,
  Sparkles,
  Download,
  Copy,
  ChevronRight,
  Database,
  ExternalLink,
  FileDown,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { Gasto, UsuarioConfig, LISTA_CATEGORIAS_DEFAULT } from '../types/finance';
import {
  sincronizarTodoConGoogleSheets,
  formatearMoneda,
  importarGastosDesdeGoogleSheets,
  guardarConfiguracion,
  sincronizarConFirebase,
  descargarGastosCSV,
  exportarGastosParaGoogleSheetsTSV
} from '../services/storageService';
import {
  procesarImportacionGoogleSheets,
  descargarGoogleSheetsCSV,
  generarPlantillaGoogleSheets
} from '../services/googleSheetsImportService';
import {
  subirGastosAGoogleSheetDirecto,
  extraerSpreadsheetId,
  ResultadoSubidaGoogleSheets
} from '../services/googleSheetsSyncService';
import {
  exportarFacturasAGoogleDriveAndroid,
  abrirEnlaceNativo,
  enviarFacturasAAppsScriptWebhook,
} from '../services/androidDriveExportService';
import { Capacitor } from '@capacitor/core';
import { loginWithGoogle, getGoogleAccessToken, solicitarPermisosGoogleSheets } from '../services/firebase';
import { CategoryIcon } from './CategoryIcon';
import { useTheme } from '../context/ThemeContext';
import { ExportTutorialModal } from './ExportTutorialModal';

interface SyncSheetModalProps {
  gastos: Gasto[];
  config: UsuarioConfig;
  onClose: () => void;
  onSynced: () => void;
  pestañaInicial?: 'importar' | 'sheet' | 'email';
}

export const SyncSheetModal: React.FC<SyncSheetModalProps> = ({
  gastos,
  config,
  onClose,
  onSynced,
  pestañaInicial = 'importar',
}) => {
  const { isDark } = useTheme();
  const [pestaña, setPestaña] = useState<'importar' | 'sheet' | 'email'>(pestañaInicial);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [emailInput, setEmailInput] = useState(config.email || '');
  const [emailGuardado, setEmailGuardado] = useState(false);
  const [iniciandoGoogle, setIniciandoGoogle] = useState(false);

  // Estados de importación
  const [metodoImportacion, setMetodoImportacion] = useState<'pegar' | 'url' | 'archivo'>('pegar');
  const [textoPegado, setTextoPegado] = useState('');
  const [urlSheet, setUrlSheet] = useState(
    config.google_sheets_id
      ? `https://docs.google.com/spreadsheets/d/${config.google_sheets_id}/edit`
      : ''
  );
  const [cargandoUrl, setCargandoUrl] = useState(false);
  const [errorUrl, setErrorUrl] = useState('');
  const [modoGuardado, setModoGuardado] = useState<'anexar' | 'reemplazar'>('anexar');
  const [notificacionCopiado, setNotificacionCopiado] = useState(false);
  const [mostrarTutorial, setMostrarTutorial] = useState(false);

  // Estados de subida directa a Google Sheets & Google Drive
  const [subiendoASheets, setSubiendoASheets] = useState(false);
  const [subiendoADriveAndroid, setSubiendoADriveAndroid] = useState(false);
  const [confirmacionSubidaAbierta, setConfirmacionSubidaAbierta] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const [necesitaAutorizacion, setNecesitaAutorizacion] = useState(false);

  // Parseo en tiempo real del texto ingresado
  const resultadoParseo = useMemo(() => {
    if (!textoPegado.trim()) return null;
    return procesarImportacionGoogleSheets(textoPegado);
  }, [textoPegado]);

  const pendientes = gastos.filter((g) => !g.sincronizado).length;

  /**
   * Método nativo para Android (APK):
   * Genera el archivo con las 18 columnas y abre el selector oficial de Android (Share Sheet),
   * donde el usuario toca "Guardar en Drive" para subirlo directamente a la carpeta de su Google Drive.
   */
  const handleSubirAGoogleDriveAndroid = async () => {
    setSubiendoADriveAndroid(true);
    setErrorSubida(null);
    setMensajeExito('');
    try {
      const res = await exportarFacturasAGoogleDriveAndroid(gastos);
      if (res.success) {
        sincronizarTodoConGoogleSheets();
        onSynced();
        setMensajeExito(res.mensaje);
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#10b981', '#14b8a6', '#3b82f6'],
          });
        } catch {}
      } else {
        setErrorSubida(res.mensaje);
      }
    } catch (err: any) {
      setErrorSubida('Error al preparar Google Drive: ' + (err?.message || 'Error'));
    } finally {
      setSubiendoADriveAndroid(false);
    }
  };

  const handleEjecutarSubidaDirecta = async () => {
    // 1. Si es un Webhook de Apps Script
    if (urlSheet.includes('script.google.com/macros/s/')) {
      setSubiendoASheets(true);
      setErrorSubida(null);
      setMensajeExito('');
      try {
        const respWebhook = await enviarFacturasAAppsScriptWebhook(urlSheet, gastos);
        if (respWebhook.success) {
          sincronizarTodoConGoogleSheets();
          onSynced();
          setMensajeExito(respWebhook.mensaje);
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.7 },
              colors: ['#10b981', '#14b8a6', '#06b6d4'],
            });
          } catch {}
        } else {
          setErrorSubida(respWebhook.mensaje);
        }
      } catch (e: any) {
        setErrorSubida('Error con Webhook: ' + (e?.message || 'Error'));
      } finally {
        setSubiendoASheets(false);
        setConfirmacionSubidaAbierta(false);
      }
      return;
    }

    const idExtraido = extraerSpreadsheetId(urlSheet);
    if (!idExtraido) {
      setErrorSubida('Por favor ingresa un enlace válido de tu hoja de Google Sheets.');
      return;
    }

    guardarConfiguracion({ google_sheets_id: idExtraido });

    // 2. Si estamos en APK nativa de Android y no hay token web cargado:
    // Enviar directamente mediante el exportador nativo de Google Drive para evitar bloqueo de WebView
    if (Capacitor.isNativePlatform() && !getGoogleAccessToken()) {
      setSubiendoASheets(true);
      setErrorSubida(null);
      setConfirmacionSubidaAbierta(false);
      try {
        const resDrive = await exportarFacturasAGoogleDriveAndroid(gastos);
        if (resDrive.success) {
          sincronizarTodoConGoogleSheets();
          onSynced();
          setMensajeExito(resDrive.mensaje);
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.7 },
              colors: ['#10b981', '#14b8a6', '#06b6d4'],
            });
          } catch {}
        } else {
          setErrorSubida(resDrive.mensaje);
        }
      } finally {
        setSubiendoASheets(false);
      }
      return;
    }

    // 3. Flujo Google Sheets API v4
    setSubiendoASheets(true);
    setErrorSubida(null);
    setMensajeExito('');
    setNecesitaAutorizacion(false);

    try {
      const res = await subirGastosAGoogleSheetDirecto(idExtraido, gastos, {
        solicitarAuthSiFalta: !Capacitor.isNativePlatform(),
      });

      if (res.success) {
        sincronizarTodoConGoogleSheets();
        onSynced();
        setMensajeExito(res.mensaje);
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#10b981', '#14b8a6', '#06b6d4'],
          });
        } catch {}
      } else {
        if (res.requiereAuth) {
          if (Capacitor.isNativePlatform()) {
            setErrorSubida(
              'En Android APK usa el botón «Subir a Google Drive (Android)» para enviar directamente a tu app de Drive instalada.'
            );
          } else {
            setNecesitaAutorizacion(true);
            setErrorSubida(
              'Google requiere autorización de tu cuenta para poder escribir en tu hoja. Haz clic en "Autorizar con Google" para completar la sincronización.'
            );
          }
        } else {
          setErrorSubida(res.mensaje || 'No se pudo subir a la hoja.');
        }
      }
    } catch (err: any) {
      setErrorSubida('Error de conexión con Google Sheets: ' + (err?.message || 'Error'));
    } finally {
      setSubiendoASheets(false);
      setConfirmacionSubidaAbierta(false);
    }
  };

  const handleAutorizarYSubir = async () => {
    if (Capacitor.isNativePlatform()) {
      await handleSubirAGoogleDriveAndroid();
      return;
    }
    setSubiendoASheets(true);
    setErrorSubida(null);
    try {
      const authRes = await solicitarPermisosGoogleSheets();
      if (authRes.success) {
        setNecesitaAutorizacion(false);
        await handleEjecutarSubidaDirecta();
      } else {
        setErrorSubida('No se pudo autorizar Google Sheets: ' + (authRes.error || 'Cancelado por el usuario'));
      }
    } finally {
      setSubiendoASheets(false);
    }
  };

  const handleActualizarEmail = () => {
    const limpio = emailInput.trim();
    guardarConfiguracion({ email: limpio });
    setEmailGuardado(true);
    setTimeout(() => setEmailGuardado(false), 2500);
    onSynced();
  };

  const handleGoogleLoginSync = async () => {
    setIniciandoGoogle(true);
    try {
      const resp = await loginWithGoogle();
      if (resp.success && resp.email) {
        setEmailInput(resp.email);
        guardarConfiguracion({ email: resp.email, modo: 'sincronizado' });
        setEmailGuardado(true);
        setTimeout(() => setEmailGuardado(false), 2500);
        onSynced();
      }
    } finally {
      setIniciandoGoogle(false);
    }
  };

  const handleSincronizarAhora = async () => {
    setSincronizando(true);
    try {
      if (emailInput.trim() && emailInput.trim() !== config.email) {
        guardarConfiguracion({ email: emailInput.trim() });
      }
      const res = sincronizarTodoConGoogleSheets();
      await sincronizarConFirebase();
      setSincronizando(false);
      setMensajeExito(res.resumen);
      onSynced();
    } catch {
      setSincronizando(false);
      setMensajeExito('Sincronización procesada.');
      onSynced();
    }
  };

  const handleExportarCSVLocal = () => {
    descargarGastosCSV(gastos);
    setMensajeExito('¡Archivo CSV descargado con éxito en tu dispositivo!');
  };

  const handleCargarEjemploPlantilla = () => {
    const ejemplo = generarPlantillaGoogleSheets();
    setTextoPegado(ejemplo);
    setMetodoImportacion('pegar');
    setErrorUrl('');
  };

  const handleDescargarPlantilla = () => {
    const csv = generarPlantillaGoogleSheets();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Google_Sheets_Facturas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopiarPlantilla = () => {
    const csv = generarPlantillaGoogleSheets();
    navigator.clipboard.writeText(csv);
    setNotificacionCopiado(true);
    setTimeout(() => setNotificacionCopiado(false), 2500);
  };

  const handleCargarUrl = async () => {
    if (!urlSheet.trim()) {
      setErrorUrl('Por favor introduce un enlace válido de Google Sheets.');
      return;
    }
    setErrorUrl('');
    setCargandoUrl(true);
    const resp = await descargarGoogleSheetsCSV(urlSheet);
    setCargandoUrl(false);

    if (resp.exito && resp.contenido) {
      setTextoPegado(resp.contenido);
      setMetodoImportacion('pegar');

      // Procesar y autoguardar de inmediato las facturas en la app / APK
      const parseado = procesarImportacionGoogleSheets(resp.contenido);
      if (parseado.exito && parseado.gastosImportados.length > 0) {
        const { importados, totalGastos } = importarGastosDesdeGoogleSheets(
          parseado.gastosImportados,
          modoGuardado
        );
        onSynced();
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#14b8a6', '#3b82f6'],
          });
        } catch {}
        setMensajeExito(
          `¡Éxito total! Se importaron ${importados} facturas desde tu enlace de Google Sheets a la APK (${modoGuardado === 'reemplazar' ? 'reemplazando anteriores' : 'anexadas'}). Total en app: ${totalGastos}.`
        );
      } else {
        setMensajeExito('¡Datos descargados de tu enlace! Revisa la vista previa para confirmar las columnas.');
      }
    } else {
      setErrorUrl(
        resp.error ||
          'No se pudo conectar directamente. Si la hoja es privada en Drive, cámbiala a "Cualquiera con el enlace" o copia las celdas y pégalas en "Pegar Celdas Directas".'
      );
    }
  };

  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setTextoPegado(content);
        setMetodoImportacion('pegar');
        setMensajeExito(`Archivo "${file.name}" cargado exitosamente.`);
      }
    };
    reader.readAsText(file);
  };

  const handleEjecutarImportacion = () => {
    if (!resultadoParseo || !resultadoParseo.exito || resultadoParseo.gastosImportados.length === 0) {
      return;
    }

    const { importados, totalGastos } = importarGastosDesdeGoogleSheets(
      resultadoParseo.gastosImportados,
      modoGuardado
    );

    setMensajeExito(
      `¡Éxito! Se importaron ${importados} facturas sin errores (${modoGuardado === 'reemplazar' ? 'reemplazando el historial anterior' : 'anexadas al historial'}). Total en app: ${totalGastos}.`
    );
    onSynced();

    // Limpiar formulario y cambiar a vista de hoja
    setTimeout(() => {
      setPestaña('sheet');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-2xl rounded-3xl p-4 sm:p-5 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border transition-colors ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera del Modal */}
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className={`font-bold text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Importador & Sincronización Google Sheets
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Formato oficial de 18 columnas (ID, Fecha, Hora, Establecimiento, NIT, Ciudad, Categoría...)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isDark
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div
          className={`flex items-center gap-1.5 my-3 p-1 rounded-2xl border text-xs font-semibold ${
            isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-slate-100/80 border-slate-200'
          }`}
        >
          <button
            onClick={() => setPestaña('importar')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pestaña === 'importar'
                ? isDark
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md'
                  : 'bg-white text-emerald-700 font-bold shadow-sm border border-slate-200'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={14} />
            <span>Importar Hoja de Cálculo</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-900 font-bold ml-1">
              Google Sheet
            </span>
          </button>

          <button
            onClick={() => setPestaña('sheet')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pestaña === 'sheet'
                ? isDark
                  ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                  : 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database size={14} />
            <span>Ver Hoja ({gastos.length} Facturas)</span>
          </button>

          <button
            onClick={() => setPestaña('email')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pestaña === 'email'
                ? isDark
                  ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                  : 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail size={14} />
            <span>Correo</span>
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

        {/* Contenido según pestaña */}
        <div className="flex-1 overflow-y-auto pr-0.5 no-scrollbar space-y-3">
          {pestaña === 'importar' && (
            <div className="space-y-3.5">
              {/* Selector de Método de Importación */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Selecciona cómo quieres cargar tu Google Sheet:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCargarEjemploPlantilla}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                      isDark
                        ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white'
                        : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Carga una hoja de ejemplo con las 23 categorías oficiales"
                  >
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Cargar Ejemplo</span>
                  </button>
                </div>
              </div>

              {/* Pestañas de método: Pegar / Enlace URL / Archivo */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMetodoImportacion('pegar')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    metodoImportacion === 'pegar'
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-emerald-50/80 border-emerald-500 text-emerald-800'
                      : isDark
                      ? 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ClipboardPaste size={14} />
                    <span>Pegar Celdas</span>
                  </div>
                  <p className="text-[10px] mt-1 opacity-80">
                    Ctrl+C en Google Sheets y pegar aquí (100% fiable)
                  </p>
                </button>

                <button
                  onClick={() => setMetodoImportacion('url')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    metodoImportacion === 'url'
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-emerald-50/80 border-emerald-500 text-emerald-800'
                      : isDark
                      ? 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <LinkIcon size={14} />
                    <span>Enlace URL</span>
                  </div>
                  <p className="text-[10px] mt-1 opacity-80">
                    Pega el enlace de tu Google Sheet
                  </p>
                </button>

                <button
                  onClick={() => setMetodoImportacion('archivo')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    metodoImportacion === 'archivo'
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-emerald-50/80 border-emerald-500 text-emerald-800'
                      : isDark
                      ? 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Upload size={14} />
                    <span>Subir Archivo</span>
                  </div>
                  <p className="text-[10px] mt-1 opacity-80">
                    Archivo .csv descargado de Google Sheets
                  </p>
                </button>
              </div>

              {/* Vista Método: Pegar Celdas */}
              {metodoImportacion === 'pegar' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-neutral-400' : 'text-slate-600'}>
                      Pega aquí tus datos copiados desde Google Sheets:
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          const clipboardText = await navigator.clipboard.readText();
                          if (clipboardText) {
                            setTextoPegado(clipboardText);
                          }
                        } catch (e) {
                          // Fallback si permisos de clipboard están restringidos
                        }
                      }}
                      className={`text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer`}
                    >
                      <ClipboardPaste size={12} />
                      <span>Pegar desde Portapapeles</span>
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    value={textoPegado}
                    onChange={(e) => setTextoPegado(e.target.value)}
                    placeholder="En tu Google Sheet: selecciona las celdas, presiona Ctrl+C y pégalas aquí con Ctrl+V...&#10;&#10;Orden oficial de 18 columnas:&#10;ID | Fecha | Hora | Establecimiento | NIT | Ciudad | Categoría | Subcategoría | Método de pago | Subtotal | IVA | Descuento | Propina | Total | Observaciones | Imagen (Drive) | Fecha de registro | MesAño"
                    className={`w-full rounded-2xl p-3 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800 text-neutral-200 placeholder-neutral-600'
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
              )}

              {/* Vista Método: Enlace URL de Google Sheets */}
              {metodoImportacion === 'url' && (
                <div
                  className={`p-3.5 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label className={`block text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Enlace de tu Google Sheet:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlSheet}
                      onChange={(e) => setUrlSheet(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                      className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      onClick={handleCargarUrl}
                      disabled={cargandoUrl}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={14} className={cargandoUrl ? 'animate-spin' : ''} />
                      <span>{cargandoUrl ? 'Descargando...' : 'Cargar'}</span>
                    </button>
                  </div>

                  {errorUrl && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p>{errorUrl}</p>
                        <button
                          onClick={() => setMetodoImportacion('pegar')}
                          className="font-bold underline text-emerald-400 cursor-pointer block"
                        >
                          Haz clic aquí para usar "Pegar Celdas" (Copia con Ctrl+C y pega al instante sin compartir enlace).
                        </button>
                      </div>
                    </div>
                  )}

                  <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    💡 Consejo: Para enlazar por URL, tu Google Sheet debe tener permisos de "Cualquier persona con el enlace puede ver". Si tu hoja es privada, usa la opción <strong>"Pegar Celdas Directas"</strong>.
                  </p>
                </div>
              )}

              {/* Vista Método: Archivo CSV / TSV */}
              {metodoImportacion === 'archivo' && (
                <div
                  className={`p-6 rounded-2xl border-2 border-dashed text-center space-y-2 transition-colors ${
                    isDark
                      ? 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <Upload size={28} className="mx-auto text-emerald-600" />
                  <div className={`text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Arrastra o selecciona tu archivo exportado de Google Sheets
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                    En Google Sheets: Archivo ➔ Descargar ➔ Valores separados por comas (.csv)
                  </p>
                  <label className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:brightness-110 cursor-pointer">
                    Seleccionar Archivo .csv
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleSubirArchivo}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Barra de Herramientas de Plantilla Oficial */}
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] ${
                  isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-600">Plantilla Oficial:</span>
                  <span className={isDark ? 'text-neutral-400' : 'text-slate-600'}>
                    Contiene las 23 categorías organizadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopiarPlantilla}
                    className={`px-2 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                      isDark
                        ? 'border-neutral-700 bg-neutral-800 hover:text-white'
                        : 'border-slate-300 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <Copy size={11} />
                    <span>{notificacionCopiado ? '¡Copiado!' : 'Copiar Encabezados'}</span>
                  </button>
                  <button
                    onClick={handleDescargarPlantilla}
                    className={`px-2 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                      isDark
                        ? 'border-neutral-700 bg-neutral-800 hover:text-white'
                        : 'border-slate-300 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <Download size={11} />
                    <span>Descargar .CSV</span>
                  </button>
                </div>
              </div>

              {/* PREVISUALIZACIÓN DE FACTURAS DETECTADAS */}
              {resultadoParseo && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    resultadoParseo.exito
                      ? isDark
                        ? 'bg-neutral-950 border-emerald-500/30'
                        : 'bg-emerald-50/40 border-emerald-300'
                      : isDark
                      ? 'bg-neutral-950 border-red-500/30'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                        <FileCheck size={16} />
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Previsualización de Importación
                        </h4>
                        <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                          {resultadoParseo.gastosImportados.length} facturas detectadas • Total:{' '}
                          {formatearMoneda(resultadoParseo.totalMonto, config.moneda)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className={`text-[11px] mr-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        Modo:
                      </span>
                      <button
                        onClick={() => setModoGuardado('anexar')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          modoGuardado === 'anexar'
                            ? 'bg-emerald-500 text-neutral-950'
                            : isDark
                            ? 'bg-neutral-800 text-neutral-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        Anexar
                      </button>
                      <button
                        onClick={() => setModoGuardado('reemplazar')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          modoGuardado === 'reemplazar'
                            ? 'bg-rose-500 text-white'
                            : isDark
                            ? 'bg-neutral-800 text-neutral-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                        title="Reemplaza todos los datos actuales y deja solo las facturas de la hoja importada"
                      >
                        Reemplazar Todo
                      </button>
                    </div>
                  </div>

                  {/* Resumen de Categorías detectadas (Chips) */}
                  <div className="space-y-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Distribución por Categorías Detectadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                      {Object.entries(resultadoParseo.conteoPorCategoria)
                        .filter(([_, count]) => count > 0)
                        .map(([cat, count]) => (
                          <span
                            key={cat}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border font-medium ${
                              isDark
                                ? 'bg-neutral-900 border-neutral-700 text-neutral-300'
                                : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                            }`}
                          >
                            <CategoryIcon categoria={cat} size={11} />
                            <span>{cat}</span>
                            <strong className="text-emerald-600 font-mono">({count})</strong>
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Tabla miniatura de las primeras 4 filas */}
                  <div className="overflow-x-auto rounded-xl border max-h-36">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr
                          className={`font-mono border-b ${
                            isDark ? 'bg-neutral-900 text-neutral-300 border-neutral-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <th className="p-1.5 border-r border-inherit">Fecha</th>
                          <th className="p-1.5 border-r border-inherit">Establecimiento</th>
                          <th className="p-1.5 border-r border-inherit">Ciudad</th>
                          <th className="p-1.5 border-r border-inherit">Categoría</th>
                          <th className="p-1.5 border-r border-inherit">Método</th>
                          <th className="p-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className={isDark ? 'divide-y divide-neutral-800' : 'divide-y divide-slate-200'}>
                        {resultadoParseo.gastosImportados.slice(0, 5).map((g) => (
                          <tr key={g.id}>
                            <td className="p-1.5 border-r border-inherit font-mono">{g.fecha}</td>
                            <td className="p-1.5 border-r border-inherit font-medium truncate max-w-[130px]">
                              {g.establecimiento}
                            </td>
                            <td className="p-1.5 border-r border-inherit font-medium text-sky-600 truncate max-w-[90px]">
                              {g.ciudad}
                            </td>
                            <td className="p-1.5 border-r border-inherit text-emerald-600 font-semibold truncate max-w-[100px]">
                              {g.categoria}
                            </td>
                            <td className="p-1.5 border-r border-inherit truncate max-w-[90px]">{g.metodo_pago}</td>
                            <td className="p-1.5 text-right font-mono font-bold">
                              {formatearMoneda(g.total, config.moneda)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botón Principal de Confirmación */}
                  <button
                    onClick={handleEjecutarImportacion}
                    className="w-full py-3 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-neutral-950 hover:brightness-110 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <CheckCircle2 size={16} className="stroke-[3]" />
                    <span>
                      Confirmar e Importar {resultadoParseo.gastosImportados.length} Facturas a la App
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pestaña: Ver Hoja de Cálculo Sincronizada */}
          {pestaña === 'sheet' && (
            <div className="space-y-3">
              {/* Configuración de Correo Electrónico Editable y Google Sign-In */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Cuenta & Correo de Sincronización:
                  </span>
                  {emailGuardado && (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 animate-pulse">
                      <CheckCircle2 size={12} />
                      ¡Guardado!
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Escribe tu correo para sincronizar (ej. mi-correo@gmail.com)"
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDark
                          ? 'bg-neutral-900 text-white placeholder-neutral-500 border-neutral-700 focus:border-emerald-500'
                          : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300 focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleActualizarEmail}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 transition-all cursor-pointer"
                    >
                      Actualizar
                    </button>

                    <button
                      type="button"
                      onClick={handleGoogleLoginSync}
                      disabled={iniciandoGoogle}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Usar cuenta de Google"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      <span>{iniciandoGoogle ? 'Google...' : 'Google'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Vinculación de Hoja Personal y Opciones de Carga */}
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      Tu Hoja de Google Sheets:
                    </span>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Pega el enlace de tu Google Sheet personal para abrirla y vincularla:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirEnlaceNativo('https://sheets.new')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:underline cursor-pointer"
                  >
                    <span>+ Crear Hoja Nueva en Blanco (sheets.new)</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="url"
                      value={urlSheet}
                      onChange={(e) => setUrlSheet(e.target.value)}
                      onBlur={() => {
                        const id = extraerSpreadsheetId(urlSheet);
                        if (id) {
                          guardarConfiguracion({ google_sheets_id: id });
                        }
                      }}
                      autoComplete="url"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="https://docs.google.com/spreadsheets/d/1cuPkxZZY5HOKu.../edit"
                      className={`flex-1 w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDark
                          ? 'bg-neutral-900 text-white placeholder-neutral-500 border-neutral-700 focus:border-emerald-500'
                          : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300 focus:border-emerald-500'
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Botón Principal: Subir a Google Drive (Especial para APK Android y Móvil) */}
                      <button
                        type="button"
                        disabled={subiendoADriveAndroid || subiendoASheets}
                        onClick={handleSubirAGoogleDriveAndroid}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-neutral-950 hover:brightness-110 shadow-md shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        title="En Android APK: Abre el selector para guardar en Google Drive o abrir en Hojas de cálculo"
                      >
                        {subiendoADriveAndroid ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Enviando a Drive...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Subir a Google Drive ({gastos.length})</span>
                          </>
                        )}
                      </button>

                      {/* Botón Secundario: Subir directo a la hoja mediante API / Webhook */}
                      <button
                        type="button"
                        disabled={subiendoASheets || subiendoADriveAndroid}
                        onClick={() => {
                          const id = extraerSpreadsheetId(urlSheet);
                          if (!id && !urlSheet.includes('script.google.com')) {
                            setErrorSubida('Pega un enlace válido de Google Sheets (ej: https://docs.google.com/spreadsheets/d/...)');
                            return;
                          }
                          setErrorSubida(null);
                          setConfirmacionSubidaAbierta(true);
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 disabled:opacity-50"
                        title="Escribe directamente en la hoja especificada por el enlace"
                      >
                        {subiendoASheets ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Escribiendo...</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet size={13} />
                            <span>Subir directo al Enlace</span>
                          </>
                        )}
                      </button>

                      {/* Botón: Traer del Sheet (Descarga e importa automáticamente en la APK) */}
                      <button
                        type="button"
                        disabled={cargandoUrl}
                        onClick={async () => {
                          const id = extraerSpreadsheetId(urlSheet);
                          if (id) {
                            guardarConfiguracion({ google_sheets_id: id });
                          }
                          if (urlSheet.trim()) {
                            await handleCargarUrl();
                          } else {
                            setErrorSubida('Pega primero el enlace de tu Google Sheet para traer los datos.');
                          }
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 disabled:opacity-50"
                        title="Descarga y carga las facturas desde Google Sheets directamente en la APK"
                      >
                        {cargandoUrl ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Leyendo...</span>
                          </>
                        ) : (
                          <>
                            <Download size={13} />
                            <span>Traer del Sheet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta explicativa de compatibilidad APK Android */}
                  <div
                    className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                      isDark ? 'bg-neutral-900/60 border-neutral-800 text-neutral-300' : 'bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-emerald-500">
                      <Smartphone size={13} />
                      <span>Sincronización Nativa para Android APK</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      • <strong>Subir a Google Drive:</strong> Pulsa el botón verde <em>«Subir a Google Drive»</em> y en el menú de tu teléfono selecciona <strong>«Guardar en Drive»</strong>. Podrás elegir cualquier carpeta de tu cuenta de Google Drive para guardar el archivo con las 18 columnas oficiales.
                      <br />
                      • <strong>Traer facturas a la APK:</strong> Pega el enlace de tu Google Sheet y pulsa <em>«Traer del Sheet»</em>. Si tu hoja está en modo privado, recuerda activar <em>«Cualquiera con el enlace»</em> en Google Drive para permitir la lectura automática sin restricciones.
                    </p>
                  </div>

                  {/* Diálogo de Confirmación Obligatorio para Operaciones en Google Workspace */}
                  {confirmacionSubidaAbierta && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border ${
                        isDark ? 'bg-neutral-900 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            ¿Subir {gastos.length} facturas a tu hoja de cálculo?
                          </h5>
                          <p className={`text-[11px] ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                            Se escribirán las 18 columnas oficiales (ID, Fecha, Hora, Establecimiento, NIT, Categoría, Total, etc.) directamente en la hoja de Google Sheets.
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              disabled={subiendoASheets}
                              onClick={handleEjecutarSubidaDirecta}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              {subiendoASheets ? (
                                <>
                                  <RefreshCw size={12} className="animate-spin" />
                                  <span>Escribiendo en hoja...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>Sí, Confirmar y Subir Directo</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmacionSubidaAbierta(false)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                isDark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Banner de error o de autorización requerida */}
                  {errorSubida && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                        isDark ? 'bg-amber-950/30 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{errorSubida}</span>
                      </div>
                      {necesitaAutorizacion && (
                        <button
                          type="button"
                          disabled={subiendoASheets}
                          onClick={handleAutorizarYSubir}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shrink-0 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          <span>{Capacitor.isNativePlatform() ? 'Subir a Drive (Nativo)' : 'Autorizar con Google'}</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>

                {config.google_sheets_id && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/40">
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Hoja vinculada: <code className="bg-emerald-500/10 px-1 py-0.5 rounded text-[10px] font-mono">{config.google_sheets_id.slice(0, 16)}...</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => abrirEnlaceNativo(`https://docs.google.com/spreadsheets/d/${config.google_sheets_id}/edit`)}
                      className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-semibold cursor-pointer"
                    >
                      <span>Abrir Hoja en Google Sheets</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Botonera de Sincronización, Link directo a Sheets y Exportación CSV Local */}
              <div
                className={`py-3 px-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {/* Copiar con 1 clic para pegar en Google Sheets */}
                  <button
                    type="button"
                    onClick={() => {
                      const tsv = exportarGastosParaGoogleSheetsTSV(gastos);
                      navigator.clipboard.writeText(tsv);
                      setMensajeExito(`¡${gastos.length} facturas copiadas! En tu Google Sheet, haz clic en la celda A1 y presiona Ctrl+V.`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:brightness-110 shadow-sm transition-all cursor-pointer"
                    title="Copia todas las filas en formato compatible con Google Sheets para pegar con Ctrl+V"
                  >
                    <Copy size={13} />
                    <span>Copiar Datos para Google Sheet (1 Clic)</span>
                  </button>

                  {/* Enlace directo accesible para abrir y verificar Google Sheets en móvil o web */}
                  <button
                    type="button"
                    onClick={() =>
                      abrirEnlaceNativo(
                        config.google_sheets_id
                          ? `https://docs.google.com/spreadsheets/d/${config.google_sheets_id}/edit`
                          : 'https://sheets.new'
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                    }`}
                  >
                    <ExternalLink size={13} />
                    <span>Abrir Mi Google Sheet</span>
                  </button>

                  {/* Exportación CSV Local para guardar sin Google Sheets */}
                  <button
                    type="button"
                    onClick={handleExportarCSVLocal}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isDark
                        ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                    }`}
                  >
                    <FileDown size={13} className="text-teal-500" />
                    <span>Guardar CSV</span>
                  </button>

                  {/* Tutorial de 18 Columnas y Respaldo Oficial */}
                  <button
                    type="button"
                    onClick={() => setMostrarTutorial(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-sm transition-all cursor-pointer"
                    title="Abre el tutorial guiado de exportación y resguardo de datos con 18 columnas"
                  >
                    <HelpCircle size={13} />
                    <span>Tutorial de Respaldo (18 Cols)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSincronizarAhora}
                  disabled={sincronizando}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} />
                  <span>{sincronizando ? 'Sincronizando...' : `Sincronizar (${pendientes} pendientes)`}</span>
                </button>
              </div>

              {mensajeExito && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{mensajeExito}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMensajeExito('')}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div
                className={`flex items-center justify-between text-xs px-1 ${
                  isDark ? 'text-neutral-400' : 'text-slate-500'
                }`}
              >
                <span>Tabla de datos sincronizada: Facturas_Personales_2026</span>
                <span className="font-mono text-emerald-600 font-semibold">{gastos.length} filas totales</span>
              </div>

              <div
                className={`border rounded-2xl overflow-hidden text-xs ${
                  isDark ? 'border-neutral-800 bg-neutral-950' : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr
                        className={`font-mono text-[11px] border-b ${
                          isDark
                            ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
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
                      {gastos.map((g) => (
                        <tr
                          key={g.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-neutral-900/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className={`p-2 border-r font-mono ${isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-slate-200 text-slate-600'}`}>
                            {g.fecha}
                          </td>
                          <td className={`p-2 border-r font-mono ${isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-slate-200 text-slate-600'}`}>
                            {g.hora}
                          </td>
                          <td className={`p-2 border-r font-medium ${isDark ? 'border-neutral-800/80 text-white' : 'border-slate-200 text-slate-900'}`}>
                            {g.establecimiento}
                          </td>
                          <td className={`p-2 border-r font-mono ${isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-slate-200 text-slate-600'}`}>
                            {g.nit}
                          </td>
                          <td className={`p-2 border-r ${isDark ? 'border-neutral-800/80 text-emerald-400' : 'border-slate-200 text-emerald-700 font-medium'}`}>
                            <div className="flex items-center gap-1.5">
                              <CategoryIcon categoria={g.categoria} size={13} />
                              <span>{g.categoria}</span>
                            </div>
                          </td>
                          <td className={`p-2 border-r ${isDark ? 'border-neutral-800/80 text-neutral-300' : 'border-slate-200 text-slate-700'}`}>
                            {g.metodo_pago}
                          </td>
                          <td className={`p-2 border-r ${isDark ? 'border-neutral-800/80 text-neutral-300' : 'border-slate-200 text-slate-700'}`}>
                            {g.ciudad}
                          </td>
                          <td className={`p-2 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatearMoneda(g.total, config.moneda)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña: Notificaciones Email */}
          {pestaña === 'email' && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-3 ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200 shadow-xs'
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

      {mostrarTutorial && (
        <ExportTutorialModal
          isOpen={mostrarTutorial}
          onClose={() => setMostrarTutorial(false)}
          gastos={gastos}
          config={config}
        />
      )}
    </div>
  );
};
