// Popup script for AI Trading Assistant

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize popup
    await checkCurrentTab();
    setupEventListeners();
});

async function checkCurrentTab() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const currentSite = document.getElementById('currentSite');
        const openSidePanel = document.getElementById('openSidePanel');
        const quickActions = document.getElementById('quickActions');

        if (!tab || !tab.url) {
            updateStatus('No active tab', 'error');
            return;
        }

        const url = new URL(tab.url);
        const hostname = url.hostname;

        // Check if current site is supported
        const supportedSites = ['tradingview.com'];
        const isSupported = supportedSites.some(site => hostname.includes(site));

        if (isSupported) {
            statusDot.classList.remove('error');
            statusText.textContent = 'Connected';
            currentSite.textContent = `Active on ${hostname}`;
            openSidePanel.disabled = false;
            quickActions.style.display = 'block';
        } else {
            statusDot.classList.add('error');
            statusText.textContent = 'Unsupported Site';
            currentSite.textContent = 'Navigate to TradingView';
            openSidePanel.disabled = true;
            quickActions.style.display = 'none';
        }

    } catch (error) {
        console.error('Error checking tab:', error);
        updateStatus('Error checking connection', 'error');
    }
}

function updateStatus(message, type = 'success') {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (type === 'error') {
        statusDot.classList.add('error');
    } else {
        statusDot.classList.remove('error');
    }

    statusText.textContent = message;
}

function setupEventListeners() {
    // Open side panel button
    document.getElementById('openSidePanel').addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            await chrome.sidePanel.open({tabId: tab.id});
            window.close();
        } catch (error) {
            console.error('Error opening side panel:', error);
        }
    });

    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(button => {
        button.addEventListener('click', async () => {
            const command = button.dataset.command;
            await executeQuickCommand(command);
        });
    });
}

async function executeQuickCommand(command) {
    try {
        // Open side panel with the command pre-filled
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        // Store the command to be auto-executed
        await chrome.storage.local.set({
            quickCommand: command
        });

        // Open side panel
        await chrome.sidePanel.open({tabId: tab.id});
        window.close();
    } catch (error) {
        console.error('Error executing quick command:', error);
        alert('Error executing command: ' + error.message);
    }
}