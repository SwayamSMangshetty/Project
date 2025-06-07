// PWA Manager - Handles Progressive Web App functionality
// Manages service worker, installation, and offline capabilities

export class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.serviceWorker = null;
  }
  
  async init() {
    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Set up install prompt
      this.setupInstallPrompt();
      
      // Set up online/offline detection
      this.setupOnlineDetection();
      
      // Check if already installed
      this.checkInstallStatus();
      
      console.log('PWA Manager initialized');
    } catch (error) {
      console.error('PWA initialization failed:', error);
    }
  }
  
  async registerServiceWorker() {
    // Check if running in StackBlitz/WebContainer environment
    const hostname = window.location.hostname;
    if (hostname.includes('stackblitz.io') || hostname.includes('webcontainer.io') || hostname === 'localhost') {
      console.warn('Service Worker registration skipped: Not supported in this environment');
      return;
    }
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration;
        
        console.log('Service Worker registered successfully');
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          }
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Save the event so it can be triggered later
      this.deferredPrompt = e;
      
      // Show custom install prompt
      this.showInstallPrompt();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallPrompt();
    });
  }
  
  showInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt && !this.isInstalled) {
      installPrompt.classList.remove('hidden');
      
      // Set up install prompt buttons
      const installAccept = document.getElementById('install-accept');
      const installDismiss = document.getElementById('install-dismiss');
      
      if (installAccept) {
        installAccept.addEventListener('click', () => {
          this.installApp();
        });
      }
      
      if (installDismiss) {
        installDismiss.addEventListener('click', () => {
          this.hideInstallPrompt();
        });
      }
    }
  }
  
  hideInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) {
      installPrompt.classList.add('hidden');
    }
  }
  
  async installApp() {
    if (!this.deferredPrompt) return;
    
    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      this.deferredPrompt = null;
      this.hideInstallPrompt();
      
    } catch (error) {
      console.error('Install failed:', error);
    }
  }
  
  checkInstallStatus() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('App is running in standalone mode');
    }
    
    // Check if running as PWA on iOS
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('App is running as PWA on iOS');
    }
  }
  
  setupOnlineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange();
    });
  }
  
  handleOnlineStatusChange() {
    // Update UI based on online status
    const offlineNotice = document.getElementById('offline-notice');
    
    if (this.isOnline) {
      if (offlineNotice) {
        offlineNotice.classList.add('hidden');
      }
      this.showOnlineNotification();
    } else {
      if (offlineNotice) {
        offlineNotice.classList.remove('hidden');
      }
      this.showOfflineNotification();
    }
  }
  
  showOnlineNotification() {
    this.showNotification('🌐 Back online! AI chat is now available.', 'success');
  }
  
  showOfflineNotification() {
    this.showNotification('📱 You\'re offline. Core features still work!', 'info');
  }
  
  showUpdateAvailable() {
    this.showNotification(
      '🔄 A new version is available! Refresh to update.',
      'info',
      () => {
        window.location.reload();
      }
    );
  }
  
  showNotification(message, type = 'info', action = null) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `pwa-notification pwa-notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      ${action ? '<button class="notification-action">Update</button>' : ''}
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#pwa-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'pwa-notification-styles';
      styles.textContent = `
        .pwa-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-lg);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          max-width: 90vw;
          animation: slideInDown 0.3s ease-out;
        }
        .pwa-notification-success { border-color: var(--success); }
        .pwa-notification-error { border-color: var(--danger); }
        .pwa-notification-info { border-color: var(--secondary); }
        .notification-message { font-size: var(--font-size-sm); }
        .notification-action {
          background: var(--primary);
          color: var(--text-inverse);
          border: none;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          cursor: pointer;
        }
        @keyframes slideInDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Add action listener
    if (action) {
      const actionBtn = notification.querySelector('.notification-action');
      if (actionBtn) {
        actionBtn.addEventListener('click', action);
      }
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 5 seconds (or 10 for updates)
    const duration = action ? 10000 : 5000;
    setTimeout(() => {
      notification.style.animation = 'slideInDown 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
  
  // Cache management
  async clearCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Cache cleared successfully');
        return true;
      } catch (error) {
        console.error('Failed to clear cache:', error);
        return false;
      }
    }
    return false;
  }
  
  // Get cache size (approximate)
  async getCacheSize() {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      } catch (error) {
        console.error('Failed to get cache size:', error);
      }
    }
    return null;
  }
  
  // Force update
  async forceUpdate() {
    if (this.serviceWorker) {
      try {
        await this.serviceWorker.update();
        window.location.reload();
      } catch (error) {
        console.error('Failed to force update:', error);
      }
    }
  }
  
  // Get PWA status
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      hasServiceWorker: !!this.serviceWorker,
      canInstall: !!this.deferredPrompt
    };
  }
  
  // Share API (if available)
  async share(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    return false;
  }
  
  // Notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  
  // Show local notification
  showLocalNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options
      });
    }
    return null;
  }
}