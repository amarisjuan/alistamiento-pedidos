import { useApp } from '../context/AppContext';

/**
 * Loader - Componente presentacional
 */
export function Loader() {
  const { loading, loaderText } = useApp();

  if (!loading) return null;

  return (
    <div className="loader-overlay">
      <div className="spinner" />
      <div className="loader-text">{loaderText}</div>
    </div>
  );
}
