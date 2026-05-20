import { useApp } from '../context/AppContext';
import { BusinessLogicService } from '../services/BusinessLogicService';

/**
 * CityListScreen - Componente presentacional
 * Lista de ciudades con stats; usa servicio para calcular
 */
export function CityListScreen() {
  const { items, setCurrentCity, setScreen, setCurrentFilter } = useApp();

  const cityStats = BusinessLogicService.calculateCityStats(items);

  const handleCityClick = (ciudad: string) => {
    setCurrentCity(ciudad);
    setCurrentFilter('pendientes');
    setScreen('picking');
  };

  return (
    <section>
      <div className="section-title">Selecciona la ciudad</div>
      <div className="city-list">
        {cityStats.map((c) => {
          const allDone = c.pending === 0;
          const cssClass = allDone
            ? 'complete'
            : c.complete > 0 || c.partial > 0
            ? 'partial'
            : '';

          return (
            <div
              key={c.ciudad}
              className={`city-card ${cssClass}`}
              onClick={() => handleCityClick(c.ciudad)}
            >
              <div className="city-card-top">
                <div className="city-name">{c.ciudad}</div>
                <span
                  className={`city-status ${
                    allDone ? 'complete' : c.pending < c.total ? 'partial' : 'pending'
                  }`}
                >
                  {allDone
                    ? 'Completo'
                    : c.pending < c.total
                    ? 'En progreso'
                    : 'Pendiente'}
                </span>
              </div>
              <div className="city-info">
                <span>📦 {c.total} refs</span>
                <span>⏳ {c.pending} pendientes</span>
              </div>
              <div className="city-progress">
                <div
                  className="city-progress-fill"
                  style={{ width: `${c.percentComplete}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
