import { useState, useEffect } from 'react';
import type { Item } from '../models/types';
import { useApp } from '../context/AppContext';
import { BusinessLogicService } from '../services/BusinessLogicService';
import { SupabaseService } from '../services/SupabaseService';

const REASONS = [
  'Sin stock',
  'Vencido',
  'Averiado',
  'No encontrado',
  'Stock parcial',
  'Otro',
];

interface Props {
  item: Item;
  onClose: () => void;
}

/**
 * ItemDetailModal - Componente presentacional
 * Modal para que el alistador registre cuántas unidades alistó
 */
export function ItemDetailModal({ item, onClose }: Props) {
  const { alistadorName, setItems, showToast } = useApp();

  const expected = BusinessLogicService.calculateExpectedUnits(item);
  const [qty, setQty] = useState<number>(item.cantidad_alistada ?? expected);
  const [reason, setReason] = useState<string>(item.motivo ?? '');
  const [saving, setSaving] = useState(false);

  // Determina si necesita motivo
  const needsReason = qty < expected;

  useEffect(() => {
    if (!needsReason) setReason('');
  }, [needsReason]);

  const handleAdjust = (delta: number) => {
    setQty((q) => Math.max(0, q + delta));
  };

  const handleQuickFull = () => {
    setQty(expected);
    setReason('');
  };

  const handleQuickZero = () => {
    setQty(0);
  };

  const handleSave = async () => {
    if (needsReason && !reason) {
      showToast('Selecciona un motivo', 'error');
      return;
    }

    setSaving(true);
    try {
      const newEstado = BusinessLogicService.calculateItemState({
        ...item,
        cantidad_alistada: qty,
      });

      const updated = await SupabaseService.updateItem(item.id, {
        cantidad_alistada: qty,
        estado: newEstado,
        motivo: needsReason ? reason : null,
        alistador: alistadorName || item.alistador || 'Anónimo',
      });

      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      showToast('Guardado', 'success');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{item.descripcion || item.referencia}</div>
        <div className="modal-ref">REF: {item.referencia}</div>

        <div className="modal-asked">
          <div className="modal-asked-label">Cantidad solicitada</div>
          <div className="modal-asked-value">
            {item.cantidad_solicitada}{' '}
            {item.unidad_alistamiento === 'cajas'
              ? item.um_empaque || 'cajas'
              : 'u.'}
          </div>
          <div className="modal-asked-um">= {expected} unidades</div>
        </div>

        <div className="qty-stepper">
          <button className="qty-btn" onClick={() => handleAdjust(-1)}>
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            className="qty-input"
            value={qty}
            onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
            min={0}
          />
          <button className="qty-btn" onClick={() => handleAdjust(1)}>
            +
          </button>
        </div>
        <div className="qty-label-small">unidades alistadas</div>

        <div className="quick-actions">
          <button className="quick-btn full" onClick={handleQuickFull}>
            ✓ Completo
          </button>
          <button className="quick-btn zero" onClick={handleQuickZero}>
            ✗ Sin stock
          </button>
        </div>

        {needsReason && (
          <div className="reason-section">
            <div className="reason-label">Motivo (obligatorio)</div>
            <div className="reason-grid">
              {REASONS.map((r) => (
                <button
                  key={r}
                  className={`reason-chip ${reason === r ? 'active' : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="modal-btn save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
