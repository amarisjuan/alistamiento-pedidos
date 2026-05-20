import { useApp } from '../context/AppContext';
import { BusinessLogicService } from '../services/BusinessLogicService';
import { ExcelService } from '../services/ExcelService';
import { SupabaseService } from '../services/SupabaseService';

/**
 * SupervisorDashboard - Componente presentacional
 * Muestra resumen general y estadísticas por ciudad
 */
export function SupervisorDashboard() {
  const {
    session,
    items,
    setItems,
    setScreen,
    showLoader,
    hideLoader,
    showToast,
  } = useApp();

  if (!session) return null;

  // Usa el servicio para calcular - NO calcula aquí
  const stats = BusinessLogicService.calculateStats(items);
  const cityStats = BusinessLogicService.calculateCityStats(items);

  const handleRefresh = async () => {
    showLoader('Actualizando...');
    try {
      const fresh = await SupabaseService.getItemsBySession(session.id);
      setItems(fresh);
      hideLoader();
      showToast('Actualizado', 'success');
    } catch (err) {
      hideLoader();
      showToast('Error al actualizar', 'error');
    }
  };

  return (
    <section>
      <div className="session-info-card">
        <div className="label">Código de sesión</div>
        <div className="code">{session.id}</div>
        <div className="hint">{session.nombre}</div>
      </div>

      <div className="super-stats">
        <div className="super-stat complete">
          <div className="lbl">Completas</div>
          <div className="num">{stats.complete}</div>
        </div>
        <div className="super-stat partial">
          <div className="lbl">Parciales</div>
          <div className="num">{stats.partial}</div>
        </div>
        <div className="super-stat zero">
          <div className="lbl">Sin alistar</div>
          <div className="num">{stats.zero}</div>
        </div>
        <div className="super-stat total">
          <div className="lbl">Total</div>
          <div className="num">{items.length}</div>
        </div>
      </div>

      <div className="super-actions">
        <button className="primary" onClick={handleRefresh}>
          🔄 Refrescar
        </button>
        <button className="primary" onClick={() => setScreen('cities')}>
          📋 Ver por ciudad
        </button>
        <button className="secondary" onClick={() => setScreen('summary')}>
          📊 Resumen detallado
        </button>
        <button
          className="secondary"
          onClick={() => ExcelService.exportToExcel(items, session.id)}
        >
          ⬇️ Excel final
        </button>
      </div>

      <div className="section-title">Avance por ciudad</div>
      <div className="city-list">
        {cityStats.map((c) => {
          const allDone = c.complete + c.partial + c.zero === c.total;
          const cssClass = allDone
            ? 'complete'
            : c.complete > 0
            ? 'partial'
            : '';
          return (
            <div key={c.ciudad} className={`city-card ${cssClass}`}>
              <div className="city-card-top">
                <div className="city-name">{c.ciudad}</div>
                <span
                  className={`city-status ${
                    allDone ? 'complete' : c.pending < c.total ? 'partial' : 'pending'
                  }`}
                >
                  {allDone ? 'Completo' : c.pending < c.total ? 'En progreso' : 'Pendiente'}
                </span>
              </div>
              <div className="city-info">
                <span>📦 {c.total} refs</span>
                <span>✅ {c.complete}</span>
                {c.partial > 0 && <span>⚠️ {c.partial}</span>}
                {c.zero > 0 && <span>❌ {c.zero}</span>}
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
