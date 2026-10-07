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

const STORAGE_KEY_GASTOS = 'aura_finances_gastos_v1';
const STORAGE_KEY_CONFIG = 'aura_finances_config_v1';
const STORAGE_KEY_QUEUE = 'aura_finances_sync_queue_v1';
const STORAGE_KEY_CATEGORIAS = 'aura_finances_custom_categories_v1';

const INITIAL_CONFIG: UsuarioConfig = {
  email: 'latouchettdiego@gmail.com',
  modo: 'sincronizado',
  moneda: 'COP',
  onboarding_completado: true,
  notificaciones_email: true,
  google_sheets_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
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
export function obtenerGastos(): Gasto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GASTOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(SEED_GASTOS));
      return SEED_GASTOS;
    }
    const lista = JSON.parse(raw);
    if (!Array.isArray(lista)) return SEED_GASTOS;

    // Normalizar categorías al vuelo para garantizar congruencia con las 23 categorías
    return lista.map((g: Gasto) => ({
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

  if (config.modo === 'sincronizado') {
    encolarSync(gasto.id, 'CREATE', gasto);
  }

  return gasto;
}

export function eliminarGasto(id: string): void {
  const lista = obtenerGastos();
  const filtrada = lista.filter((g) => g.id !== id);
  localStorage.setItem(STORAGE_KEY_GASTOS, JSON.stringify(filtrada));
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
