import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BusinessLogicService } from '../services/BusinessLogicService';
import type { Item, FilterType } from '../models/types';
import { BarcodeScanner } from './BarcodeScanner';
import { ItemDetailModal } from './ItemDetailModal';
import { useIsMobile } from '../hooks/useIsMobile';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'todos', label: 'Todos' },
  { value: 'completos', label: 'Completos' },
  { value: 'parciales', label: 'Parciales' },
  { value: 'cero', label: 'Sin stock' },
];

/**
 * PickListScreen - Componente presentacional
 * Lista de items para alistar; usa servicio para filtrar
 */
export function PickListScreen() {
  const { items, currentCity, currentFilter, setCurrentFilter } = useApp();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const isMobile = useIsMobile();

  // Filtrar por ciudad primero
  const cityItems = currentCity
    ? items.filter((i) => i.ciudad === currentCity)
    : items;

  // Aplicar filtro de estado usando el servicio
  const filtered = BusinessLogicService.filterItems(cityItems, currentFilter);

  return (
    <section>
      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-btn ${currentFilter === f.value ? 'active' : ''}`}
            onClick={() => setCurrentFilter(f.value)}
          >
            {f.label}
          </button>
        ))}

        {isMobile && (
          <button
            className="filter-btn scanner-btn"
            onClick={() => setScannerOpen(true)}
            title="Escanear código"
          >
            📷 Escanear
          </button>
        )}
      </div>

      <div className="pick-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No hay items en este filtro</div>
          </div>
        ) : (
          filtered.map((item) => (
            <PickCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))
        )}
      </div>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <BarcodeScanner
        items={items}
        onDetected={(item) => {
          setSelectedItem(item);
          setScannerOpen(false);
        }}
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </section>
  );
}

/**
 * PickCard - Sub-componente presentacional
 */
function PickCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const expected = BusinessLogicService.calculateExpectedUnits(item);
  const cssClass =
    item.estado === 'completo'
      ? 'complete'
      : item.estado === 'parcial'
      ? 'partial'
      : item.estado === 'cero'
      ? 'zero'
      : '';

  const icon =
    item.estado === 'completo'
      ? '✓'
      : item.estado === 'parcial'
      ? '!'
      : item.estado === 'cero'
      ? '✗'
      : '';

  return (
    <div className={`pick-card ${cssClass}`} onClick={onClick}>
      <div className="pick-top">
        <span className="pick-ref">{item.referencia}</span>
        {icon && <div className={`pick-status-icon ${cssClass}`}>{icon}</div>}
      </div>
      <div className="pick-desc">{item.descripcion}</div>
      <div className="pick-bottom">
        <div>
          <span className="pick-qty-label">Tomar: </span>
          <span className="pick-qty-value">
            {item.cantidad_solicitada}{' '}
            {item.unidad_alistamiento === 'cajas'
              ? item.um_empaque || 'cajas'
              : 'u.'}
          </span>
          {item.cantidad_alistada !== null && (
            <span className={`pick-qty-real ${cssClass}`}>
              ({item.cantidad_alistada}/{expected} u.)
            </span>
          )}
        </div>
      </div>
      {item.alistador && (
        <div className="pick-alistador">por {item.alistador}</div>
      )}
    </div>
  );
}
