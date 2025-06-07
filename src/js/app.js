// MindEase - Teen Mental Wellness PWA
// Enhanced main application with comprehensive mobile UI

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
    this.isMobile = window.innerWidth <= 768;
    
    this.init();
  }
  
  async init() {
    try {
      // Show enhanced loading screen
      this.showLoadingScreen();
      
      // Initialize all managers
      await this.initializeManagers();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize theme
      this.initializeTheme();
      
      // Setup responsive behavior
      this.setupResponsiveFeatures();
      
      // Handle URL parameters
      this.handleURLParameters();
      
      // Hide loading screen and show app
      setTimeout(() => {
        this.hideLoadingScreen();
        this.announceAppReady();
      }, 1800);
      
      console.log('MindEase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MindEase:', error);
      this.showError('Failed to initialize app. Please refresh the page.');
    }
  }
  
  async initializeManagers() {
    // Initialize storage first
    await this.storage.init();
    
    // Initialize other managers in parallel for better performance
    await Promise.all([
      this.ai.init(),
      this.mood.init(),
      this.journal.init(),
      this.meditation.init(),
      this.auth.init(),
      this.pwa.init()
    ]);
  }
  
  setupEventListeners() {
    // Navigation with enhanced accessibility
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
        this.announceTabChange(tab);
      });
      
      // Keyboard navigation
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const tab = e.currentTarget.dataset.tab;
          this.switchTab(tab);
          this.announceTabChange(tab);
        }
      });
    });
    
    // Theme toggle with system preference detection
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Settings modal
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openModal('settings');
    });
    
    // Modal close buttons with escape key support
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
    
    // Enhanced online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
      this.showNotification('🌐 Back online! AI chat is now available.', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
      this.showNotification('📱 You\'re offline. Core features still work!', 'info');
    });
    
    // Responsive design handling
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    // Keyboard shortcuts with accessibility
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Settings form with enhanced UX
    this.setupSettingsForm();
    
    // Floating Action Button for mobile
    this.setupFloatingActionButton();
    
    // Haptic feedback support
    this.setupHapticFeedback();
    
    // Focus management
    this.setupFocusManagement();
  }
  
  setupFloatingActionButton() {
    const fab = document.getElementById('fab-new-entry');
    const newEntryBtn = document.getElementById('new-entry-btn');
    
    if (fab && newEntryBtn) {
      // Show FAB on mobile in journal tab
      const updateFABVisibility = () => {
        if (this.isMobile && this.currentTab === 'journal') {
          fab.style.display = 'flex';
          newEntryBtn.style.display = 'none';
        } else {
          fab.style.display = 'none';
          newEntryBtn.style.display = 'inline-flex';
        }
      };
      
      fab.addEventListener('click', () => {
        this.journal.openNewEntryModal();
        this.triggerHapticFeedback('light');
      });
      
      // Initial setup
      updateFABVisibility();
      
      // Update on tab change
      this.onTabChangeCallbacks = this.onTabChangeCallbacks || [];
      this.onTabChangeCallbacks.push(updateFABVisibility);
    }
  }
  
  setupHapticFeedback() {
    // Add haptic feedback to interactive elements
    const hapticElements = document.querySelectorAll('.nav-item, .primary-btn, .mood-btn, .meditation-btn');
    
    hapticElements.forEach(element => {
      element.addEventListener('click', () => {
        this.triggerHapticFeedback('light');
      });
    });
  }
  
  triggerHapticFeedback(type = 'light') {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([30, 10, 30]);
          break;
      }
    }
  }
  
  setupFocusManagement() {
    // Trap focus in modals
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          this.trapFocus(e, modal);
        }
      });
    });
  }
  
  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
  
  setupResponsiveFeatures() {
    this.handleResize();
    
    // Add touch gesture support for mobile
    if ('ontouchstart' in window) {
      this.setupTouchGestures();
    }
  }
  
  setupTouchGestures() {
    let startX = 0;
    let startY = 0;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Horizontal swipe detection
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe left - next tab
          this.navigateTab('next');
        } else {
          // Swipe right - previous tab
          this.navigateTab('prev');
        }
      }
      
      startX = 0;
      startY = 0;
    });
  }
  
  navigateTab(direction) {
    const tabs = ['chat', 'mood', 'journal', 'meditation'];
    const currentIndex = tabs.indexOf(this.currentTab);
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    
    this.switchTab(tabs[newIndex]);
    this.triggerHapticFeedback('light');
  }
  
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== this.isMobile) {
      // Update FAB visibility
      if (this.onTabChangeCallbacks) {
        this.onTabChangeCallbacks.forEach(callback => callback());
      }
    }
  }
  
  handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const action = urlParams.get('action');
    
    if (tab && ['chat', 'mood', 'journal', 'meditation'].includes(tab)) {
      this.switchTab(tab);
    }
    
    if (action === 'new' && tab === 'journal') {
      setTimeout(() => {
        this.journal.openNewEntryModal();
      }, 2000); // Wait for app to fully load
    }
  }
  
  setupSettingsForm() {
    // API key inputs with enhanced UX
    const apiKeys = ['cohere-key', 'openrouter-key', 'huggingface-key'];
    apiKeys.forEach(keyId => {
      const input = document.getElementById(keyId);
      if (input) {
        // Load saved key
        const savedKey = this.storage.get(`ai_${keyId.replace('-key', '')}_key`);
        if (savedKey) {
          input.value = savedKey;
        }
        
        // Save on change with debouncing
        let saveTimeout;
        input.addEventListener('input', () => {
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            const key = keyId.replace('-key', '');
            this.storage.set(`ai_${key}_key`, input.value);
            this.ai.updateApiKey(key, input.value);
            
            // Show subtle feedback
            input.style.borderColor = 'var(--success)';
            setTimeout(() => {
              input.style.borderColor = '';
            }, 1000);
          }, 500);
        });
        
        // Toggle password visibility
        this.addPasswordToggle(input);
      }
    });
    
    // Auth buttons with loading states
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
  
  addPasswordToggle(input) {
    const wrapper = input.parentNode;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.innerHTML = '👁️';
    toggle.style.cssText = `
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
    `;
    
    wrapper.style.position = 'relative';
    wrapper.appendChild(toggle);
    
    toggle.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = '🙈';
      } else {
        input.type = 'password';
        toggle.innerHTML = '👁️';
      }
    });
  }
  
  async handleAuth(action) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const button = document.getElementById(`${action}-btn`);
    
    // Show loading state
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
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
        this.triggerHapticFeedback('medium');
      } else {
        this.showError(result.error);
        this.triggerHapticFeedback('heavy');
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showError('Authentication failed. Please try again.');
      this.triggerHapticFeedback('heavy');
    } finally {
      // Restore button state
      button.textContent = originalText;
      button.disabled = false;
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
    this.showSuccess('Settings saved successfully!');
    this.triggerHapticFeedback('medium');
  }
  
  switchTab(tabName) {
    // Update navigation with enhanced accessibility
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.setAttribute('aria-selected', 'true');
    }
    
    // Update content with smooth transitions
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      content.setAttribute('aria-hidden', 'true');
    });
    
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
      activeContent.classList.add('active');
      activeContent.setAttribute('aria-hidden', 'false');
    }
    
    this.currentTab = tabName;
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    window.history.replaceState({}, '', url);
    
    // Trigger tab-specific initialization
    this.onTabSwitch(tabName);
    
    // Call registered callbacks
    if (this.onTabChangeCallbacks) {
      this.onTabChangeCallbacks.forEach(callback => callback());
    }
  }
  
  announceTabChange(tabName) {
    // Announce tab change for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Switched to ${tabName} tab`;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  announceAppReady() {
    // Announce app ready for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'MindEase app is ready. Your personal mental wellness sanctuary is now available.';
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 3000);
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
            if (chatInput && !this.isMobile) {
              chatInput.focus();
            }
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
    this.triggerHapticFeedback('light');
    
    // Announce theme change
    this.showNotification(`Switched to ${newTheme} theme`, 'info');
  }
  
  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'light' ? '#6C63FF' : '#1A1B23';
    }
  }
  
  updateOnlineStatus() {
    const offlineNotice = document.getElementById('offline-notice');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (this.isOnline) {
      if (offlineNotice) offlineNotice.classList.add('hidden');
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = "Share what's on your mind...";
      }
    } else {
      if (offlineNotice) offlineNotice.classList.remove('hidden');
      if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = "AI chat requires internet connection";
      }
      if (sendBtn) sendBtn.disabled = true;
    }
  }
  
  openModal(modalName) {
    const modal = document.getElementById(`${modalName}-modal`);
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      
      // Focus management
      const firstFocusable = modal.querySelector('input, textarea, button');
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
      
      // Update auth UI if settings modal
      if (modalName === 'settings') {
        this.updateAuthUI();
      }
      
      this.triggerHapticFeedback('light');
    }
  }
  
  closeModal(modalName) {
    const modal = document.getElementById(`${modalName}-modal`);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      this.triggerHapticFeedback('light');
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
        this.triggerHapticFeedback('light');
      }
    }
    
    // Quick actions
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (this.currentTab === 'journal') {
        this.journal.openNewEntryModal();
        this.triggerHapticFeedback('medium');
      }
    }
  }
  
  showLoadingScreen() {
    document.getElementById('loading-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
  }
  
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainApp = document.getElementById('main-app');
    
    // Smooth transition
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      mainApp.classList.remove('hidden');
      mainApp.style.opacity = '0';
      
      // Fade in main app
      setTimeout(() => {
        mainApp.style.transition = 'opacity 0.5s ease-out';
        mainApp.style.opacity = '1';
      }, 50);
    }, 500);
  }
  
  showSuccess(message) {
    this.showNotification(message, 'success');
  }
  
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  showNotification(message, type = 'info', duration = 4000) {
    // Create enhanced notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notification.innerHTML = `
      <span class="notification-icon" aria-hidden="true">${icon}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    `;
    
    // Add enhanced styles if not already added
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: var(--spacing-lg);
          right: var(--spacing-lg);
          background: var(--bg-overlay);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-floating);
          z-index: var(--z-toast);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          max-width: 400px;
          min-width: 300px;
          animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(20px);
          border-left: 4px solid var(--primary);
        }
        .notification-success { border-left-color: var(--success); }
        .notification-error { border-left-color: var(--danger); }
        .notification-info { border-left-color: var(--secondary); }
        .notification-message { 
          flex: 1;
          font-family: var(--font-secondary);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-normal);
        }
        .notification-close {
          background: none;
          border: none;
          font-size: var(--font-size-lg);
          cursor: pointer;
          color: var(--text-muted);
          transition: color var(--transition-fast);
          padding: var(--spacing-xs);
        }
        .notification-close:hover {
          color: var(--text-primary);
        }
        @keyframes slideInRight {
          from { 
            transform: translateX(100%); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
        @media (max-width: 480px) {
          .notification {
            left: var(--spacing-md);
            right: var(--spacing-md);
            max-width: none;
            min-width: auto;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(notification);
    });
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
  }
  
  removeNotification(notification) {
    if (notification.parentNode) {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }
  
  // Enhanced error handling
  handleError(error, context = 'Unknown') {
    console.error(`Error in ${context}:`, error);
    
    let userMessage = 'Something went wrong. Please try again.';
    
    if (error.message) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('storage')) {
        userMessage = 'Storage error. Please try refreshing the page.';
      }
    }
    
    this.showError(userMessage);
    this.triggerHapticFeedback('heavy');
  }
  
  // Performance monitoring
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
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

// Service Worker registration check
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // This will be handled by PWAManager
  });
}