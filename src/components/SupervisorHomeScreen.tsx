import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ExcelService } from '../services/ExcelService';
import { SupabaseService } from '../services/SupabaseService';
import { BusinessLogicService } from '../services/BusinessLogicService';
import type { Session } from '../models/types';

/**
 * SupervisorHomeScreen - Componente presentacional
 * El supervisor puede cargar Excel o seleccionar sesión activa
 */
export function SupervisorHomeScreen() {
  const {
    setSession,
    setItems,
    setScreen,
    showToast,
    showLoader,
    hideLoader,
  } = useApp();

  const [sessions, setSessions] = useState<Session[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showLoader('Procesando archivo...');
    try {
      const consolidated = await ExcelService.parseExcelFile(file);
      if (!consolidated.length) {
        throw new Error('No se encontraron pedidos válidos en el archivo');
      }

      const sessionId = BusinessLogicService.generateSessionCode();
      const sessionName = file.name.replace(/\.[^.]+$/, '');

      showLoader('Creando sesión en la nube...');
      await SupabaseService.createSession(sessionId, sessionName, consolidated);

      showLoader('Cargando sesión...');
      const session = await SupabaseService.getSessionById(sessionId);
      const items = await SupabaseService.getItemsBySession(sessionId);

      setSession(session);
      setItems(items);
      hideLoader();
      showToast(`Sesión creada: ${sessionId}`, 'success');
      setScreen('superDash');
    } catch (err) {
      hideLoader();
      const msg = err instanceof Error ? err.message : 'Error al procesar';
      showToast(msg, 'error');
      console.error(err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const joinSession = async (sessionId: string) => {
    showLoader('Cargando sesión...');
    try {
      const session = await SupabaseService.getSessionById(sessionId);
      const items = await SupabaseService.getItemsBySession(sessionId);
      setSession(session);
      setItems(items);
      hideLoader();
      setScreen('superDash');
    } catch (err) {
      hideLoader();
      const msg = err instanceof Error ? err.message : 'Error';
      showToast(msg, 'error');
    }
  };

  return (
    <section>
      <div className="welcome-card">
        <div className="welcome-icon">📁</div>
        <h2 className="welcome-title">Nueva sesión de alistamiento</h2>
        <p className="welcome-sub">
          Carga el Excel de pedidos para crear una nueva sesión en la nube. Los
          alistadores podrán verla y trabajar en ella desde sus celulares.
        </p>
        <label className="file-btn">
          📁 Cargar Excel de pedidos
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="section-title">Sesiones activas</div>
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
