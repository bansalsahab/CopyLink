// Service worker for the extension
// Handles background tasks and messaging

const DEFAULT_SHORTCUTS = {
    '/github': 'https://github.com',
    '/linkedin': 'https://linkedin.com',
    '/twitter': 'https://twitter.com',
    '/portfolio': 'https://example.com',
    '/email': 'developer@example.com',
    '/resume': 'https://example.com/resume.pdf'
};

chrome.runtime.onInstalled.addListener(() => {
    // Initialize default shortcuts in storage
    try {
        chrome.storage.sync.get('shortcuts', (result) => {
            if (chrome.runtime.lastError) {
                console.error('Storage error on install:', chrome.runtime.lastError);
                return;
            }
            if (!result || !result.shortcuts) {
                chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error setting default shortcuts:', chrome.runtime.lastError);
                    } else {
                        console.log('Default shortcuts initialized');
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error during extension installation:', error);
    }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyToClipboard') {
        try {
            // Copy to clipboard
            navigator.clipboard.writeText(request.text).then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                console.error('Clipboard write error:', error);
                sendResponse({ success: false });
            });
            return true; // Will respond asynchronously
        } catch (error) {
            console.error('Message handler error:', error);
            sendResponse({ success: false });
        }
    }
});
