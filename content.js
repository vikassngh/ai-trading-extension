// TradingView Content Script - Extract trading data from the page

console.log('TradingView AI Assistant content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    switch (request.type) {
        case 'PING':
            sendResponse({success: true});
            break;

        case 'EXTRACT_PAGE_DATA':
            try {
                const pageData = extractTradingViewData();
                sendResponse(pageData);
            } catch (error) {
                console.error('Error extracting page data:', error);
                sendResponse({error: error.message});
            }
            return true;

        case 'EXECUTE_ACTION':
            executeAction(request);
            break;

        default:
            console.log('Unknown message type:', request.type);
    }
});

// Extract any "key data" blocks (label + value pairs)
function extractKeyDataGeneric() {
    const blocks = deepQueryAll(document, '[data-container-name="key-stats-id"] [class*="block-"]');
    return blocks.map(block => {
        const label = block.querySelector('[class*="label-"]')?.innerText?.trim();
        const value = block.querySelector('[class*="value-"]')?.innerText?.trim();
        return {label, value};
    }).filter(x => x.label && x.value);
}

// Extract company/about section (usually a content block)
function extractCompanyInfoGeneric() {
    return deepQuerySelector(document, '[data-container-name="company-info-id"] [class*="content-"]')
        ?.innerText?.trim() || null;
}

// Extract FAQ (question + answer)
function extractFAQGeneric() {
    const items = deepQueryAll(document, '[data-container-name="symbol-faq-widget-id"] [class*="item-"]');
    return items.map(item => {
        const question = item.querySelector('[class*="summaryText-"]')?.innerText?.trim();
        const answer = item.querySelector('[class*="details-"]')?.innerText?.trim();
        return {question, answer};
    }).filter(x => x.question && x.answer);
}


function deepQuerySelector(root, selector) {
    if (!root) return null;

    // Normal search first
    const el = root.querySelector(selector);
    if (el) return el;

    // Then check inside shadow roots
    const elems = root.querySelectorAll('*');
    for (const e of elems) {
        if (e.shadowRoot) {
            const found = deepQuerySelector(e.shadowRoot, selector);
            if (found) return found;
        }
    }
    return null;
}

function deepQueryAll(root, selector) {
    let results = [];
    if (!root) return results;

    // Normal query
    results.push(...root.querySelectorAll(selector));

    // Traverse shadow roots
    const elems = root.querySelectorAll('*');
    for (const e of elems) {
        if (e.shadowRoot) {
            results.push(...deepQueryAll(e.shadowRoot, selector));
        }
    }
    return results;
}

function getTabs() {
    const tabs = deepQueryAll(document, '.js-category-tab');
    return tabs
        .map(el => ({
            text: el.innerText?.trim(),
            href: el.getAttribute("href"),
            element: el
        }))
        .filter(t => t.text && t.text.length < 30);
}

// Extract comprehensive trading data from TradingView page
function extractTradingViewData() {
    try {
        const overview = {
            symbolFull: deepQuerySelector(document, 'h1[class^="title-"]')?.innerText || null,
            symbolCode: deepQuerySelector(document, '.js-symbol-header-ticker')?.dataset.symbol || null,
            lastPrice: deepQuerySelector(document, '.js-symbol-last span')?.innerText || null,
            currency: deepQuerySelector(document, '.js-symbol-currency')?.innerText || null,
            change: deepQuerySelector(document, '.js-symbol-change-direction span')?.innerText || null,
            changePercent: deepQuerySelector(document, '.js-symbol-change-pt')?.innerText || null,
            marketStatus: deepQuerySelector(document, '[class^="marketStatusSmall-"]')?.innerText || null,
            lastUpdate: deepQuerySelector(document, '.js-symbol-lp-time')?.innerText || null,
            tabs: getTabs(),
        };

        return {
            ...overview,
            keyData: extractKeyDataGeneric(),
            companyInfo: extractCompanyInfoGeneric(),
            faq: extractFAQGeneric(),
            timestamp: Date.now()
        };
    } catch (err) {
        console.error("Error extracting TradingView data:", err);
        return {error: err.message};
    }
}

// Execute actions on the page
function executeAction(request) {
    try {
        const {action} = request;
        if (!action) return;

        switch (action.type) {
            case 'click':
                const clickElement = deepQuerySelector(document, action.selector);
                if (clickElement) {
                    clickElement.click();
                    console.log('Clicked:', action.selector);
                }
                break;

            case 'type':
                const typeElement = deepQuerySelector(document, action.selector);
                if (typeElement) {
                    typeElement.focus();
                    typeElement.value = action.text;
                    typeElement.dispatchEvent(new Event('input', {bubbles: true}));
                    typeElement.dispatchEvent(new Event('change', {bubbles: true}));
                    console.log('Typed:', action.text);
                }
                break;

            case 'scroll':
                const scrollElement = action.selector ?
                    deepQuerySelector(document, action.selector) :
                    window;
                if (scrollElement) {
                    scrollElement.scrollBy(0, action.amount || 100);
                    console.log('Scrolled');
                }
                break;
        }
    } catch (error) {
        console.error('Error executing action:', error);
    }
}