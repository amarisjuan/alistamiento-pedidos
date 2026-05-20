import { useApp } from '../context/AppContext';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showProgress?: boolean;
}

/**
 * Header - Componente presentacional
 * Solo renderizado, NO lógica de negocio
 */
export function Header({ title, onBack, showProgress = false }: HeaderProps) {
  const { isOnline, items } = useApp();

  const done = items.filter((i) => i.estado !== 'pendiente').length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <header className="app-header">
      <div className="header-row">
        {onBack && (
          <button className="header-back" onClick={onBack}>
            ←
          </button>
        )}
        <div className="header-title">
          <span className={`conn-dot ${isOnline ? 'online' : 'offline'}`} />
          {title}
        </div>
      </div>
      {showProgress && items.length > 0 && (
        <div className="progress-section">
          <div className="progress-row">
            <span>Progreso</span>
            <span>
              {done} / {items.length} ({pct}%)
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </header>
  );
}
