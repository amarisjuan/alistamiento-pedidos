import { supabase } from '../lib/supabase';
import type {
  Session,
  Item,
  ConsolidatedExcelItem,
} from '../models/types';

/**
 * SupabaseService
 * Responsabilidad: Todas las operaciones con Supabase (DB)
 * NO depende de React
 */
export class SupabaseService {
  /**
   * Verifica conexión con Supabase
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sesiones')
        .select('id')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene todas las sesiones activas
   */
  static async getActiveSessions(): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sesiones')
      .select('*')
      .eq('estado', 'activo')
      .order('creado_en', { ascending: false });

    if (error) throw new Error(`Error al cargar sesiones: ${error.message}`);
    return data || [];
  }

  /**
   * Obtiene una sesión específica por ID
   */
  static async getSessionById(id: string): Promise<Session> {
    const { data, error } = await supabase
      .from('sesiones')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new Error('Sesión no encontrada');
    return data;
  }

  /**
   * Crea una nueva sesión en la nube
   */
  static async createSession(
    sessionId: string,
    sessionName: string,
    consolidatedItems: ConsolidatedExcelItem[]
  ): Promise<void> {
    // 1. Crear sesión
    const { error: e1 } = await supabase.from('sesiones').insert({
      id: sessionId,
      nombre: sessionName,
      estado: 'activo',
    });
    if (e1) throw new Error(`Error creando sesión: ${e1.message}`);

    // 2. Preparar items
    const itemsToInsert = consolidatedItems.map((c, i) => {
      const cantidadFinal =
        c.unidadAlistamiento === 'cajas'
          ? Math.round(c.cantidad / c.factorEmpaque)
          : c.cantidad;

      return {
        id: `${sessionId}-${String(i).padStart(4, '0')}`,
        sesion_id: sessionId,
        ciudad: c.ciudad,
        referencia: c.referencia,
        descripcion: c.descripcion,
        um: c.um,
        cantidad_solicitada: cantidadFinal,
        factor_empaque: c.factorEmpaque,
        um_empaque: c.umEmpaque,
        unidad_alistamiento: c.unidadAlistamiento,
        num_pedidos: c.numPedidos,
        estado: 'pendiente' as const,
      };
    });

    // 3. Insertar items en chunks de 100
    const CHUNK_SIZE = 100;
    for (let i = 0; i < itemsToInsert.length; i += CHUNK_SIZE) {
      const chunk = itemsToInsert.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('items').insert(chunk);
      if (error) throw new Error(`Error subiendo items: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los items de una sesión
   */
  static async getItemsBySession(sessionId: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('sesion_id', sessionId);

    if (error) throw error;

    return (data || []).sort(
      (a, b) =>
        a.ciudad.localeCompare(b.ciudad) ||
        a.referencia.localeCompare(b.referencia)
    );
  }

  /**
   * Actualiza un item (cuando alistador hace pick)
   */
  static async updateItem(
    itemId: string,
    updates: Partial<Item>
  ): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update({
        ...updates,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando item: ${error.message}`);
    return data;
  }

  /**
   * Suscripción a cambios en tiempo real
   */
  static subscribeToSession(
    sessionId: string,
    onUpdate: (item: Item) => void,
    onInsert: (item: Item) => void
  ): () => void {
    const channel = supabase
      .channel(`sess-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `sesion_id=eq.${sessionId}`,
        },
        (payload) => onUpdate(payload.new as Item)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'items',
          filter: `sesion_id=eq.${sessionId}`,
        },
        (payload) => onInsert(payload.new as Item)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
