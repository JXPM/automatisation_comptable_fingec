import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

// Suivi des erreurs frontend : activé seulement si VITE_SENTRY_DSN est fourni au
// build (sinon no-op total). Capture les exceptions non gérées de l'app React.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: (import.meta.env.VITE_SENTRY_ENV as string | undefined) ?? 'production',
    tracesSampleRate: 0,
    // RGPD : ne pas envoyer d'IP ni de données personnelles par défaut.
    sendDefaultPii: false,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
