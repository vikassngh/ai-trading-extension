// Background script for AI Trading Assistant Chrome Extension

// Enable side panel only on TradingView
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;

    if (isTradingViewTab(tab.url) && info.status === 'complete') {
        // Enable side panel for this tab
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
        });
    }
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

    switch (request.type) {
        case 'ANALYZE_PAGE':
            handlePageAnalysis(request.data, sendResponse);
            return true;

        case 'EXECUTE_ACTION':
            // Get tab ID from request data or active tab
            handleExecuteAction(request, sender, sendResponse);
            return true;

        case 'GET_PAGE_DATA':
            handleGetPageData(request, sender, sendResponse);
            return true;

        default:
            console.log('Unknown message type:', request.type);
    }
});

// Check if a URL is a TradingView tab
function isTradingViewTab(url) {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('tradingview.com');
    } catch {
        return false;
    }
}

// Handle EXECUTE_ACTION with TradingView tab filtering
async function handleExecuteAction(request, sender, sendResponse) {
    let tabId = null;
    let targetTab = null;

    // Try to get tab ID from various sources
    if (request.tabId) {
        try {
            targetTab = await chrome.tabs.get(request.tabId);
            tabId = request.tabId;
        } catch (error) {
            console.error('Error getting tab by ID:', error);
        }
    } else if (sender.tab && sender.tab.id) {
        targetTab = sender.tab;
        tabId = sender.tab.id;
    } else {
        // If no tab ID available, get the active TradingView tab
        try {
            const [activeTab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (activeTab) {
                targetTab = activeTab;
                tabId = activeTab.id;
            }
        } catch (error) {
            console.error('Error getting active tab:', error);
        }
    }

    // Check if the tab is a TradingView tab
    if (!tabId || !targetTab || !targetTab.url) {
        sendResponse({error: 'No active tab found'});
        return;
    }

    if (!isTradingViewTab(targetTab.url)) {
        sendResponse({
            error: 'Actions can only be executed on TradingView.com. Please navigate to TradingView and try again.'
        });
        return;
    }

    try {
        await forwardToContentScript(request, tabId);
        sendResponse({success: true});
    } catch (error) {
        sendResponse({
            error: 'Failed to execute action. Please refresh the TradingView page and try again.'
        });
    }
}

async function handleGetPageData(request, sender, sendResponse) {
    let tabId = null;
    let targetTab = null;

    // Try to get tab ID from various sources
    if (request.tabId) {
        try {
            targetTab = await chrome.tabs.get(request.tabId);
            tabId = request.tabId;
        } catch (error) {
            console.error('Error getting tab by ID:', error);
        }
    } else if (sender.tab && sender.tab.id) {
        targetTab = sender.tab;
        tabId = sender.tab.id;
    } else {
        // If no tab ID available, get the active TradingView tab
        try {
            const [activeTab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (activeTab) {
                targetTab = activeTab;
                tabId = activeTab.id;
            }
        } catch (error) {
            console.error('Error getting active tab:', error);
        }
    }

    // Check if the tab is a TradingView tab
    if (!tabId || !targetTab || !targetTab.url) {
        sendResponse({error: 'No active tab found'});
        return;
    }

    if (!isTradingViewTab(targetTab.url)) {
        sendResponse({
            error: 'This extension only works on TradingView.com. Please navigate to TradingView and try again.'
        });
        return;
    }

    getPageDataFromContentScript(tabId, sendResponse);
}

// Ensure content script is loaded on the tab
async function ensureContentScriptLoaded(tabId) {
    try {
        // Try to ping the content script first
        await chrome.tabs.sendMessage(tabId, {type: 'PING'});
    } catch (error) {
        // If ping fails, inject the content script
        console.log('Injecting content script into tab:', tabId);
        try {
            await chrome.scripting.executeScript({
                target: {tabId: tabId},
                files: ['content.js']
            });

            // Wait a bit for the script to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (injectionError) {
            console.error('Failed to inject content script:', injectionError);
            throw new Error('Failed to load content script on the page');
        }
    }
}

// Forward action execution requests to content script with content script check
async function forwardToContentScript(request, tabId) {
    try {
        await ensureContentScriptLoaded(tabId);

        // Always send a structured request
        await chrome.tabs.sendMessage(tabId, {
            type: request.type,
            action: request.action || null,
            data: request.data || null
        });
    } catch (error) {
        console.error('Error forwarding message to content script:', error);
        throw error;
    }
}


// Get page data from content script - only for TradingView
async function getPageDataFromContentScript(tabId, sendResponse) {
    try {
        // First check if the tab exists and is a TradingView tab
        const tab = await chrome.tabs.get(tabId);
        if (!tab || !isTradingViewTab(tab.url)) {
            sendResponse({
                error: 'Please navigate to TradingView.com to use this extension.'
            });
            return;
        }

        // Try to inject content script if not already present
        await ensureContentScriptLoaded(tabId);

        const response = await chrome.tabs.sendMessage(tabId, {
            type: 'EXTRACT_PAGE_DATA'
        });
        sendResponse(response);
    } catch (error) {
        console.error('Error getting page data:', error);

        if (error.message.includes('Could not establish connection') ||
            error.message.includes('Receiving end does not exist')) {
            sendResponse({
                error: 'Content script not loaded. Please refresh the TradingView page and try again.'
            });
        } else {
            sendResponse({
                error: 'Failed to extract page data from TradingView. Make sure the page has loaded completely and try refreshing if needed.'
            });
        }
    }
}

// Handle AI analysis requests
async function handlePageAnalysis(data, sendResponse) {
    try {
        const {prompt, pageData, apiKey} = data;

        if (!apiKey) {
            sendResponse({
                error: 'API key not configured. Please set your Google Gemini API key in the extension settings.'
            });
            return;
        }

        const response = await callGeminiAPI(prompt, pageData, apiKey);
        sendResponse(response);

    } catch (error) {
        console.error('Error in AI analysis:', error);
        sendResponse({
            error: 'Failed to analyze page: ' + error.message
        });
    }
}

// Utility: safely parse JSON or fallback
function safeParseJSON(text) {
    try {
        return JSON.parse(text);
    } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                return null;
            }
        }
        return null;
    }
}

// Call Google Gemini API
async function callGeminiAPI(userPrompt, pageData, apiKey) {
    const systemPrompt = `
You are a specialized AI trading assistant for TradingView.

CONTEXT:
You have access to real-time trading data extracted from the TradingView interface.

AVAILABLE DATA:
${JSON.stringify(pageData, null, 2)}

CAPABILITIES:
- Analyze current market conditions based on visible price, volume, and technical indicators
- Interpret chart patterns and trading signals from the extracted data
- Provide insights for the current symbol: ${pageData.symbol || 'Unknown'}
- Current Price: ${pageData.price || 'N/A'}
- Price Change: ${pageData.change || 'N/A'} (${pageData.changePercent || 'N/A'}%)
- Volume: ${pageData.volume || 'N/A'}
- Active Indicators: ${Object.keys(pageData.indicators || {}).join(', ') || 'None visible'}
- Chart Timeframe: ${pageData.chartData?.timeframe || 'N/A'}

EXPECTED OUTPUT:
Always respond with **valid JSON** in this format:
{
  "response": "Detailed analysis and user-friendly summary",
  "actions": [
    {
      "type": "click|type|scroll",
      "selector": "CSS selector for TradingView elements",
      "text": "Text to type (only if type action)",
      "description": "What this action does"
    }
  ],
  "tradingInsights": {
    "marketSentiment": "bullish|bearish|neutral",
    "keyLevels": ["support/resistance levels if visible"],
    "signals": ["trading signals based on available data"]
  }
}

STYLE GUIDE:
- Use bullet points and line breaks for readability
- Keep output concise, actionable, and structured
- Only use extracted data (no general market assumptions)

USER REQUEST:
${userPrompt}
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{parts: [{text: systemPrompt}]}],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    topP: 0.8,
                    topK: 10,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            `Gemini API error: ${response.status} ${response.statusText}. ${
                errorData.error?.message || ''
            }`
        );
    }

    const data = await response.json();
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
        throw new Error('Invalid response from Gemini API');
    }

    // Try to parse AI response
    const parsed = safeParseJSON(aiResponse);
    if (parsed) return parsed;

    // Fallback
    return {
        response: aiResponse.trim(),
        actions: [],
        tradingInsights: {},
    };
}

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
    console.log('AI Trading Assistant installed');
});