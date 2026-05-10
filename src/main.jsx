import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from '@/App.jsx'
import { initStatusBar } from '@/lib/native'
import '@/index.css'

initStatusBar()

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn && import.meta.env.PROD) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: Capacitor.isNativePlatform() ? 'ios' : 'web',
      tracesSampleRate: 0.1,
    })
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const send = (metric) => {
        Sentry.captureMessage(`webvital.${metric.name}`, {
          level: 'info',
          tags: { metric: metric.name, rating: metric.rating },
          extra: { value: metric.value, id: metric.id, navigationType: metric.navigationType },
        })
      }
      onCLS(send); onINP(send); onLCP(send); onFCP(send); onTTFB(send)
    })
  })
} else if (import.meta.env.DEV) {
  import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    const log = (m) => console.log(`[web-vitals] ${m.name}=${Math.round(m.value)} (${m.rating})`)
    onCLS(log); onINP(log); onLCP(log); onFCP(log); onTTFB(log)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}
