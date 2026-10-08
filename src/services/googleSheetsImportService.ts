import {
  Gasto,
  CategoriaGasto,
  MetodoPago,
  LISTA_CATEGORIAS_DEFAULT,
  CATEGORIAS_CONFIG_DEFAULT,
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

// Lista de ciudades colombianas para detección precisa y normalización
export const CIUDADES_COLOMBIANAS: Record<string, string> = {
  cucuta: 'Cúcuta',
  'santa marta': 'Santa Marta',
  santamarta: 'Santa Marta',
  bogota: 'Bogotá',
  medellin: 'Medellín',
  cali: 'Cali',
  barranquilla: 'Barranquilla',
  cartagena: 'Cartagena',
  bucaramanga: 'Bucaramanga',
  pereira: 'Pereira',
  manizales: 'Manizales',
  ibague: 'Ibagué',
  villavicencio: 'Villavicencio',
  pasto: 'Pasto',
  armenia: 'Armenia',
  valledupar: 'Valledupar',
  monteria: 'Montería',
  sincelejo: 'Sincelejo',
  popayan: 'Popayán',
  tunja: 'Tunja',
  riohacha: 'Riohacha',
  florencia: 'Florencia',
  yopal: 'Yopal',
  quibdo: 'Quibdó',
  neiva: 'Neiva',
  soacha: 'Soacha',
  bello: 'Bello',
  palmira: 'Palmira',
  envigado: 'Envigado',
  itagui: 'Itagüí',
  floridablanca: 'Floridablanca',
  giron: 'Girón',
  piedecuesta: 'Piedecuesta',
  dosquebradas: 'Dosquebradas',
  soledad: 'Soledad',
  chia: 'Chía',
  zipaquira: 'Zipaquirá',
  rionegro: 'Rionegro',
  barrancabermeja: 'Barrancabermeja',
  duitama: 'Duitama',
  sogamoso: 'Sogamoso',
  girardot: 'Girardot',
  tulua: 'Tuluá',
  cartago: 'Cartago',
  ipiales: 'Ipiales',
  'los patios': 'Los Patios',
  'villa del rosario': 'Villa del Rosario',
};

/**
 * Normaliza cualquier texto de ciudad (en especial Santa Marta y Cúcuta)
 */
export function normalizarCiudad(ciudadRaw?: any): string {
  if (!ciudadRaw || typeof ciudadRaw !== 'string') return 'Bogotá';
  const raw = ciudadRaw.trim();
  if (!raw) return 'Bogotá';

  const limpio = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Buscar coincidencia en diccionario de ciudades colombianas
  for (const [clave, nombreOficial] of Object.entries(CIUDADES_COLOMBIANAS)) {
    if (limpio === clave || limpio.includes(clave)) {
      return nombreOficial;
    }
  }

  // Devolver con formato Capital Case si no está en la lista estándar
  return raw
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
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

  // 2. Mapeos directos comunes y variantes colombianas
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
    alimentos: 'Mercado',
    abarrotes: 'Mercado',

    // Gasolina
    gasolina: 'Gasolina',
    gas: 'Gasolina',
    combustible: 'Gasolina',
    estacion: 'Gasolina',
    acpm: 'Gasolina',
    tanqueada: 'Gasolina',
    tanque: 'Gasolina',

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
    helado: 'Snacks',

    // Caridad
    caridad: 'Caridad',
    donacion: 'Caridad',
    donaciones: 'Caridad',
    ong: 'Caridad',
    fundacion: 'Caridad',
    limosna: 'Caridad',
    ayuda: 'Caridad',

    // Cumpleaños
    cumpleanos: 'Cumpleaños',
    cumple: 'Cumpleaños',
    cumpleanios: 'Cumpleaños',
    regalos: 'Cumpleaños',
    regalo: 'Cumpleaños',
    torta: 'Cumpleaños',
    fiesta: 'Cumpleaños',

    // Crypto
    crypto: 'Crypto',
    cripto: 'Crypto',
    criptomoneda: 'Crypto',
    criptomonedas: 'Crypto',
    bitcoin: 'Crypto',
    btc: 'Crypto',
    binance: 'Crypto',
    usdt: 'Crypto',

    // Apuestas
    apuestas: 'Apuestas',
    apuesta: 'Apuestas',
    casino: 'Apuestas',
    loteria: 'Apuestas',
    chance: 'Apuestas',
    betplay: 'Apuestas',
    wplay: 'Apuestas',

    // Videojuegos
    videojuegos: 'Videojuegos',
    videojuego: 'Videojuegos',
    gaming: 'Videojuegos',
    games: 'Videojuegos',
    juegos: 'Videojuegos',
    playstation: 'Videojuegos',
    steam: 'Videojuegos',

    // Restaurantes
    restaurantes: 'Restaurantes',
    restaurante: 'Restaurantes',
    comida: 'Restaurantes',
    almuerzo: 'Restaurantes',
    almuerzos: 'Restaurantes',
    cena: 'Restaurantes',
    desayuno: 'Restaurantes',
    comidas: 'Restaurantes',

    // Transporte
    transporte: 'Transporte',
    taxi: 'Transporte',
    uber: 'Transporte',
    didi: 'Transporte',
    bus: 'Transporte',
    pasajes: 'Transporte',
    peaje: 'Transporte',
    peajes: 'Transporte',
    transmilenio: 'Transporte',

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
    gas_domiciliario: 'Servicios',
    internet: 'Servicios',
    energia: 'Servicios',
    telefonia: 'Servicios',

    // Salud
    salud: 'Salud',
    medico: 'Salud',
    medicina: 'Salud',
    farmacia: 'Salud',
    drogueria: 'Salud',
    eps: 'Salud',
    hospital: 'Salud',
    clinica: 'Salud',
    medicamentos: 'Salud',

    // Entretenimiento
    entretenimiento: 'Entretenimiento',
    ocio: 'Entretenimiento',
    cine: 'Entretenimiento',
    concierto: 'Entretenimiento',
    diversion: 'Entretenimiento',
    boletas: 'Entretenimiento',

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
    hospedaje: 'Viajes',

    // Taller
    taller: 'Taller',
    mecanico: 'Taller',
    repuestos: 'Taller',
    mantenimiento: 'Taller',
    auto: 'Taller',
    moto: 'Taller',
    llantas: 'Taller',

    // Educación
    educacion: 'Educación',
    colegio: 'Educación',
    universidad: 'Educación',
    cursos: 'Educación',
    curso: 'Educación',
    estudios: 'Educación',
    matricula: 'Educación',

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
    hardware: 'Tecnología',

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
    general: 'Otros',
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
        if (limpio === kwLimpio || limpio.includes(kwLimpio) || kwLimpio.includes(limpio)) {
          return catName;
        }
      }
    }
  }

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
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const partes = str.split('.');
    if (partes.length > 2) {
      str = str.replace(/\./g, '');
    } else if (partes[1] && partes[1].length === 3) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
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

  // Serial de Excel (e.g. 46299)
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
    const partes = str.split('T')[0].split(' ')[0].split('-');
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
    if (Number(mes) > 12 && Number(dia) <= 12) {
      const temp = dia;
      dia = mes;
      mes = temp;
    }
    return `${anio}-${mes}-${dia}`;
  }

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
 * Detecta qué columna corresponde a qué campo.
 * Mapea con precisión las 18 columnas de Google Sheets indicadas por el usuario:
 * ID | Fecha | Hora | Establecimiento | NIT | Ciudad | Categoría | Subcategoría | Método de pago | Subtotal | IVA | Descuento | Propina | Total | Observaciones | Imagen (Drive) | Fecha de registro | MesAño
 */
export function identificarColumnas(headers: string[]): Record<string, number> {
  const mapa: Record<string, number> = {};

  const nombresLimpios = headers.map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  nombresLimpios.forEach((h, idx) => {
    // 1. ID de la factura / registro
    if ((h === 'id' || h === '#' || h === 'nro' || h === 'codigo') && mapa.id === undefined) {
      mapa.id = idx;
    }
    // 2. Subcategoría (debe verificarse antes de categoría)
    else if (
      (h.includes('subcategoria') || h.includes('sub-cat') || h.includes('sub cat') || h.includes('sub_cat')) &&
      mapa.subcategoria === undefined
    ) {
      mapa.subcategoria = idx;
    }
    // 3. Categoría (estricto: no subcategoría)
    else if (
      (h.includes('categoria') || h.includes('category') || h.includes('rubro') || h.includes('clasificacion')) &&
      !h.includes('sub') &&
      mapa.categoria === undefined
    ) {
      mapa.categoria = idx;
    }
    // 4. Subtotal (estricto: antes de total)
    else if (
      (h.includes('subtotal') || h.includes('sub-total') || h.includes('sub_total')) &&
      mapa.subtotal === undefined
    ) {
      mapa.subtotal = idx;
    }
    // 5. IVA / Impuesto
    else if (
      (h === 'iva' || h.includes('impuesto') || h.includes('tax') || h.includes('iva 19')) &&
      mapa.iva === undefined
    ) {
      mapa.iva = idx;
    }
    // 6. Descuento
    else if (
      (h.includes('descuento') || h.includes('dcto') || h.includes('discount')) &&
      mapa.descuento === undefined
    ) {
      mapa.descuento = idx;
    }
    // 7. Propina
    else if (
      (h.includes('propina') || h.includes('tip')) &&
      mapa.propina === undefined
    ) {
      mapa.propina = idx;
    }
    // 8. Total final a pagar (estricto: NO subtotal)
    else if (
      !h.includes('subtotal') &&
      !h.includes('sub_total') &&
      (h === 'total' ||
        h === 'valor total' ||
        h === 'monto total' ||
        h === 'total factura' ||
        h === 'a pagar' ||
        h === 'importe total' ||
        h === 'costo total' ||
        h === 'monto' ||
        h === 'importe' ||
        (h.includes('total') && !h.includes('sub'))) &&
      mapa.total === undefined
    ) {
      mapa.total = idx;
    }
    // 9. Fecha de Registro / Creación (separado de Fecha del gasto)
    else if (
      (h.includes('registro') || h.includes('creacion') || h.includes('fecha de registro')) &&
      mapa.fecha_registro === undefined
    ) {
      mapa.fecha_registro = idx;
    }
    // 10. Fecha del gasto (excluyendo fecha de registro)
    else if (
      (h === 'fecha' ||
        h === 'date' ||
        h === 'dia' ||
        h === 'tiempo' ||
        h === 'f.' ||
        (h.includes('fecha') && !h.includes('registro') && !h.includes('creacion'))) &&
      mapa.fecha === undefined
    ) {
      mapa.fecha = idx;
    }
    // 11. Hora
    else if (
      (h === 'hora' || h === 'time' || h === 'hr' || h.startsWith('hora')) &&
      mapa.hora === undefined
    ) {
      mapa.hora = idx;
    }
    // 12. Establecimiento / Comercio / Lugar
    else if (
      (h.includes('establecimiento') ||
        h.includes('comercio') ||
        h.includes('lugar') ||
        h.includes('negocio') ||
        h.includes('tienda') ||
        h.includes('proveedor') ||
        h.includes('empresa') ||
        h.includes('razon') ||
        (h.includes('nombre') && !h.includes('archivo') && !h.includes('usuario'))) &&
      mapa.establecimiento === undefined
    ) {
      mapa.establecimiento = idx;
    }
    // 13. NIT / RUT / Cédula
    else if (
      (h === 'nit' || h === 'rut' || h === 'rfc' || h.includes('nit') || h.includes('cedula') || (h.includes('factura') && !h.includes('total'))) &&
      mapa.nit === undefined
    ) {
      mapa.nit = idx;
    }
    // 14. Ciudad / Municipio / Ubicación (ej: Santa Marta, Cúcuta)
    else if (
      (h.includes('ciudad') || h.includes('city') || h.includes('municipio') || h.includes('ubicacion')) &&
      mapa.ciudad === undefined
    ) {
      mapa.ciudad = idx;
    }
    // 15. Método de pago
    else if (
      (h.includes('metodo') || h.includes('medio') || h.includes('forma') || (h.includes('pago') && !h.includes('total'))) &&
      mapa.metodo_pago === undefined
    ) {
      mapa.metodo_pago = idx;
    }
    // 16. Imagen (Drive) / Comprobante
    else if (
      (h.includes('imagen') || h.includes('drive') || h.includes('foto') || h.includes('comprobante') || h.includes('recibo')) &&
      mapa.imagen_drive === undefined
    ) {
      mapa.imagen_drive = idx;
    }
    // 17. MesAño / Periodo
    else if (
      (h.includes('mes') || h.includes('periodo') || h.includes('mesano')) &&
      mapa.mes_ano === undefined
    ) {
      mapa.mes_ano = idx;
    }
    // 18. Observaciones / Notas
    else if (
      (h.includes('observacion') || h.includes('observaciones') || h.includes('nota') || h.includes('comentario') || h.includes('detalle')) &&
      mapa.observaciones === undefined
    ) {
      mapa.observaciones = idx;
    }
  });

  return mapa;
}

/**
 * Función principal para procesar cualquier texto o enlace de Google Sheets
 * Soporta de forma nativa la estructura oficial de 18 columnas:
 * ID | Fecha | Hora | Establecimiento | NIT | Ciudad | Categoría | Subcategoría | Método de pago | Subtotal | IVA | Descuento | Propina | Total | Observaciones | Imagen (Drive) | Fecha de registro | MesAño
 * Y también la variante de 14 columnas que inicia con A: Fecha, B: Hora, C: Establecimiento, D: NIT, etc.
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

  // 1. Detección Inteligente del Encabezado explorando las primeras 15 filas
  let filaInicio = 0;
  let mapaColumnas: Record<string, number> = {};
  let indiceEncabezadoEncontrado = -1;

  for (let r = 0; r < Math.min(filas.length, 15); r++) {
    const mapaPrueba = identificarColumnas(filas[r]);
    const clavesDetectadas = [
      mapaPrueba.establecimiento !== undefined,
      mapaPrueba.categoria !== undefined,
      mapaPrueba.total !== undefined,
      mapaPrueba.hora !== undefined,
      mapaPrueba.ciudad !== undefined,
      mapaPrueba.nit !== undefined,
      mapaPrueba.fecha !== undefined,
      mapaPrueba.subtotal !== undefined,
      mapaPrueba.metodo_pago !== undefined,
    ].filter(Boolean).length;

    if (clavesDetectadas >= 2) {
      mapaColumnas = mapaPrueba;
      indiceEncabezadoEncontrado = r;
      filaInicio = r + 1;
      break;
    }
  }

  // 2. Si no se encontró fila de encabezado explícita, aplicar inferencia inteligente por orden y contenido
  if (indiceEncabezadoEncontrado === -1) {
    const primeraFila = filas[0] || [];
    const numCols = primeraFila.length;

    // Verificar si la columna 0 es ID o Fecha
    const col0 = String(primeraFila[0] || '').trim();
    const col1 = String(primeraFila[1] || '').trim();

    const col1EsFecha = /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/.test(col1);
    const col0EsFecha = /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/.test(col0);

    // Formato 1: 18 columnas con ID en columna 0
    // ID | Fecha | Hora | Establecimiento | NIT | Ciudad | Categoría | Subcategoría | Método | Subtotal | IVA | Dcto | Propina | Total | Observaciones | Imagen | Registro | MesAño
    if (numCols >= 16 || col1EsFecha) {
      mapaColumnas = {
        id: 0,
        fecha: 1,
        hora: 2,
        establecimiento: 3,
        nit: 4,
        ciudad: 5,
        categoria: 6,
        subcategoria: 7,
        metodo_pago: 8,
        subtotal: 9,
        iva: 10,
        descuento: 11,
        propina: 12,
        total: 13,
        observaciones: 14,
        imagen_drive: 15,
        fecha_registro: 16,
        mes_ano: 17,
      };
      advertencias.push(
        'Se aplicó la estructura oficial de 18 columnas (ID, Fecha, Hora, Establecimiento, NIT, Ciudad, Categoría, Subcategoría, Método, Subtotal, IVA, Descuento, Propina, Total, Observaciones, Imagen, Fecha de registro, MesAño).'
      );
      filaInicio = 0;
    }
    // Formato 2: 14 columnas que inician con A: Fecha, B: Hora, C: Establecimiento, D: NIT, E: Ciudad, F: Categoría...
    else if (col0EsFecha || numCols >= 10) {
      mapaColumnas = {
        fecha: 0,
        hora: 1,
        establecimiento: 2,
        nit: 3,
        ciudad: 4,
        categoria: 5,
        subcategoria: 6,
        metodo_pago: 7,
        subtotal: 8,
        iva: 9,
        descuento: 10,
        propina: 11,
        total: 12,
        observaciones: 13,
      };
      advertencias.push(
        'Se aplicó la estructura directa de 14 columnas (A: Fecha, B: Hora, C: Establecimiento, D: NIT, E: Ciudad, F: Categoría, G: Subcategoría, H: Método, I: Subtotal, J: IVA, K: Descuento, L: Propina, M: Total, N: Observaciones).'
      );
      filaInicio = 0;
    } else {
      // Fallback básico
      mapaColumnas = {
        fecha: 0,
        hora: 1,
        establecimiento: 2,
        nit: 3,
        ciudad: 4,
        categoria: 5,
        metodo_pago: 6,
        total: numCols - 1,
      };
      filaInicio = 0;
    }
  }

  // Garantizar que 'total' esté asignado sin colisionar con NIT ni ID
  if (mapaColumnas.total === undefined) {
    if (mapaColumnas.id === 0 && mapaColumnas.fecha === 1) {
      mapaColumnas.total = 13;
    } else if (mapaColumnas.fecha === 0) {
      mapaColumnas.total = 12;
    } else {
      mapaColumnas.total = filas[filaInicio]?.length ? filas[filaInicio].length - 1 : 13;
    }
  }

  // Garantizar que establecimiento esté asignado correctamente
  if (mapaColumnas.establecimiento === undefined) {
    if (mapaColumnas.id === 0) {
      mapaColumnas.establecimiento = 3;
    } else if (mapaColumnas.fecha === 0) {
      mapaColumnas.establecimiento = 2;
    } else {
      mapaColumnas.establecimiento = 1;
    }
  }

  // Garantizar que ciudad esté asignada correctamente (Santa Marta / Cúcuta)
  if (mapaColumnas.ciudad === undefined) {
    if (mapaColumnas.id === 0) {
      mapaColumnas.ciudad = 5;
    } else if (mapaColumnas.fecha === 0) {
      mapaColumnas.ciudad = 4;
    }
  }

  const gastosParseados: Gasto[] = [];
  let totalMonto = 0;
  const hoyStr = new Date().toISOString().split('T')[0];

  for (let i = filaInicio; i < filas.length; i++) {
    const fila = filas[i];
    if (!fila || fila.length === 0 || fila.every((cell) => !cell || !cell.trim())) {
      continue;
    }

    // A. Filtrado silencioso de filas de resumen o subtotales acumulados
    const filaTextoUnido = fila.join(' ').toLowerCase();
    const esFilaResumen =
      filaTextoUnido.includes('total general') ||
      filaTextoUnido.includes('panel de control') ||
      filaTextoUnido.includes('resumen de gastos') ||
      filaTextoUnido.includes('totales:') ||
      filaTextoUnido.includes('promedio:') ||
      (fila[0] && ['total', 'totales', 'suma', 'subtotal general'].includes(fila[0].trim().toLowerCase()));

    if (esFilaResumen) {
      continue;
    }

    // B. Extraer Total de forma estricta (¡NUNCA tomar el NIT ni el ID como total!)
    let total = 0;
    if (mapaColumnas.total !== undefined && fila[mapaColumnas.total] !== undefined) {
      total = normalizarMonto(fila[mapaColumnas.total]);
    }

    // Si total dio 0 pero tenemos subtotal disponible: Total = Subtotal + IVA + Propina - Descuento
    if (total === 0 && mapaColumnas.subtotal !== undefined && fila[mapaColumnas.subtotal] !== undefined) {
      const subtotal = normalizarMonto(fila[mapaColumnas.subtotal]);
      const iva = mapaColumnas.iva !== undefined ? normalizarMonto(fila[mapaColumnas.iva]) : 0;
      const propina = mapaColumnas.propina !== undefined ? normalizarMonto(fila[mapaColumnas.propina]) : 0;
      const descuento = mapaColumnas.descuento !== undefined ? normalizarMonto(fila[mapaColumnas.descuento]) : 0;
      total = subtotal + iva + propina - descuento;
      if (total === 0 && subtotal > 0) {
        total = subtotal;
      }
    }

    // C. Extraer Categoría
    const categoriaRaw = mapaColumnas.categoria !== undefined ? fila[mapaColumnas.categoria] : '';
    const categoria = normalizarCategoria(categoriaRaw);

    // D. Extraer Establecimiento con validación para que no absorba ciudades ni fechas
    let establecimiento = mapaColumnas.establecimiento !== undefined ? fila[mapaColumnas.establecimiento] : '';
    establecimiento = String(establecimiento || '').trim();

    // Si el establecimiento vino vacío o es solo una fecha/hora/NIT
    if (
      !establecimiento ||
      /^\d{4}-\d{2}-\d{2}/.test(establecimiento) ||
      /^\d{1,2}:\d{2}/.test(establecimiento) ||
      /^\d{8,11}/.test(establecimiento)
    ) {
      if (total === 0) continue; // Fila sin datos válidos
      establecimiento = `Factura ${categoria}`;
    }

    // E. Extraer Fecha
    let fecha = hoyStr;
    if (mapaColumnas.fecha !== undefined && fila[mapaColumnas.fecha]) {
      fecha = normalizarFecha(fila[mapaColumnas.fecha]);
    } else {
      for (const celda of fila) {
        if (celda && /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/.test(String(celda).trim())) {
          const normal = normalizarFecha(celda);
          if (normal) {
            fecha = normal;
            break;
          }
        }
      }
    }

    // F. Extraer Hora
    let hora = mapaColumnas.hora !== undefined ? fila[mapaColumnas.hora] : '';
    if (!hora || !/^\d{1,2}:\d{2}/.test(String(hora).trim())) {
      hora = '12:00';
    } else {
      hora = String(hora).trim().slice(0, 5);
    }

    // G. Extraer NIT (ej: 860.005.224-6, 900.254.123-1)
    const nit = (mapaColumnas.nit !== undefined ? fila[mapaColumnas.nit] : '') || '';

    // H. Extraer Ciudad (Cúcuta, Santa Marta, Bogotá, etc.)
    let ciudadRaw = mapaColumnas.ciudad !== undefined ? fila[mapaColumnas.ciudad] : '';
    // Si la celda de ciudad está vacía, buscar si alguna celda contiene Santa Marta o Cúcuta
    if (!ciudadRaw) {
      for (const c of fila) {
        const valLimpio = String(c || '').toLowerCase();
        if (valLimpio.includes('santa marta') || valLimpio.includes('cucuta')) {
          ciudadRaw = c;
          break;
        }
      }
    }
    const ciudad = normalizarCiudad(ciudadRaw);

    // I. Extraer Método de Pago
    const metodoRaw = mapaColumnas.metodo_pago !== undefined ? fila[mapaColumnas.metodo_pago] : '';
    const metodo_pago = normalizarMetodoPago(metodoRaw);

    // J. Extraer Imagen Drive si viene disponible
    let foto_factura_uri: string | undefined = undefined;
    if (mapaColumnas.imagen_drive !== undefined && fila[mapaColumnas.imagen_drive]) {
      const link = String(fila[mapaColumnas.imagen_drive]).trim();
      if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('data:image')) {
        foto_factura_uri = link;
      }
    }

    // K. Construir Observaciones integrando Subcategoría, IVA, Propina y Periodo
    const partesObs: string[] = [];
    if (mapaColumnas.observaciones !== undefined && fila[mapaColumnas.observaciones]?.trim()) {
      partesObs.push(fila[mapaColumnas.observaciones].trim());
    }
    if (mapaColumnas.subcategoria !== undefined && fila[mapaColumnas.subcategoria]?.trim()) {
      const subcat = fila[mapaColumnas.subcategoria].trim();
      if (subcat && !partesObs.some((p) => p.toLowerCase().includes(subcat.toLowerCase()))) {
        partesObs.push(`Subcategoría: ${subcat}`);
      }
    }
    if (mapaColumnas.iva !== undefined && normalizarMonto(fila[mapaColumnas.iva]) > 0) {
      partesObs.push(`IVA: $${normalizarMonto(fila[mapaColumnas.iva])}`);
    }
    if (mapaColumnas.propina !== undefined && normalizarMonto(fila[mapaColumnas.propina]) > 0) {
      partesObs.push(`Propina: $${normalizarMonto(fila[mapaColumnas.propina])}`);
    }
    if (mapaColumnas.mes_ano !== undefined && fila[mapaColumnas.mes_ano]?.trim()) {
      const mesAno = fila[mapaColumnas.mes_ano].trim();
      if (mesAno && !partesObs.some((p) => p.toLowerCase().includes(mesAno.toLowerCase()))) {
        partesObs.push(`Periodo: ${mesAno}`);
      }
    }

    const observaciones = partesObs.join(' | ');

    // Preservar ID si vino en el archivo, o generar uno nuevo único
    const idEnFila = mapaColumnas.id !== undefined && fila[mapaColumnas.id]?.trim() ? fila[mapaColumnas.id].trim() : '';
    const id = idEnFila || `gsheet_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = `${fecha}T${hora}:00`;

    const gasto: Gasto = {
      id,
      establecimiento: String(establecimiento).trim(),
      fecha,
      hora,
      ciudad: String(ciudad).trim(),
      nit: nit ? String(nit).trim() : undefined,
      categoria,
      metodo_pago,
      total,
      observaciones: observaciones || undefined,
      foto_factura_uri,
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
      errores: ['No se pudieron extraer facturas válidas del archivo o enlace proporcionado.'],
      advertencias,
    };
  }

  return {
    exito: true,
    totalFilas: gastosParseados.length,
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
 * Soporta gid de pestaña específico (#gid=... o &gid=...)
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
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    const urlsToTry = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
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
 * Genera contenido CSV con la estructura oficial de 18 columnas solicitada por el usuario:
 * ID, Fecha, Hora, Establecimiento, NIT, Ciudad, Categoría, Subcategoría, Método de pago, Subtotal, IVA, Descuento, Propina, Total, Observaciones, Imagen (Drive), Fecha de registro, MesAño
 * Incluye datos reales para Cúcuta, Santa Marta y Bogotá.
 */
export function generarPlantillaGoogleSheets(): string {
  const encabezado =
    'ID,Fecha,Hora,Establecimiento,NIT,Ciudad,Categoría,Subcategoría,Método de pago,Subtotal,IVA,Descuento,Propina,Total,Observaciones,Imagen (Drive),Fecha de registro,MesAño';
  const ejemplos = [
    '1,2026-03-01,09:15,Ventura Plaza Cúcuta,900.254.123-1,Cúcuta,Mercado,Víveres,Tarjeta Débito,120000,19000,0,0,139000,Mercado quincenal familiar,,2026-03-01 10:00:00,Marzo 2026',
    '2,2026-03-02,13:30,Restaurante El Rodadero,860.519.894-3,Santa Marta,Restaurantes,Almuerzo,Tarjeta Crédito,75000,0,0,7500,82500,Almuerzo frente a la playa,,2026-03-02 14:15:00,Marzo 2026',
    '3,2026-03-03,07:45,Estación Terpel Los Patios Cúcuta,860.005.224-6,Cúcuta,Gasolina,Corriente,Efectivo,95000,0,0,0,95000,Combustible semana,,2026-03-03 08:00:00,Marzo 2026',
    '4,2026-03-04,16:20,Oxxo Santa Marta Centro,900.876.543-2,Santa Marta,Snacks,Bebidas,Transferencia,18500,0,0,0,18500,Café y refrigerio tarde,,2026-03-04 16:35:00,Marzo 2026',
    '5,2026-03-05,11:00,Droguerías Cruz Verde,800.123.456-7,Bogotá,Salud,Farmacia,Tarjeta Débito,48900,0,0,0,48900,Medicamentos y vitaminas,,2026-03-05 11:30:00,Marzo 2026',
  ];

  return [encabezado, ...ejemplos].join('\r\n');
}
