// Meditation Manager - Handles guided meditation sessions
// Provides offline meditation content with timer functionality

export class MeditationManager {
  constructor() {
    this.currentSession = null;
    this.timer = null;
    this.isPlaying = false;
    this.timeRemaining = 0;
    
    this.meditations = {
      breathing: {
        title: 'Deep Breathing',
        duration: 5, // minutes
        icon: '🫁',
        description: '5-minute guided breathing exercise',
        instructions: [
          { time: 0, text: "Welcome to your breathing meditation. Find a comfortable position and close your eyes if you'd like." },
          { time: 30, text: "Begin by taking a deep breath in through your nose for 4 counts..." },
          { time: 35, text: "Hold your breath for 4 counts..." },
          { time: 40, text: "Now exhale slowly through your mouth for 6 counts..." },
          { time: 50, text: "Continue this pattern: breathe in for 4, hold for 4, exhale for 6." },
          { time: 120, text: "You're doing great. Focus only on your breath, letting other thoughts drift away." },
          { time: 180, text: "If your mind wanders, gently bring your attention back to your breathing." },
          { time: 240, text: "Notice how your body feels more relaxed with each breath." },
          { time: 270, text: "We're halfway through. Keep breathing deeply and steadily." },
          { time: 300, text: "You're doing wonderfully. Your breath is your anchor to the present moment." }
        ]
      },
      
      mindfulness: {
        title: 'Mindfulness',
        duration: 10,
        icon: '🧘‍♀️',
        description: '10-minute present moment awareness',
        instructions: [
          { time: 0, text: "Welcome to mindfulness meditation. Sit comfortably and gently close your eyes." },
          { time: 30, text: "Begin by noticing your breath, without trying to change it." },
          { time: 60, text: "Now expand your awareness to your entire body. Notice any sensations." },
          { time: 120, text: "If thoughts arise, acknowledge them kindly and return to the present moment." },
          { time: 180, text: "Notice sounds around you without judging them as good or bad." },
          { time: 240, text: "Bring attention to your emotions. What are you feeling right now?" },
          { time: 300, text: "Remember, there's no perfect way to meditate. You're doing great." },
          { time: 360, text: "Notice the space between your thoughts. Rest in that peaceful space." },
          { time: 420, text: "Feel gratitude for taking this time for yourself." },
          { time: 480, text: "As we near the end, slowly bring awareness back to your surroundings." },
          { time: 540, text: "Take three deep breaths and gently open your eyes when ready." }
        ]
      },
      
      gratitude: {
        title: 'Gratitude',
        duration: 7,
        icon: '🙏',
        description: '7-minute gratitude reflection',
        instructions: [
          { time: 0, text: "Welcome to gratitude meditation. Settle into a comfortable position." },
          { time: 30, text: "Take a few deep breaths and allow your body to relax." },
          { time: 60, text: "Think of one thing you're grateful for today, no matter how small." },
          { time: 90, text: "Feel the warmth of gratitude in your heart as you focus on this blessing." },
          { time: 150, text: "Now think of a person you're grateful for. Picture their face." },
          { time: 210, text: "Send them loving thoughts and appreciation for their presence in your life." },
          { time: 270, text: "Consider a challenge that helped you grow. Can you find gratitude for the lesson?" },
          { time: 330, text: "Think about your body and all it does for you. Feel grateful for your health." },
          { time: 390, text: "Expand your gratitude to include this moment, this breath, this opportunity to reflect." },
          { time: 420, text: "Carry this feeling of gratitude with you as you return to your day." }
        ]
      },
      
      sleep: {
        title: 'Sleep Prep',
        duration: 15,
        icon: '🌙',
        description: '15-minute wind-down routine',
        instructions: [
          { time: 0, text: "Welcome to your sleep preparation meditation. Lie down comfortably." },
          { time: 30, text: "Close your eyes and take three slow, deep breaths." },
          { time: 60, text: "Let go of the day's worries. They can wait until tomorrow." },
          { time: 120, text: "Starting with your toes, consciously relax each part of your body." },
          { time: 180, text: "Feel your legs becoming heavy and relaxed, sinking into the bed." },
          { time: 240, text: "Release tension from your back, shoulders, and arms." },
          { time: 300, text: "Relax your neck, jaw, and facial muscles. Let everything soften." },
          { time: 360, text: "Your body is now completely relaxed. Focus on your gentle breathing." },
          { time: 480, text: "If thoughts arise, imagine them floating away like clouds in the sky." },
          { time: 600, text: "You are safe, peaceful, and ready for restorative sleep." },
          { time: 720, text: "Continue breathing slowly as you drift into peaceful slumber." },
          { time: 840, text: "Sweet dreams. Rest well." }
        ]
      }
    };
  }
  
  async init() {
    this.setupMeditationUI();
    console.log('Meditation Manager initialized');
  }
  
  setupMeditationUI() {
    // Meditation card click handlers
    document.querySelectorAll('.meditation-card').forEach(card => {
      const meditationBtn = card.querySelector('.meditation-btn');
      if (meditationBtn) {
        meditationBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const meditationType = card.dataset.meditation;
          this.startMeditation(meditationType);
        });
      }
    });
  }
  
  startMeditation(type) {
    const meditation = this.meditations[type];
    if (!meditation) return;
    
    this.currentSession = {
      type,
      meditation,
      startTime: Date.now(),
      currentInstructionIndex: 0
    };
    
    this.timeRemaining = meditation.duration * 60; // Convert to seconds
    this.openMeditationModal();
    this.renderMeditationContent();
    this.startTimer();
  }
  
  openMeditationModal() {
    const modal = document.getElementById('meditation-modal');
    const title = document.getElementById('meditation-title');
    
    if (modal && title) {
      title.textContent = this.currentSession.meditation.title;
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }
  
  closeMeditationModal() {
    const modal = document.getElementById('meditation-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
    
    this.stopMeditation();
  }
  
  renderMeditationContent() {
    const content = document.getElementById('meditation-content');
    if (!content) return;
    
    const meditation = this.currentSession.meditation;
    
    content.innerHTML = `
      <div class="meditation-session">
        <div class="meditation-icon">${meditation.icon}</div>
        <div class="meditation-timer" id="meditation-timer">
          ${this.formatTime(this.timeRemaining)}
        </div>
        <div class="meditation-instruction" id="meditation-instruction">
          ${meditation.instructions[0].text}
        </div>
        <div class="meditation-controls">
          <button id="meditation-pause" class="secondary-btn">
            <span id="pause-text">Pause</span>
          </button>
          <button id="meditation-stop" class="danger-btn">Stop</button>
        </div>
        <div class="meditation-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-text">
            <span id="elapsed-time">0:00</span>
            <span id="total-time">${this.formatTime(meditation.duration * 60)}</span>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('meditation-pause').addEventListener('click', () => {
      this.togglePause();
    });
    
    document.getElementById('meditation-stop').addEventListener('click', () => {
      this.stopMeditation();
    });
    
    // Add meditation styles
    this.addMeditationStyles();
  }
  
  startTimer() {
    this.isPlaying = true;
    this.timer = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }
  
  updateTimer() {
    if (!this.isPlaying || !this.currentSession) return;
    
    this.timeRemaining--;
    
    // Update timer display
    const timerElement = document.getElementById('meditation-timer');
    if (timerElement) {
      timerElement.textContent = this.formatTime(this.timeRemaining);
    }
    
    // Update progress
    this.updateProgress();
    
    // Check for instruction updates
    this.checkInstructions();
    
    // Check if session is complete
    if (this.timeRemaining <= 0) {
      this.completeMeditation();
    }
  }
  
  updateProgress() {
    const totalDuration = this.currentSession.meditation.duration * 60;
    const elapsed = totalDuration - this.timeRemaining;
    const progress = (elapsed / totalDuration) * 100;
    
    const progressFill = document.getElementById('progress-fill');
    const elapsedTime = document.getElementById('elapsed-time');
    
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    
    if (elapsedTime) {
      elapsedTime.textContent = this.formatTime(elapsed);
    }
  }
  
  checkInstructions() {
    const meditation = this.currentSession.meditation;
    const totalDuration = meditation.duration * 60;
    const elapsed = totalDuration - this.timeRemaining;
    
    // Find the next instruction that should be shown
    const nextInstruction = meditation.instructions.find((instruction, index) => 
      instruction.time <= elapsed && index > this.currentSession.currentInstructionIndex
    );
    
    if (nextInstruction) {
      this.showInstruction(nextInstruction.text);
      this.currentSession.currentInstructionIndex = meditation.instructions.indexOf(nextInstruction);
    }
  }
  
  showInstruction(text) {
    const instructionElement = document.getElementById('meditation-instruction');
    if (instructionElement) {
      // Fade out
      instructionElement.style.opacity = '0';
      
      setTimeout(() => {
        instructionElement.textContent = text;
        // Fade in
        instructionElement.style.opacity = '1';
      }, 300);
    }
  }
  
  togglePause() {
    const pauseBtn = document.getElementById('meditation-pause');
    const pauseText = document.getElementById('pause-text');
    
    if (this.isPlaying) {
      this.isPlaying = false;
      if (pauseText) pauseText.textContent = 'Resume';
    } else {
      this.isPlaying = true;
      if (pauseText) pauseText.textContent = 'Pause';
    }
  }
  
  stopMeditation() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.isPlaying = false;
    this.currentSession = null;
    this.closeMeditationModal();
  }
  
  completeMeditation() {
    this.stopMeditation();
    
    // Show completion message
    this.showCompletionMessage();
    
    // Save meditation session (optional)
    this.saveMeditationSession();
  }
  
  showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'meditation-completion';
    message.innerHTML = `
      <div class="completion-content">
        <div class="completion-icon">✨</div>
        <h3>Meditation Complete!</h3>
        <p>Great job taking time for yourself today.</p>
        <button class="primary-btn" onclick="this.parentElement.parentElement.remove()">
          Continue
        </button>
      </div>
    `;
    
    message.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    
    document.body.appendChild(message);
  }
  
  saveMeditationSession() {
    // This could save meditation history for tracking
    const session = {
      type: this.currentSession.type,
      duration: this.currentSession.meditation.duration,
      completed_at: new Date().toISOString()
    };
    
    // Save to localStorage for now
    const sessions = JSON.parse(localStorage.getItem('mindease_meditation_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('mindease_meditation_sessions', JSON.stringify(sessions));
  }
  
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  addMeditationStyles() {
    if (document.querySelector('#meditation-session-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'meditation-session-styles';
    styles.textContent = `
      .meditation-session {
        text-align: center;
        padding: var(--spacing-xl);
      }
      
      .meditation-session .meditation-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
      }
      
      .meditation-timer {
        font-size: 3rem;
        font-weight: 600;
        color: var(--primary);
        margin-bottom: var(--spacing-lg);
        font-variant-numeric: tabular-nums;
      }
      
      .meditation-instruction {
        font-size: var(--font-size-lg);
        line-height: var(--line-height-relaxed);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xl);
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease;
      }
      
      .meditation-controls {
        display: flex;
        justify-content: center;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
      }
      
      .meditation-progress {
        max-width: 300px;
        margin: 0 auto;
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--spacing-sm);
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary), var(--secondary));
        border-radius: 4px;
        transition: width 1s ease;
      }
      
      .progress-text {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-sm);
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }
      
      .completion-content {
        background: var(--bg-primary);
        padding: var(--spacing-2xl);
        border-radius: var(--radius-xl);
        text-align: center;
        max-width: 400px;
        margin: var(--spacing-md);
      }
      
      .completion-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
      }
      
      .completion-content h3 {
        font-size: var(--font-size-2xl);
        font-weight: 600;
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }
      
      .completion-content p {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xl);
        line-height: var(--line-height-relaxed);
      }
      
      @media (max-width: 480px) {
        .meditation-timer {
          font-size: 2.5rem;
        }
        
        .meditation-instruction {
          font-size: var(--font-size-base);
          min-height: 80px;
        }
        
        .meditation-controls {
          flex-direction: column;
          align-items: center;
        }
        
        .meditation-controls button {
          width: 200px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  // Get meditation statistics
  getMeditationStats() {
    const sessions = JSON.parse(localStorage.getItem('mindease_meditation_sessions') || '[]');
    
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    
    // Calculate streak (consecutive days with meditation)
    const streak = this.calculateMeditationStreak(sessions);
    
    return {
      totalSessions,
      totalMinutes,
      streak
    };
  }
  
  calculateMeditationStreak(sessions) {
    if (sessions.length === 0) return 0;
    
    const today = new Date();
    const sessionDates = sessions
      .map(session => new Date(session.completed_at).toDateString())
      .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b) - new Date(a)); // Sort descending
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const sessionDate of sessionDates) {
      const sessionDateObj = new Date(sessionDate);
      const diffDays = Math.floor((currentDate - sessionDateObj) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = new Date(sessionDateObj);
      } else {
        break;
      }
    }
    
    return streak;
  }
}