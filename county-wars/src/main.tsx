import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'

// Add global error handlers to catch any unhandled errors that might cause refreshes
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
  // Prevent the default error handling which might cause a page reload
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default handling which might cause a page reload
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  // Temporarily disabled StrictMode to prevent double-mounting during county claiming
  // <StrictMode>
    <App />
  // </StrictMode>
)
