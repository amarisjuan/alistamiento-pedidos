import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { SupabaseService } from '../services/SupabaseService';
import { BusinessLogicService } from '../services/BusinessLogicService';
import type { Session } from '../models/types';

/**
 * AlistadorJoinScreen - Componente presentacional
 * El alistador ingresa su nombre y selecciona sesión
 */
export function AlistadorJoinScreen() {
  const {
    alistadorName,
    setAlistadorName,
    setSession,
    setItems,
    setScreen,
    showToast,
    showLoader,
    hideLoader,
  } = useApp();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState(alistadorName);

  useEffect(() => {
    const saved = localStorage.getItem('alistador_name');
    if (saved) setName(saved);
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await SupabaseService.getActiveSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!name.trim()) {
      showToast('Escribe tu nombre primero', 'error');
      return;
    }
    setAlistadorName(name.trim());
    localStorage.setItem('alistador_name', name.trim());

    showLoader('Cargando sesión...');
    try {
      const session = await SupabaseService.getSessionById(sessionId);
      const items = await SupabaseService.getItemsBySession(sessionId);
      setSession(session);
      setItems(items);
      hideLoader();
      setScreen('cities');
    } catch (err) {
      hideLoader();
      const msg = err instanceof Error ? err.message : 'Error';
      showToast(msg, 'error');
    }
  };

  return (
    <section>
      <div className="welcome-card">
        <div className="welcome-icon">👷</div>
        <h2 className="welcome-title">Ingresar al alistamiento</h2>
        <p className="welcome-sub">
          Escribe tu nombre y selecciona la sesión asignada por tu supervisor.
        </p>
        <div className="form-group">
          <label className="form-label">Tu nombre</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Carlos Pérez"
          />
        </div>
      </div>

      <div className="section-title">Sesiones disponibles</div>
      <div className="session-list">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No hay sesiones activas</div>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="session-card"
              onClick={() => joinSession(s.id)}
            >
              <div className="name">{s.nombre}</div>
              <div className="meta">
                <span className="session-code">{s.id}</span>
                <span>📅 {BusinessLogicService.formatDate(s.creado_en)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
