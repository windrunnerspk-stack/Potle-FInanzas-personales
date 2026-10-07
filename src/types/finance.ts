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
  id: string; // UUID v4
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
  moneda: string; // e.g. COP, USD, EUR, MXN
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

export const CATEGORIAS_CONFIG_DEFAULT: Record<
  string,
  { icon: string; color: string; bg: string; keywords: string[] }
> = {
  Caridad: { icon: 'HeartHandshake', color: '#ec4899', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20', keywords: ['donacion', 'fundacion', 'caridad', 'ong'] },
  Cumpleaños: { icon: 'Cake', color: '#f43f5e', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20', keywords: ['regalo', 'fiesta', 'cumple', 'torta'] },
  Cripto: { icon: 'Coins', color: '#d97706', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20', keywords: ['binance', 'crypto', 'btc', 'eth', 'usdt'] },
  Apuestas: { icon: 'Dices', color: '#e11d48', bg: 'bg-red-500/10 text-red-300 border-red-500/20', keywords: ['betplay', 'wplay', 'casino', 'loteria', 'apuesta'] },
  Videojuegos: { icon: 'Gamepad2', color: '#8b5cf6', bg: 'bg-violet-500/10 text-violet-300 border-violet-500/20', keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'game'] },
  Restaurante: { icon: 'Utensils', color: '#ea580c', bg: 'bg-orange-500/10 text-orange-300 border-orange-500/20', keywords: ['restaurante', 'crepes', 'mcdonalds', 'kfc', 'cafe', 'starbucks', 'almuerzo', 'comida', 'burger', 'pizza'] },
  Transporte: { icon: 'Car', color: '#0284c7', bg: 'bg-sky-500/10 text-sky-300 border-sky-500/20', keywords: ['uber', 'didi', 'cabify', 'taxi', 'transmilenio', 'metro', 'peaje'] },
  Vivienda: { icon: 'Home', color: '#2563eb', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20', keywords: ['arriendo', 'alquiler', 'administracion', 'hipoteca', 'condominio'] },
  Servicios: { icon: 'Zap', color: '#ca8a04', bg: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20', keywords: ['luz', 'agua', 'gas', 'internet', 'claro', 'tigo', 'movistar', 'enel'] },
  Salud: { icon: 'Activity', color: '#059669', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', keywords: ['farmacia', 'drogueria', 'cruz verde', 'medico', 'clinica', 'odontologia', 'eps'] },
  Entretenimiento: { icon: 'Film', color: '#9333ea', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20', keywords: ['cine', 'cinepolis', 'cinemark', 'teatro', 'concierto', 'parque'] },
  Compras: { icon: 'ShoppingBag', color: '#4f46e5', bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20', keywords: ['tienda', 'falabella', 'amazon', 'mercado libre', 'compras'] },
  Viajes: { icon: 'Plane', color: '#0d9488', bg: 'bg-teal-500/10 text-teal-300 border-teal-500/20', keywords: ['avianca', 'latam', 'hotel', 'airbnb', 'vuelo', 'aeropuerto', 'booking'] },
  Taller: { icon: 'Wrench', color: '#64748b', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20', keywords: ['mecanico', 'repuestos', 'taller', 'llantas', 'mantenimiento', 'aceite'] },
  Educación: { icon: 'GraduationCap', color: '#1d4ed8', bg: 'bg-blue-600/10 text-blue-300 border-blue-600/20', keywords: ['universidad', 'colegio', 'curso', 'udemy', 'platzi', 'matricula', 'libros'] },
  Suscripciones: { icon: 'CreditCard', color: '#db2777', bg: 'bg-pink-600/10 text-pink-300 border-pink-600/20', keywords: ['netflix', 'spotify', 'youtube', 'icloud', 'disney', 'chatgpt', 'prime'] },
  Tecnología: { icon: 'Laptop', color: '#0284c7', bg: 'bg-sky-500/10 text-sky-300 border-sky-500/20', keywords: ['apple', 'samsung', 'computador', 'celular', 'auriculares', 'gadget'] },
  Ropa: { icon: 'Shirt', color: '#c026d3', bg: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20', keywords: ['zara', 'h&m', 'bershka', 'ropa', 'zapatos', 'nike', 'adidas'] },
  Multas: { icon: 'AlertTriangle', color: '#dc2626', bg: 'bg-red-600/10 text-red-300 border-red-600/20', keywords: ['comparendo', 'transito', 'multa', 'infraccion'] },
  Snack: { icon: 'Coffee', color: '#b45309', bg: 'bg-amber-600/10 text-amber-300 border-amber-600/20', keywords: ['oxxo', 'tostao', 'panaderia', 'snack', 'helado', 'dulces'] },
  Gasolina: { icon: 'Fuel', color: '#15803d', bg: 'bg-emerald-600/10 text-emerald-300 border-emerald-600/20', keywords: ['terpel', 'primax', 'texaco', 'esso', 'mobil', 'gasolina', 'combustible', 'estacion'] },
  Mercados: { icon: 'ShoppingCart', color: '#047857', bg: 'bg-emerald-600/10 text-emerald-300 border-emerald-600/20', keywords: ['exito', 'jumbo', 'olimpica', 'd1', 'ara', 'carulla', 'supermercado', 'mercado'] },
  Otros: { icon: 'MoreHorizontal', color: '#71717a', bg: 'bg-zinc-600/10 text-zinc-300 border-zinc-600/20', keywords: ['varios', 'otros', 'gasto'] },
};

export const CATEGORIAS_CONFIG = CATEGORIAS_CONFIG_DEFAULT;

export const LISTA_CATEGORIAS_DEFAULT: string[] = [
  'Gasolina', 'Mercados', 'Restaurante', 'Vivienda', 'Servicios', 'Salud',
  'Transporte', 'Compras', 'Educación', 'Suscripciones', 'Tecnología', 'Viajes',
  'Entretenimiento', 'Ropa', 'Snack', 'Taller', 'Cripto', 'Videojuegos',
  'Cumpleaños', 'Caridad', 'Multas', 'Apuestas', 'Otros'
];

export const LISTA_CATEGORIAS = LISTA_CATEGORIAS_DEFAULT;

export const LISTA_METODOS_PAGO: MetodoPago[] = [
  'Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia', 'Cripto', 'Otro'
];
