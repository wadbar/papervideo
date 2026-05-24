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
        let isCritical = false;
        if (memory) {
            const used = memory.usedJSHeapSize;
            const limit = memory.jsHeapSizeLimit || memory.totalJSHeapSize;
            if (used > limit * 0.8) {
                isCritical = true;
                sysLog(`RESOURCE_CRITICAL: high memory pressure detected (${Math.round(used/1024/1024)}MB / ${Math.round(limit/1024/1024)}MB)`, 'warn');
            }
        }
        
        // Dispatch industrial memory event for observers to consume (e.g. VideoStudio memory-aware batching)
        if (isCritical) {
            window.dispatchEvent(new CustomEvent('vram-pressure-critical', { detail: { timestamp: Date.now() } }));
        }
    }, 15000); // 15s interval for system tracing
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
