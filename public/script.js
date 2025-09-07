// Dashboard JavaScript
class BusinessDashboard {
    constructor() {
        this.conversationHistory = [];
        this.isTyping = false;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recognition = null;
        this.initializeEventListeners();
        this.checkApiStatus();
        this.initializeVoiceRecognition();
    }

    initializeEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.id));
        });

        // Chat functionality
        const sendButton = document.getElementById('send-button');
        const chatInput = document.getElementById('chat-input');
        const clearChatButton = document.getElementById('clear-chat');
        const voiceButton = document.getElementById('voice-button');

        sendButton.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        clearChatButton.addEventListener('click', () => this.clearChat());
        voiceButton.addEventListener('click', () => this.toggleVoiceRecording());

        // Quick actions
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => this.handleQuickAction(e.target));
        });
    }

    switchTab(tabId) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active', 'border-purple-400', 'text-purple-400');
            tab.classList.add('border-transparent', 'text-gray-400');
        });

        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabId);
        selectedTab.classList.add('active', 'border-purple-400', 'text-purple-400');
        selectedTab.classList.remove('border-transparent', 'text-gray-400');

        // Show corresponding content
        const contentId = tabId.replace('-tab', '-content');
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.remove('hidden');
        }
    }

    async checkApiStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.getElementById('status-text');
            
            if (data.claudeApiConfigured && data.elevenlabsApiConfigured) {
                statusIndicator.className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse-slow';
                statusText.textContent = 'Connected (Chat + Voice)';
            } else if (data.claudeApiConfigured) {
                statusIndicator.className = 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse-slow';
                statusText.textContent = 'Connected (Chat Only)';
            } else {
                statusIndicator.className = 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse-slow';
                statusText.textContent = 'API Keys Required';
            }
        } catch (error) {
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.getElementById('status-text');
            
            statusIndicator.className = 'w-2 h-2 bg-red-400 rounded-full animate-pulse-slow';
            statusText.textContent = 'Disconnected';
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;

        // Clear input and disable button
        input.value = '';
        this.setTypingState(true);

        // Add user message to chat
        this.addMessageToChat('user', message);

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.conversationHistory
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            // Update conversation history
            this.conversationHistory = data.conversationHistory || [];

            // Add assistant response to chat
            this.addMessageToChat('assistant', data.response);

        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToChat('assistant', `Sorry, I encountered an error: ${error.message}`, true);
        } finally {
            this.setTypingState(false);
        }
    }

    addMessageToChat(role, content, isError = false) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-3 animate-slide-up';

        if (role === 'user') {
            messageDiv.innerHTML = `
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-white text-sm"></i>
                </div>
                <div class="bg-blue-600/20 border border-blue-500/20 rounded-lg px-4 py-3 max-w-md ml-auto">
                    <p class="text-white">${this.formatMessage(content)}</p>
                </div>
            `;
            messageDiv.classList.add('flex-row-reverse');
        } else {
            const bgClass = isError ? 'bg-red-600/20 border-red-500/20' : 'bg-gray-800/50';
            messageDiv.innerHTML = `
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <div class="${bgClass} rounded-lg px-4 py-3 max-w-2xl">
                    <p class="text-white">${this.formatMessage(content)}</p>
                </div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessage(message) {
        // Basic markdown-style formatting
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br>');
    }

    setTypingState(isTyping) {
        this.isTyping = isTyping;
        const sendButton = document.getElementById('send-button');
        const typingIndicator = document.getElementById('typing-indicator');
        const chatInput = document.getElementById('chat-input');

        if (isTyping) {
            sendButton.disabled = true;
            sendButton.classList.add('opacity-50', 'cursor-not-allowed');
            typingIndicator.classList.remove('hidden');
            chatInput.disabled = true;
        } else {
            sendButton.disabled = false;
            sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
            typingIndicator.classList.add('hidden');
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        this.conversationHistory = [];
        
        // Keep only the welcome message
        chatMessages.innerHTML = `
            <div class="flex items-start space-x-3 animate-slide-up">
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-gray-800/50 rounded-lg px-4 py-3 max-w-md">
                    <p class="text-white">Hello! I'm your AI business partner. I'm here to help you with strategy, insights, and decision-making. What would you like to discuss today?</p>
                </div>
            </div>
        `;
    }

    handleQuickAction(actionElement) {
        const actionText = actionElement.textContent.trim();
        const chatInput = document.getElementById('chat-input');
        
        let prompt = '';
        
        switch (actionText) {
            case 'Analyze Performance':
                prompt = 'Can you help me analyze my business performance? What key metrics should I be tracking?';
                break;
            case 'Strategic Planning':
                prompt = 'I need help with strategic planning for my business. What framework would you recommend?';
                break;
            case 'Team Management':
                prompt = 'What are some effective team management strategies I should implement?';
                break;
            case 'Financial Analysis':
                prompt = 'Help me understand financial analysis for my business. What should I focus on?';
                break;
            default:
                prompt = actionText;
        }
        
        chatInput.value = prompt;
        chatInput.focus();
    }

    initializeVoiceRecognition() {
        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            const voiceButton = document.getElementById('voice-button');
            voiceButton.style.display = 'none';
            return;
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.setVoiceRecordingState(true);
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            const chatInput = document.getElementById('chat-input');
            chatInput.value = finalTranscript + interimTranscript;
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.setVoiceRecordingState(false);
        };

        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            this.setVoiceRecordingState(false);
        };
    }

    toggleVoiceRecording() {
        if (!this.recognition) {
            alert('Voice recognition is not supported in your browser');
            return;
        }

        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    startVoiceRecording() {
        try {
            const chatInput = document.getElementById('chat-input');
            chatInput.value = ''; // Clear input
            chatInput.placeholder = 'Listening... Speak now';
            
            this.recognition.start();
            this.isRecording = true;
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.setVoiceRecordingState(false);
        }
    }

    stopVoiceRecording() {
        try {
            this.recognition.stop();
            this.isRecording = false;
            
            const chatInput = document.getElementById('chat-input');
            chatInput.placeholder = 'Ask me anything about your business...';
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }
    }

    setVoiceRecordingState(isRecording) {
        this.isRecording = isRecording;
        const voiceButton = document.getElementById('voice-button');
        const voiceIcon = document.getElementById('voice-icon');
        const recordingIndicator = document.getElementById('voice-recording-indicator');
        const listeningDots = document.getElementById('voice-listening-dots');

        if (isRecording) {
            // Recording state
            voiceButton.classList.remove('bg-gray-700/50', 'hover:bg-gray-600/50', 'text-gray-300');
            voiceButton.classList.add('bg-red-500/20', 'hover:bg-red-500/30', 'text-red-400', 'animate-voice-pulse');
            voiceIcon.classList.remove('fa-microphone');
            voiceIcon.classList.add('fa-stop');
            recordingIndicator.classList.remove('hidden');
            listeningDots.classList.remove('hidden');
            voiceButton.title = 'Stop recording';
        } else {
            // Default state
            voiceButton.classList.remove('bg-red-500/20', 'hover:bg-red-500/30', 'text-red-400', 'animate-voice-pulse');
            voiceButton.classList.add('bg-gray-700/50', 'hover:bg-gray-600/50', 'text-gray-300');
            voiceIcon.classList.remove('fa-stop');
            voiceIcon.classList.add('fa-microphone');
            recordingIndicator.classList.add('hidden');
            listeningDots.classList.add('hidden');
            voiceButton.title = 'Voice input';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BusinessDashboard();
});

// Add some nice visual effects
document.addEventListener('DOMContentLoaded', () => {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards and elements
    document.querySelectorAll('.bg-black\\/20').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}); 