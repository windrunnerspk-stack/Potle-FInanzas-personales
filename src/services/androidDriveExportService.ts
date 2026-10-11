import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { Gasto } from '../types/finance';
import { COLUMNAS_OFICIALES_SHEETS, convertirGastoAFilaGoogleSheets } from './googleSheetsSyncService';

/**
 * Abre cualquier enlace externo (Google Sheets, Google Drive, sheets.new)
 * de forma nativa en el navegador del sistema o en la app de Google Sheets instalada en Android.
 */
export async function abrirEnlaceNativo(url: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url, windowName: '_system' });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Convierte los gastos a un CSV estándar con codificación UTF-8 y BOM (\uFEFF)
 * para que Google Drive, Google Sheets y Excel en Android reconozcan acentos, eñes y formatos.
 */
export function generarCSVParaGoogleDrive(gastos: Gasto[]): string {
  const lineas: string[] = [];

  // Encabezados oficiales de 18 columnas
  lineas.push(
    COLUMNAS_OFICIALES_SHEETS.map((h) => `"${h.replace(/"/g, '""')}"`).join(',')
  );

  // Filas de datos
  gastos.forEach((gasto, idx) => {
    const fila = convertirGastoAFilaGoogleSheets(gasto, idx);
    const filaEscapada = fila.map((val) => {
      if (val === null || val === undefined) return '""';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    });
    lineas.push(filaEscapada.join(','));
  });

  // Prefijo BOM UTF-8 (\uFEFF) para compatibilidad absoluta en Android y Google Drive
  return '\uFEFF' + lineas.join('\r\n');
}

export interface ResultadoExportacionDrive {
  success: boolean;
  mensaje: string;
  esNativo: boolean;
  archivo?: string;
  error?: string;
}

/**
 * Guarda o sube las facturas a Google Drive / Google Sheets en Android:
 * - En la APK de Android: Genera el archivo físico y llama al selector nativo del sistema (Android Share Sheet),
 *   donde el usuario puede pulsar "Guardar en Drive" (sube directamente a cualquier carpeta de Google Drive)
 *   o "Hojas de cálculo de Google" (abre directamente la hoja con todas las columnas).
 * - En Web: Descarga el archivo CSV directamente en el dispositivo.
 */
export async function exportarFacturasAGoogleDriveAndroid(
  gastos: Gasto[],
  nombreArchivo = 'Facturas_Aura_Finanzas_GoogleDrive.csv'
): Promise<ResultadoExportacionDrive> {
  if (gastos.length === 0) {
    return {
      success: false,
      mensaje: 'No tienes facturas para subir. Escanea o registra una factura primero.',
      esNativo: Capacitor.isNativePlatform(),
    };
  }

  const csvContenido = generarCSVParaGoogleDrive(gastos);
  const esNativo = Capacitor.isNativePlatform();

  if (esNativo) {
    try {
      // 1. Escribir el archivo CSV en el almacenamiento de caché de la app en Android
      const writeResult = await Filesystem.writeFile({
        path: nombreArchivo,
        data: csvContenido,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // 2. Obtener la URI interna del archivo para Android
      const uriResult = await Filesystem.getUri({
        path: nombreArchivo,
        directory: Directory.Cache,
      });

      const archivoUri = uriResult.uri || writeResult.uri;

      // 3. Compartir nativamente con Google Drive / Google Sheets en Android
      await Share.share({
        title: 'Guardar facturas en Google Drive',
        text: `Exportación de ${gastos.length} facturas de Aura Finanzas con 18 columnas oficiales para Google Drive y Google Sheets.`,
        url: archivoUri,
        dialogTitle: 'Subir a Google Drive o Hojas de cálculo',
      });

      return {
        success: true,
        mensaje: `¡Listo! Selecciona "Guardar en Drive" en la lista de tu teléfono para guardarlo en la carpeta que elijas.`,
        esNativo: true,
        archivo: archivoUri,
      };
    } catch (err: any) {
      // Si el usuario canceló el selector nativo
      if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
        return {
          success: true,
          mensaje: 'Selección de destino cerrada por el usuario.',
          esNativo: true,
        };
      }

      // Si falló el share nativo, intentar descarga tradicional como respaldo
      try {
        const blob = new Blob([csvContenido], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return {
          success: true,
          mensaje: 'Archivo generado y descargado en tu dispositivo.',
          esNativo: true,
        };
      } catch {
        return {
          success: false,
          mensaje: `Error al generar archivo para Google Drive: ${err?.message || 'Error en Android'}`,
          esNativo: true,
          error: err?.message,
        };
      }
    }
  } else {
    // Modo Web
    try {
      const blob = new Blob([csvContenido], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        mensaje: `Archivo CSV con ${gastos.length} facturas descargado con éxito. Puedes subirlo a tu Google Drive o abrirlo en Google Sheets.`,
        esNativo: false,
      };
    } catch (err: any) {
      return {
        success: false,
        mensaje: `Error al descargar archivo: ${err?.message || 'Error de descarga'}`,
        esNativo: false,
        error: err?.message,
      };
    }
  }
}

/**
 * Envía las facturas directamente a una hoja de cálculo mediante un Webhook de Google Apps Script.
 * Funciona de forma 100% nativa en la APK de Android sin requerir permisos de navegador ni OAuth.
 */
export async function enviarFacturasAAppsScriptWebhook(
  webhookUrl: string,
  gastos: Gasto[]
): Promise<{ success: boolean; mensaje: string; count: number; error?: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      mensaje: 'URL de Webhook inválida.',
      count: 0,
      error: 'URL no válida',
    };
  }

  const filas = gastos.map((g, idx) => convertirGastoAFilaGoogleSheets(g, idx));
  const payload = {
    accion: 'anexar_facturas',
    origen: 'Aura Finanzas Android APK',
    fecha_envio: new Date().toISOString(),
    encabezados: COLUMNAS_OFICIALES_SHEETS,
    values: filas,
  };

  try {
    if (Capacitor.isNativePlatform()) {
      // Uso de CapacitorHttp nativo para saltar CORS en Android
      const resp = await CapacitorHttp.post({
        url: webhookUrl.trim(),
        headers: {
          'Content-Type': 'application/json',
        },
        data: payload,
      });

      if (resp.status >= 200 && resp.status < 300) {
        return {
          success: true,
          count: gastos.length,
          mensaje: `¡Éxito! Se sincronizaron ${gastos.length} facturas directamente a tu Google Sheet vía Webhook.`,
        };
      } else {
        return {
          success: false,
          count: 0,
          mensaje: `El Webhook respondió con código ${resp.status}. Verifica que el script esté publicado como aplicación web.`,
          error: `HTTP ${resp.status}`,
        };
      }
    } else {
      // Fetch web estándar
      const resp = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Apps Script a menudo redirige con 302 sin CORS
      });

      return {
        success: true,
        count: gastos.length,
        mensaje: `Facturas enviadas al Webhook de Google Apps Script exitosamente.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      mensaje: `Error al contactar el Webhook de Google Sheets: ${err?.message || 'Error de red'}`,
      error: err?.message,
    };
  }
}
