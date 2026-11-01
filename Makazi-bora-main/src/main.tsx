import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and silence benign dev-server WebSocket / HMR failure errors and unhandled rejections
if (typeof window !== 'undefined') {
  const isWebsocketOrViteError = (err: any) => {
    if (!err) return false;
    const msg = String(err.message || err.description || err.reason || err);
    return (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('vite') ||
      msg.includes('connection')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isWebsocketOrViteError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isWebsocketOrViteError(event.message) || isWebsocketOrViteError(event.error)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

