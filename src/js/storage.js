// Storage Manager - Handles local storage and IndexedDB operations
// Provides offline-first data persistence with optional cloud sync

export class StorageManager {
  constructor() {
    this.dbName = 'MindEaseDB';
    this.dbVersion = 1;
    this.db = null;
    this.stores = {
      journal: 'journal_entries',
      mood: 'mood_data',
      settings: 'app_settings',
      chat: 'chat_history'
    };
  }
  
  async init() {
    try {
      await this.initIndexedDB();
      console.log('Storage initialized successfully');
    } catch (error) {
      console.error('Storage initialization failed:', error);
      // Fallback to localStorage only
    }
  }
  
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(this.stores.journal)) {
          const journalStore = db.createObjectStore(this.stores.journal, { keyPath: 'id' });
          journalStore.createIndex('date', 'date', { unique: false });
          journalStore.createIndex('created_at', 'created_at', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.stores.mood)) {
          const moodStore = db.createObjectStore(this.stores.mood, { keyPath: 'id' });
          moodStore.createIndex('date', 'date', { unique: true });
        }
        
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains(this.stores.chat)) {
          const chatStore = db.createObjectStore(this.stores.chat, { keyPath: 'id' });
          chatStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  // Generic localStorage methods
  set(key, value) {
    try {
      localStorage.setItem(`mindease_${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }
  
  get(key) {
    try {
      const item = localStorage.getItem(`mindease_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }
  
  remove(key) {
    try {
      localStorage.removeItem(`mindease_${key}`);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  }
  
  // IndexedDB methods for complex data
  async saveToIndexedDB(storeName, data) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.put(data);
      return true;
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
      return false;
    }
  }
  
  async getFromIndexedDB(storeName, key) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to read from IndexedDB:', error);
      return null;
    }
  }
  
  async getAllFromIndexedDB(storeName) {
    if (!this.db) return [];
    
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to read all from IndexedDB:', error);
      return [];
    }
  }
  
  async deleteFromIndexedDB(storeName, key) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.delete(key);
      return true;
    } catch (error) {
      console.error('Failed to delete from IndexedDB:', error);
      return false;
    }
  }
  
  // Journal-specific methods
  async saveJournalEntry(entry) {
    const success = await this.saveToIndexedDB(this.stores.journal, entry);
    if (!success) {
      // Fallback to localStorage
      const entries = this.get('journal_entries') || [];
      const existingIndex = entries.findIndex(e => e.id === entry.id);
      if (existingIndex >= 0) {
        entries[existingIndex] = entry;
      } else {
        entries.push(entry);
      }
      return this.set('journal_entries', entries);
    }
    return success;
  }
  
  async getJournalEntries() {
    const entries = await this.getAllFromIndexedDB(this.stores.journal);
    if (entries.length > 0) {
      return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    // Fallback to localStorage
    const localEntries = this.get('journal_entries') || [];
    return localEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  async deleteJournalEntry(id) {
    const success = await this.deleteFromIndexedDB(this.stores.journal, id);
    if (!success) {
      // Fallback to localStorage
      const entries = this.get('journal_entries') || [];
      const filteredEntries = entries.filter(e => e.id !== id);
      return this.set('journal_entries', filteredEntries);
    }
    return success;
  }
  
  // Mood-specific methods
  async saveMoodEntry(entry) {
    const success = await this.saveToIndexedDB(this.stores.mood, entry);
    if (!success) {
      // Fallback to localStorage
      const moods = this.get('mood_entries') || [];
      const existingIndex = moods.findIndex(m => m.date === entry.date);
      if (existingIndex >= 0) {
        moods[existingIndex] = entry;
      } else {
        moods.push(entry);
      }
      return this.set('mood_entries', moods);
    }
    return success;
  }
  
  async getMoodEntries() {
    const entries = await this.getAllFromIndexedDB(this.stores.mood);
    if (entries.length > 0) {
      return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    // Fallback to localStorage
    const localEntries = this.get('mood_entries') || [];
    return localEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  // Chat history methods
  async saveChatMessage(message) {
    const success = await this.saveToIndexedDB(this.stores.chat, message);
    if (!success) {
      // Fallback to localStorage
      const messages = this.get('chat_history') || [];
      messages.push(message);
      // Keep only last 100 messages in localStorage
      if (messages.length > 100) {
        messages.splice(0, messages.length - 100);
      }
      return this.set('chat_history', messages);
    }
    return success;
  }
  
  async getChatHistory() {
    const messages = await this.getAllFromIndexedDB(this.stores.chat);
    if (messages.length > 0) {
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // Fallback to localStorage
    return this.get('chat_history') || [];
  }
  
  async clearChatHistory() {
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.stores.chat], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
      } catch (error) {
        console.error('Failed to clear chat history from IndexedDB:', error);
      }
    }
    
    // Also clear localStorage
    this.remove('chat_history');
  }
  
  // Data export/import for backup
  async exportData() {
    const data = {
      journal: await this.getJournalEntries(),
      mood: await this.getMoodEntries(),
      chat: await this.getChatHistory(),
      settings: {
        theme: this.get('theme'),
        // Don't export API keys for security
      },
      exported_at: new Date().toISOString()
    };
    
    return data;
  }
  
  async importData(data) {
    try {
      // Import journal entries
      if (data.journal && Array.isArray(data.journal)) {
        for (const entry of data.journal) {
          await this.saveJournalEntry(entry);
        }
      }
      
      // Import mood entries
      if (data.mood && Array.isArray(data.mood)) {
        for (const entry of data.mood) {
          await this.saveMoodEntry(entry);
        }
      }
      
      // Import settings (excluding sensitive data)
      if (data.settings) {
        if (data.settings.theme) {
          this.set('theme', data.settings.theme);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
  
  // Storage usage information
  async getStorageInfo() {
    const info = {
      localStorage: {
        used: 0,
        available: true
      },
      indexedDB: {
        used: 0,
        available: !!this.db
      }
    };
    
    // Calculate localStorage usage
    try {
      let localStorageSize = 0;
      for (let key in localStorage) {
        if (key.startsWith('mindease_')) {
          localStorageSize += localStorage[key].length;
        }
      }
      info.localStorage.used = localStorageSize;
    } catch (error) {
      info.localStorage.available = false;
    }
    
    // IndexedDB usage is harder to calculate, but we can count records
    if (this.db) {
      try {
        const journalCount = (await this.getAllFromIndexedDB(this.stores.journal)).length;
        const moodCount = (await this.getAllFromIndexedDB(this.stores.mood)).length;
        const chatCount = (await this.getAllFromIndexedDB(this.stores.chat)).length;
        
        info.indexedDB.records = {
          journal: journalCount,
          mood: moodCount,
          chat: chatCount
        };
      } catch (error) {
        console.error('Failed to get IndexedDB info:', error);
      }
    }
    
    return info;
  }
}