// ============================================================
// MODELS - Tipos de datos centrales del sistema
// ============================================================

export type EstadoItem = 'pendiente' | 'completo' | 'parcial' | 'cero';
export type UnidadAlistamiento = 'cajas' | 'unidades';
export type UserRole = 'supervisor' | 'alistador' | null;
export type FilterType = 'todos' | 'pendientes' | 'completos' | 'parciales' | 'cero';

export interface BarcodeResult {
  success: boolean;
  text: string;
  item?: Item;
  message: string;
}

export interface Session {
  id: string;
  nombre: string;
  estado: 'activo' | 'cerrado';
  creado_en: string;
}

export interface Item {
  id: string;
  sesion_id: string;
  ciudad: string;
  referencia: string;
  descripcion: string | null;
  um: string | null;
  cantidad_solicitada: number;
  factor_empaque: number;
  um_empaque: string | null;
  unidad_alistamiento: UnidadAlistamiento;
  cantidad_alistada: number | null;
  estado: EstadoItem;
  motivo: string | null;
  alistador: string | null;
  num_pedidos: number;
  actualizado_en?: string;
}

export interface Stats {
  total: number;
  complete: number;
  partial: number;
  zero: number;
  pending: number;
  percentComplete: number;
}

export interface CityStats {
  ciudad: string;
  total: number;
  complete: number;
  partial: number;
  zero: number;
  pending: number;
  percentComplete: number;
}

export interface ConsolidatedExcelItem {
  ciudad: string;
  referencia: string;
  descripcion: string;
  um: string;
  factor: number;
  cantidad: number;
  numPedidos: number;
  factorEmpaque: number;
  umEmpaque: string;
  unidadAlistamiento: UnidadAlistamiento;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

export type Screen =
  | 'welcome'
  | 'superHome'
  | 'alistadorJoin'
  | 'superDash'
  | 'cities'
  | 'picking'
  | 'summary';
