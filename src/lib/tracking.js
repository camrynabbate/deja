import { Capacitor } from '@capacitor/core';

const SKIMLINKS_SRC = 'https://s.skimresources.com/js/302123.skimlinks.js';

let injected = false;
function injectSkimlinks() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('script');
  s.async = true;
  s.defer = true;
  s.src = SKIMLINKS_SRC;
  document.head.appendChild(s);
}

let initStarted = false;
export async function initTracking() {
  if (initStarted) return;
  initStarted = true;

  if (Capacitor.getPlatform() !== 'ios') {
    injectSkimlinks();
    return;
  }

  try {
    const { AppTrackingTransparency } = await import('@capgo/capacitor-app-tracking-transparency');
    const { status } = await AppTrackingTransparency.requestPermission();
    if (status === 'authorized') {
      injectSkimlinks();
    }
  } catch {
    // Plugin missing or call failed — fail safe by not loading the tracker
  }
}
