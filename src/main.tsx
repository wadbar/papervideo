import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { sysLog } from './lib/sys';
import './index.css';

// Register Service Worker for Chromium optimizations
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

// Global Exception Shielding: UNCAUGHT_EXCEPTION Protocol
window.addEventListener('error', (event) => {
  sysLog(`UNCAUGHT_EXCEPTION: ${event.message} @ ${event.filename}:${event.lineno}`, 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  sysLog(`UNHANDLED_PROMISE_REJECTION: ${event.reason}`, 'error');
});

// Telemetry Daemon: Memory & Frame Performance Monitoring
const initTelemetry = () => {
    setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            if (usedMB > totalMB * 0.8) {
                sysLog(`RESOURCE_CRITICAL: high memory pressure detected (${usedMB}MB / ${totalMB}MB)`, 'warn');
            }
        }
    }, 10000);
};

initTelemetry();

import {ThemeProvider} from './core/contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
