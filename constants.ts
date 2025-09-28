
import { TableStatus } from './types';

export const STATUS_COLORS: Record<TableStatus, { bg: string; text: string; ring: string }> = {
  [TableStatus.Libre]: { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    ring: 'ring-green-400'
  },
  [TableStatus.Ocupada]: { 
    bg: 'bg-red-100', 
    text: 'text-red-800',
    ring: 'ring-red-400'
  },
  [TableStatus.Reservada]: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800',
    ring: 'ring-blue-400'
  },
  [TableStatus.Limpiando]: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800',
    ring: 'ring-yellow-400'
  },
};
