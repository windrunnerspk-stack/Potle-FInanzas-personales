/**
 * ARCHIVO EXPO NATIVO: src/services/expenseService.ts
 * Servicio para validación, persistencia en SQLite y encolamiento de sincronización.
 */

export const EXPO_EXPENSE_SERVICE_CODE = `import { getDatabase } from '../db/database';
import { Gasto, CategoriaGasto, MetodoPago, LISTA_CATEGORIAS, LISTA_METODOS_PAGO } from '../types';
import * as Crypto from 'expo-crypto';

export interface NuevoGastoDTO {
  establecimiento: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  ciudad: string;
  nit: string;
  categoria: CategoriaGasto;
  metodo_pago: MetodoPago;
  total: number;
  observaciones?: string;
  foto_factura_uri?: string;
}

export interface ResultadoGuardado {
  exito: boolean;
  gasto?: Gasto;
  error?: string;
}

/**
 * Valida los campos obligatorios del modelo de gasto antes de persistir
 */
export function validarGasto(dto: NuevoGastoDTO): { valido: boolean; mensajeError?: string } {
  if (!dto.establecimiento || dto.establecimiento.trim().length === 0) {
    return { valido: false, mensajeError: 'El nombre del establecimiento o proveedor es obligatorio.' };
  }
  if (!dto.fecha || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dto.fecha)) {
    return { valido: false, mensajeError: 'La fecha debe tener un formato válido (YYYY-MM-DD).' };
  }
  if (!dto.hora || !/^\\d{2}:\\d{2}$/.test(dto.hora)) {
    return { valido: false, mensajeError: 'La hora debe tener formato válido (HH:mm).' };
  }
  if (!dto.ciudad || dto.ciudad.trim().length === 0) {
    return { valido: false, mensajeError: 'La ciudad donde se realizó la compra es obligatoria.' };
  }
  if (!dto.nit || dto.nit.trim().length === 0) {
    return { valido: false, mensajeError: 'El NIT o documento fiscal del emisor es obligatorio.' };
  }
  if (!LISTA_CATEGORIAS.includes(dto.categoria)) {
    return { valido: false, mensajeError: 'La categoría seleccionada no es válida dentro del catálogo oficial.' };
  }
  if (!LISTA_METODOS_PAGO.includes(dto.metodo_pago)) {
    return { valido: false, mensajeError: 'El método de pago no es válido.' };
  }
  if (typeof dto.total !== 'number' || isNaN(dto.total) || dto.total <= 0) {
    return { valido: false, mensajeError: 'El total debe ser un monto numérico positivo mayor a cero.' };
  }
  return { valido: true };
}

/**
 * Guarda manualmente un nuevo gasto en SQLite y lo encola si el usuario está en modo sincronizado.
 * Utiliza transacciones atómicas para consistencia garantizada.
 */
export async function guardarGastoManual(dto: NuevoGastoDTO): Promise<ResultadoGuardado> {
  const validacion = validarGasto(dto);
  if (!validacion.valido) {
    return { exito: false, error: validacion.mensajeError };
  }

  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const timestampAhora = new Date().toISOString();

  // Consultar si el usuario está en modo local o sincronizado
  const configModoRow = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM configuracion_usuario WHERE clave = ?',
    ['modo_operacion']
  );
  const esModoSincronizado = configModoRow?.valor === 'sincronizado';

  const gasto: Gasto = {
    id,
    establecimiento: dto.establecimiento.trim(),
    fecha: dto.fecha,
    hora: dto.hora,
    ciudad: dto.ciudad.trim(),
    nit: dto.nit.trim(),
    categoria: dto.categoria,
    metodo_pago: dto.metodo_pago,
    total: Number(dto.total.toFixed(2)),
    observaciones: dto.observaciones?.trim() || undefined,
    foto_factura_uri: dto.foto_factura_uri,
    sincronizado: false, // Siempre nace en false hasta que el worker lo sincronice
    creado_en: timestampAhora,
    actualizado_en: timestampAhora,
  };

  try {
    await db.withTransactionAsync(async () => {
      // 1. Insertar el gasto en la tabla principal
      await db.runAsync(
        \`INSERT INTO gastos (
          id, establecimiento, fecha, hora, ciudad, nit, categoria, 
          metodo_pago, total, observaciones, foto_factura_uri, sincronizado, creado_en, actualizado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
        [
          gasto.id,
          gasto.establecimiento,
          gasto.fecha,
          gasto.hora,
          gasto.ciudad,
          gasto.nit,
          gasto.categoria,
          gasto.metodo_pago,
          gasto.total,
          gasto.observaciones || null,
          gasto.foto_factura_uri || null,
          0,
          gasto.creado_en,
          gasto.actualizado_en
        ]
      );

      // 2. Si el usuario activó Modo Sincronizado, registrarlo en la cola offline
      if (esModoSincronizado) {
        const syncId = Crypto.randomUUID();
        await db.runAsync(
          \`INSERT INTO sync_queue (id, gasto_id, accion, payload, intentos, creado_en)
           VALUES (?, ?, 'CREATE', ?, 0, ?)\`,
          [syncId, gasto.id, JSON.stringify(gasto), timestampAhora]
        );
      }
    });

    return { exito: true, gasto };
  } catch (error) {
    console.error('Error al persistir el gasto en SQLite:', error);
    return {
      exito: false,
      error: error instanceof Error ? error.message : 'Error inesperado al guardar el gasto en la base de datos.'
    };
  }
}
`;
