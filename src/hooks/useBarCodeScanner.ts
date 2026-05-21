import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { BarcodeScannerService } from '../services/BarcodeScannerService';
import type { Item, BarcodeResult } from '../models/types';

interface UseBarcodeResult {
  isScanning: boolean;
  lastScanned: string | null;
  lastResult: BarcodeResult | null;
  error: string | null;
  scannerRef: RefObject<HTMLDivElement>;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  manualValidate: (barcode: string) => void;
}

const MOBILE_REGEX = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;

function isMobileDevice(): boolean {
  if (typeof navigator !== 'undefined' && MOBILE_REGEX.test(navigator.userAgent)) {
    return true;
  }
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768;
  }
  return false;
}

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  return AudioCtx ? new AudioCtx() : null;
}

function playTone(frequency: number, durationMs: number, type: OscillatorType) {
  const context = createAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  gainNode.gain.setValueAtTime(0.001, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);

  oscillator.start();
  oscillator.stop(context.currentTime + durationMs / 1000);

  oscillator.onended = () => {
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.03);
    setTimeout(() => {
      oscillator.disconnect();
      gainNode.disconnect();
    }, 50);
  };
}

function playSuccessSound() {
  playTone(880, 160, 'sine');
  setTimeout(() => playTone(1320, 120, 'sine'), 160);
}

function playErrorSound() {
  playTone(220, 220, 'square');
}

export function useBarCodeScanner(
  items: Item[],
  onDetected: (item: Item) => void,
  mobileOnly: boolean
): UseBarcodeResult {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BarcodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const lastDetectedRef = useRef<string | null>(null);

  const processBarcode = useCallback(
    (barcode: string) => {
      const normalized = barcode.trim();
      if (!normalized) return;
      if (normalized === lastDetectedRef.current) return;

      const result = BarcodeScannerService.validateBarcode(normalized, items);
      setLastScanned(normalized);
      setLastResult(result);

      if (result.success && result.item) {
        playSuccessSound();
        onDetected(result.item);
      } else {
        playErrorSound();
      }

      lastDetectedRef.current = normalized;
      window.setTimeout(() => {
        if (lastDetectedRef.current === normalized) {
          lastDetectedRef.current = null;
        }
      }, 1200);
    },
    [items, onDetected]
  );

  const stopScanning = useCallback(() => {
    setIsScanning(false);

    if (!scannerInstanceRef.current) {
      return;
    }

    scannerInstanceRef.current
      .stop()
      .then(() => scannerInstanceRef.current?.clear())
      .catch((err) => {
        console.error('Error al detener escáner:', err);
      })
      .finally(() => {
        scannerInstanceRef.current = null;
      });
  }, []);

  const startScanning = useCallback(async () => {
    if (!mobileOnly) {
      setError('El escáner solo está disponible en dispositivos móviles.');
      return;
    }

    if (!scannerRef.current) return;

    try {
      setError(null);

      if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5Qrcode('barcode-scanner-reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 180 },
        disableFlip: false,
      };

      const cameraConfig = { facingMode: { exact: 'environment' } } as const;

      await scannerInstanceRef.current.start(
        cameraConfig,
        config,
        (decodedText) => {
          processBarcode(decodedText);
        },
        () => {
          // Aquí se ignoran los errores de lectura de fotogramas.
        }
      );

      setIsScanning(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al iniciar la cámara. Asegúrate de que el dispositivo permita el acceso.';

      setError(message);
      setIsScanning(false);
    }
  }, [mobileOnly, processBarcode]);

  const manualValidate = useCallback(
    (barcode: string) => {
      processBarcode(barcode);
    },
    [processBarcode]
  );

  useEffect(() => {
    if (!mobileOnly) {
      setError('Escaneo deshabilitado en escritorio.');
    }
  }, [mobileOnly]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    isScanning,
    lastScanned,
    lastResult,
    error,
    scannerRef,
    startScanning,
    stopScanning,
    manualValidate,
  };
}
