import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from '@/App.jsx'
import { initStatusBar } from '@/lib/native'
import '@/index.css'

initStatusBar()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true)
      },
    })
  })
}
