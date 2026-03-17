import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Aggressive service worker cleanup
(function cleanupServiceWorkers() {
  // Clear any existing service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      console.log('🧹 Found', registrations.length, 'service workers to unregister');
      const unregisterPromises = registrations.map(function(registration) {
        return registration.unregister().then(function(success) {
          console.log('🗑️ Service worker unregistered:', success);
          return success;
        });
      });
      
      return Promise.all(unregisterPromises);
    }).then(function() {
      console.log('✅ All service workers cleaned up');
      
      // Prevent future service worker registration
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register = function() {
          console.log('🚫 Service worker registration blocked');
          return Promise.reject(new Error('Service worker registration is disabled'));
        };
      }
    }).catch(function(error) {
      console.error('❌ Error cleaning up service workers:', error);
    });
  }
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      console.log('🧹 Found', cacheNames.length, 'caches to clear');
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName).then(function(success) {
            console.log('🗑️ Cache deleted:', cacheName, success);
            return success;
          });
        })
      );
    }).then(function() {
      console.log('✅ All caches cleared');
    }).catch(function(error) {
      console.error('❌ Error clearing caches:', error);
    });
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
