import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {triggerAnalyticsIfConsented} from './lib/analytics';

// Suppress benign Vite WebSocket and HMR errors/rejections that occur because HMR is disabled in AI Studio preview environments.
if (typeof window !== 'undefined') {
  const isViteWebsocketError = (err: any): boolean => {
    if (!err) return false;
    const message = (err.message || String(err)).toLowerCase();
    const stack = err.stack ? String(err.stack).toLowerCase() : '';
    const isWebSocket = message.includes('websocket') || message.includes('web socket') || stack.includes('websocket');
    const isVite = message.includes('vite') || stack.includes('vite') || stack.includes('@vite');
    return isWebSocket || isVite;
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteWebsocketError(event.reason)) {
      console.warn('⚠️ Suppressed benign Vite/WebSocket unhandled rejection:', event.reason);
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isViteWebsocketError(event.error) || isViteWebsocketError(event.message)) {
      console.warn('⚠️ Suppressed benign Vite/WebSocket runtime error:', event.message || event.error);
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

// Attempt dynamic / environment-based initialization
triggerAnalyticsIfConsented();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

