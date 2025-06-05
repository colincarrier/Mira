import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOfflineStore } from "./store/offline-store";

// Register service worker for PWA capabilities and offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'BACKGROUND_SYNC') {
            // Trigger sync when background sync is requested
            import('./store/offline-store').then(({ useOfflineStore }) => {
              useOfflineStore.getState().syncWithServer();
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Initialize offline functionality
initializeOfflineStore().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
