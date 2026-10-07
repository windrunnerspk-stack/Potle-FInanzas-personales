import React from 'react';
import {
  HeartHandshake,
  Cake,
  Coins,
  Dices,
  Gamepad2,
  Utensils,
  Car,
  Home,
  Zap,
  Activity,
  Film,
  ShoppingBag,
  Plane,
  Wrench,
  GraduationCap,
  CreditCard,
  Laptop,
  Shirt,
  AlertTriangle,
  Coffee,
  Fuel,
  ShoppingCart,
  MoreHorizontal,
  Tag
} from 'lucide-react';
import { CATEGORIAS_CONFIG } from '../types/finance';

interface CategoryIconProps {
  categoria: string;
  size?: number;
  className?: string;
  showBadge?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoria,
  size = 18,
  className = '',
  showBadge = false,
}) => {
  const config = CATEGORIAS_CONFIG[categoria] || {
    icon: 'Tag',
    color: '#a1a1aa',
    bg: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60',
    keywords: []
  };

  const renderIcon = () => {
    switch (categoria) {
      case 'Caridad': return <HeartHandshake size={size} />;
      case 'Cumpleaños': return <Cake size={size} />;
      case 'Cripto': return <Coins size={size} />;
      case 'Apuestas': return <Dices size={size} />;
      case 'Videojuegos': return <Gamepad2 size={size} />;
      case 'Restaurante': return <Utensils size={size} />;
      case 'Transporte': return <Car size={size} />;
      case 'Vivienda': return <Home size={size} />;
      case 'Servicios': return <Zap size={size} />;
      case 'Salud': return <Activity size={size} />;
      case 'Entretenimiento': return <Film size={size} />;
      case 'Compras': return <ShoppingBag size={size} />;
      case 'Viajes': return <Plane size={size} />;
      case 'Taller': return <Wrench size={size} />;
      case 'Educación': return <GraduationCap size={size} />;
      case 'Suscripciones': return <CreditCard size={size} />;
      case 'Tecnología': return <Laptop size={size} />;
      case 'Ropa': return <Shirt size={size} />;
      case 'Multas': return <AlertTriangle size={size} />;
      case 'Snack': return <Coffee size={size} />;
      case 'Gasolina': return <Fuel size={size} />;
      case 'Mercados': return <ShoppingCart size={size} />;
      case 'Otros': return <MoreHorizontal size={size} />;
      default:
        return <Tag size={size} />;
    }
  };

  if (showBadge) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-transform ${config.bg} ${className}`}
        style={{ color: config.color }}
      >
        {renderIcon()}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ color: config.color }}>
      {renderIcon()}
    </span>
  );
};
