// Side panel JavaScript for AI Trading Assistant

class TradingAssistant {
    constructor() {
        this.messages = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadApiKey();
        this.checkPageStatus();
    }

    setupEventListeners() {
        const sendButton = document.getElementById('sendButton');
        const promptInput = document.getElementById('promptInput');
        const apiKeyInput = document.getElementById('apiKeyInput');

        sendButton.addEventListener('click', () => this.handleSend());
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Auto-resize textarea
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
        });

        // Save API key on change
        apiKeyInput.addEventListener('change', () => this.saveApiKey());

        // Handle action button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-button')) {
                this.executeAction(JSON.parse(e.target.dataset.action));
            }
        });
    }

    async checkPageStatus() {
        try {
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            const currentTab = tabs[0];

            if (!currentTab?.url) {
                this.updateStatus('No active tab', 'error');
                return;
            }

            const url = new URL(currentTab.url);
            const supportedSites = ['tradingview.com'];
            const isSupported = supportedSites.some(site => url.hostname.includes(site));

            if (isSupported) {
                this.updateStatus('✓ Connected to ' + url.hostname);
                this.addSystemMessage(`Connected to ${url.hostname}. You can now ask questions about the trading data on this page.`);

                const {quickCommand} = await chrome.storage.local.get([
                    "quickCommand"
                ]);
                if (quickCommand?.length > 0) {
                    this.handleSend();
                }
            } else {
                this.updateStatus('Navigate to TradingView', 'error');
                this.addSystemMessage('Please navigate to a supported trading website (TradingView) to use the AI assistant.');
            }

        } catch (error) {
            console.error('Error checking page status:', error);
            this.updateStatus('Connection error', 'error');
        }
    }

    updateStatus(text, type = 'success') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = text;
        statusEl.className = `status ${type}`;
    }

    loadApiKey() {
        chrome.storage.local.get(['gemini_api_key'], (result) => {
            if (result.gemini_api_key) {
                document.getElementById('apiKeyInput').value = result.gemini_api_key;
            }
        });
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        chrome.storage.local.set({gemini_api_key: apiKey});
    }

    async handleSend() {
        if (this.isLoading) return;

        let promptInput = document.getElementById('promptInput');
        let prompt = promptInput.value.trim();

        const {quickCommand} = await chrome.storage.local.get([
            "quickCommand"
        ]);

        if (quickCommand?.length > 0) {
            prompt = quickCommand;
            await chrome.storage.local.remove(["quickCommand"]);
        }

        if (!prompt) return;

        // Clear input
        promptInput.value = '';
        promptInput.style.height = 'auto';

        // Add user message
        this.addMessage(prompt, 'user');

        // Check API key
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (!apiKey) {
            this.addMessage('Please enter your Google Gemini API key in the settings below. Get one free at https://makersuite.google.com/app/apikey', 'ai');
            return;
        }

        // Show loading
        this.setLoading(true);
        this.addMessage('Analyzing page and processing your request...', 'ai', true);

        try {
            // Get page data from content script
            const pageData = await this.getPageData();

            // Send to background script for AI analysis
            const response = await this.sendMessage({
                type: 'ANALYZE_PAGE',
                data: {
                    prompt: prompt,
                    pageData: pageData,
                    apiKey: apiKey
                }
            });

            this.removeLoadingMessage();

            if (response.error) {
                this.addMessage(`Error: ${response.error}`, 'ai');
            } else {
                this.addMessage(response.response, 'ai');

                // Add action buttons if there are actions
                if (response.actions && response.actions.length > 0) {
                    this.addActionButtons(response.actions);
                }
            }

        } catch (error) {
            this.removeLoadingMessage();
            this.addMessage(`Error: ${error.message}`, 'ai');
        }

        this.setLoading(false);
    }

    async getPageData() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'GET_PAGE_DATA'
            }, (response) => {
                resolve(response || {error: 'No page data available'});
            });
        });
    }

    async sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }

    addMessage(text, sender, isLoading = false) {
        const messagesContainer = document.getElementById('messages');
        const placeholder = messagesContainer.querySelector('.placeholder-message');
        if (placeholder) {
            placeholder.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;

        if (isLoading) {
            messageEl.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          ${text}
        </div>
      `;
            messageEl.classList.add('loading-message');
        } else {
            messageEl.textContent = text;
        }

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({text, sender, timestamp: Date.now()});
    }

    addSystemMessage(text) {
        const messagesContainer = document.getElementById('messages');
        const placeholder = messagesContainer.querySelector('.placeholder-message');
        if (placeholder) {
            placeholder.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'message system';
        messageEl.textContent = text;

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addActionButtons(actions) {
        const messagesContainer = document.getElementById('messages');
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-container';

        actions.forEach((action, index) => {
            const button = document.createElement('button');
            button.className = 'action-button';
            button.textContent = `${action.type.toUpperCase()}: ${action.description}`;
            button.dataset.action = JSON.stringify(action);
            actionsContainer.appendChild(button);
        });

        messagesContainer.appendChild(actionsContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async executeAction(action) {
        this.addMessage(`Executing: ${action.description}`, 'system');

        try {
            const result = await this.sendMessage({
                type: 'EXECUTE_ACTION',
                action: action
            });

            if (result && result.success) {
                this.addMessage(`✅ Action executed`, 'system');
            } else if (result && result.error) {
                this.addMessage(`❌ ${result.error}`, 'system');
            }

        } catch (error) {
            this.addMessage(`❌ Failed to execute action: ${error.message}`, 'system');
        }
    }

    removeLoadingMessage() {
        const loadingMessage = document.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const sendButton = document.getElementById('sendButton');
        const promptInput = document.getElementById('promptInput');

        sendButton.disabled = loading;
        promptInput.disabled = loading;

        if (loading) {
            sendButton.innerHTML = '<div class="spinner"></div>';
        } else {
            sendButton.textContent = 'Send';
        }
    }
}

// Initialize the assistant when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    new TradingAssistant();
});