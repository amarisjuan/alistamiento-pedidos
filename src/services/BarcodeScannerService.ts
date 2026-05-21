import type { Item, BarcodeResult } from '../models/types';

/**
 * BarcodeScannerService
 * Responsabilidad: Validación de códigos y sonidos con Web Audio API
 */
export class BarcodeScannerService {
  private static audioContext: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private static playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ): void {
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (err) {
      console.error('Error reproduciendo tono:', err);
    }
  }

  static playSuccessSound(frequency: number = 1000, duration: number = 180): void {
    this.playTone(frequency, duration, 'sine');
  }

  static playErrorSound(frequency: number = 320, duration: number = 260): void {
    this.playTone(frequency, duration, 'triangle');
  }

  static playWarningSound(frequency: number = 720, duration: number = 140): void {
    this.playTone(frequency, duration, 'square');
  }

  static validateBarcode(barcode: string, items: Item[]): BarcodeResult {
    const normalized = barcode.trim().toUpperCase();

    const byReference = items.find(
      (item) => item.referencia.toUpperCase() === normalized
    );
    if (byReference) {
      return {
        success: true,
        text: barcode,
        item: byReference,
        message: `Producto encontrado: ${byReference.referencia}`,
      };
    }

    const byId = items.find((item) => item.id.toUpperCase() === normalized);
    if (byId) {
      return {
        success: true,
        text: barcode,
        item: byId,
        message: `Producto encontrado: ${byId.referencia}`,
      };
    }

    return {
      success: false,
      text: barcode,
      message: `Código no encontrado: ${barcode}`,
    };
  }

  static releaseAudioContext(): void {
    if (!this.audioContext) return;
    try {
      this.audioContext.close();
    } catch (err) {
      console.error('Error cerrando AudioContext:', err);
    }
    this.audioContext = null;
  }
}
