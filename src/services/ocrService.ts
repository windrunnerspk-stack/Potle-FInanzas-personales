import { CategoriaGasto, CATEGORIAS_CONFIG } from '../types/finance';

export interface ResultadoOCR {
  textoCompleto: string;
  establecimientoDetectado?: string;
  fechaDetectada?: string;
  horaDetectada?: string;
  nitDetectado?: string;
  totalDetectado?: number;
  categoriaSugerida: CategoriaGasto;
  confianza: number;
}

/**
 * Heurísticas y RegEx offline para parsear texto de facturas en local (simulando ML Kit / Tesseract)
 */
export function procesarTextoFactura(texto: string): ResultadoOCR {
  const lineas = texto.split('\n').map((l) => l.trim()).filter(Boolean);
  const textoLimpio = texto.toUpperCase();

  // 1. Detección de NIT / RUT / RFC
  // Ejemplos: "NIT: 860.005.224-6", "NIT 890900608-9", "RUT: 12345678-9", "RFC: ABC123456"
  let nitDetectado: string | undefined;
  const nitRegex = /(?:NIT|RUT|RFC)[:\s.-]*([0-9]{3}[\.\s]?[0-9]{3}[\.\s]?[0-9]{3}[-\s]?[0-9Kk]?|[0-9]{8,11}[-\s]?[0-9Kk]?)/i;
  const matchNit = texto.match(nitRegex);
  if (matchNit && matchNit[1]) {
    nitDetectado = matchNit[1].replace(/\s+/g, '');
  }

  // 2. Detección de TOTAL / VALOR TOTAL / A PAGAR
  let totalDetectado: number | undefined;
  const totalPatrones = [
    /(?:TOTAL|VALOR\s*TOTAL|TOTAL\s*A\s*PAGAR|TOTAL\s*PAGO|A\s*PAGAR|IMPORTE\s*TOTAL)[\s:$]*([\d\.,]{3,})/i,
    /\$\s*([\d\.,]{3,})/g,
  ];

  const matchTotal = texto.match(totalPatrones[0]);
  if (matchTotal && matchTotal[1]) {
    const rawNum = matchTotal[1].replace(/[^0-9,\.]/g, '');
    // Manejo de separadores miles vs decimales en español/latino
    const cleaned = limpiarMonto(rawNum);
    if (!isNaN(cleaned) && cleaned > 0) {
      totalDetectado = cleaned;
    }
  }

  // Fallback si no hubo coincidencia en el total explícito
  if (!totalDetectado) {
    const todosLosMontos: number[] = [];
    const generalMoneyRegex = /\$\s*([0-9\.,]{3,})/g;
    let m;
    while ((m = generalMoneyRegex.exec(texto)) !== null) {
      const val = limpiarMonto(m[1]);
      if (!isNaN(val) && val > 0) {
        todosLosMontos.push(val);
      }
    }
    if (todosLosMontos.length > 0) {
      // Usualmente el total es el monto más alto en la factura
      totalDetectado = Math.max(...todosLosMontos);
    }
  }

  // 3. Detección de Fechas (DD/MM/AAAA o YYYY-MM-DD o DD-MM-YYYY)
  let fechaDetectada: string | undefined;
  const fechaRegex = /(?:FECHA[:\s]*)?([0-3]?[0-9])[\/\-.]([0-1]?[0-9])[\/\-.](202[0-9]|20[0-9]{2})/i;
  const matchFecha = texto.match(fechaRegex);
  if (matchFecha) {
    const dia = matchFecha[1].padStart(2, '0');
    const mes = matchFecha[2].padStart(2, '0');
    const anio = matchFecha[3];
    fechaDetectada = `${anio}-${mes}-${dia}`;
  } else {
    // Formato ISO YYYY-MM-DD
    const isoRegex = /(202[0-9])-([0-1][0-9])-([0-3][0-9])/;
    const matchIso = texto.match(isoRegex);
    if (matchIso) {
      fechaDetectada = `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
    }
  }

  // 4. Detección de Hora (HH:mm)
  let horaDetectada: string | undefined;
  const horaRegex = /(?:HORA[:\s]*)?([0-2]?[0-9]):([0-5][0-9])(?::([0-5][0-9]))?/i;
  const matchHora = texto.match(horaRegex);
  if (matchHora) {
    const hh = matchHora[1].padStart(2, '0');
    const mm = matchHora[2];
    horaDetectada = `${hh}:${mm}`;
  }

  // 5. Establecimiento y Categoría Sugerida
  let establecimientoDetectado: string | undefined;
  let categoriaSugerida: CategoriaGasto = 'Otros';
  let confianza = 0.5;

  // Revisar primeras 4 líneas (donde casi siempre está el nombre del comercio)
  if (lineas.length > 0) {
    for (let i = 0; i < Math.min(lineas.length, 4); i++) {
      const linea = lineas[i];
      if (
        !linea.includes('NIT') &&
        !linea.includes('FACTURA') &&
        !linea.includes('REGIMEN') &&
        !linea.includes('TEL') &&
        linea.length >= 3 &&
        linea.length <= 40
      ) {
        establecimientoDetectado = linea;
        break;
      }
    }
  }

  // Clasificación por palabras clave en las categorías
  for (const [catName, config] of Object.entries(CATEGORIAS_CONFIG)) {
    const encontrada = config.keywords.some((kw) => textoLimpio.includes(kw.toUpperCase()));
    if (encontrada) {
      categoriaSugerida = catName as CategoriaGasto;
      confianza = 0.95;
      break;
    }
  }

  return {
    textoCompleto: texto,
    establecimientoDetectado: establecimientoDetectado || 'Comercio Local',
    fechaDetectada: fechaDetectada || new Date().toISOString().split('T')[0],
    horaDetectada: horaDetectada || new Date().toTimeString().slice(0, 5),
    nitDetectado: nitDetectado || '',
    totalDetectado: totalDetectado || 45000,
    categoriaSugerida,
    confianza,
  };
}

function limpiarMonto(raw: string): number {
  let s = raw.trim();
  // Caso formato latino: 145.000 o 145.000,00
  if (s.includes('.') && s.includes(',')) {
    // Si la coma está al final con 2 dígitos, es decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes('.')) {
    // Si tiene puntos y 3 dígitos al final (ej 145.000), son miles
    const partes = s.split('.');
    if (partes[partes.length - 1].length === 3) {
      s = s.replace(/\./g, '');
    }
  } else if (s.includes(',')) {
    // Coma como separador de miles o decimal
    const partes = s.split(',');
    if (partes[partes.length - 1].length === 3) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(/,/g, '.');
    }
  }
  return parseFloat(s);
}
