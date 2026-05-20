import type { Session } from '../models/types';

/**
 * ShareService
 * Responsabilidad: Compartir información (WhatsApp, Email, Clipboard)
 * NO depende de React
 */
export class ShareService {
  /**
   * Compartir por WhatsApp
   */
  static async shareWhatsApp(text: string): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Alistamiento', text });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  /**
   * Compartir por Email
   */
  static shareEmail(text: string, session: Session): void {
    const subject = `Alistamiento ${session.nombre} - ${new Date().toLocaleDateString('es-CO')}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }

  /**
   * Copiar al portapapeles
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
