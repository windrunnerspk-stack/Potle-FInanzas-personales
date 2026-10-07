export type CategoriaGasto = string;

export type MetodoPago =
  | 'Efectivo'
  | 'Tarjeta Débito'
  | 'Tarjeta Crédito'
  | 'Transferencia'
  | 'Cripto'
  | 'Otro';

export type ModoOperacion = 'local' | 'sincronizado';

export interface Gasto {
  id: string; // UUID v4 o identificador único
  establecimiento: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  ciudad: string;
  nit: string;
  categoria: CategoriaGasto;
  metodo_pago: MetodoPago;
  total: number;
  observaciones?: string;
  foto_factura_uri?: string;
  sincronizado: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface UsuarioConfig {
  email: string;
  modo: ModoOperacion;
  moneda: string; // COP, USD, EUR, MXN
  onboarding_completado: boolean;
  notificaciones_email: boolean;
  google_sheets_id?: string;
  ultima_sincronizacion?: string;
}

export interface SyncQueueItem {
  id: string;
  gasto_id: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string;
  intentos: number;
  creado_en: string;
  error?: string;
}

export interface CategoriaConfigItem {
  nombre: string;
  icon: string;
  color: string;
  bg?: string;
  keywords?: string[];
  esPersonalizada?: boolean;
}

// Las 23 categorías oficiales solicitadas por el usuario:
export const LISTA_CATEGORIAS_DEFAULT: string[] = [
  'Mercado',
  'Gasolina',
  'Snacks',
  'Caridad',
  'Cumpleaños',
  'Crypto',
  'Apuestas',
  'Videojuegos',
  'Restaurantes',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Entretenimiento',
  'Compras',
  'Viajes',
  'Taller',
  'Educación',
  'Suscripciones',
  'Tecnología',
  'Ropa',
  'Multas',
  'Otros',
];

export const CATEGORIAS_CONFIG_DEFAULT: Record<
  string,
  { icon: string; color: string; bg: string; keywords: string[] }
> = {
  Mercado: {
    icon: 'ShoppingCart',
    color: '#059669',
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    keywords: ['exito', 'jumbo', 'olimpica', 'd1', 'ara', 'carulla', 'supermercado', 'mercado', 'mercados', 'viveres', 'fruver', 'plaza'],
  },
  Gasolina: {
    icon: 'Fuel',
    color: '#0d9488',
    bg: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    keywords: ['terpel', 'primax', 'texaco', 'esso', 'mobil', 'gasolina', 'combustible', 'estacion', 'tanquear'],
  },
  Snacks: {
    icon: 'Coffee',
    color: '#d97706',
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    keywords: ['oxxo', 'tostao', 'panaderia', 'snack', 'snacks', 'helado', 'dulces', 'cafe', 'onces', 'mecato'],
  },
  Caridad: {
    icon: 'HeartHandshake',
    color: '#ec4899',
    bg: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    keywords: ['donacion', 'fundacion', 'caridad', 'ong', 'ayuda'],
  },
  Cumpleaños: {
    icon: 'Cake',
    color: '#f43f5e',
    bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    keywords: ['regalo', 'fiesta', 'cumple', 'cumpleaños', 'cumpleanos', 'torta'],
  },
  Crypto: {
    icon: 'Coins',
    color: '#f59e0b',
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    keywords: ['binance', 'crypto', 'cripto', 'btc', 'eth', 'usdt', 'bitcoin', 'metamask'],
  },
  Apuestas: {
    icon: 'Dices',
    color: '#e11d48',
    bg: 'bg-red-500/10 text-red-600 border-red-500/20',
    keywords: ['betplay', 'wplay', 'casino', 'loteria', 'apuesta', 'apuestas', 'ruleta'],
  },
  Videojuegos: {
    icon: 'Gamepad2',
    color: '#8b5cf6',
    bg: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'game', 'videojuegos', 'videojuego'],
  },
  Restaurantes: {
    icon: 'Utensils',
    color: '#ea580c',
    bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    keywords: ['restaurante', 'restaurantes', 'crepes', 'mcdonalds', 'kfc', 'cafe', 'starbucks', 'almuerzo', 'comida', 'burger', 'pizza', 'cena'],
  },
  Transporte: {
    icon: 'Car',
    color: '#0284c7',
    bg: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    keywords: ['uber', 'didi', 'cabify', 'taxi', 'transmilenio', 'metro', 'peaje', 'bus', 'pasajes'],
  },
  Vivienda: {
    icon: 'Home',
    color: '#2563eb',
    bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    keywords: ['arriendo', 'alquiler', 'administracion', 'hipoteca', 'condominio', 'vivienda'],
  },
  Servicios: {
    icon: 'Zap',
    color: '#ca8a04',
    bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    keywords: ['luz', 'agua', 'gas', 'internet', 'claro', 'tigo', 'movistar', 'enel', 'servicios', 'energia'],
  },
  Salud: {
    icon: 'Activity',
    color: '#10b981',
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    keywords: ['farmacia', 'drogueria', 'cruz verde', 'medico', 'clinica', 'odontologia', 'eps', 'salud', 'remedios'],
  },
  Entretenimiento: {
    icon: 'Film',
    color: '#9333ea',
    bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    keywords: ['cine', 'cinepolis', 'cinemark', 'teatro', 'concierto', 'parque', 'entretenimiento', 'boletas'],
  },
  Compras: {
    icon: 'ShoppingBag',
    color: '#4f46e5',
    bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    keywords: ['tienda', 'falabella', 'amazon', 'mercado libre', 'compras', 'compra', 'shopping'],
  },
  Viajes: {
    icon: 'Plane',
    color: '#14b8a6',
    bg: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    keywords: ['avianca', 'latam', 'hotel', 'airbnb', 'vuelo', 'aeropuerto', 'booking', 'viajes', 'viaje'],
  },
  Taller: {
    icon: 'Wrench',
    color: '#64748b',
    bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    keywords: ['mecanico', 'repuestos', 'taller', 'llantas', 'mantenimiento', 'aceite'],
  },
  Educación: {
    icon: 'GraduationCap',
    color: '#1d4ed8',
    bg: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    keywords: ['universidad', 'colegio', 'curso', 'udemy', 'platzi', 'matricula', 'libros', 'educacion', 'educación'],
  },
  Suscripciones: {
    icon: 'CreditCard',
    color: '#db2777',
    bg: 'bg-pink-600/10 text-pink-600 border-pink-600/20',
    keywords: ['netflix', 'spotify', 'youtube', 'icloud', 'disney', 'chatgpt', 'prime', 'suscripciones', 'suscripcion'],
  },
  Tecnología: {
    icon: 'Laptop',
    color: '#0ea5e9',
    bg: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    keywords: ['apple', 'samsung', 'computador', 'celular', 'auriculares', 'gadget', 'tecnologia', 'tecnología'],
  },
  Ropa: {
    icon: 'Shirt',
    color: '#c026d3',
    bg: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20',
    keywords: ['zara', 'h&m', 'bershka', 'ropa', 'zapatos', 'nike', 'adidas', 'moda'],
  },
  Multas: {
    icon: 'AlertTriangle',
    color: '#dc2626',
    bg: 'bg-red-600/10 text-red-600 border-red-600/20',
    keywords: ['comparendo', 'transito', 'multa', 'multas', 'infraccion'],
  },
  Otros: {
    icon: 'MoreHorizontal',
    color: '#71717a',
    bg: 'bg-zinc-600/10 text-zinc-600 border-zinc-600/20',
    keywords: ['varios', 'otros', 'gasto', 'general'],
  },

  // Alias para retrocompatibilidad
  Mercados: {
    icon: 'ShoppingCart',
    color: '#059669',
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    keywords: ['mercado'],
  },
  Restaurante: {
    icon: 'Utensils',
    color: '#ea580c',
    bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    keywords: ['restaurante'],
  },
  Snack: {
    icon: 'Coffee',
    color: '#d97706',
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    keywords: ['snack'],
  },
  Cripto: {
    icon: 'Coins',
    color: '#f59e0b',
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    keywords: ['cripto'],
  },
};

export const CATEGORIAS_CONFIG = CATEGORIAS_CONFIG_DEFAULT;
export const LISTA_CATEGORIAS = LISTA_CATEGORIAS_DEFAULT;

export const LISTA_METODOS_PAGO: MetodoPago[] = [
  'Efectivo',
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Transferencia',
  'Cripto',
  'Otro',
];
