// AI Manager - Handles multiple AI providers with automatic fallback
// Supports Cohere, OpenRouter, and HuggingFace APIs

export class AIManager {
  constructor(storage) {
    this.storage = storage;
    this.providers = {
      cohere: {
        name: 'Cohere',
        endpoint: 'https://api.cohere.ai/v1/generate',
        model: 'command-r-plus',
        available: false,
        rateLimited: false,
        lastError: null
      },
      openrouter: {
        name: 'OpenRouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'mistralai/mistral-7b-instruct',
        available: false,
        rateLimited: false,
        lastError: null
      },
      huggingface: {
        name: 'HuggingFace',
        endpoint: 'https://api-inference.huggingface.co/models/distilgpt2',
        model: 'distilgpt2',
        available: false,
        rateLimited: false,
        lastError: null
      }
    };
    
    this.currentProvider = null;
    this.conversationHistory = [];
    this.systemPrompt = this.getSystemPrompt();
  }
  
  async init() {
    // Load API keys and check provider availability
    this.loadApiKeys();
    await this.checkProviderAvailability();
    
    // Load conversation history
    this.conversationHistory = await this.storage.getChatHistory();
    
    // Set up chat UI
    this.setupChatUI();
    
    console.log('AI Manager initialized');
  }
  
  loadApiKeys() {
    const cohereKey = this.storage.get('ai_cohere_key');
    const openrouterKey = this.storage.get('ai_openrouter_key');
    const huggingfaceKey = this.storage.get('ai_huggingface_key');
    
    if (cohereKey) {
      this.providers.cohere.apiKey = cohereKey;
      this.providers.cohere.available = true;
    }
    
    if (openrouterKey) {
      this.providers.openrouter.apiKey = openrouterKey;
      this.providers.openrouter.available = true;
    }
    
    if (huggingfaceKey) {
      this.providers.huggingface.apiKey = huggingfaceKey;
      this.providers.huggingface.available = true;
    }
  }
  
  updateApiKey(provider, key) {
    if (this.providers[provider]) {
      this.providers[provider].apiKey = key;
      this.providers[provider].available = !!key;
      this.providers[provider].rateLimited = false;
      this.providers[provider].lastError = null;
    }
  }
  
  async checkProviderAvailability() {
    // This would normally test each provider, but we'll skip for now
    // to avoid unnecessary API calls during initialization
    console.log('Provider availability check skipped during init');
  }
  
  setupChatUI() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatInput || !sendBtn) return;
    
    // Load existing messages
    this.renderChatHistory();
    
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      this.autoResizeTextarea(chatInput);
      this.updateSendButton();
    });
    
    // Send message on Enter (but not Shift+Enter)
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Send button click
    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // Initial state
    this.updateSendButton();
  }
  
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
  
  updateSendButton() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (chatInput && sendBtn) {
      const hasText = chatInput.value.trim().length > 0;
      const isOnline = navigator.onLine;
      sendBtn.disabled = !hasText || !isOnline;
    }
  }
  
  async sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message || !navigator.onLine) return;
    
    // Clear input and disable send button
    chatInput.value = '';
    this.autoResizeTextarea(chatInput);
    this.updateSendButton();
    
    // Add user message to UI
    this.addMessageToUI('user', message);
    
    // Save user message
    const userMessage = {
      id: this.generateId(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    this.conversationHistory.push(userMessage);
    await this.storage.saveChatMessage(userMessage);
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Remove typing indicator
      this.hideTypingIndicator();
      
      if (response) {
        // Add AI response to UI
        this.addMessageToUI('assistant', response);
        
        // Save AI message
        const aiMessage = {
          id: this.generateId(),
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };
        
        this.conversationHistory.push(aiMessage);
        await this.storage.saveChatMessage(aiMessage);
      } else {
        this.hideTypingIndicator();
        this.addMessageToUI('assistant', "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.");
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      this.hideTypingIndicator();
      this.addMessageToUI('assistant', "I'm experiencing some technical difficulties. Please try again later.");
    }
  }
  
  async getAIResponse(userMessage) {
    const availableProviders = Object.keys(this.providers).filter(key => 
      this.providers[key].available && 
      !this.providers[key].rateLimited &&
      this.providers[key].apiKey
    );
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available. Please configure your API keys in settings.');
    }
    
    // Try each provider in order
    for (const providerKey of availableProviders) {
      try {
        const response = await this.callProvider(providerKey, userMessage);
        if (response) {
          this.currentProvider = providerKey;
          return response;
        }
      } catch (error) {
        console.error(`Provider ${providerKey} failed:`, error);
        
        // Check if it's a rate limit error
        if (error.status === 429 || error.message.includes('rate limit')) {
          this.providers[providerKey].rateLimited = true;
          // Reset rate limit after 1 hour
          setTimeout(() => {
            this.providers[providerKey].rateLimited = false;
          }, 60 * 60 * 1000);
        }
        
        this.providers[providerKey].lastError = error.message;
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  }
  
  async callProvider(providerKey, userMessage) {
    const provider = this.providers[providerKey];
    
    switch (providerKey) {
      case 'cohere':
        return await this.callCohere(provider, userMessage);
      case 'openrouter':
        return await this.callOpenRouter(provider, userMessage);
      case 'huggingface':
        return await this.callHuggingFace(provider, userMessage);
      default:
        throw new Error(`Unknown provider: ${providerKey}`);
    }
  }
  
  async callCohere(provider, userMessage) {
    const prompt = this.buildPrompt(userMessage);
    
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.7,
        stop_sequences: ['\n\nUser:', '\n\nHuman:']
      })
    });
    
    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.generations?.[0]?.text?.trim();
  }
  
  async callOpenRouter(provider, userMessage) {
    const messages = this.buildChatMessages(userMessage);
    
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MindEase'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim();
  }
  
  async callHuggingFace(provider, userMessage) {
    const prompt = this.buildPrompt(userMessage);
    
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 300,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (Array.isArray(data) && data[0]?.generated_text) {
      // Extract only the new part of the response
      const fullText = data[0].generated_text;
      const newText = fullText.replace(prompt, '').trim();
      return newText;
    }
    
    return null;
  }
  
  buildPrompt(userMessage) {
    let prompt = this.systemPrompt + '\n\n';
    
    // Add recent conversation history (last 5 exchanges)
    const recentHistory = this.conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }
    
    prompt += `User: ${userMessage}\nAssistant:`;
    return prompt;
  }
  
  buildChatMessages(userMessage) {
    const messages = [
      { role: 'system', content: this.systemPrompt }
    ];
    
    // Add recent conversation history
    const recentHistory = this.conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    messages.push({ role: 'user', content: userMessage });
    return messages;
  }
  
  getSystemPrompt() {
    return `You are a compassionate AI companion designed to support teenagers with their mental wellness. Your role is to:

1. Listen actively and empathetically to their concerns
2. Provide gentle, non-judgmental support and validation
3. Offer practical coping strategies and mindfulness techniques
4. Encourage healthy habits and positive thinking patterns
5. Know when to suggest seeking professional help for serious issues

Guidelines:
- Use a warm, friendly, and age-appropriate tone
- Be supportive but not overly casual
- Avoid giving medical advice or diagnoses
- Encourage self-reflection and personal growth
- Respect boundaries and privacy
- If someone mentions self-harm or suicide, gently encourage them to reach out to a trusted adult, counselor, or crisis helpline

Remember: You're here to provide emotional support and practical wellness tips, not to replace professional mental health care. Keep responses concise but meaningful, typically 2-3 sentences unless more detail is specifically requested.`;
  }
  
  renderChatHistory() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Clear existing messages except welcome message
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    chatMessages.innerHTML = '';
    if (welcomeMessage) {
      chatMessages.appendChild(welcomeMessage);
    }
    
    // Render conversation history
    for (const message of this.conversationHistory) {
      this.addMessageToUI(message.role, message.content, false);
    }
    
    // Scroll to bottom
    this.scrollToBottom();
  }
  
  addMessageToUI(role, content, animate = true) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    if (animate) {
      messageDiv.style.opacity = '0';
      messageDiv.style.transform = 'translateY(20px)';
    }
    
    const avatar = document.createElement('div');
    avatar.className = `${role}-avatar`;
    avatar.textContent = role === 'user' ? '👤' : '🌸';
    
    const content_div = document.createElement('div');
    content_div.className = 'message-content';
    
    const paragraph = document.createElement('p');
    paragraph.textContent = content;
    content_div.appendChild(paragraph);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content_div);
    
    chatMessages.appendChild(messageDiv);
    
    if (animate) {
      // Trigger animation
      setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease-out';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
      }, 50);
    }
    
    this.scrollToBottom();
  }
  
  showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message typing-indicator';
    typingDiv.innerHTML = `
      <div class="bot-avatar">🌸</div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    // Add typing animation styles if not already added
    if (!document.querySelector('#typing-styles')) {
      const styles = document.createElement('style');
      styles.id = 'typing-styles';
      styles.textContent = `
        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }
        .typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }
    
    chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }
  
  hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Clear conversation history
  async clearHistory() {
    this.conversationHistory = [];
    await this.storage.clearChatHistory();
    this.renderChatHistory();
  }
  
  // Get provider status for debugging
  getProviderStatus() {
    return Object.keys(this.providers).map(key => ({
      name: this.providers[key].name,
      available: this.providers[key].available,
      rateLimited: this.providers[key].rateLimited,
      lastError: this.providers[key].lastError,
      hasApiKey: !!this.providers[key].apiKey
    }));
  }
}