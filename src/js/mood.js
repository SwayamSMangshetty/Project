// Mood Tracker - Handles mood logging and visualization
// Provides daily mood tracking with historical charts

export class MoodTracker {
  constructor(storage) {
    this.storage = storage;
    this.moodData = [];
    this.selectedMood = null;
    this.chart = null;
  }
  
  async init() {
    // Load existing mood data
    this.moodData = await this.storage.getMoodEntries();
    
    // Set up mood UI
    this.setupMoodUI();
    
    // Render mood chart
    this.renderMoodChart();
    
    console.log('Mood Tracker initialized');
  }
  
  setupMoodUI() {
    // Mood selection buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mood = parseInt(e.currentTarget.dataset.mood);
        this.selectMood(mood);
      });
    });
    
    // Save mood button
    const saveMoodBtn = document.getElementById('save-mood');
    if (saveMoodBtn) {
      saveMoodBtn.addEventListener('click', () => {
        this.saveTodaysMood();
      });
    }
    
    // Check if mood already logged today
    this.checkTodaysMood();
  }
  
  selectMood(moodValue) {
    // Update UI
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    document.querySelector(`[data-mood="${moodValue}"]`).classList.add('selected');
    
    // Update state
    this.selectedMood = moodValue;
    
    // Enable save button
    const saveMoodBtn = document.getElementById('save-mood');
    if (saveMoodBtn) {
      saveMoodBtn.disabled = false;
    }
  }
  
  async saveTodaysMood() {
    if (this.selectedMood === null) return;
    
    const today = new Date().toISOString().split('T')[0];
    const moodEntry = {
      id: `mood_${today}`,
      date: today,
      mood: this.selectedMood,
      timestamp: Date.now()
    };
    
    try {
      // Save to storage
      await this.storage.saveMoodEntry(moodEntry);
      
      // Update local data
      const existingIndex = this.moodData.findIndex(entry => entry.date === today);
      if (existingIndex >= 0) {
        this.moodData[existingIndex] = moodEntry;
      } else {
        this.moodData.push(moodEntry);
        this.moodData.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      
      // Update UI
      this.showMoodSaved();
      this.renderMoodChart();
      
      // Disable save button and show success
      const saveMoodBtn = document.getElementById('save-mood');
      if (saveMoodBtn) {
        saveMoodBtn.disabled = true;
        saveMoodBtn.textContent = '✓ Mood Saved';
        setTimeout(() => {
          saveMoodBtn.textContent = 'Save Today\'s Mood';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Failed to save mood:', error);
      this.showError('Failed to save mood. Please try again.');
    }
  }
  
  checkTodaysMood() {
    const today = new Date().toISOString().split('T')[0];
    const todaysMood = this.moodData.find(entry => entry.date === today);
    
    if (todaysMood) {
      // Select today's mood
      this.selectMood(todaysMood.mood);
      
      // Disable save button
      const saveMoodBtn = document.getElementById('save-mood');
      if (saveMoodBtn) {
        saveMoodBtn.disabled = true;
        saveMoodBtn.textContent = '✓ Already Logged Today';
      }
    }
  }
  
  renderMoodChart() {
    const chartContainer = document.getElementById('mood-chart');
    if (!chartContainer) return;
    
    if (this.moodData.length === 0) {
      chartContainer.innerHTML = `
        <div class="no-data">
          <span>📈</span>
          <p>Start tracking your mood to see patterns over time</p>
        </div>
      `;
      return;
    }
    
    // Create simple chart visualization
    this.createSimpleChart(chartContainer);
  }
  
  createSimpleChart(container) {
    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentData = this.moodData.filter(entry => 
      new Date(entry.date) >= thirtyDaysAgo
    );
    
    if (recentData.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <span>📈</span>
          <p>No recent mood data to display</p>
        </div>
      `;
      return;
    }
    
    // Create chart HTML
    const chartHTML = `
      <div class="mood-chart-container">
        <div class="chart-header">
          <h4>Last 30 Days</h4>
          <div class="chart-legend">
            <span class="legend-item">😢 Very Low</span>
            <span class="legend-item">😔 Low</span>
            <span class="legend-item">😐 Neutral</span>
            <span class="legend-item">🙂 Good</span>
            <span class="legend-item">😊 Great</span>
          </div>
        </div>
        <div class="chart-grid">
          ${this.generateChartBars(recentData)}
        </div>
        <div class="chart-stats">
          ${this.generateMoodStats(recentData)}
        </div>
      </div>
    `;
    
    container.innerHTML = chartHTML;
    
    // Add chart styles if not already added
    this.addChartStyles();
  }
  
  generateChartBars(data) {
    const maxMood = 5;
    const bars = data.map(entry => {
      const height = (entry.mood / maxMood) * 100;
      const moodEmoji = this.getMoodEmoji(entry.mood);
      const date = new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      return `
        <div class="chart-bar" title="${date}: ${moodEmoji}">
          <div class="bar-fill" style="height: ${height}%; background: ${this.getMoodColor(entry.mood)}"></div>
          <div class="bar-label">${date}</div>
        </div>
      `;
    }).join('');
    
    return bars;
  }
  
  generateMoodStats(data) {
    if (data.length === 0) return '';
    
    const average = data.reduce((sum, entry) => sum + entry.mood, 0) / data.length;
    const mostCommon = this.getMostCommonMood(data);
    const trend = this.getMoodTrend(data);
    
    return `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Average</span>
          <span class="stat-value">${this.getMoodEmoji(Math.round(average))}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Most Common</span>
          <span class="stat-value">${this.getMoodEmoji(mostCommon)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Trend</span>
          <span class="stat-value">${trend}</span>
        </div>
      </div>
    `;
  }
  
  getMoodEmoji(mood) {
    const emojis = ['', '😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood] || '😐';
  }
  
  getMoodColor(mood) {
    const colors = [
      '',
      '#FF9191', // Very Low - soft red
      '#FFB366', // Low - soft orange  
      '#FFD991', // Neutral - soft yellow
      '#91FFB8', // Good - soft green
      '#91C7FF'  // Great - soft blue
    ];
    return colors[mood] || '#FFD991';
  }
  
  getMostCommonMood(data) {
    const moodCounts = {};
    data.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    return parseInt(Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b
    ));
  }
  
  getMoodTrend(data) {
    if (data.length < 2) return '📊';
    
    const recent = data.slice(-7); // Last 7 entries
    const older = data.slice(-14, -7); // Previous 7 entries
    
    if (older.length === 0) return '📊';
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 0.3) return '📈'; // Improving
    if (diff < -0.3) return '📉'; // Declining
    return '➡️'; // Stable
  }
  
  addChartStyles() {
    if (document.querySelector('#mood-chart-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'mood-chart-styles';
    styles.textContent = `
      .mood-chart-container {
        padding: var(--spacing-lg);
      }
      
      .chart-header {
        margin-bottom: var(--spacing-lg);
      }
      
      .chart-header h4 {
        font-size: var(--font-size-lg);
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
        color: var(--text-primary);
      }
      
      .chart-legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        font-size: var(--font-size-xs);
        color: var(--text-muted);
      }
      
      .chart-grid {
        display: flex;
        gap: var(--spacing-xs);
        align-items: end;
        height: 150px;
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-sm) 0;
        overflow-x: auto;
      }
      
      .chart-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 30px;
        height: 100%;
        position: relative;
      }
      
      .bar-fill {
        width: 20px;
        min-height: 4px;
        border-radius: 2px;
        transition: all var(--transition-fast);
        margin-bottom: var(--spacing-xs);
      }
      
      .bar-label {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        text-align: center;
        transform: rotate(-45deg);
        white-space: nowrap;
      }
      
      .chart-bar:hover .bar-fill {
        transform: scaleY(1.1);
        box-shadow: var(--shadow-sm);
      }
      
      .chart-stats {
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: var(--spacing-md);
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-label {
        display: block;
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        margin-bottom: var(--spacing-xs);
      }
      
      .stat-value {
        font-size: var(--font-size-lg);
        font-weight: 600;
      }
      
      @media (max-width: 480px) {
        .chart-legend {
          font-size: 10px;
        }
        
        .chart-grid {
          height: 120px;
        }
        
        .bar-label {
          font-size: 10px;
        }
        
        .stats-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  refreshChart() {
    this.renderMoodChart();
  }
  
  showMoodSaved() {
    // Create a temporary success message
    const message = document.createElement('div');
    message.className = 'mood-success';
    message.innerHTML = '✓ Mood saved successfully!';
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--success);
      color: var(--text-inverse);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-weight: 500;
      z-index: 10000;
      animation: fadeInOut 2s ease-in-out;
    `;
    
    // Add animation keyframes if not already added
    if (!document.querySelector('#mood-success-styles')) {
      const styles = document.createElement('style');
      styles.id = 'mood-success-styles';
      styles.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 2000);
  }
  
  showError(message) {
    console.error('Mood Tracker Error:', message);
    // You could implement a toast notification here
  }
  
  // Export mood data for backup
  exportMoodData() {
    return {
      moods: this.moodData,
      exported_at: new Date().toISOString()
    };
  }
  
  // Import mood data from backup
  async importMoodData(data) {
    if (data.moods && Array.isArray(data.moods)) {
      for (const entry of data.moods) {
        await this.storage.saveMoodEntry(entry);
      }
      
      // Reload data
      this.moodData = await this.storage.getMoodEntries();
      this.renderMoodChart();
      this.checkTodaysMood();
      
      return true;
    }
    return false;
  }
}