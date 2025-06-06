// Authentication Manager - Handles Supabase authentication
// Provides optional cloud sync for user data

export class AuthManager {
  constructor(storage) {
    this.storage = storage;
    this.supabase = null;
    this.user = null;
    this.isInitialized = false;
  }
  
  async init() {
    try {
      // Only initialize Supabase if environment variables are available
      if (this.hasSupabaseConfig()) {
        await this.initializeSupabase();
      } else {
        console.log('Supabase not configured - running in offline-only mode');
      }
      
      this.isInitialized = true;
      console.log('Auth Manager initialized');
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Continue without auth - app should work offline
    }
  }
  
  hasSupabaseConfig() {
    // Check if Supabase environment variables are available
    return !!(import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY);
  }
  
  async initializeSupabase() {
    try {
      // Dynamic import to avoid errors if Supabase is not available
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check for existing session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        this.user = session.user;
      }
      
      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.user = session?.user || null;
        this.handleAuthChange(event, session);
      });
      
      console.log('Supabase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      this.supabase = null;
    }
  }
  
  handleAuthChange(event, session) {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_IN') {
      this.onSignIn(session.user);
    } else if (event === 'SIGNED_OUT') {
      this.onSignOut();
    }
  }
  
  async onSignIn(user) {
    console.log('User signed in:', user.email);
    
    // Optionally sync local data to cloud
    try {
      await this.syncDataToCloud();
    } catch (error) {
      console.error('Failed to sync data to cloud:', error);
    }
  }
  
  onSignOut() {
    console.log('User signed out');
    // Data remains local, no need to clear anything
  }
  
  async signup(email, password) {
    if (!this.supabase) {
      return { success: false, error: 'Cloud sync not available' };
    }
    
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { 
        success: true, 
        user: data.user,
        message: 'Account created successfully!'
      };
    } catch (error) {
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }
  
  async login(email, password) {
    if (!this.supabase) {
      return { success: false, error: 'Cloud sync not available' };
    }
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { 
        success: true, 
        user: data.user,
        message: 'Logged in successfully!'
      };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }
  
  async logout() {
    if (!this.supabase) {
      return { success: false, error: 'Not logged in' };
    }
    
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { 
        success: true,
        message: 'Logged out successfully!'
      };
    } catch (error) {
      return { success: false, error: 'Logout failed. Please try again.' };
    }
  }
  
  isAuthenticated() {
    return !!this.user;
  }
  
  getUser() {
    return this.user;
  }
  
  async syncDataToCloud() {
    if (!this.supabase || !this.user) {
      return false;
    }
    
    try {
      // Get local data
      const journalEntries = await this.storage.getJournalEntries();
      const moodEntries = await this.storage.getMoodEntries();
      
      // Sync journal entries
      for (const entry of journalEntries) {
        await this.syncJournalEntry(entry);
      }
      
      // Sync mood entries
      for (const entry of moodEntries) {
        await this.syncMoodEntry(entry);
      }
      
      console.log('Data synced to cloud successfully');
      return true;
    } catch (error) {
      console.error('Failed to sync data to cloud:', error);
      return false;
    }
  }
  
  async syncJournalEntry(entry) {
    if (!this.supabase || !this.user) return;
    
    try {
      const { error } = await this.supabase
        .from('journal_entries')
        .upsert({
          id: entry.id,
          user_id: this.user.id,
          title: entry.title,
          content: entry.content,
          created_at: entry.created_at,
          updated_at: entry.updated_at
        });
      
      if (error) {
        console.error('Failed to sync journal entry:', error);
      }
    } catch (error) {
      console.error('Journal sync error:', error);
    }
  }
  
  async syncMoodEntry(entry) {
    if (!this.supabase || !this.user) return;
    
    try {
      const { error } = await this.supabase
        .from('mood_entries')
        .upsert({
          id: entry.id,
          user_id: this.user.id,
          date: entry.date,
          mood: entry.mood,
          timestamp: entry.timestamp
        });
      
      if (error) {
        console.error('Failed to sync mood entry:', error);
      }
    } catch (error) {
      console.error('Mood sync error:', error);
    }
  }
  
  async syncDataFromCloud() {
    if (!this.supabase || !this.user) {
      return false;
    }
    
    try {
      // Fetch journal entries from cloud
      const { data: journalEntries, error: journalError } = await this.supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', this.user.id);
      
      if (journalError) {
        console.error('Failed to fetch journal entries:', journalError);
      } else if (journalEntries) {
        // Save to local storage
        for (const entry of journalEntries) {
          await this.storage.saveJournalEntry(entry);
        }
      }
      
      // Fetch mood entries from cloud
      const { data: moodEntries, error: moodError } = await this.supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', this.user.id);
      
      if (moodError) {
        console.error('Failed to fetch mood entries:', moodError);
      } else if (moodEntries) {
        // Save to local storage
        for (const entry of moodEntries) {
          await this.storage.saveMoodEntry(entry);
        }
      }
      
      console.log('Data synced from cloud successfully');
      return true;
    } catch (error) {
      console.error('Failed to sync data from cloud:', error);
      return false;
    }
  }
  
  async deleteAccount() {
    if (!this.supabase || !this.user) {
      return { success: false, error: 'Not logged in' };
    }
    
    try {
      // Delete user data from cloud
      await this.supabase
        .from('journal_entries')
        .delete()
        .eq('user_id', this.user.id);
      
      await this.supabase
        .from('mood_entries')
        .delete()
        .eq('user_id', this.user.id);
      
      // Note: Actual user account deletion would require admin privileges
      // For now, we just sign out the user
      await this.logout();
      
      return { 
        success: true,
        message: 'Account data deleted successfully!'
      };
    } catch (error) {
      return { success: false, error: 'Failed to delete account. Please try again.' };
    }
  }
  
  // Get sync status
  getSyncStatus() {
    return {
      available: !!this.supabase,
      authenticated: this.isAuthenticated(),
      user: this.user ? {
        email: this.user.email,
        id: this.user.id
      } : null
    };
  }
}