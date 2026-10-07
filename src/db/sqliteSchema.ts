/**
 * SQLite Schema para Aura Finance (React Native Expo SQLite SDK 51/52)
 * Diseñado para operaciones Offline-First de alta velocidad y sincronización en segundo plano.
 */

export const SQLITE_SCHEMA_SQL = `
-- ============================================================
-- 1. TABLA PRINCIPAL: GASTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY NOT NULL,              -- UUID v4 generado en cliente
    establecimiento TEXT NOT NULL,             -- Comercio o proveedor (ej. 'Terpel')
    fecha TEXT NOT NULL,                       -- Formato ISO: YYYY-MM-DD
    hora TEXT NOT NULL,                        -- Formato 24h: HH:mm
    ciudad TEXT NOT NULL,                      -- Ciudad del gasto
    nit TEXT NOT NULL,                         -- NIT/RUT/RFC o doc fiscal emisor
    categoria TEXT NOT NULL,                   -- Una de las 23 categorías cerradas
    metodo_pago TEXT NOT NULL,                 -- Efectivo, Tarjeta Débito/Crédito, etc.
    total REAL NOT NULL CHECK(total >= 0),     -- Monto numérico con precisión flotante
    observaciones TEXT,                        -- Notas adicionales opcionales
    foto_factura_uri TEXT,                     -- Path local de la imagen guardada
    sincronizado INTEGER NOT NULL DEFAULT 0,  -- 0 = pendiente sync, 1 = sincronizado
    creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ============================================================
-- 2. ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================
-- Índice para filtrado cronológico (Mis Gastos y Calendario estilo Vuelos)
CREATE INDEX IF NOT EXISTS idx_gastos_fecha 
ON gastos(fecha DESC);

-- Índice compuesto para búsqueda instantánea por establecimiento y fecha
CREATE INDEX IF NOT EXISTS idx_gastos_establecimiento_fecha 
ON gastos(establecimiento COLLATE NOCASE, fecha DESC);

-- Índice para el ranking y desglose por categorías
CREATE INDEX IF NOT EXISTS idx_gastos_categoria_fecha 
ON gastos(categoria, fecha DESC);

-- Índice para la cola de sincronización offline (filtrar no sincronizados velozmente)
CREATE INDEX IF NOT EXISTS idx_gastos_sincronizado 
ON gastos(sincronizado) 
WHERE sincronizado = 0;

-- Índice para búsquedas por NIT/RUT fiscal
CREATE INDEX IF NOT EXISTS idx_gastos_nit 
ON gastos(nit);

-- ============================================================
-- 3. TABLA DE COLA DE SINCRONIZACIÓN (BACKGROUND SYNC QUEUE)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,              -- UUID del evento de sincronización
    gasto_id TEXT NOT NULL,                    -- FK lógica al gasto
    accion TEXT NOT NULL CHECK(accion IN ('CREATE', 'UPDATE', 'DELETE')),
    payload TEXT NOT NULL,                     -- Snapshot JSON del registro
    intentos INTEGER NOT NULL DEFAULT 0,       -- Contador de reintentos
    ultimo_intento TEXT,                       -- Timestamp del último intento
    ultimo_error TEXT,                         -- Detalle del error si falló
    creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY(gasto_id) REFERENCES gastos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_intentos 
ON sync_queue(intentos ASC, creado_en ASC);

-- ============================================================
-- 4. TABLA DE CONFIGURACIÓN DEL USUARIO (PREFERENCIAS & MODO)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_usuario (
    clave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL,
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ============================================================
-- 5. TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_gastos_actualizado_en
AFTER UPDATE ON gastos
FOR EACH ROW
BEGIN
    UPDATE gastos 
    SET actualizado_en = datetime('now', 'localtime') 
    WHERE id = OLD.id;
END;
`;

export const EXPO_FOLDER_STRUCTURE_DOC = `
aura-finance/
├── app/                           # Expo Router v3 (Navegación basada en archivos)
│   ├── _layout.tsx                # Layout raíz (ThemeProvider, Gestures, DB Init)
│   ├── onboarding.tsx             # Pantalla de bienvenida (Email + Modo Local/Sync)
│   ├── (tabs)/                    # Tab Bar inferior con animaciones hápticas
│   │   ├── _layout.tsx            # Configuración de Tabs con iconos personalizados
│   │   ├── index.tsx              # Tab 1: "Mis Gastos" (Resumen Mensual/Anual, Ranking, Búsqueda)
│   │   ├── calendar.tsx           # Tab 2: Calendario tipo Precios de Vuelos (Badges diarios)
│   │   ├── scan.tsx               # Tab 3: Botón flotante central -> OCR Scanner Local
│   │   ├── analytics.tsx          # Tab 4: Gráficos Donut + Tendencia Anual ascendente
│   │   └── settings.tsx           # Tab 5: Configuración, Google Sheets & Export
│   ├── expense/
│   │   ├── new.tsx                # Modal de Registro Manual de Gasto
│   │   └── [id].tsx               # Detalle / Edición de Gasto
│   └── modals/
│       ├── category-picker.tsx    # Modal táctil de las 23 categorías
│       └── day-details.tsx        # Bottom sheet de gastos del día en el calendario
│
├── src/
│   ├── components/                # Componentes atómicos y moleculares reutilizables
│   │   ├── ui/                    # Botones premium, inputs hápticos, tarjetas de vidrio
│   │   ├── forms/                 # Formulario de gasto con autocompletado y validación
│   │   ├── calendar/              # Celda personalizada con badge de precio y degradado
│   │   ├── charts/                # Donut Chart interactivo y gráficos de barras
│   │   ├── scanner/               # Overlay de cámara y visor de parsing OCR
│   │   └── widgets/               # Vista previa de widgets para pantalla de inicio
│   ├── db/                        # Capa de persistencia nativa SQLite
│   │   ├── database.ts            # Inicialización de expo-sqlite con migraciones
│   │   ├── schema.sql             # Definición de tablas e índices
│   │   └── migrations.ts          # Control de versiones del esquema
│   ├── services/                  # Lógica de negocio y orquestación
│   │   ├── expenseService.ts      # CRUD de gastos, validaciones y cola de sync
│   │   ├── ocrService.ts          # Procesamiento OCR local y regex de facturas
│   │   ├── syncService.ts         # Worker en background: Google Sheets API & Correo
│   │   └── emailService.ts        # Despacho de notificaciones y resumen de compra
│   ├── hooks/                     # Custom hooks para estado y reactividad
│   │   ├── useExpenses.ts         # Hook reactivo de gastos con filtros y estadísticas
│   │   ├── useSyncQueue.ts        # Estado de sincronización y conectividad
│   │   └── useHaptics.ts          # Feedback táctil de alta gama en cada interacción
│   ├── constants/                 # Constantes globales
│   │   ├── categories.ts          # Las 23 categorías con iconos y paletas hex
│   │   └── theme.ts               # Paleta lujosa (Midnight Obsidian, Emerald Accent)
│   ├── utils/                     # Formateadores de moneda, fechas, regex
│   │   ├── currency.ts            # Formato de moneda local (ej. $ 45.000 COP)
│   │   └── ocrParser.ts           # RegEx para NIT, Fechas, Total y Comercio
│   └── types/                     # Definiciones de TypeScript estrictas
│       └── index.ts
├── assets/                        # Fuentes Plus Jakarta Sans, iconos de widgets, logos
├── app.json                       # Configuración de Expo (plugins de cámara, widgets)
├── package.json
└── tsconfig.json
`;
