import { useEffect } from 'react';
import { useBarCodeScanner } from '../hooks/useBarCodeScanner';
import { useIsMobile } from '../hooks/useIsMobile';
import type { Item } from '../models/types';

interface Props {
  items: Item[];
  onDetected: (item: Item) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * BarcodeScanner - Componente de escaneo de códigos de barras
 * Solo disponible en dispositivos móviles.
 */
export function BarcodeScanner({ items, onDetected, isOpen, onClose }: Props) {
  const isMobile = useIsMobile();
  const { isScanning, lastResult, error, scannerRef, startScanning, stopScanning } =
    useBarCodeScanner(items, onDetected, isMobile);

  useEffect(() => {
    if (!isMobile) {
      stopScanning();
      return;
    }

    if (isOpen && !isScanning) {
      startScanning();
    } else if (!isOpen && isScanning) {
      stopScanning();
    }
  }, [isMobile, isOpen, isScanning, startScanning, stopScanning]);

  if (!isMobile || !isOpen) return null;

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-container">
        <div className="barcode-scanner-header">
          <h2>📷 Escanear código de barras</h2>
          <button className="barcode-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="barcode-scanner-body">
          {error && <div className="barcode-error">{error}</div>}

          <div className="barcode-video-container">
            <div id="barcode-scanner-reader" ref={scannerRef} className="barcode-reader" />
          </div>

          {isScanning && <div className="barcode-status">🔴 ESCANEANDO...</div>}

          {lastResult && (
            <div
              className={`barcode-result ${lastResult.success ? 'success' : 'error'}`}
            >
              <div className="result-code">{lastResult.text}</div>
              <div className="result-message">{lastResult.message}</div>
              {lastResult.item && (
                <div className="result-item">
                  <div className="result-ref">{lastResult.item.referencia}</div>
                  <div className="result-desc">{lastResult.item.descripcion}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
