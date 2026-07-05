# Crash reporting setup

Crash reporting is optional and disabled unless a Sentry DSN is configured.

Add these variables to the Vercel production environment and the local iOS build environment:

```text
VITE_SENTRY_DSN=your_sentry_dsn
VITE_APP_RELEASE=1.0.0-build.2
```

The app reports crashes and the signed-in Firebase user ID. It does not send email addresses, performance traces, session replays, or screen recordings.

Before each App Store build, update `VITE_APP_RELEASE` so reports can be tied to the correct release.
