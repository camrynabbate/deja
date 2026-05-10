import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

export async function initStatusBar() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {}
}

export async function hapticLight() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export async function hapticMedium() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {}
}

export async function hapticSelection() {
  if (!isNative()) return;
  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch {}
}

export async function shareItem({ title, text, url }) {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, url, dialogTitle: title });
      return true;
    } catch {
      return false;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard && url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
