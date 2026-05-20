import { useApp } from '../context/AppContext';
import { BusinessLogicService } from '../services/BusinessLogicService';
import { ShareService } from '../services/ShareService';

/**
 * SummaryScreen - Componente presentacional
 * Resumen final del alistamiento + acciones de compartir
 */
export function SummaryScreen() {
  const { session, items, showToast } = useApp();

  if (!session) return null;

  const stats = BusinessLogicService.calculateStats(items);
  const issues = items.filter(
    (i) => i.estado === 'parcial' || i.estado === 'cero'
  );

  const handleWhatsApp = async () => {
    const text = BusinessLogicService.buildSummaryText(items, session);
    await ShareService.shareWhatsApp(text);
  };

  const handleEmail = () => {
    const text = BusinessLogicService.buildSummaryText(items, session);
    ShareService.shareEmail(text, session);
  };

  const handleCopy = async () => {
    const text = BusinessLogicService.buildSummaryText(items, session);
    const ok = await ShareService.copyToClipboard(text);
    showToast(ok ? 'Copiado' : 'Error al copiar', ok ? 'success' : 'error');
  };

  return (
    <section>
      <div className="summary-card">
        <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>
          Resumen del alistamiento
        </h3>
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
            <div className="lbl">Total refs</div>
            <div className="num">{items.length}</div>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="summary-card">
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>
            ⚠️ Referencias con novedad
          </h3>
          <div className="summary-list">
            {issues.map((i) => {
              const expected = BusinessLogicService.calculateExpectedUnits(i);
              const diff = expected - (i.cantidad_alistada || 0);
              return (
                <div key={i.id} className="summary-issue">
                  <div className="summary-issue-info">
                    <div className="summary-issue-ref">{i.referencia}</div>
                    <div className="summary-issue-desc">{i.descripcion}</div>
                    <div className="summary-issue-reason">{i.motivo}</div>
                  </div>
                  <div className="summary-issue-qty">
                    {i.cantidad_alistada} / {expected} u.
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--danger)',
                        fontWeight: 600,
                      }}
                    >
                      Falta: {diff} u.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="share-actions">
        <button className="share-btn whatsapp" onClick={handleWhatsApp}>
          📱 WhatsApp
        </button>
        <button className="share-btn email" onClick={handleEmail}>
          ✉️ Correo
        </button>
        <button className="share-btn copy" onClick={handleCopy}>
          📋
        </button>
      </div>
    </section>
  );
}
