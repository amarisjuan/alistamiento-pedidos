import { useApp } from '../context/AppContext';

/**
 * Toast - Componente presentacional
 */
export function Toast() {
  const { toast } = useApp();

  return (
    <div
      className={`toast ${toast.visible ? 'show' : ''} ${toast.type}`}
      role="status"
    >
      {toast.message}
    </div>
  );
}
