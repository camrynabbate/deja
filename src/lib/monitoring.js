const SENTRY_DSN = import.meta.env?.VITE_SENTRY_DSN;
let monitoringPromise;

function loadMonitoring() {
  if (!SENTRY_DSN) return Promise.resolve(null);
  if (!monitoringPromise) {
    monitoringPromise = import('@/lib/sentryClient').then((Sentry) => {
      Sentry.initializeSentry({
        dsn: SENTRY_DSN,
        environment: import.meta.env?.MODE || 'production',
        release: import.meta.env?.VITE_APP_RELEASE || undefined,
        sendDefaultPii: false,
      });
      return Sentry;
    });
  }
  return monitoringPromise;
}

export async function initMonitoring() {
  try {
    return Boolean(await loadMonitoring());
  } catch (error) {
    console.error('[monitoring] Could not initialize crash reporting:', error);
    return false;
  }
}

export async function captureException(error, context = {}) {
  try {
    const Sentry = await loadMonitoring();
    if (!Sentry) {
      console.error('[app error]', error, context);
      return;
    }
    Sentry.reportException(error, context);
  } catch (monitoringError) {
    console.error('[monitoring] Could not report app error:', monitoringError, error);
  }
}

export async function setMonitoringUser(user) {
  try {
    const Sentry = await loadMonitoring();
    if (!Sentry) return;
    Sentry.setSentryUser(user?.uid ? { id: user.uid } : null);
  } catch (error) {
    console.error('[monitoring] Could not update user context:', error);
  }
}
