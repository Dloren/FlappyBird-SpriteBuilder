// Compartir una imagen PNG por WhatsApp (u otra app):
//  - APK (Capacitor): Filesystem + Share nativo
//  - Web: navigator.share con archivos; si no, descarga + wa.me
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

export async function shareCanvas(canvas, text, filename = 'pipi-potter.png') {
  if (isNative()) {
    try {
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      const res = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      await Share.share({ title: 'Pipi Potter', text, files: [res.uri], dialogTitle: 'Compartir por WhatsApp' });
      return 'native';
    } catch (e) {
      try { await Share.share({ title: 'Pipi Potter', text }); return 'native-text'; } catch (_) { return 'error'; }
    }
  }
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: 'Pipi Potter' });
      return 'webshare';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancel';
  }
  // Alternativa: descarga la imagen y abre WhatsApp con el texto
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (_) { /* noop */ }
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  return 'fallback';
}
