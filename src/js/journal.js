// Journal Manager - Handles journal entries with full CRUD operations
// Provides rich text editing and local storage with cloud sync

export class JournalManager {
  constructor(storage) {
    this.storage = storage;
    this.entries = [];
    this.currentEntry = null;
    this.isEditing = false;
  }
  
  async init() {
    // Load existing entries
    this.entries = await this.storage.getJournalEntries();
    
    // Set up journal UI
    this.setupJournalUI();
    
    // Render entries
    this.renderEntries();
    
    console.log('Journal Manager initialized');
  }
  
  setupJournalUI() {
    // New entry button
    const newEntryBtn = document.getElementById('new-entry-btn');
    if (newEntryBtn) {
      newEntryBtn.addEventListener('click', () => {
        this.openNewEntryModal();
      });
    }
    
    // Save entry button
    const saveEntryBtn = document.getElementById('save-entry');
    if (saveEntryBtn) {
      saveEntryBtn.addEventListener('click', () => {
        this.saveCurrentEntry();
      });
    }
    
    // Delete entry button
    const deleteEntryBtn = document.getElementById('delete-entry');
    if (deleteEntryBtn) {
      deleteEntryBtn.addEventListener('click', () => {
        this.deleteCurrentEntry();
      });
    }
    
    // Auto-save functionality
    const titleInput = document.getElementById('journal-title');
    const contentTextarea = document.getElementById('journal-content');
    
    if (titleInput && contentTextarea) {
      let autoSaveTimeout;
      
      const autoSave = () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
          if (this.currentEntry && this.isEditing) {
            this.autoSaveEntry();
          }
        }, 2000); // Auto-save after 2 seconds of inactivity
      };
      
      titleInput.addEventListener('input', autoSave);
      contentTextarea.addEventListener('input', autoSave);
    }
  }
  
  renderEntries() {
    const entriesContainer = document.getElementById('journal-entries');
    if (!entriesContainer) return;
    
    if (this.entries.length === 0) {
      entriesContainer.innerHTML = `
        <div class="no-entries">
          <span>📔</span>
          <p>Your thoughts and reflections will appear here</p>
        </div>
      `;
      return;
    }
    
    const entriesHTML = this.entries.map(entry => this.createEntryHTML(entry)).join('');
    entriesContainer.innerHTML = entriesHTML;
    
    // Add click listeners to entries
    entriesContainer.querySelectorAll('.journal-entry').forEach(entryElement => {
      entryElement.addEventListener('click', () => {
        const entryId = entryElement.dataset.entryId;
        this.openEntry(entryId);
      });
    });
  }
  
  createEntryHTML(entry) {
    const date = new Date(entry.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const title = entry.title || 'Untitled Entry';
    const preview = this.createPreview(entry.content);
    
    return `
      <div class="journal-entry" data-entry-id="${entry.id}">
        <div class="entry-header">
          <div>
            <div class="entry-title">${this.escapeHtml(title)}</div>
            <div class="entry-date">${date}</div>
          </div>
        </div>
        <div class="entry-preview">${this.escapeHtml(preview)}</div>
      </div>
    `;
  }
  
  createPreview(content) {
    if (!content) return 'No content';
    
    // Remove extra whitespace and limit to 150 characters
    const cleaned = content.replace(/\s+/g, ' ').trim();
    return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  openNewEntryModal() {
    this.currentEntry = {
      id: this.generateId(),
      title: '',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.isEditing = true;
    this.populateModal();
    this.openModal();
  }
  
  openEntry(entryId) {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    this.currentEntry = { ...entry }; // Create a copy
    this.isEditing = true;
    this.populateModal();
    this.openModal();
  }
  
  populateModal() {
    const titleInput = document.getElementById('journal-title');
    const contentTextarea = document.getElementById('journal-content');
    const modalTitle = document.getElementById('journal-modal-title');
    const deleteBtn = document.getElementById('delete-entry');
    
    if (titleInput) titleInput.value = this.currentEntry.title || '';
    if (contentTextarea) contentTextarea.value = this.currentEntry.content || '';
    
    if (modalTitle) {
      modalTitle.textContent = this.currentEntry.title ? 'Edit Entry' : 'New Entry';
    }
    
    if (deleteBtn) {
      // Show delete button only for existing entries
      const isNewEntry = !this.entries.find(e => e.id === this.currentEntry.id);
      deleteBtn.classList.toggle('hidden', isNewEntry);
    }
  }
  
  openModal() {
    const modal = document.getElementById('journal-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      
      // Focus title input
      setTimeout(() => {
        const titleInput = document.getElementById('journal-title');
        if (titleInput) titleInput.focus();
      }, 100);
    }
  }
  
  closeModal() {
    const modal = document.getElementById('journal-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
    
    this.currentEntry = null;
    this.isEditing = false;
  }
  
  async saveCurrentEntry() {
    if (!this.currentEntry) return;
    
    const titleInput = document.getElementById('journal-title');
    const contentTextarea = document.getElementById('journal-content');
    
    if (!titleInput || !contentTextarea) return;
    
    // Update entry data
    this.currentEntry.title = titleInput.value.trim();
    this.currentEntry.content = contentTextarea.value.trim();
    this.currentEntry.updated_at = new Date().toISOString();
    
    // Validate entry
    if (!this.currentEntry.content) {
      this.showError('Please write something before saving.');
      return;
    }
    
    try {
      // Save to storage
      await this.storage.saveJournalEntry(this.currentEntry);
      
      // Update local entries array
      const existingIndex = this.entries.findIndex(e => e.id === this.currentEntry.id);
      if (existingIndex >= 0) {
        this.entries[existingIndex] = { ...this.currentEntry };
      } else {
        this.entries.unshift({ ...this.currentEntry });
      }
      
      // Re-render entries
      this.renderEntries();
      
      // Close modal
      this.closeModal();
      
      // Show success message
      this.showSuccess('Entry saved successfully!');
      
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      this.showError('Failed to save entry. Please try again.');
    }
  }
  
  async autoSaveEntry() {
    if (!this.currentEntry || !this.isEditing) return;
    
    const titleInput = document.getElementById('journal-title');
    const contentTextarea = document.getElementById('journal-content');
    
    if (!titleInput || !contentTextarea) return;
    
    // Update entry data
    this.currentEntry.title = titleInput.value.trim();
    this.currentEntry.content = contentTextarea.value.trim();
    this.currentEntry.updated_at = new Date().toISOString();
    
    // Only auto-save if there's content
    if (this.currentEntry.content) {
      try {
        await this.storage.saveJournalEntry(this.currentEntry);
        
        // Update local entries array
        const existingIndex = this.entries.findIndex(e => e.id === this.currentEntry.id);
        if (existingIndex >= 0) {
          this.entries[existingIndex] = { ...this.currentEntry };
        } else {
          this.entries.unshift({ ...this.currentEntry });
        }
        
        // Show subtle auto-save indicator
        this.showAutoSaveIndicator();
        
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }
  
  async deleteCurrentEntry() {
    if (!this.currentEntry) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete from storage
      await this.storage.deleteJournalEntry(this.currentEntry.id);
      
      // Remove from local entries array
      this.entries = this.entries.filter(e => e.id !== this.currentEntry.id);
      
      // Re-render entries
      this.renderEntries();
      
      // Close modal
      this.closeModal();
      
      // Show success message
      this.showSuccess('Entry deleted successfully.');
      
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      this.showError('Failed to delete entry. Please try again.');
    }
  }
  
  refreshEntries() {
    this.renderEntries();
  }
  
  generateId() {
    return 'journal_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  showAutoSaveIndicator() {
    const saveBtn = document.getElementById('save-entry');
    if (saveBtn) {
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✓ Auto-saved';
      saveBtn.style.opacity = '0.7';
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.opacity = '1';
      }, 1500);
    }
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
    notification.className = `journal-notification journal-notification-${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#journal-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'journal-notification-styles';
      styles.textContent = `
        .journal-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-lg);
          z-index: 10001;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          max-width: 300px;
          animation: slideInRight 0.3s ease-out;
        }
        .journal-notification-success { border-color: var(--success); }
        .journal-notification-error { border-color: var(--danger); }
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
  
  // Search functionality
  searchEntries(query) {
    if (!query.trim()) {
      return this.entries;
    }
    
    const searchTerm = query.toLowerCase();
    return this.entries.filter(entry => 
      (entry.title && entry.title.toLowerCase().includes(searchTerm)) ||
      (entry.content && entry.content.toLowerCase().includes(searchTerm))
    );
  }
  
  // Export journal data for backup
  exportJournalData() {
    return {
      entries: this.entries,
      exported_at: new Date().toISOString()
    };
  }
  
  // Import journal data from backup
  async importJournalData(data) {
    if (data.entries && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        await this.storage.saveJournalEntry(entry);
      }
      
      // Reload entries
      this.entries = await this.storage.getJournalEntries();
      this.renderEntries();
      
      return true;
    }
    return false;
  }
  
  // Get entry statistics
  getStatistics() {
    const totalEntries = this.entries.length;
    const totalWords = this.entries.reduce((sum, entry) => {
      return sum + (entry.content ? entry.content.split(/\s+/).length : 0);
    }, 0);
    
    const averageWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    
    // Get writing streak (consecutive days with entries)
    const streak = this.calculateWritingStreak();
    
    return {
      totalEntries,
      totalWords,
      averageWords,
      writingStreak: streak
    };
  }
  
  calculateWritingStreak() {
    if (this.entries.length === 0) return 0;
    
    const today = new Date();
    const entryDates = this.entries
      .map(entry => new Date(entry.created_at).toDateString())
      .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b) - new Date(a)); // Sort descending
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const entryDate of entryDates) {
      const entryDateObj = new Date(entryDate);
      const diffDays = Math.floor((currentDate - entryDateObj) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = new Date(entryDateObj);
      } else {
        break;
      }
    }
    
    return streak;
  }
}