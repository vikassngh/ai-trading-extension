# AI Trading Assistant Chrome Extension

A powerful Chrome extension that enhances your trading experience on TradingView by providing AI-powered analysis and
automation capabilities.

## 🚀 Features

- **Natural Language Processing**: Ask questions about trading data in plain English
- **Page Analysis**: Automatically extracts stock prices, symbols, and market data
- **Action Execution**: Click buttons and interact with trading websites through AI commands
- **Multi-Platform Support**: Works with TradingView
- **Real-time Data**: Analyzes current page content and market information
- **Secure**: API keys stored locally, never shared

## 📋 Prerequisites

- Chrome browser (version 88+)
- Google Gemini API key (free tier available)
- Active subscription to supported trading platforms (optional)

## 🛠 Installation

### Method 1: Developer Mode (Recommended)

1. **Download the Extension Files**
    - Save all the provided files in a new folder called `ai-trading-assistant`
    - Ensure you have all these files:
        - `manifest.json`
        - `background.js`
        - `content.js`
        - `sidepanel.html`
        - `sidepanel.js`
        - `popup.html`
        - `popup.js`

2. **Create Icons Folder**
   ```
   ai-trading-assistant/
   ├── icons/
   │   ├── icon16.png
   │   ├── icon32.png
   │   ├── icon48.png
   │   └── icon128.png
   └── [other files]
   ```

   You can use any trading/finance related icons (16x16, 32x32, 48x48, 128x128 pixels) or create simple placeholder
   images.

3. **Load in Chrome**
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode" (toggle in top right)
    - Click "Load unpacked"
    - Select your `ai-trading-assistant` folder
    - The extension should now appear in your extensions list

### Method 2: Create Icons (Optional)

If you don't have icons, create simple colored squares:

1. Create a 128x128 pixel image with a blue background
2. Add a simple "AI" text or chart symbol
3. Resize to create 16x16, 32x32, and 48x48 versions
4. Save as PNG files in the `icons/` folder

## ⚙️ Configuration

### 1. Get Google Gemini API Key (FREE!)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. **Free Tier**: 15 requests per minute, 1500 requests per day, 1 million tokens per month

### 2. Configure Extension

1. Navigate to TradingView
2. Click the extension icon in Chrome toolbar
3. Click "Open AI Assistant"
4. Enter your OpenAI API key in the settings section
5. The key will be saved locally and securely

## 📖 Usage

### Basic Interaction

1. **Navigate to Supported Site**
    - Go to [TradingView](https://tradingview.com)
    - Open any stock chart or portfolio page

2. **Open AI Assistant**
    - Click extension icon → "Open AI Assistant"
    - Or use the side panel that automatically appears

3. **Start Chatting**
    - Type natural language questions like:
        - "What's the current price of AAPL?"
        - "Show me trending stocks"
        - "Analyze this chart"
        - "Find my best performing stock today"

### Example Commands

#### Information Queries

```
- "What stocks are visible on this page?"
- "What's the current symbol and price?"
- "Show me the market data"
- "What are the trending stocks?"
```

#### Action Requests (Bonus Features)

```
- "Click on the TSLA stock"
- "Change the chart timeframe to 1 year"
- "Search for Microsoft stock"
- "Show me the Apple stock details"
```

### Quick Actions

Use the popup interface for common tasks:

- **Current Price**: Get current stock price
- **Trending Stocks**: View trending symbols
- **Chart Analysis**: Analyze current chart

## 🔧 Technical Details

### Architecture

- **Manifest V3**: Uses latest Chrome extension standards
- **Content Script**: Extracts data from trading websites
- **Background Script**: Handles API calls and message routing
- **Side Panel**: Modern Chrome UI for chat interface
- **Popup**: Quick access interface

### Supported Websites

| Platform    | URL Pattern         | Features                         |
|-------------|---------------------|----------------------------------|
| TradingView | `*.tradingview.com` | Full support, charts, watchlists |

### Data Extraction

The extension intelligently extracts:

- Stock symbols and tickers
- Current prices and market data
- Chart timeframes and controls
- Watchlists and portfolios
- News and trending stocks

## 🛡️ Security & Privacy

- **Local Storage**: API keys stored locally in Chrome
- **No Data Collection**: Extension doesn't collect user data
- **Secure API Calls**: Direct communication with OpenAI
- **Permission-Based**: Only accesses specified trading sites

## 🐛 Troubleshooting

### Common Issues

**"API key not configured"**

- Solution: Enter your Google Gemini API key in settings

**"Unsupported Site"**

- Solution: Navigate to TradingView

**"Element not found"**

- Solution: Website layout may have changed, try refreshing

**Extension not loading**

- Check Chrome console (`F12 → Console`)
- Verify all files are present
- Reload extension in `chrome://extensions/`

### Debug Mode

Enable debug logging:

1. Open Chrome DevTools (`F12`)
2. Check Console tab for error messages
3. Look for messages from "AI Trading Assistant"

## 🚀 Advanced Usage

### Custom Prompts

Train the AI with specific instructions:

```
"Analyze the current stock page and tell me:
1. The current price and change
2. Any notable patterns in the chart
3. Recommend whether to buy, hold, or sell
4. Explain your reasoning"
```

### Action Chaining

Request multiple actions:

```
"Search for NVDA, then click on it, and change the timeframe to 1 year"
```

## 📝 Development

### File Structure

```
ai-trading-assistant/
├── manifest.json          # Extension configuration
├── background.js           # Service worker, API calls
├── content.js             # Page interaction, DOM extraction
├── sidepanel.html         # Chat interface UI
├── sidepanel.js           # Chat functionality
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
├── icons/                 # Extension icons
└── README.md              # Documentation
```

### Adding New Sites

To support additional trading platforms:

1. Update `manifest.json` host permissions
2. Add URL patterns to content script matches
3. Create new extraction functions in `content.js`
4. Test thoroughly on the new platform

### Customizing AI Behavior

Modify the system prompt in `background.js` to change how the AI responds:

```javascript
const systemPrompt = `You are an expert financial advisor...`;
```

## 📄 License

This project is provided as-is for educational and development purposes.

## 🤝 Contributing

Feel free to fork, modify, and improve this extension. Key areas for contribution:

- Additional trading platform support
- Enhanced data extraction
- UI/UX improvements
- Performance optimizations

## 📞 Support

For technical issues:

1. Check browser console for errors
2. Verify API key configuration
3. Ensure you're on a supported website
4. Try reloading the extension

---

**⚠️ Disclaimer**: This extension is for educational purposes. Always verify trading information independently before
making investment decisions.