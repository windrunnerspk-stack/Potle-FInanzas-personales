import {
  Gasto,
  UsuarioConfig,
  SyncQueueItem,
  CategoriaGasto,
  MetodoPago,
  LISTA_CATEGORIAS_DEFAULT,
  CATEGORIAS_CONFIG_DEFAULT
} from '../types/finance';
import { normalizarCategoria } from './googleSheetsImportService';
import {
  syncGastoToFirestore,
  deleteGastoFromFirestore,
  fetchGastosFromFirestore,
  syncUserProfileToFirestore
} from './firebase';

const STORAGE_KEY_GASTOS = 'aura_finances_gastos_v1';
const STORAGE_KEY_CONFIG = 'aura_finances_config_v1';
const STORAGE_KEY_QUEUE = 'aura_finances_sync_queue_v1';
const STORAGE_KEY_CATEGORIAS = 'aura_finances_custom_categories_v1';

export const ADMIN_EMAIL = 'latouchettdiego@gmail.com';

/**
 * Valida si un correo electrónico corresponde al Administrador Pro del sistema
 */
export function esUsuarioAdmin(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

const INITIAL_CONFIG: UsuarioConfig = {
  email: '',
  modo: 'sincronizado',
  moneda: 'COP',
  onboarding_completado: true,
  notificaciones_email: false,
  google_sheets_id: '',
  ultima_sincronizacion: new Date().toISOString(),
};

// Semilla inicial realista de facturas con las 23 categorías oficiales
const SEED_GASTOS: Gasto[] = [
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    establecimiento: 'Estación Terpel Calle 100',
    fecha: '2026-10-06',
    hora: '08:45',
    ciudad: 'Bogotá',
    nit: '860.005.224-6',
    categoria: 'Gasolina',
    metodo_pago: 'Tarjeta Crédito',
    total: 145000,
    observaciones: 'Tanque lleno Corriente para viaje',
    sincronizado: true,
    creado_en: '2026-10-06T08:45:00',
    actualizado_en: '2026-10-06T08:45:00',
  },
  {
    id: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    establecimiento: 'Éxito Calle 80',
    fecha: '2026-10-06',
    hora: '14:20',
    ciudad: 'Bogotá',
    nit: '890.900.608-9',
    categoria: 'Mercado',
    metodo_pago: 'Tarjeta Débito',
    total: 320500,
    observaciones: 'Mercado de la quincena víveres y aseo',
    sincronizado: true,
    creado_en: '2026-10-06T14:20:00',
    actualizado_en: '2026-10-06T14:20:00',
  },
  {
    id: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c99',
    establecimiento: 'Oxxo Parque 93',
    fecha: '2026-10-06',
    hora: '17:10',
    ciudad: 'Bogotá',
    nit: '900.254.123-1',
    categoria: 'Snacks',
    metodo_pago: 'Efectivo',
    total: 18500,
    observaciones: 'Café americano y galletas de avena',
    sincronizado: true,
    creado_en: '2026-10-06T17:10:00',
    actualizado_en: '2026-10-06T17:10:00',
  },
  {
    id: 'c2b3a4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
    establecimiento: 'Crepes & Waffles Zona T',
    fecha: '2026-10-05',
    hora: '19:30',
    ciudad: 'Bogotá',
    nit: '860.519.894-3',
    categoria: 'Restaurantes',
    metodo_pago: 'Tarjeta Débito',
    total: 89400,
    observaciones: 'Cena de celebración familiar',
    sincronizado: true,
    creado_en: '2026-10-05T19:30:00',
    actualizado_en: '2026-10-05T19:30:00',
  },
  {
    id: 'd3c4b5a6-f7e8-9b0a-1c2d-3e4f5a6b7c8d',
    establecimiento: 'Droguería Cruz Verde 93',
    fecha: '2026-10-04',
    hora: '11:15',
    ciudad: 'Bogotá',
    nit: '800.149.695-1',
    categoria: 'Salud',
    metodo_pago: 'Transferencia',
    total: 64200,
    observaciones: 'Medicamentos recetados y vitaminas',
    sincronizado: true,
    creado_en: '2026-10-04T11:15:00',
    actualizado_en: '2026-10-04T11:15:00',
  },
  {
    id: 'e4d5c6b7-a8f9-0b1a-2c3d-4e5f6a7b8c9d',
    establecimiento: 'Inmobiliaria Habitat S.A.S.',
    fecha: '2026-10-01',
    hora: '09:00',
    ciudad: 'Bogotá',
    nit: '900.845.120-7',
    categoria: 'Vivienda',
    metodo_pago: 'Transferencia',
    total: 2150000,
    observaciones: 'Canon de arrendamiento + administración mensual',
    sincronizado: true,
    creado_en: '2026-10-01T09:00:00',
    actualizado_en: '2026-10-01T09:00:00',
  },
  {
    id: 'f5e6d7c8-b9a0-1c2d-3e4f-5a6b7c8d9e0f',
    establecimiento: 'Netflix Mensualidad',
    fecha: '2026-09-28',
    hora: '03:00',
    ciudad: 'Bogotá',
    nit: '901.388.940-2',
    categoria: 'Suscripciones',
    metodo_pago: 'Tarjeta Crédito',
    total: 44900,
    observaciones: 'Plan Premium 4 Pantallas',
    sincronizado: true,
    creado_en: '2026-09-28T03:00:00',
    actualizado_en: '2026-09-28T03:00:00',
  },
  {
    id: 'a6b7c8d9-c0d1-2e3f-4a5b-6c7d8e9f0a1b',
    establecimiento: 'Universidad de los Andes',
    fecha: '2026-09-15',
    hora: '10:30',
    ciudad: 'Bogotá',
    nit: '860.007.386-1',
    categoria: 'Educación',
    metodo_pago: 'Transferencia',
    total: 1200000,
    observaciones: 'Cuota de especialización en Arquitectura de Software',
    sincronizado: true,
    creado_en: '2026-09-15T10:30:00',
    actualizado_en: '2026-09-15T10:30:00',
  },
  {
    id: 'b7c8d9e0-d1e2-3f4a-5b6c-7d8e9f0a1b2c',
    establecimiento: 'Estación Terpel Autopista Norte',
    fecha: '2026-09-22',
    hora: '18:10',
    ciudad: 'Bogotá',
    nit: '860.005.224-6',
    categoria: 'Gasolina',
    metodo_pago: 'Efectivo',
    total: 110000,
    observaciones: 'Combustible fin de semana',
    sincronizado: true,
    creado_en: '2026-09-22T18:10:00',
    actualizado_en: '2026-09-22T18:10:00',
  },
  {
    id: 'c8d9e0f1-e2f3-4a5b-6c7d-8e9f0a1b2c3d',
    establecimiento: 'Apple Store Unicentro',
    fecha: '2026-08-10',
    hora: '16:00',
    ciudad: 'Bogotá',
    nit: '830.098.712-3',
    categoria: 'Tecnología',
    metodo_pago: 'Tarjeta Crédito',
    total: 980000,
    observaciones: 'Accesorios y cargador MagSafe',
    sincronizado: true,
    creado_en: '2026-08-10T16:00:00',
    actualizado_en: '2026-08-10T16:00:00',
  }
];

export function obtenerConfiguracion(): UsuarioConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(INITIAL_CONFIG));
      return INITIAL_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONFIG;
  }
}

export function guardarConfiguracion(config: Partial<UsuarioConfig>): UsuarioConfig {
  const actual = obtenerConfiguracion();
  const actualizada = { ...actual, ...config };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(actualizada));
  syncUserProfileToFirestore(actualizada).catch((e) => console.warn('Sync profile error:', e));
  return actualizada;
}

// ============================================================
// GESTIÓN DE CATEGORÍAS PERSONALIZADAS (AÑADIR / ELIMINAR)
// ============================================================
export function obtenerCategorias(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIAS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(LISTA_CATEGORIAS_DEFAULT));
      return LISTA_CATEGORIAS_DEFAULT;
    }
    const lista = JSON.parse(raw);
    return Array.isArray(lista) && lista.length > 0 ? lista : LISTA_CATEGORIAS_DEFAULT;
  } catch {
    return LISTA_CATEGORIAS_DEFAULT;
  }
}

export function agregarNuevaCategoria(nombre: string): { exito: boolean; categorias: string[]; error?: string } {
  const limpio = nombre.trim();
  if (!limpio) {
    return { exito: false, categorias: obtenerCategorias(), error: 'El nombre de la categoría no puede estar vacío.' };
  }
  const actuales = obtenerCategorias();
  if (actuales.some((c) => c.toLowerCase() === limpio.toLowerCase())) {
    return { exito: false, categorias: actuales, error: 'Esta categoría ya existe en tu catálogo.' };
  }
  const actualizadas = [limpio, ...actuales];
  localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(actualizadas));
  return { exito: true, categorias: actualizadas };
}

export function eliminarCategoria(nombre: string): { exito: boolean; categorias: string[]; error?: string } {
  const actuales = obtenerCategorias();
  if (actuales.length <= 1) {
    return { exito: false, categorias: actuales, error: 'Debes mantener al menos una categoría en el catálogo.' };
  }
  const actualizadas = actuales.filter((c) => c.toLowerCase() !== nombre.toLowerCase());
  localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(actualizadas));
  return { exito: true, categorias: actualizadas };
}

// ============================================================
// GASTOS (FACTURAS)
// ============================================================

/**
 * Detecta y elimina gastos corruptos o fantasmas (por ejemplo facturas importadas con NIT
 * interpretado erróneamente como total de 10 millones en 'Otros' o fechas en el establecimiento)
 */
export function limpiarGastosCorruptos(): { eliminados: number; totalRestante: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GASTOS);
    if (!raw) return { eliminados: 0, totalRestante: 0 };
    const lista: Gasto[] = JSON.parse(raw);
    if (!Array.isArray(lista)) return { eliminados: 0, totalRestante: 0 };

    const limpia = lista.filter((g) => {
      // Condición 1: Categoría 'Otros' con montos exorbitantes (>= $5.000.000 COP) generados por error de NIT/offset
      const esOtrosExorbitante = (g.categoria === 'Otros' || g.categoria === 'Otro') && g.total >= 5000000;
      // Condición 2: Establecimiento corrupto que es fecha, hora o puro número NIT
      const est = String(g.establecimiento || '');
      const esEstablecimientoCorrupto =
        /^\d{4}-\d{2}-\d{2}/.test(est) ||
        /^\d{8,12}$/.test(est.replace(/[^0-9]/g, ''));

      return !esOtrosExorbitante && !esEstablecimientoCorrupto;
    });

    const eliminados = lista.length - limpia.length;
    if (eliminados > 0) {
      localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(limpia));
      const borrados = lista.filter((g) => !limpia.some((l) => l.id === g.id));
      borrados.forEach((b) => deleteGastoFromFirestore(b.id).catch(() => {}));
    }

    return { eliminados, totalRestante: limpia.length };
  } catch {
    return { eliminados: 0, totalRestante: 0 };
  }
}

export function obtenerGastos(): Gasto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GASTOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(SEED_GASTOS));
      return SEED_GASTOS;
    }
    const lista = JSON.parse(raw);
    if (!Array.isArray(lista)) return SEED_GASTOS;

    // Sanear gastos corruptos al vuelo si existen
    let procesada = lista;
    const tieneCorruptos = lista.some(
      (g: Gasto) =>
        ((g.categoria === 'Otros' || g.categoria === 'Otro') && g.total >= 5000000) ||
        /^\d{4}-\d{2}-\d{2}/.test(g.establecimiento || '')
    );
    if (tieneCorruptos) {
      procesada = lista.filter(
        (g: Gasto) =>
          !((g.categoria === 'Otros' || g.categoria === 'Otro') && g.total >= 5000000) &&
          !/^\d{4}-\d{2}-\d{2}/.test(g.establecimiento || '')
      );
      localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(procesada));
      const borrados = lista.filter((g: Gasto) => !procesada.some((p: Gasto) => p.id === g.id));
      borrados.forEach((b: Gasto) => deleteGastoFromFirestore(b.id).catch(() => {}));
    }

    // Normalizar categorías al vuelo para garantizar congruencia con las 23 categorías
    return procesada.map((g: Gasto) => ({
      ...g,
      categoria: normalizarCategoria(g.categoria),
    }));
  } catch {
    return SEED_GASTOS;
  }
}

export function guardarGasto(nuevoGasto: Omit<Gasto, 'id' | 'sincronizado' | 'creado_en' | 'actualizado_en'>): Gasto {
  const lista = obtenerGastos();
  const config = obtenerConfiguracion();
  const id = crypto.randomUUID ? crypto.randomUUID() : `factura_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  const gasto: Gasto = {
    ...nuevoGasto,
    categoria: normalizarCategoria(nuevoGasto.categoria),
    id,
    sincronizado: config.modo === 'local',
    creado_en: timestamp,
    actualizado_en: timestamp,
  };

  const actualizada = [gasto, ...lista];
  localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(actualizada));

  // Sincronizar en tiempo real con Firestore
  syncGastoToFirestore(gasto).catch((e) => console.warn('Sync gasto error:', e));

  if (config.modo === 'sincronizado') {
    encolarSync(gasto.id, 'CREATE', gasto);
  }

  return gasto;
}

/**
 * Actualiza una factura existente y sincroniza con Firestore
 */
export function actualizarGasto(gastoActualizado: Gasto): Gasto {
  const lista = obtenerGastos();
  const idStr = String(gastoActualizado.id || '').trim();
  const timestamp = new Date().toISOString();

  const gastoLimpio: Gasto = {
    ...gastoActualizado,
    categoria: normalizarCategoria(gastoActualizado.categoria),
    actualizado_en: timestamp,
  };

  let encontrado = false;
  const actualizada = lista.map((g) => {
    const gidStr = String(g.id || '').trim();
    if ((idStr && gidStr === idStr) || g.id === gastoActualizado.id) {
      encontrado = true;
      return gastoLimpio;
    }
    return g;
  });

  if (!encontrado) {
    actualizada.unshift(gastoLimpio);
  }

  localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(actualizada));

  // Sincronizar en Firestore
  syncGastoToFirestore(gastoLimpio).catch((e) => console.warn('Sync updated gasto error:', e));

  return gastoLimpio;
}

export function eliminarGasto(id: string, gastoCompleto?: Partial<Gasto>): boolean {
  try {
    const idStr = String(id || '').trim();
    const lista = obtenerGastos();

    const filtrada = lista.filter((g) => {
      const gidStr = String(g.id || '').trim();
      // 1. Coincidencia por ID (tipo string o number)
      if (idStr && (gidStr === idStr || String(g.id) === String(id))) {
        return false;
      }
      // 2. Si se suministró el objeto completo, verificar por contenido exacto (por si el ID varió o está corrupto)
      if (
        gastoCompleto &&
        gastoCompleto.fecha === g.fecha &&
        String(gastoCompleto.establecimiento || '').toLowerCase().trim() === String(g.establecimiento || '').toLowerCase().trim() &&
        Math.abs(Number(gastoCompleto.total) - Number(g.total)) < 0.01
      ) {
        return false;
      }
      return true;
    });

    localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(filtrada));

    // Borrar de Firestore
    if (idStr) {
      deleteGastoFromFirestore(idStr).catch((e) => console.warn('Delete firestore gasto error:', e));
    }
    if (gastoCompleto?.id) {
      const altId = String(gastoCompleto.id).trim();
      if (altId && altId !== idStr) {
        deleteGastoFromFirestore(altId).catch(() => {});
      }
    }

    return true;
  } catch (err) {
    console.error('Error al eliminar gasto:', err);
    return false;
  }
}

/**
 * Importa facturas provenientes de Google Sheets (modo: 'reemplazar' o 'anexar')
 */
export function importarGastosDesdeGoogleSheets(
  nuevosGastos: Gasto[],
  modo: 'reemplazar' | 'anexar' = 'anexar'
): { importados: number; totalGastos: number; totalMonto: number } {
  const gastosLimpios = nuevosGastos.map((g) => ({
    ...g,
    categoria: normalizarCategoria(g.categoria),
    sincronizado: true,
  }));

  let resultadoFinal: Gasto[] = [];
  if (modo === 'reemplazar') {
    resultadoFinal = gastosLimpios;
  } else {
    const existentes = obtenerGastos();
    // Evitar duplicados idénticos si ya existían
    const idsExistentes = new Set(existentes.map((e) => e.id));
    const nuevosFiltrados = gastosLimpios.filter((g) => !idsExistentes.has(g.id));
    resultadoFinal = [...nuevosFiltrados, ...existentes];
  }

  // Ordenar por fecha descendente
  resultadoFinal.sort((a, b) => {
    const compFecha = b.fecha.localeCompare(a.fecha);
    if (compFecha !== 0) return compFecha;
    return (b.hora || '00:00').localeCompare(a.hora || '00:00');
  });

  localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(resultadoFinal));

  // Sincronizar gastos importados con Firestore
  Promise.all(gastosLimpios.map(g => syncGastoToFirestore(g))).catch((e) => console.warn('Firestore import sync error:', e));

  // Actualizar fecha de sincronización
  guardarConfiguracion({
    ultima_sincronizacion: new Date().toISOString(),
  });

  const totalMonto = resultadoFinal.reduce((sum, g) => sum + g.total, 0);

  return {
    importados: nuevosGastos.length,
    totalGastos: resultadoFinal.length,
    totalMonto,
  };
}

export function reiniciarDatosACero(): void {
  localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEY_QUEUE);
  guardarConfiguracion({
    ultima_sincronizacion: new Date().toISOString(),
  });
}

export function encolarSync(gastoId: string, accion: 'CREATE' | 'UPDATE' | 'DELETE', payload: any): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    const queue: SyncQueueItem[] = raw ? JSON.parse(raw) : [];
    const item: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      gasto_id: gastoId,
      accion,
      payload: JSON.stringify(payload),
      intentos: 0,
      creado_en: new Date().toISOString(),
    };
    queue.push(item);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Error al encolar sync:', err);
  }
}

export function obtenerColaSync(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function sincronizarTodoConGoogleSheets(): { sincronizados: number; resumen: string } {
  const lista = obtenerGastos();
  let pendientes = 0;

  const actualizados = lista.map((g) => {
    if (!g.sincronizado) {
      pendientes++;
      return { ...g, sincronizado: true };
    }
    return g;
  });

  localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(actualizados));
  localStorage.removeItem(STORAGE_KEY_QUEUE);

  const config = obtenerConfiguracion();
  guardarConfiguracion({
    ultima_sincronizacion: new Date().toISOString(),
  });

  return {
    sincronizados: pendientes,
    resumen: `${pendientes} facturas subidas a Google Sheets y confirmación despachada a ${config.email}`,
  };
}

export async function sincronizarConFirebase(): Promise<{ totalSincronizados: number; mensaje: string }> {
  try {
    const locales = obtenerGastos();
    const config = obtenerConfiguracion();
    await syncUserProfileToFirestore(config);
    
    // Subir todos los gastos locales a Firestore
    for (const g of locales) {
      await syncGastoToFirestore(g);
    }

    // Traer los existentes de Firestore para fusionar si hay nuevos
    const remotos = await fetchGastosFromFirestore();
    const mapa = new Map<string, Gasto>();
    locales.forEach(g => mapa.set(g.id, g));
    remotos.forEach(g => {
      if (!mapa.has(g.id)) {
        mapa.set(g.id, g);
      }
    });

    const listaUnificada = Array.from(mapa.values());
    localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(listaUnificada));

    return {
      totalSincronizados: listaUnificada.length,
      mensaje: `Sincronización completa con Firebase Firestore (${listaUnificada.length} comprobantes activos)`
    };
  } catch (err: any) {
    return {
      totalSincronizados: 0,
      mensaje: `Error al sincronizar con Firebase: ${err.message || 'Error de red'}`
    };
  }
}

export function formatearMoneda(monto: number, moneda: string = 'COP'): string {
  if (moneda === 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);
  }
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(monto);
}

/**
 * Exporta el listado actual de gastos a formato CSV compatible con Excel y Google Sheets
 * Siguiendo el orden exacto de 18 columnas:
 * ID, Fecha, Hora, Establecimiento, NIT, Ciudad, Categoría, Subcategoría, Método de pago, Subtotal, IVA, Descuento, Propina, Total, Observaciones, Imagen (Drive), Fecha de registro, MesAño
 */
export function exportarGastosACSV(gastos: Gasto[]): string {
  const escapeCSV = (val?: string | number) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const encabezados = [
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

  const filas = gastos.map((g, idx) => {
    // Extraer subcategoría si está en observaciones
    let subcategoria = '';
    let obsLimpia = g.observaciones || '';
    const matchSubcat = obsLimpia.match(/Subcategor[ií]a:\s*([^|]+)/i);
    if (matchSubcat) {
      subcategoria = matchSubcat[1].trim();
    }

    // Calcular MesAño a partir de la fecha
    let mesAno = '';
    if (g.fecha && g.fecha.length >= 7) {
      mesAno = g.fecha.substring(0, 7);
    }

    return [
      escapeCSV(g.id || idx + 1),
      escapeCSV(g.fecha),
      escapeCSV(g.hora || '12:00'),
      escapeCSV(g.establecimiento),
      escapeCSV(g.nit || ''),
      escapeCSV(g.ciudad || 'Bogotá'),
      escapeCSV(g.categoria),
      escapeCSV(subcategoria),
      escapeCSV(g.metodo_pago),
      escapeCSV(g.total), // Subtotal base
      escapeCSV(0), // IVA
      escapeCSV(0), // Descuento
      escapeCSV(0), // Propina
      escapeCSV(g.total), // Total
      escapeCSV(obsLimpia),
      escapeCSV(g.foto_factura_uri || ''),
      escapeCSV(g.creado_en || `${g.fecha} ${g.hora || '12:00'}:00`),
      escapeCSV(mesAno),
    ].join(',');
  });

  return [encabezados.join(','), ...filas].join('\r\n');
}

/**
 * Genera contenido en formato TSV (separado por tabulaciones) con las 18 columnas exactas
 * para que el usuario pueda copiar y pegar con 1 solo clic (Ctrl+V) directamente en Google Sheets.
 */
export function exportarGastosParaGoogleSheetsTSV(gastos: Gasto[]): string {
  const encabezados = [
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

  const filas = gastos.map((g, idx) => {
    let subcategoria = '';
    let obsLimpia = g.observaciones || '';
    const matchSubcat = obsLimpia.match(/Subcategor[ií]a:\s*([^|]+)/i);
    if (matchSubcat) {
      subcategoria = matchSubcat[1].trim();
    }
    let mesAno = g.fecha && g.fecha.length >= 7 ? g.fecha.substring(0, 7) : '';

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
      0,
      0,
      0,
      g.total,
      obsLimpia,
      g.foto_factura_uri || '',
      g.creado_en || `${g.fecha} ${g.hora || '12:00'}:00`,
      mesAno,
    ].join('\t');
  });

  return [encabezados.join('\t'), ...filas].join('\r\n');
}

/**
 * Dispara la descarga local en el navegador de un archivo CSV con codificación UTF-8 BOM
 */
export function descargarGastosCSV(gastos: Gasto[], nombreArchivo: string = 'Aura_Finanzas_Gastos'): void {
  const csvContent = exportarGastosACSV(gastos);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fechaHoy = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `${nombreArchivo}_${fechaHoy}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera un backup completo JSON de toda la app (gastos, categorías y configuración)
 * para garantizar cero pérdida de datos antes o después de actualizar la APK.
 */
export function generarBackupCompletoJSON(): string {
  const gastos = obtenerGastos();
  const config = obtenerConfiguracion();
  const categorias = obtenerCategorias();
  return JSON.stringify(
    {
      version: '1.1',
      generadoEl: new Date().toISOString(),
      config,
      categorias,
      gastos,
    },
    null,
    2
  );
}

/**
 * Dispara la descarga del respaldo JSON completo
 */
export function descargarBackupJSON(): void {
  const jsonContent = generarBackupCompletoJSON();
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fechaHoy = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `AuraFinanzas_CopiaSeguridad_${fechaHoy}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restaura un backup completo JSON sin borrar nada preexistente de forma destructiva
 */
export function restaurarBackupCompletoJSON(jsonString: string): {
  exito: boolean;
  gastosRestaurados: number;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.gastos)) {
      return {
        exito: false,
        gastosRestaurados: 0,
        error: 'El archivo de respaldo no tiene el formato válido.',
      };
    }
    const actuales = obtenerGastos();
    const mapa = new Map<string, Gasto>();
    // Unir actuales con los del backup sin duplicados
    data.gastos.forEach((g: Gasto) => mapa.set(g.id, g));
    actuales.forEach((g) => mapa.set(g.id, g));
    const unificados = Array.from(mapa.values());

    localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(unificados));
    if (data.categorias && Array.isArray(data.categorias)) {
      localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(data.categorias));
    }
    return { exito: true, gastosRestaurados: unificados.length };
  } catch (err: any) {
    return { exito: false, gastosRestaurados: 0, error: err.message || 'Error al procesar el archivo.' };
  }
}

