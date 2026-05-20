import { useApp } from '../context/AppContext';

/**
 * WelcomeScreen - Selección de rol
 * Componente presentacional - solo renderiza, callbacks van por context
 */
export function WelcomeScreen() {
  const { setRole, setScreen } = useApp();

  const handleRoleSelect = (role: 'supervisor' | 'alistador') => {
    setRole(role);
    setScreen(role === 'supervisor' ? 'superHome' : 'alistadorJoin');
  };

  return (
    <section>
      <div className="welcome-card">
        <div className="welcome-icon">📦</div>
        <h2 className="welcome-title">Alistamiento de Pedidos</h2>
        <p className="welcome-sub">Elige tu rol para comenzar</p>
        <div className="role-cards">
          <div
            className="role-card"
            onClick={() => handleRoleSelect('supervisor')}
          >
            <div className="icon">👔</div>
            <div className="label">Supervisor</div>
            <div className="sub">Cargar pedidos y monitorear</div>
          </div>
          <div
            className="role-card"
            onClick={() => handleRoleSelect('alistador')}
          >
            <div className="icon">👷</div>
            <div className="label">Alistador</div>
            <div className="sub">Alistar referencias</div>
          </div>
        </div>
      </div>
    </section>
  );
}
