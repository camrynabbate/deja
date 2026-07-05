import {
  browserApiErrorsIntegration,
  captureException,
  dedupeIntegration,
  globalHandlersIntegration,
  init,
  linkedErrorsIntegration,
  setUser,
  withScope,
} from '@sentry/browser';

export function initializeSentry(options) {
  init({
    ...options,
    defaultIntegrations: false,
    integrations: [
      globalHandlersIntegration(),
      browserApiErrorsIntegration(),
      linkedErrorsIntegration(),
      dedupeIntegration(),
    ],
  });
}

export function reportException(error, context) {
  withScope((scope) => {
    scope.setContext('app', context);
    captureException(error);
  });
}

export function setSentryUser(user) {
  setUser(user);
}
