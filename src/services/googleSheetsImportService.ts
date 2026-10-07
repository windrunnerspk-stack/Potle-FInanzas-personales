import {
  Gasto,
  CategoriaGasto,
  MetodoPago,
  LISTA_CATEGORIAS_DEFAULT,
  CATEGORIAS_CONFIG_DEFAULT
} from '../types/finance';

export interface ResultadoImportacion {
  exito: boolean;
  totalFilas: number;
  gastosImportados: Gasto[];
  columnasMapeadas: Record<string, number>;
  totalMonto: number;
  conteoPorCategoria: Record<string, number>;
  errores: string[];
  advertencias: string[];
}

/**
 * Normaliza cualquier texto de categoría a una de las 23 categorías oficiales del usuario:
 * 'Mercado','Gasolina','Snacks','Caridad','Cumpleaños','Crypto','Apuestas','Videojuegos','Restaurantes',
 * 'Transporte','Vivienda','Servicios','Salud','Entretenimiento','Compras','Viajes','Taller','Educación',
 * 'Suscripciones','Tecnología','Ropa','Multas','Otros'
 */
export function normalizarCategoria(categoriaRaw?: string): CategoriaGasto {
  if (!categoriaRaw || typeof categoriaRaw !== 'string') {
    return 'Otros';
  }

  const raw = categoriaRaw.trim();
  if (!raw) return 'Otros';

  // 1. Coincidencia exacta directa
  const categoriaExacta = LISTA_CATEGORIAS_DEFAULT.find(
    (c) => c.toLowerCase() === raw.toLowerCase()
  );
  if (categoriaExacta) {
    return categoriaExacta;
  }

  // Quitar acentos para comparación robusta
  const limpio = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 2. Mapeos directos comunes y variantes
  const MAPEO_DIRECTO: Record<string, CategoriaGasto> = {
    // Mercado
    mercado: 'Mercado',
    mercados: 'Mercado',
    supermercado: 'Mercado',
    supermercados: 'Mercado',
    viveres: 'Mercado',
    fruver: 'Mercado',
    despensa: 'Mercado',
    comestibles: 'Mercado',

    // Gasolina
    gasolina: 'Gasolina',
    gas: 'Gasolina',
    combustible: 'Gasolina',
    estacion: 'Gasolina',
    acpm: 'Gasolina',

    // Snacks
    snack: 'Snacks',
    snacks: 'Snacks',
    mecato: 'Snacks',
    onces: 'Snacks',
    dulces: 'Snacks',
    golosinas: 'Snacks',
    panaderia: 'Snacks',
    cafe: 'Snacks',
    cafeteria: 'Snacks',

    // Caridad
    caridad: 'Caridad',
    donacion: 'Caridad',
    donaciones: 'Caridad',
    ong: 'Caridad',
    fundacion: 'Caridad',

    // Cumpleaños
    cumpleanos: 'Cumpleaños',
    cumple: 'Cumpleaños',
    cumpleanios: 'Cumpleaños',
    regalos: 'Cumpleaños',
    regalo: 'Cumpleaños',

    // Crypto
    crypto: 'Crypto',
    cripto: 'Crypto',
    criptomoneda: 'Crypto',
    criptomonedas: 'Crypto',
    bitcoin: 'Crypto',
    btc: 'Crypto',
    binance: 'Crypto',

    // Apuestas
    apuestas: 'Apuestas',
    apuesta: 'Apuestas',
    casino: 'Apuestas',
    loteria: 'Apuestas',
    chance: 'Apuestas',

    // Videojuegos
    videojuegos: 'Videojuegos',
    videojuego: 'Videojuegos',
    gaming: 'Videojuegos',
    games: 'Videojuegos',
    juegos: 'Videojuegos',

    // Restaurantes
    restaurantes: 'Restaurantes',
    restaurante: 'Restaurantes',
    comida: 'Restaurantes',
    almuerzo: 'Restaurantes',
    almuerzos: 'Restaurantes',
    cena: 'Restaurantes',
    desayuno: 'Restaurantes',

    // Transporte
    transporte: 'Transporte',
    taxi: 'Transporte',
    uber: 'Transporte',
    bus: 'Transporte',
    pasajes: 'Transporte',
    peaje: 'Transporte',
    peajes: 'Transporte',

    // Vivienda
    vivienda: 'Vivienda',
    arriendo: 'Vivienda',
    alquiler: 'Vivienda',
    renta: 'Vivienda',
    casa: 'Vivienda',
    apartamento: 'Vivienda',
    administracion: 'Vivienda',

    // Servicios
    servicios: 'Servicios',
    'servicios publicos': 'Servicios',
    luz: 'Servicios',
    agua: 'Servicios',
    internet: 'Servicios',
    energia: 'Servicios',

    // Salud
    salud: 'Salud',
    medico: 'Salud',
    medicina: 'Salud',
    farmacia: 'Salud',
    drogueria: 'Salud',
    eps: 'Salud',
    hospital: 'Salud',
    clinica: 'Salud',

    // Entretenimiento
    entretenimiento: 'Entretenimiento',
    ocio: 'Entretenimiento',
    cine: 'Entretenimiento',
    concierto: 'Entretenimiento',
    diversion: 'Entretenimiento',

    // Compras
    compras: 'Compras',
    compra: 'Compras',
    shopping: 'Compras',
    tienda: 'Compras',

    // Viajes
    viajes: 'Viajes',
    viaje: 'Viajes',
    vuelos: 'Viajes',
    vuelo: 'Viajes',
    hotel: 'Viajes',
    vacaciones: 'Viajes',

    // Taller
    taller: 'Taller',
    mecanico: 'Taller',
    repuestos: 'Taller',
    mantenimiento: 'Taller',
    auto: 'Taller',

    // Educación
    educacion: 'Educación',
    colegio: 'Educación',
    universidad: 'Educación',
    cursos: 'Educación',
    curso: 'Educación',
    estudios: 'Educación',

    // Suscripciones
    suscripciones: 'Suscripciones',
    suscripcion: 'Suscripciones',
    streaming: 'Suscripciones',
    membresia: 'Suscripciones',
    netflix: 'Suscripciones',
    spotify: 'Suscripciones',

    // Tecnología
    tecnologia: 'Tecnología',
    computador: 'Tecnología',
    celular: 'Tecnología',
    gadgets: 'Tecnología',
    software: 'Tecnología',

    // Ropa
    ropa: 'Ropa',
    vestuario: 'Ropa',
    zapatos: 'Ropa',
    calzado: 'Ropa',
    moda: 'Ropa',

    // Multas
    multas: 'Multas',
    multa: 'Multas',
    comparendo: 'Multas',
    infraccion: 'Multas',

    // Otros
    otros: 'Otros',
    otro: 'Otros',
    varios: 'Otros',
    gastos: 'Otros',
    gasto: 'Otros',
  };

  if (MAPEO_DIRECTO[limpio]) {
    return MAPEO_DIRECTO[limpio];
  }

  // 3. Buscar si coincide con alguna palabra clave de las configuraciones oficiales
  for (const catName of LISTA_CATEGORIAS_DEFAULT) {
    const conf = CATEGORIAS_CONFIG_DEFAULT[catName];
    if (conf?.keywords) {
      for (const kw of conf.keywords) {
        const kwLimpio = kw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        if (limpio.includes(kwLimpio) || kwLimpio.includes(limpio)) {
          return catName;
        }
      }
    }
  }

  // Fallback seguro sin fallar jamás
  return 'Otros';
}

/**
 * Normaliza cualquier valor numérico monetario proveniente de Google Sheets
 * e.g. "$ 145.000", "145000", "145,000.50", "$ 145.000 COP", "-35000"
 */
export function normalizarMonto(montoRaw: any): number {
  if (typeof montoRaw === 'number') {
    return Math.abs(isNaN(montoRaw) ? 0 : montoRaw);
  }

  if (!montoRaw || typeof montoRaw !== 'string') {
    return 0;
  }

  let str = montoRaw.trim();
  // Quitar símbolos de moneda y letras (COP, USD, $, €, etc.)
  str = str.replace(/[^0-9.,\-]/g, '');

  if (!str) return 0;

  // Manejo de formatos de miles y decimales
  // Si contiene tanto punto como coma:
  if (str.includes('.') && str.includes(',')) {
    // Ejemplo "145.000,50" -> miles punto, decimal coma
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Ejemplo "145,000.50" -> miles coma, decimal punto
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // Si tiene puntos: puede ser miles "145.000" o decimal "145.50"
    const partes = str.split('.');
    if (partes.length > 2) {
      // Múltiples puntos: "1.250.000" -> separador de miles
      str = str.replace(/\./g, '');
    } else if (partes[1] && partes[1].length === 3) {
      // 3 decimales: típicamente miles en COP/España (ej: 145.000)
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    // Si tiene comas: puede ser miles "145,000" o decimal "145,50"
    const partes = str.split(',');
    if (partes.length > 2) {
      str = str.replace(/,/g, '');
    } else if (partes[1] && partes[1].length === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Normaliza fechas variadas (YYYY-MM-DD, DD/MM/YYYY, D/M/YYYY, seriales de Excel)
 */
export function normalizarFecha(fechaRaw?: any): string {
  const hoyStr = new Date().toISOString().split('T')[0];
  if (!fechaRaw) return hoyStr;

  // Si es un número serial de Excel (e.g. 46299)
  if (typeof fechaRaw === 'number' || (!isNaN(Number(fechaRaw)) && Number(fechaRaw) > 30000 && Number(fechaRaw) < 60000)) {
    const serial = Number(fechaRaw);
    const fechaExcel = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(fechaExcel.getTime())) {
      return fechaExcel.toISOString().split('T')[0];
    }
  }

  const str = String(fechaRaw).trim();

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
    const partes = str.split('T')[0].split('-');
    const y = partes[0];
    const m = partes[1].padStart(2, '0');
    const d = partes[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const regexDMY = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const matchDMY = str.match(regexDMY);
  if (matchDMY) {
    let dia = matchDMY[1].padStart(2, '0');
    let mes = matchDMY[2].padStart(2, '0');
    let anio = matchDMY[3];
    if (anio.length === 2) {
      anio = `20${anio}`;
    }
    // Si mes es mayor a 12 pero dia <= 12, intercambiar (MM/DD/YYYY)
    if (Number(mes) > 12 && Number(dia) <= 12) {
      const temp = dia;
      dia = mes;
      mes = temp;
    }
    return `${anio}-${mes}-${dia}`;
  }

  // Intentar parseo nativo
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return hoyStr;
}

/**
 * Normaliza método de pago
 */
export function normalizarMetodoPago(metodoRaw?: string): MetodoPago {
  if (!metodoRaw || typeof metodoRaw !== 'string') return 'Tarjeta Débito';
  const str = metodoRaw.toLowerCase();
  if (str.includes('efectivo') || str.includes('cash')) return 'Efectivo';
  if (str.includes('credito') || str.includes('crédito') || str.includes('credit')) return 'Tarjeta Crédito';
  if (str.includes('debito') || str.includes('débito') || str.includes('debit')) return 'Tarjeta Débito';
  if (str.includes('transf') || str.includes('nequi') || str.includes('daviplata') || str.includes('bancolombia') || str.includes('pse')) return 'Transferencia';
  if (str.includes('cripto') || str.includes('crypto') || str.includes('btc') || str.includes('binance')) return 'Cripto';
  return 'Otro';
}

/**
 * Parser de texto CSV/TSV respetando comillas y delimitadores múltiples
 */
export function parsearLineasCSV(texto: string, delimitador?: string): string[][] {
  const lineas: string[][] = [];
  if (!texto || !texto.trim()) return lineas;

  // Auto-detectar delimitador si no se especificó
  let delim = delimitador;
  if (!delim) {
    const primeraLinea = texto.split(/\r?\n/)[0] || '';
    const tabs = (primeraLinea.match(/\t/g) || []).length;
    const comas = (primeraLinea.match(/,/g) || []).length;
    const puntosYComas = (primeraLinea.match(/;/g) || []).length;

    if (tabs > 0 && tabs >= comas && tabs >= puntosYComas) {
      delim = '\t';
    } else if (puntosYComas > comas) {
      delim = ';';
    } else {
      delim = ',';
    }
  }

  const rawLines = texto.split(/\r?\n/);
  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;

    const row: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"') {
        if (insideQuotes && rawLine[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delim && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    if (row.some((cell) => cell.length > 0)) {
      lineas.push(row);
    }
  }

  return lineas;
}

/**
 * Detecta qué columna corresponde a qué campo
 */
function identificarColumnas(headers: string[]): Record<string, number> {
  const mapa: Record<string, number> = {};

  const nombresLimpios = headers.map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  nombresLimpios.forEach((h, idx) => {
    // Fecha
    if (h.includes('fecha') || h === 'date' || h === 'dia' || h === 'tiempo' || h === 'f.') {
      if (mapa.fecha === undefined) mapa.fecha = idx;
    }
    // Hora
    else if (h.includes('hora') || h === 'time' || h === 'hr') {
      if (mapa.hora === undefined) mapa.hora = idx;
    }
    // Establecimiento / Comercio / Lugar
    else if (
      h.includes('establecimiento') ||
      h.includes('comercio') ||
      h.includes('lugar') ||
      h.includes('negocio') ||
      h.includes('tienda') ||
      h.includes('proveedor') ||
      h.includes('concepto') ||
      h.includes('descripcion') ||
      h.includes('nombre') ||
      h.includes('detalle') ||
      h.includes('item')
    ) {
      if (mapa.establecimiento === undefined) mapa.establecimiento = idx;
    }
    // NIT / Factura
    else if (h.includes('nit') || h.includes('rut') || h.includes('factura') || h.includes('nro') || h.includes('ticket')) {
      if (mapa.nit === undefined) mapa.nit = idx;
    }
    // Categoría
    else if (
      h.includes('categoria') ||
      h.includes('category') ||
      h.includes('rubro') ||
      h.includes('clasificacion') ||
      h.includes('tipo')
    ) {
      if (mapa.categoria === undefined) mapa.categoria = idx;
    }
    // Método de pago
    else if (h.includes('metodo') || h.includes('medio') || h.includes('pago') || h.includes('forma')) {
      if (mapa.metodo_pago === undefined) mapa.metodo_pago = idx;
    }
    // Ciudad / Ubicación
    else if (h.includes('ciudad') || h.includes('city') || h.includes('ubicacion') || h.includes('lugar')) {
      if (mapa.ciudad === undefined) mapa.ciudad = idx;
    }
    // Total / Monto / Valor
    else if (
      h.includes('total') ||
      h.includes('monto') ||
      h.includes('valor') ||
      h.includes('precio') ||
      h.includes('importe') ||
      h.includes('costo') ||
      h.includes('gasto') ||
      h.includes('amount')
    ) {
      if (mapa.total === undefined) mapa.total = idx;
    }
    // Observaciones / Notas
    else if (h.includes('observacion') || h.includes('nota') || h.includes('comentario')) {
      if (mapa.observaciones === undefined) mapa.observaciones = idx;
    }
  });

  return mapa;
}

/**
 * Función principal para procesar cualquier texto o contenido de Google Sheets
 * y cargarlo a la aplicación sin errores.
 */
export function procesarImportacionGoogleSheets(textoCrudo: string): ResultadoImportacion {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const conteoPorCategoria: Record<string, number> = {};
  LISTA_CATEGORIAS_DEFAULT.forEach((cat) => {
    conteoPorCategoria[cat] = 0;
  });

  if (!textoCrudo || !textoCrudo.trim()) {
    return {
      exito: false,
      totalFilas: 0,
      gastosImportados: [],
      columnasMapeadas: {},
      totalMonto: 0,
      conteoPorCategoria,
      errores: ['El contenido pegado o importado está vacío.'],
      advertencias,
    };
  }

  const filas = parsearLineasCSV(textoCrudo);
  if (filas.length === 0) {
    return {
      exito: false,
      totalFilas: 0,
      gastosImportados: [],
      columnasMapeadas: {},
      totalMonto: 0,
      conteoPorCategoria,
      errores: ['No se encontraron filas con datos válidos en el archivo.'],
      advertencias,
    };
  }

  // Identificar si la fila 0 es un encabezado
  let filaInicio = 0;
  let mapaColumnas = identificarColumnas(filas[0]);

  // Si encontramos al menos 2 columnas clave reconocidas en la primera fila, es un encabezado
  const columnasClaveEncontradas = [
    mapaColumnas.total !== undefined,
    mapaColumnas.fecha !== undefined,
    mapaColumnas.establecimiento !== undefined,
    mapaColumnas.categoria !== undefined,
  ].filter(Boolean).length;

  if (columnasClaveEncontradas >= 2) {
    filaInicio = 1;
  } else {
    // Si la primera fila no parece encabezado, revisar fila 1
    if (filas.length > 1) {
      const mapaFila1 = identificarColumnas(filas[1]);
      if (
        [mapaFila1.total !== undefined, mapaFila1.fecha !== undefined, mapaFila1.establecimiento !== undefined].filter(
          Boolean
        ).length >= 2
      ) {
        mapaColumnas = mapaFila1;
        filaInicio = 2;
      }
    }

    // Si aún no hay encabezados, inferir posiciones por orden estándar:
    // Fecha(0), Hora(1), Establecimiento(2), NIT(3), Categoría(4), Método(5), Ciudad(6), Total(7), Observaciones(8)
    if (mapaColumnas.total === undefined && mapaColumnas.establecimiento === undefined) {
      advertencias.push('No se detectaron nombres de columnas explícitos. Se utilizó el mapeo inteligente por posición.');
      mapaColumnas = {
        fecha: 0,
        hora: 1,
        establecimiento: 2,
        nit: 3,
        categoria: 4,
        metodo_pago: 5,
        ciudad: 6,
        total: 7,
        observaciones: 8,
      };
    }
  }

  // Si aún no tenemos mapeado 'total', buscar qué columna tiene números en las filas
  if (mapaColumnas.total === undefined) {
    const numCols = filas[filaInicio]?.length || 0;
    for (let c = numCols - 1; c >= 0; c--) {
      const celda = filas[filaInicio]?.[c];
      if (celda && normalizarMonto(celda) > 0) {
        mapaColumnas.total = c;
        break;
      }
    }
  }

  // Si no tenemos establecimiento, buscar la primera columna de texto largo
  if (mapaColumnas.establecimiento === undefined) {
    mapaColumnas.establecimiento = 2 < (filas[filaInicio]?.length || 0) ? 2 : 0;
  }

  const gastosParseados: Gasto[] = [];
  let totalMonto = 0;
  const hoyStr = new Date().toISOString().split('T')[0];

  for (let i = filaInicio; i < filas.length; i++) {
    const fila = filas[i];
    if (!fila || fila.length === 0 || fila.every((cell) => !cell || !cell.trim())) {
      continue;
    }

    // 1. Extraer o inferir monto total
    const totalRaw = mapaColumnas.total !== undefined ? fila[mapaColumnas.total] : '';
    let total = normalizarMonto(totalRaw);

    // Si el total dio 0 pero hay alguna otra celda que parece monto, buscarla
    if (total === 0) {
      for (let c = 0; c < fila.length; c++) {
        const val = normalizarMonto(fila[c]);
        if (val > 100) {
          total = val;
          break;
        }
      }
    }

    // 2. Extraer o normalizar categoría
    const categoriaRaw = mapaColumnas.categoria !== undefined ? fila[mapaColumnas.categoria] : '';
    const categoria = normalizarCategoria(categoriaRaw);

    // 3. Extraer establecimiento
    let establecimiento = mapaColumnas.establecimiento !== undefined ? fila[mapaColumnas.establecimiento] : '';
    if (!establecimiento || !establecimiento.trim()) {
      establecimiento = `Factura ${categoria}`;
    }

    // 4. Extraer fecha
    const fechaRaw = mapaColumnas.fecha !== undefined ? fila[mapaColumnas.fecha] : '';
    const fecha = normalizarFecha(fechaRaw);

    // 5. Extraer hora
    let hora = mapaColumnas.hora !== undefined ? fila[mapaColumnas.hora] : '';
    if (!hora || !/^\d{1,2}:\d{2}/.test(hora.trim())) {
      hora = '12:00';
    } else {
      hora = hora.trim().slice(0, 5);
    }

    // 6. Extraer NIT
    const nit = (mapaColumnas.nit !== undefined ? fila[mapaColumnas.nit] : '') || 'Consumidor Final';

    // 7. Extraer Ciudad
    const ciudad = (mapaColumnas.ciudad !== undefined ? fila[mapaColumnas.ciudad] : '') || 'Bogotá';

    // 8. Extraer Método de Pago
    const metodoRaw = mapaColumnas.metodo_pago !== undefined ? fila[mapaColumnas.metodo_pago] : '';
    const metodo_pago = normalizarMetodoPago(metodoRaw);

    // 9. Extraer Observaciones
    const observaciones = (mapaColumnas.observaciones !== undefined ? fila[mapaColumnas.observaciones] : '') || '';

    const id = `gsheet_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = `${fecha}T${hora}:00`;

    const gasto: Gasto = {
      id,
      establecimiento: establecimiento.trim(),
      fecha,
      hora,
      ciudad: ciudad.trim(),
      nit: nit.trim(),
      categoria,
      metodo_pago,
      total,
      observaciones: observaciones.trim() || undefined,
      sincronizado: true,
      creado_en: timestamp,
      actualizado_en: timestamp,
    };

    gastosParseados.push(gasto);
    totalMonto += total;
    conteoPorCategoria[categoria] = (conteoPorCategoria[categoria] || 0) + 1;
  }

  if (gastosParseados.length === 0) {
    return {
      exito: false,
      totalFilas: filas.length,
      gastosImportados: [],
      columnasMapeadas: mapaColumnas,
      totalMonto: 0,
      conteoPorCategoria,
      errores: ['No se pudieron extraer gastos válidos de las filas procesadas.'],
      advertencias,
    };
  }

  return {
    exito: true,
    totalFilas: filas.length - filaInicio,
    gastosImportados: gastosParseados,
    columnasMapeadas: mapaColumnas,
    totalMonto,
    conteoPorCategoria,
    errores,
    advertencias,
  };
}

/**
 * Descarga y extrae los datos directamente desde una URL pública de Google Sheets
 */
export async function descargarGoogleSheetsCSV(url: string): Promise<{
  exito: boolean;
  contenido?: string;
  error?: string;
}> {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      return {
        exito: false,
        error: 'El enlace no tiene un formato válido de Google Sheets (falta el ID de la hoja).',
      };
    }

    const sheetId = match[1];

    // Intentar endpoint de exportación directa a CSV
    const urlsToTry = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
    ];

    for (const fetchUrl of urlsToTry) {
      try {
        const resp = await fetch(fetchUrl);
        if (resp.ok) {
          const text = await resp.text();
          if (text && text.trim().length > 10 && !text.includes('<!DOCTYPE html>')) {
            return { exito: true, contenido: text };
          }
        }
      } catch (e) {
        // Ignorar y probar siguiente endpoint
      }
    }

    return {
      exito: false,
      error:
        'No se pudo descargar automáticamente debido a permisos privados de Google Sheets o bloqueo CORS. Usa la opción "Pegar Celdas Directas (Ctrl+C en Google Sheets -> Pegar aquí)" que no requiere permisos y funciona al 100%.',
    };
  } catch (err: any) {
    return {
      exito: false,
      error: err?.message || 'Error al conectar con Google Sheets.',
    };
  }
}

/**
 * Genera contenido CSV de plantilla oficial con las 23 categorías
 */
export function generarPlantillaGoogleSheets(): string {
  const encabezado = 'Fecha,Hora,Establecimiento,NIT,Categoria,Metodo_Pago,Ciudad,Total,Observaciones';
  const ejemplos = [
    '2026-10-06,08:45,Estación Terpel Calle 100,860.005.224-6,Gasolina,Tarjeta Crédito,Bogotá,145000,Tanque lleno corriente',
    '2026-10-06,14:20,Éxito Calle 80,890.900.608-9,Mercado,Tarjeta Débito,Bogotá,320500,Mercado quincenal',
    '2026-10-06,17:15,Oxxo Parque 93,900.254.123-1,Snacks,Efectivo,Bogotá,18500,Café y galletas',
    '2026-10-05,19:30,Crepes & Waffles Zona T,860.519.894-3,Restaurantes,Tarjeta Débito,Bogotá,89400,Cena familiar',
    '2026-10-04,11:15,Cruz Verde Droguería,800.149.695-1,Salud,Transferencia,Bogotá,64200,Vitaminas y medicamentos',
    '2026-10-01,09:00,Inmobiliaria Habitat,900.845.120-7,Vivienda,Transferencia,Bogotá,2150000,Arriendo del mes',
    '2026-09-28,03:00,Netflix Suscripción,901.388.940-2,Suscripciones,Tarjeta Crédito,Bogotá,44900,Plan Premium 4k',
    '2026-09-25,18:40,Enel Colombia,860.003.559-7,Servicios,Transferencia,Bogotá,185000,Factura energía eléctrica',
    '2026-09-22,16:00,Binance Exchange,000.000.000-0,Crypto,Transferencia,Bogotá,500000,Aporte mensual USDT/BTC',
    '2026-09-18,20:00,PlayStation Store,900.111.222-3,Videojuegos,Tarjeta Crédito,Bogotá,189000,Pase de temporada',
    '2026-09-15,10:30,Universidad Andes,860.007.386-1,Educación,Transferencia,Bogotá,1200000,Especialización software',
    '2026-09-12,15:30,Zara Titán Plaza,800.222.333-4,Ropa,Tarjeta Crédito,Bogotá,280000,Ropa para oficina',
    '2026-09-10,14:00,Taller Mecánico El Pistón,900.444.555-6,Taller,Efectivo,Bogotá,210000,Cambio de aceite y pastillas',
    '2026-09-08,12:00,Secretaría Movilidad,899.999.061-9,Multas,Transferencia,Bogotá,340000,Fotomulta velocidad',
    '2026-09-05,11:00,Fundación Niños de los Andes,860.024.120-1,Caridad,Transferencia,Bogotá,100000,Donación mensual',
    '2026-09-02,18:00,Pastelería Santa Elena,860.055.123-4,Cumpleaños,Tarjeta Débito,Bogotá,95000,Torta de cumpleaños',
    '2026-08-30,22:00,BetPlay Colombia,901.123.456-7,Apuestas,Transferencia,Bogotá,50000,Pronóstico deportivo',
    '2026-08-25,13:00,Uber Technologies,901.444.888-9,Transporte,Tarjeta Crédito,Bogotá,28500,Traslado al aeropuerto',
    '2026-08-20,10:00,Avianca Airlines,890.100.577-6,Viajes,Tarjeta Crédito,Bogotá,650000,Tiquetes fin de año',
    '2026-08-15,16:00,Apple Store Unicentro,830.098.712-3,Tecnología,Tarjeta Crédito,Bogotá,980000,Accesorios y cargador',
    '2026-08-10,19:00,Cine Colombia Unicentro,860.005.124-8,Entretenimiento,Tarjeta Débito,Bogotá,56000,Entradas y combos cine',
    '2026-08-05,15:00,Amazon Imports,000.000.000-0,Compras,Tarjeta Crédito,Bogotá,320000,Mochila y termo térmico',
    '2026-08-01,10:00,Papelería Panamericana,860.008.224-5,Otros,Efectivo,Bogotá,35000,Cuadernos y bolígrafos',
  ];

  return [encabezado, ...ejemplos].join('\n');
}
