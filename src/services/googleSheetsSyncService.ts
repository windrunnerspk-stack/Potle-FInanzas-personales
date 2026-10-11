import { Gasto } from '../types/finance';
import { getGoogleAccessToken, solicitarPermisosGoogleSheets } from './firebase';

export interface ResultadoSubidaGoogleSheets {
  success: boolean;
  filasSubidas: number;
  mensaje: string;
  requiereAuth?: boolean;
  sheetUrl?: string;
  error?: string;
}

export const COLUMNAS_OFICIALES_SHEETS = [
  'ID',
  'Fecha',
  'Hora',
  'Establecimiento',
  'NIT',
  'Ciudad',
  'Categoría',
  'Subcategoría',
  'Método de pago',
  'Subtotal',
  'IVA',
  'Descuento',
  'Propina',
  'Total',
  'Observaciones',
  'Imagen (Drive)',
  'Fecha de registro',
  'MesAño',
];

export function extraerSpreadsheetId(urlOId: string): string | null {
  if (!urlOId) return null;
  const limpio = urlOId.trim();
  const match = limpio.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Si ya es un ID directo de Google Sheets (usualmente 44 caracteres alfanuméricos)
  if (/^[a-zA-Z0-9-_]{20,70}$/.test(limpio)) {
    return limpio;
  }
  return null;
}

export function convertirGastoAFilaGoogleSheets(g: Gasto, idx: number): (string | number)[] {
  let subcategoria = '';
  const obsLimpia = g.observaciones || '';
  const matchSubcat = obsLimpia.match(/Subcategor[ií]a:\s*([^|]+)/i);
  if (matchSubcat) {
    subcategoria = matchSubcat[1].trim();
  }
  const mesAno = g.fecha && g.fecha.length >= 7 ? g.fecha.substring(0, 7) : '';

  return [
    g.id || idx + 1,
    g.fecha,
    g.hora || '12:00',
    g.establecimiento,
    g.nit || '',
    g.ciudad || 'Bogotá',
    g.categoria,
    subcategoria,
    g.metodo_pago,
    g.total,
    0, // IVA
    0, // Descuento
    0, // Propina
    g.total,
    obsLimpia,
    g.foto_factura_uri ? 'Adjunta en App' : '',
    g.creado_en || `${g.fecha} ${g.hora || '12:00'}:00`,
    mesAno,
  ];
}

/**
 * Sube directamente las facturas a la hoja de Google Sheets usando la API oficial v4 de Google Sheets.
 * Escribe las 18 columnas de verdad en tiempo real sin requerir copiar y pegar.
 */
export async function subirGastosAGoogleSheetDirecto(
  urlOId: string,
  gastos: Gasto[],
  opciones?: {
    reemplazarTodo?: boolean;
    solicitarAuthSiFalta?: boolean;
  }
): Promise<ResultadoSubidaGoogleSheets> {
  const spreadsheetId = extraerSpreadsheetId(urlOId);
  if (!spreadsheetId) {
    return {
      success: false,
      filasSubidas: 0,
      mensaje: 'Enlace de Google Sheets no reconocido. Verifica el formato del enlace.',
      error: 'ID de hoja inválido',
    };
  }

  if (gastos.length === 0) {
    return {
      success: false,
      filasSubidas: 0,
      mensaje: 'No tienes facturas para subir. Agrega o escanea una factura primero.',
      error: 'Sin facturas',
    };
  }

  const targetSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 1. Obtener o solicitar token de acceso con scope https://www.googleapis.com/auth/spreadsheets
  let token = getGoogleAccessToken();
  if (!token && opciones?.solicitarAuthSiFalta !== false) {
    const authRes = await solicitarPermisosGoogleSheets();
    if (authRes.success && authRes.accessToken) {
      token = authRes.accessToken;
    } else {
      return {
        success: false,
        filasSubidas: 0,
        requiereAuth: true,
        sheetUrl: targetSheetUrl,
        mensaje: 'Se necesita autorización de tu cuenta de Google para escribir directamente en esta hoja.',
        error: authRes.error || 'Token de acceso no disponible',
      };
    }
  }

  if (!token) {
    return {
      success: false,
      filasSubidas: 0,
      requiereAuth: true,
      sheetUrl: targetSheetUrl,
      mensaje: 'Inicia sesión con Google para permitir la subida automática a tu Google Sheet.',
      error: 'Token no disponible',
    };
  }

  try {
    // 2. Verificar si la hoja ya tiene encabezados leyendo A1:R1
    let tieneEncabezados = false;
    try {
      const getResp = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:R1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (getResp.ok) {
        const getData = await getResp.json();
        if (getData.values && getData.values.length > 0 && getData.values[0].length >= 3) {
          tieneEncabezados = true;
        }
      } else if (getResp.status === 401 || getResp.status === 403) {
        // Token caducado o sin permiso en esa hoja
        const errorJson = await getResp.json().catch(() => ({}));
        const mensajeApi = errorJson?.error?.message || getResp.statusText;
        return {
          success: false,
          filasSubidas: 0,
          requiereAuth: true,
          sheetUrl: targetSheetUrl,
          mensaje: `Google no permitió el acceso a esta hoja (${mensajeApi}). Verifica que tu cuenta de Google tenga permisos de edición en la hoja.`,
          error: mensajeApi,
        };
      }
    } catch {
      // Ignorar fallo de lectura y proceder a insertar
    }

    // 3. Preparar filas
    const filasGasto = gastos.map((g, idx) => convertirGastoAFilaGoogleSheets(g, idx));
    const filasParaInsertar: (string | number)[][] = [];

    if (!tieneEncabezados) {
      filasParaInsertar.push(COLUMNAS_OFICIALES_SHEETS);
    }
    filasParaInsertar.push(...filasGasto);

    // 4. Escribir o anexar a la hoja
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const appendResp = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: filasParaInsertar,
      }),
    });

    if (!appendResp.ok) {
      const errorData = await appendResp.json().catch(() => ({}));
      const msg = errorData?.error?.message || `HTTP ${appendResp.status}`;
      return {
        success: false,
        filasSubidas: 0,
        sheetUrl: targetSheetUrl,
        mensaje: `Error de Google Sheets API: ${msg}`,
        error: msg,
      };
    }

    return {
      success: true,
      filasSubidas: gastos.length,
      sheetUrl: targetSheetUrl,
      mensaje: `¡Éxito total! Se subieron ${gastos.length} facturas con las 18 columnas directamente a tu Google Sheet en vivo.`,
    };
  } catch (err: any) {
    return {
      success: false,
      filasSubidas: 0,
      sheetUrl: targetSheetUrl,
      mensaje: `Fallo de conexión al subir al sheet: ${err?.message || 'Error de red'}`,
      error: err?.message,
    };
  }
}
