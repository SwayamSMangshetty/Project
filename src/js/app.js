// MindEase - Teen Mental Wellness PWA
// Main application entry point

import { StorageManager } from './storage.js';
import { AIManager } from './ai.js';
import { MoodTracker } from './mood.js';
import { JournalManager } from './journal.js';
import { MeditationManager } from './meditation.js';
import { AuthManager } from './auth.js';
import { PWAManager } from './pwa.js';

class MindEaseApp {
  constructor() {
    this.storage = new StorageManager();
    this.ai = new AIManager(this.storage);
    this.mood = new MoodTracker(this.storage);
    this.journal = new JournalManager(this.storage);
    this.meditation = new MeditationManager();
    this.auth = new AuthManager(this.storage);
    this.pwa = new PWAManager();
    
    this.currentTab = 'chat';
    this.isOnline = navigator.onLine;
    
    this.init();
  }
  
  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen();
      
      // Initialize all managers
      await this.initializeManagers();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize theme
      this.initializeTheme();
      
      // Hide loading screen and show app
      setTimeout(() => {
        this.hideLoadingScreen();
      }, 1500);
      
      console.log('MindEase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MindEase:', error);
      this.showError('Failed to initialize app. Please refresh the page.');
    }
  }
  
  async initializeManagers() {
    // Initialize storage first
    await this.storage.init();
    
    // Initialize other managers
    await this.ai.init();
    await this.mood.init();
    await this.journal.init();
    await this.meditation.init();
    await this.auth.init();
    await this.pwa.init();
  }
  
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Settings modal
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openModal('settings');
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.currentTarget.dataset.modal;
        this.closeModal(modal);
      });
    });
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          const modalId = modal.id.replace('-modal', '');
          this.closeModal(modalId);
        }
      });
    });
    
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Settings form
    this.setupSettingsForm();
  }
  
  setupSettingsForm() {
    // API key inputs
    const apiKeys = ['cohere-key', 'openrouter-key', 'huggingface-key'];
    apiKeys.forEach(keyId => {
      const input = document.getElementById(keyId);
      if (input) {
        // Load saved key
        const savedKey = this.storage.get(`ai_${keyId.replace('-key', '')}_key`);
        if (savedKey) {
          input.value = savedKey;
        }
        
        // Save on change
        input.addEventListener('change', () => {
          const key = keyId.replace('-key', '');
          this.storage.set(`ai_${key}_key`, input.value);
          this.ai.updateApiKey(key, input.value);
        });
      }
    });
    
    // Auth buttons
    document.getElementById('login-btn').addEventListener('click', () => {
      this.handleAuth('login');
    });
    
    document.getElementById('signup-btn').addEventListener('click', () => {
      this.handleAuth('signup');
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.handleAuth('logout');
    });
    
    // Save settings button
    document.querySelector('[data-modal="settings"]').addEventListener('click', () => {
      this.saveSettings();
      this.closeModal('settings');
    });
  }
  
  async handleAuth(action) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    try {
      let result;
      switch (action) {
        case 'login':
          result = await this.auth.login(email, password);
          break;
        case 'signup':
          result = await this.auth.signup(email, password);
          break;
        case 'logout':
          result = await this.auth.logout();
          break;
      }
      
      if (result.success) {
        this.updateAuthUI();
        if (action !== 'logout') {
          this.showSuccess('Authentication successful!');
        }
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showError('Authentication failed. Please try again.');
    }
  }
  
  updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    const syncSection = document.getElementById('sync-section');
    
    if (this.auth.isAuthenticated()) {
      authSection.classList.add('hidden');
      syncSection.classList.remove('hidden');
    } else {
      authSection.classList.remove('hidden');
      syncSection.classList.add('hidden');
    }
  }
  
  saveSettings() {
    // Settings are saved automatically on change
    this.showSuccess('Settings saved successfully!');
  }
  
  switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    this.currentTab = tabName;
    
    // Trigger tab-specific initialization
    this.onTabSwitch(tabName);
  }
  
  onTabSwitch(tabName) {
    switch (tabName) {
      case 'mood':
        this.mood.refreshChart();
        break;
      case 'journal':
        this.journal.refreshEntries();
        break;
      case 'meditation':
        // Meditation tab doesn't need refresh
        break;
      case 'chat':
      default:
        // Focus chat input if online
        if (this.isOnline) {
          setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) chatInput.focus();
          }, 100);
        }
        break;
    }
  }
  
  initializeTheme() {
    const savedTheme = this.storage.get('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    this.setTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.storage.get('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
  
  toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    this.storage.set('theme', newTheme);
  }
  
  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }
  
  updateOnlineStatus() {
    const offlineNotice = document.getElementById('offline-notice');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (this.isOnline) {
      offlineNotice.classList.add('hidden');
      chatInput.disabled = false;
      chatInput.placeholder = "Share what's on your mind...";
    } else {
      offlineNotice.classList.remove('hidden');
      chatInput.disabled = true;
      chatInput.placeholder = "AI chat requires internet connection";
      sendBtn.disabled = true;
    }
  }
  
  openModal(modalName) {
    const modal = document.getElementById(`${modalName}-modal`);
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      const firstInput = modal.querySelector('input, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
      
      // Update auth UI if settings modal
      if (modalName === 'settings') {
        this.updateAuthUI();
      }
    }
  }
  
  closeModal(modalName) {
    const modal = document.getElementById(`${modalName}-modal`);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }
  
  handleKeyboardShortcuts(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal:not(.hidden)');
      if (openModal) {
        const modalId = openModal.id.replace('-modal', '');
        this.closeModal(modalId);
      }
    }
    
    // Tab navigation with Ctrl/Cmd + number
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const tabs = ['chat', 'mood', 'journal', 'meditation'];
      const tabIndex = parseInt(e.key) - 1;
      if (tabs[tabIndex]) {
        this.switchTab(tabs[tabIndex]);
      }
    }
  }
  
  showLoadingScreen() {
    document.getElementById('loading-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
  }
  
  hideLoadingScreen() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
  }
  
  showSuccess(message) {
    this.showNotification(message, 'success');
  }
  
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-lg);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          max-width: 300px;
          animation: slideInRight 0.3s ease-out;
        }
        .notification-success { border-color: var(--success); }
        .notification-error { border-color: var(--danger); }
        .notification-message { font-size: var(--font-size-sm); }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MindEaseApp();
  });
} else {
  new MindEaseApp();
}

// Export for debugging
window.MindEaseApp = MindEaseApp;