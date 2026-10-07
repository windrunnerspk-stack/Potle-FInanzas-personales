/**
 * ARCHIVO EXPO NATIVO: src/db/database.ts
 * Implementación con expo-sqlite (Modern API Expo SDK 51 / 52)
 * Provee la conexión singleton y ejecuta migraciones iniciales.
 */

export const EXPO_DATABASE_CODE = `import * as SQLite from 'expo-sqlite';

const DB_NAME = 'aura_finances.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Obtiene la instancia abierta de la base de datos SQLite
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initDatabase(dbInstance);
  }
  return dbInstance;
}

/**
 * Inicializa las tablas, índices y configuración de PRAGMA
 */
export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Activar Foreign Keys y modo WAL para máxima velocidad y concurrencia offline
  await db.execAsync(\`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  \`);

  // Ejecución del esquema DDL
  await db.execAsync(\`
    CREATE TABLE IF NOT EXISTS gastos (
      id TEXT PRIMARY KEY NOT NULL,
      establecimiento TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      ciudad TEXT NOT NULL,
      nit TEXT NOT NULL,
      categoria TEXT NOT NULL,
      metodo_pago TEXT NOT NULL,
      total REAL NOT NULL CHECK(total >= 0),
      observaciones TEXT,
      foto_factura_uri TEXT,
      sincronizado INTEGER NOT NULL DEFAULT 0,
      creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      actualizado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_gastos_establecimiento_fecha ON gastos(establecimiento COLLATE NOCASE, fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_gastos_categoria_fecha ON gastos(categoria, fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_gastos_sincronizado ON gastos(sincronizado) WHERE sincronizado = 0;
    CREATE INDEX IF NOT EXISTS idx_gastos_nit ON gastos(nit);

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      gasto_id TEXT NOT NULL,
      accion TEXT NOT NULL CHECK(accion IN ('CREATE', 'UPDATE', 'DELETE')),
      payload TEXT NOT NULL,
      intentos INTEGER NOT NULL DEFAULT 0,
      ultimo_intento TEXT,
      ultimo_error TEXT,
      creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(gasto_id) REFERENCES gastos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_intentos ON sync_queue(intentos ASC, creado_en ASC);

    CREATE TABLE IF NOT EXISTS configuracion_usuario (
      clave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL,
      actualizado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  \`);
}
`;
