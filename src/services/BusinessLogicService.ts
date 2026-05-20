import type {
  Item,
  Stats,
  CityStats,
  Session,
  EstadoItem,
  FilterType,
} from '../models/types';

/**
 * BusinessLogicService
 * Responsabilidad: Todas las reglas de negocio de alistamiento
 * NO depende de React - funciones puras testeables
 */
export class BusinessLogicService {
  /**
   * Calcular unidades esperadas según tipo de empaque
   */
  static calculateExpectedUnits(item: Item): number {
    const isCajas = item.unidad_alistamiento === 'cajas';
    const factor = item.factor_empaque || 1;
    return isCajas ? item.cantidad_solicitada * factor : item.cantidad_solicitada;
  }

  /**
   * Determinar estado del ítem según cantidad alistada
   */
  static calculateItemState(item: Item): EstadoItem {
    if (item.cantidad_alistada === null || item.cantidad_alistada === undefined) {
      return 'pendiente';
    }
    if (item.cantidad_alistada === 0) return 'cero';

    const expected = this.calculateExpectedUnits(item);
    if (item.cantidad_alistada >= expected) return 'completo';
    return 'parcial';
  }

  /**
   * Calcular estadísticas generales
   */
  static calculateStats(items: Item[]): Stats {
    const stats: Stats = {
      total: items.length,
      complete: 0,
      partial: 0,
      zero: 0,
      pending: 0,
      percentComplete: 0,
    };

    items.forEach((i) => {
      if (i.estado === 'completo') stats.complete++;
      else if (i.estado === 'parcial') stats.partial++;
      else if (i.estado === 'cero') stats.zero++;
      else stats.pending++;
    });

    const done = stats.complete + stats.partial + stats.zero;
    stats.percentComplete = items.length
      ? Math.round((done / items.length) * 100)
      : 0;

    return stats;
  }

  /**
   * Calcular estadísticas por ciudad
   */
  static calculateCityStats(items: Item[]): CityStats[] {
    const map = new Map<string, CityStats>();

    items.forEach((i) => {
      if (!map.has(i.ciudad)) {
        map.set(i.ciudad, {
          ciudad: i.ciudad,
          total: 0,
          complete: 0,
          partial: 0,
          zero: 0,
          pending: 0,
          percentComplete: 0,
        });
      }
      const c = map.get(i.ciudad)!;
      c.total++;
      if (i.estado === 'completo') c.complete++;
      else if (i.estado === 'parcial') c.partial++;
      else if (i.estado === 'cero') c.zero++;
      else c.pending++;
    });

    const result = Array.from(map.values());
    result.forEach((c) => {
      const done = c.complete + c.partial + c.zero;
      c.percentComplete = c.total ? Math.round((done / c.total) * 100) : 0;
    });

    return result.sort((a, b) => a.ciudad.localeCompare(b.ciudad));
  }

  /**
   * Filtrar ítems según criterio
   */
  static filterItems(
    items: Item[],
    filter: FilterType,
    searchTerm: string = ''
  ): Item[] {
    let filtered = items;

    if (filter === 'pendientes') {
      filtered = filtered.filter((i) => i.estado === 'pendiente');
    } else if (filter === 'completos') {
      filtered = filtered.filter((i) => i.estado === 'completo');
    } else if (filter === 'parciales') {
      filtered = filtered.filter((i) => i.estado === 'parcial');
    } else if (filter === 'cero') {
      filtered = filtered.filter((i) => i.estado === 'cero');
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.referencia.toLowerCase().includes(term) ||
          (i.descripcion || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  /**
   * Construir texto de resumen para compartir
   */
  static buildSummaryText(items: Item[], session: Session): string {
    const stats = this.calculateStats(items);
    let text = `📦 *Alistamiento: ${session.nombre}*\n`;
    text += `🔖 Código: ${session.id}\n`;
    text += `📅 ${new Date().toLocaleString('es-CO')}\n\n`;
    text += `*Resumen:*\n`;
    text += `✅ Completas: ${stats.complete}\n`;
    text += `⚠️ Parciales: ${stats.partial}\n`;
    text += `❌ Sin alistar: ${stats.zero}\n`;
    if (stats.pending) text += `⏳ Pendientes: ${stats.pending}\n`;
    text += `📊 Total: ${items.length} refs\n`;

    const issues = items.filter(
      (i) => i.estado === 'parcial' || i.estado === 'cero'
    );

    if (issues.length) {
      text += `\n*⚠️ Novedades:*\n`;
      const byCity: Record<string, Item[]> = {};
      for (const i of issues) {
        (byCity[i.ciudad] = byCity[i.ciudad] || []).push(i);
      }
      for (const c of Object.keys(byCity).sort()) {
        text += `\n📍 *${c}*\n`;
        for (const i of byCity[c]) {
          const expected = this.calculateExpectedUnits(i);
          const diff = expected - (i.cantidad_alistada || 0);
          text += `• ${i.referencia} - ${(i.descripcion || '').substring(0, 40)}\n`;
          text += `   Pidió: ${expected} u. → Alistó: ${i.cantidad_alistada} u. (faltan ${diff}, ${i.motivo})\n`;
        }
      }
    }

    return text;
  }

  /**
   * Genera un código único de sesión
   */
  static generateSessionCode(): string {
    const d = new Date();
    const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `S${ymd}-${rand}`;
  }

  /**
   * Formatea fecha ISO a es-CO
   */
  static formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
